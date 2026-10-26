import type { Motion } from '../gsap';
import { createProgram, createTarget, createVao, type Program } from './gl-utils';
import { INITIAL_GOVERNOR, stepGovernor } from './governor';
import { luminance, mixRgb, parseColor, type Rgb } from './color';
import {
  FALLBACK_COLORS,
  HALFTONE_PITCH_PX,
  MAX_DPR,
  MAX_STEP_MS,
  PAPER_RETREAT_KEY,
  PAPER_TOKENS,
  PARALLAX,
  PULSE,
  PULSE_GAIN,
  QUIET_FRAMES,
  RETINT_MS,
  RIPPLE_IGNORE,
  SIM_DOWNSCALE,
  TRAIL,
  WIDE_DPR,
  WIDE_CONTAINER_PX,
} from './constants';
import { addRipple, packRipples, pruneRipples, type Ripple } from './ripples';
import { FULLSCREEN_VERTEX, PAPER_FRAGMENT, SIM_FRAGMENT } from './shaders';
import { resolveWeights } from './weights';

type Ticker = Motion['gsap']['ticker'];

// Lenis mueve el scroll nativo, asi que el papel lee window.scrollY y no un estado propio.
const getScroll = () => ({ y: window.scrollY });

function onScroll(listener: () => void): () => void {
  window.addEventListener('scroll', listener, { passive: true });
  return () => window.removeEventListener('scroll', listener);
}

const FULLSCREEN_TRIANGLE = new Float32Array([-1, -1, 3, -1, -1, 3]);
const REFERENCE_FRAME_MS = 1000 / 60;

type Target = ReturnType<typeof createTarget>;

export function paperHasRetreated(): boolean {
  try {
    return sessionStorage.getItem(PAPER_RETREAT_KEY) === '1';
  } catch {
    // Storage bloqueado: sin recuerdo, el gobernador vuelve a decidir en esta pagina.
    return false;
  }
}

function rememberRetreat(): void {
  try {
    sessionStorage.setItem(PAPER_RETREAT_KEY, '1');
  } catch (error) {
    console.warn('[paper] retreat not persisted for the session', error);
  }
}

interface Palette {
  paper: Rgb;
  ink: Rgb;
}

// Se lee en el contenedor y no en <html>: asi la placa, que invierte el tema, tine el papel con el suyo.
function readPalette(container: HTMLElement): Palette {
  const style = getComputedStyle(container);
  return {
    paper: parseColor(style.getPropertyValue(PAPER_TOKENS.paper)) ?? FALLBACK_COLORS.paper,
    ink: parseColor(style.getPropertyValue(PAPER_TOKENS.ink)) ?? FALLBACK_COLORS.ink,
  };
}

const samePalette = (a: Palette, b: Palette) => a.paper.join() === b.paper.join() && a.ink.join() === b.ink.join();
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const nextPulseGap = () => PULSE.minGapMs + Math.random() * (PULSE.maxGapMs - PULSE.minGapMs);

function containerDpr(width: number): number {
  const cap = width > WIDE_CONTAINER_PX ? WIDE_DPR : MAX_DPR;
  return Math.min(window.devicePixelRatio || 1, cap);
}

interface Gpu {
  gl: WebGL2RenderingContext;
  sim: Program;
  paper: Program;
  triangle: ReturnType<typeof createVao>;
}

function createGpu(canvas: HTMLCanvasElement): Gpu | null {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) return null;
  try {
    const sim = createProgram(gl, FULLSCREEN_VERTEX, SIM_FRAGMENT);
    const paper = createProgram(gl, FULLSCREEN_VERTEX, PAPER_FRAGMENT);
    return { gl, sim, paper, triangle: createVao(gl, paper, FULLSCREEN_TRIANGLE) };
  } catch (error) {
    console.warn('[paper] falling back to CSS grain, shader setup failed', error);
    return null;
  }
}

export interface PaperOptions {
  /** Papel estatico: sin estela, anillos, parallax ni tiempo. */
  reducedMotion: boolean;
  /** El reloj de gsap: el mismo que mueve Lenis, asi el papel y el scroll pintan en el mismo frame. */
  ticker: Ticker;
  /**
   * Donde se escucha el puntero, si no es el padre del contenedor: una cara que se
   * descubre al hover va `inert` y nunca recibe eventos, y quien los recibe es la
   * tarjeta que la contiene.
   */
  host?: HTMLElement;
}

/**
 * Arranca el papel en un canvas que llena `container`. Los eventos del puntero se
 * escuchan en el padre del contenedor, la seccion cuyo contenido va encima. null si
 * no hay WebGL2: el grano CSS ya esta puesto. La funcion devuelta lo para y deja el CSS.
 */
export function startPaper(container: HTMLElement, canvas: HTMLCanvasElement, { reducedMotion, ticker, host: listenOn }: PaperOptions): (() => void) | null {
  const gpu = createGpu(canvas);
  if (!gpu) return null;
  const { gl, sim, paper, triangle } = gpu;
  const root = document.documentElement;
  const host = listenOn ?? container.parentElement ?? container;

  let size = { width: 0, height: 0, simWidth: 0, simHeight: 0, dpr: 1 };
  let trail: [Target, Target] | null = null;
  let ripples: readonly Ripple[] = [];
  let palette = readPalette(container);
  let retint: { from: Palette; to: Palette; t0: number } | null = null;
  // Posiciones en px CSS del contenedor; dir en el espacio de la sim (y hacia arriba).
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, lastX: 0, lastY: 0, lastAt: 0, dirX: 0, dirY: 0, force: 0, seen: false, inside: false };
  let pulse = { t0: -Infinity, next: performance.now() + nextPulseGap() };
  let simScroll = 0;
  let governor = INITIAL_GOVERNOR;
  let looping = false;
  let measure = false;
  let quiet = 0;
  let pendingFrame = false;
  let stopped = false;
  let visible = true;

  function releaseTrail(): void {
    trail?.forEach(({ framebuffer, texture }) => {
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(texture);
    });
    trail = null;
  }

  function clearTrail(): void {
    trail?.forEach(({ framebuffer }) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function resizeIfNeeded(): void {
    const dpr = containerDpr(canvas.clientWidth);
    const width = Math.round(canvas.clientWidth * dpr);
    const height = Math.round(canvas.clientHeight * dpr);
    if (trail && width === size.width && height === size.height) return;
    const simWidth = Math.max(1, Math.ceil(width / SIM_DOWNSCALE));
    const simHeight = Math.max(1, Math.ceil(height / SIM_DOWNSCALE));
    size = { width, height, simWidth, simHeight, dpr };
    canvas.width = width;
    canvas.height = height;
    releaseTrail();
    trail = [createTarget(gl, simWidth, simHeight), createTarget(gl, simWidth, simHeight)];
    clearTrail();
    simScroll = getScroll().y;
  }

  function currentPalette(now: number): Palette {
    if (!retint) return palette;
    const t = Math.min(1, (now - retint.t0) / RETINT_MS);
    const eased = easeOutCubic(t);
    const mixed = { paper: mixRgb(retint.from.paper, retint.to.paper, eased), ink: mixRgb(retint.from.ink, retint.to.ink, eased) };
    if (t >= 1) retint = null;
    return mixed;
  }

  /** Envolvente del pulse: sube, meseta, baja. Solo mientras el loop vive. */
  function pulseEnvelope(now: number): number {
    if (now >= pulse.next) pulse = { t0: now, next: now + nextPulseGap() };
    const p = (now - pulse.t0) / PULSE.durationMs;
    if (p < 0 || p > 1) return 0;
    return Math.min(1, p / PULSE.ramp, (1 - p) / PULSE.ramp);
  }

  const cssHeight = () => size.height / size.dpr;

  function stepSim(frames: number, source: Target, destination: Target): void {
    const { width, height, simWidth, simHeight } = size;
    const scrollY = getScroll().y;
    // La estela viaja con la hoja: se corre lo mismo que el parallax desde el ultimo paso.
    const shift = reducedMotion ? 0 : ((scrollY - simScroll) * PARALLAX) / cssHeight();
    simScroll = scrollY;

    gl.bindFramebuffer(gl.FRAMEBUFFER, destination.framebuffer);
    gl.viewport(0, 0, simWidth, simHeight);
    gl.useProgram(sim.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, source.texture);
    gl.uniform1i(sim.uniform('u_prev'), 0);
    gl.uniform2f(sim.uniform('u_simResolution'), simWidth, simHeight);
    gl.uniform2f(sim.uniform('u_shift'), 0, shift);
    gl.uniform2f(sim.uniform('u_splat'), (pointer.x * size.dpr) / width, 1 - (pointer.y * size.dpr) / height);
    gl.uniform2f(sim.uniform('u_dir'), pointer.dirX, pointer.dirY);
    gl.uniform1f(sim.uniform('u_aspect'), width / height);
    gl.uniform1f(sim.uniform('u_force'), pointer.force * TRAIL.splatGain);
    gl.uniform1f(sim.uniform('u_radius'), TRAIL.radius);
    gl.uniform1f(sim.uniform('u_radiusGrowth'), TRAIL.radiusGrowth);
    gl.uniform1f(sim.uniform('u_anisotropy'), TRAIL.anisotropy);
    gl.uniform1f(sim.uniform('u_diffusion'), TRAIL.diffusion);
    gl.uniform1f(sim.uniform('u_fade'), Math.pow(TRAIL.fade, frames));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** La cola guarda px CSS con y hacia abajo; el shader quiere UV con y hacia arriba y radio en altos. */
  function ringUniforms(now: number): Float32Array {
    const packed = packRipples(ripples, now);
    const w = size.width / size.dpr;
    const h = cssHeight();
    for (let i = 0; i < packed.length; i += 4) {
      packed[i] /= w;
      packed[i + 1] = 1 - packed[i + 1] / h;
      packed[i + 2] /= h;
    }
    return packed;
  }

  function drawPaper(now: number, scene: Target, alive: boolean): void {
    const { width, height, dpr } = size;
    const colors = currentPalette(now);
    const hiColor = mixRgb(colors.paper, colors.ink, -0.5).map((c) => Math.min(255, Math.max(0, c)) / 255);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(paper.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, scene.texture);
    gl.uniform1i(paper.uniform('u_trail'), 0);
    gl.uniform2f(paper.uniform('u_resolution'), width, height);
    gl.uniform1f(paper.uniform('u_dpr'), dpr);
    gl.uniform1f(paper.uniform('u_scroll'), reducedMotion ? 0 : (getScroll().y * PARALLAX) / cssHeight());
    gl.uniform1f(paper.uniform('u_time8'), Math.floor((now / 1000) * PULSE.stepHz) / PULSE.stepHz);
    gl.uniform1f(paper.uniform('u_alive'), alive ? 1 : 0);
    gl.uniform2f(paper.uniform('u_trailTexel'), 1 / size.simWidth, 1 / size.simHeight);
    // Oscuridad continua: durante el retint los pesos del grano viajan con el color.
    const weights = resolveWeights(1 - Math.min(1, Math.max(0, (luminance(colors.paper) - 0.25) / 0.4)));
    gl.uniform4f(paper.uniform('u_surface'), weights.tooth, weights.felt, weights.crumple, weights.emboss);
    gl.uniform4f(paper.uniform('u_marks'), weights.warp, weights.streak1, weights.streak2, weights.stain);
    gl.uniform4f(paper.uniform('u_light'), weights.crease, weights.edge, weights.sheen, weights.halftone);
    gl.uniform4f(paper.uniform('u_dots'), weights.fleck, weights.halfTrail, weights.wakeDots, 0);
    gl.uniform1f(paper.uniform('u_strength'), weights.strength);
    gl.uniform1f(paper.uniform('u_shake'), alive && !reducedMotion ? pulseEnvelope(now) * weights.pulse * PULSE_GAIN : 0);
    gl.uniform3f(paper.uniform('u_paper'), colors.paper[0] / 255, colors.paper[1] / 255, colors.paper[2] / 255);
    gl.uniform3f(paper.uniform('u_ink'), colors.ink[0] / 255, colors.ink[1] / 255, colors.ink[2] / 255);
    gl.uniform3f(paper.uniform('u_hi'), hiColor[0], hiColor[1], hiColor[2]);
    gl.uniform4fv(paper.uniform('u_ripples'), ringUniforms(now));
    gl.uniform1f(paper.uniform('u_pitch'), HALFTONE_PITCH_PX);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function render(now: number, frames: number, simulate: boolean): void {
    resizeIfNeeded();
    if (!trail || canvas.clientWidth === 0 || canvas.clientHeight === 0) return;
    gl.bindVertexArray(triangle.vao);
    if (simulate) {
      stepSim(frames, trail[0], trail[1]);
      trail = [trail[1], trail[0]];
    }
    drawPaper(now, trail[0], simulate);
    container.dataset.paperGl = '';
  }

  function loop(_time: number, deltaMs: number): void {
    if (measure) {
      const step = stepGovernor(governor, deltaMs);
      governor = step.state;
      if (step.verdict === 'retreat') return retreat();
    }
    measure = true;

    const now = performance.now();
    const frames = Math.min(deltaMs, MAX_STEP_MS) / REFERENCE_FRAME_MS;
    const follow = 1 - Math.pow(1 - TRAIL.follow, frames);
    pointer.x += (pointer.targetX - pointer.x) * follow;
    pointer.y += (pointer.targetY - pointer.y) * follow;

    render(now, frames, true);

    pointer.force *= Math.pow(TRAIL.forceDecay, frames);
    ripples = pruneRipples(ripples, now);
    const busy = pointer.force > TRAIL.restForce || ripples.length > 0 || retint !== null;
    quiet = busy ? 0 : quiet + frames;
    if (quiet >= QUIET_FRAMES) {
      stopLoop();
      clearTrail();
      render(now, 0, false);
    }
  }

  function startLoop(): void {
    if (looping || stopped || !visible) return;
    looping = true;
    // La estela arranca limpia: el scroll hecho en reposo no debe arrastrarla de golpe.
    simScroll = getScroll().y;
    // El primer delta tras engancharse incluye el reposo: no es un frame lento.
    measure = false;
    quiet = 0;
    ticker.add(loop);
  }

  function stopLoop(): void {
    if (!looping) return;
    looping = false;
    ticker.remove(loop);
  }

  const drawOnce = () => {
    pendingFrame = false;
    if (!looping && !stopped) render(performance.now(), 0, false);
  };

  /** Un solo frame en el siguiente tick, para scroll, resize o retint sin movimiento. */
  function requestFrame(): void {
    if (looping || pendingFrame || stopped || !visible) return;
    pendingFrame = true;
    ticker.add(drawOnce, true);
  }

  const local = (event: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height };
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    const { x, y, height } = local(event);
    pointer.targetX = x;
    pointer.targetY = y;
    if (!pointer.seen || !pointer.inside) {
      // Al entrar no hay velocidad desde donde salio: el puntero aparece donde esta.
      pointer.x = pointer.lastX = x;
      pointer.y = pointer.lastY = y;
      pointer.lastAt = event.timeStamp;
      pointer.seen = true;
      pointer.inside = true;
      return;
    }
    const dx = x - pointer.lastX;
    const dy = y - pointer.lastY;
    const dist = Math.hypot(dx, dy);
    const dt = Math.max(event.timeStamp - pointer.lastAt, 1);
    if (dist > TRAIL.dirMinPx && height > 0) {
      // Direccion en el espacio de la sim: y hacia arriba.
      pointer.dirX += (dx / dist - pointer.dirX) * TRAIL.dirFollow;
      pointer.dirY += (-dy / dist - pointer.dirY) * TRAIL.dirFollow;
    }
    pointer.force = Math.min(pointer.force + (dist / dt) * TRAIL.forcePerSpeed, TRAIL.maxForce);
    pointer.lastX = x;
    pointer.lastY = y;
    pointer.lastAt = event.timeStamp;
    startLoop();
  };

  // Fuera del contenedor no se suma fuerza: la estela se apaga con su propio decaimiento.
  const onPointerLeave = () => {
    pointer.inside = false;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest(RIPPLE_IGNORE)) return;
    const { x, y, width, height } = local(event);
    ripples = addRipple(ripples, x, y, performance.now(), { width, height });
    startLoop();
  };

  const onModeChange = () => {
    const next = readPalette(container);
    if (samePalette(next, retint?.to ?? palette)) return;
    const now = performance.now();
    retint = reducedMotion ? null : { from: currentPalette(now), to: next, t0: now };
    palette = next;
    if (reducedMotion) requestFrame();
    else startLoop();
  };

  const onContextLost = () => {
    teardown();
  };

  const onVisibility = ([entry]: IntersectionObserverEntry[]) => {
    visible = entry?.isIntersecting ?? true;
    if (visible) requestFrame();
    else stopLoop();
  };

  const modeObserver = new MutationObserver(onModeChange);
  modeObserver.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  const resizeObserver = new ResizeObserver(() => requestFrame());
  resizeObserver.observe(container);
  const visibilityObserver = new IntersectionObserver(onVisibility);
  visibilityObserver.observe(container);
  canvas.addEventListener('webglcontextlost', onContextLost);
  const offScroll = reducedMotion ? () => {} : onScroll(requestFrame);
  if (!reducedMotion) {
    host.addEventListener('pointermove', onPointerMove, { passive: true });
    host.addEventListener('pointerleave', onPointerLeave);
    host.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
  }

  render(performance.now(), 0, false);

  function teardown(): void {
    if (stopped) return;
    stopped = true;
    stopLoop();
    ticker.remove(drawOnce);
    modeObserver.disconnect();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    offScroll();
    host.removeEventListener('pointermove', onPointerMove);
    host.removeEventListener('pointerleave', onPointerLeave);
    host.removeEventListener('pointerdown', onPointerDown, { capture: true });
    canvas.removeEventListener('webglcontextlost', onContextLost);
    // Primero el CSS: el grano del contenedor vuelve en el mismo frame en que se oculta el canvas.
    delete container.dataset.paperGl;
    canvas.hidden = true;
    releaseTrail();
    gl.deleteProgram(sim.program);
    gl.deleteProgram(paper.program);
    gl.deleteVertexArray(triangle.vao);
    gl.deleteBuffer(triangle.buffer);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  function retreat(): void {
    rememberRetreat();
    teardown();
  }

  return teardown;
}
