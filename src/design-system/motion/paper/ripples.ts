import { RIPPLE } from './constants';

export interface Ripple {
  readonly x: number;
  readonly y: number;
  readonly t0: number;
  readonly rMax: number;
  /** Momento en que se le pidio apagarse para dejar sitio; null mientras vive normal. */
  readonly dieAt: number | null;
}

export interface Viewport {
  width: number;
  height: number;
}

/** Radio final: hasta la esquina mas lejana mas un margen, asi el anillo sale del contenedor. */
export function rippleReach(x: number, y: number, viewport: Viewport): number {
  const dx = Math.max(x, viewport.width - x);
  const dy = Math.max(y, viewport.height - y);
  return Math.hypot(dx, dy) + RIPPLE.overshoot * viewport.height;
}

/**
 * Agrega un anillo respetando el gap y los slots. Con los slots llenos el mas viejo
 * vivo pasa a apagarse en vez de desaparecer de golpe; si ya no cabe ni asi, se va
 * el que lleva mas tiempo apagandose.
 */
export function addRipple(list: readonly Ripple[], x: number, y: number, now: number, viewport: Viewport): readonly Ripple[] {
  const last = list[list.length - 1];
  if (last && now - last.t0 < RIPPLE.gapMs) return list;

  let next: readonly Ripple[] = [...list, { x, y, t0: now, rMax: rippleReach(x, y, viewport), dieAt: null }];

  const living = next.filter((r) => r.dieAt === null);
  if (living.length >= RIPPLE.slots) {
    const oldest = living[0];
    next = next.map((r) => (r === oldest ? { ...r, dieAt: now } : r));
  }
  while (next.length > RIPPLE.slots) {
    const dying = next.find((r) => r.dieAt !== null) ?? next[0];
    next = next.filter((r) => r !== dying);
  }
  return next;
}

export function rippleFrame(r: Ripple, now: number): { radius: number; alpha: number } {
  const p = Math.min(1, Math.max(0, (now - r.t0) / RIPPLE.durationMs));
  const radius = r.rMax * (1 - (1 - p) * (1 - p));
  const tailStart = 1 - RIPPLE.tail;
  const fade = (p - tailStart) / RIPPLE.tail;
  let alpha = RIPPLE.alpha * (p < tailStart ? 1 : 1 - fade * fade);
  if (r.dieAt !== null) alpha *= 1 - Math.min(1, (now - r.dieAt) / RIPPLE.dieMs);
  return { radius, alpha: Math.max(0, alpha) };
}

export function pruneRipples(list: readonly Ripple[], now: number): readonly Ripple[] {
  const next = list.filter((r) => rippleFrame(r, now).alpha > 0);
  return next.length === list.length ? list : next;
}

/** vec4 por slot (x, y, radio, alpha) en px CSS con y hacia abajo; el motor convierte. */
export function packRipples(list: readonly Ripple[], now: number): Float32Array {
  const out = new Float32Array(RIPPLE.slots * 4);
  list.slice(-RIPPLE.slots).forEach((r, i) => {
    const { radius, alpha } = rippleFrame(r, now);
    out.set([r.x, r.y, radius, alpha], i * 4);
  });
  return out;
}
