"use client";

import { useEffect, useRef } from "react";
import { REDUCED_MOTION } from "./breakpoints";
import { loadMotion } from "./gsap";
import { HALFTONE_FIELD, HALFTONE_SHAPES, type HalftoneShapeName } from "./halftone/shapes";
import { BRAND_EASE, duration, stagger } from "./tokens";

/**
 * Un solido impreso en semitono que responde al puntero, sobre un canvas 2D.
 *
 * Portado del "ASCII wake" de Bencho, con los cambios de casa: sin glifos —la estela
 * ENGORDA los puntos en vez de cambiarlos por caracteres, que es tinta y no terminal—,
 * los tiempos de la escala de marca y la entrada atada al reveal de su tarjeta.
 *
 * - **La forma** es una mascara: cada celda guarda el tamano de su punto, que sale de
 *   la funcion del solido (`halftone/shapes`).
 * - **La estela** es otro numero por celda. El puntero lo sube a lo largo de la linea
 *   que recorrio —un trazo rapido no deja huecos— y cada fotograma se enfria en la
 *   misma fraccion. Mismo gesto que el papel de la placa de contacto, a escala de pieza.
 * - **El anillo** de un clic pasa como una onda y no deja nada detras.
 * - **La entrada**: los puntos crecen desde cero cuando la tarjeta llega a pantalla,
 *   con el desfase de su indice de reveal.
 *
 * El bucle solo corre mientras hay estela, anillo o entrada en curso; quieto no hay
 * fotograma. Con reduced-motion se pinta una vez, entero, y no escucha al puntero.
 */
/**
 * El paso de la trama, en pixeles de pantalla: la celda del lienzo se deriva del tamano
 * pintado para que una pieza de 56px y una de 250 tengan el mismo grano, como una misma
 * trama de imprenta a dos tamanos de papel.
 */
const SCREEN_PITCH = 2.1;
const MIN_CELL = 5;
const MAX_CELL = 14;
/** Fila a fila, la altura de un triangulo equilatero: una trama hexagonal, sin rayas. */
const ROW_RATIO = 0.866;
const DOT_RATIO = 0.46;
/** El ancho de la estela, en unidades del lienzo. */
const REACH = 30;
/** Por debajo de esto una celda ya no tiene estela. */
const COLD = 0.003;
/** Cuanto se acerca el anillo: su radio final, en unidades del lienzo. */
const RING_REACH = HALFTONE_FIELD * 0.9;

interface Ring {
  x: number;
  y: number;
  t: number;
}

export function useHalftone<T extends HTMLCanvasElement>(shape: HalftoneShapeName, hostSelector?: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reduced = window.matchMedia(REDUCED_MOTION).matches;
    const painted = canvas.clientWidth || HALFTONE_FIELD;
    const CELL = Math.min(MAX_CELL, Math.max(MIN_CELL, (HALFTONE_FIELD * SCREEN_PITCH) / painted));
    const ROW = CELL * ROW_RATIO;
    const DOT = CELL * DOT_RATIO;
    const cols = Math.floor(HALFTONE_FIELD / CELL);
    const rows = Math.floor(HALFTONE_FIELD / ROW);
    const mask = new Float32Array(cols * rows);
    const heat = new Float32Array(cols * rows);
    const ox = (HALFTONE_FIELD - cols * CELL) / 2;
    const oy = (HALFTONE_FIELD - rows * ROW) / 2;
    const state = { grow: reduced ? 1 : 0, lx: NaN, ly: NaN, raf: 0, rings: [] as Ring[], entered: reduced };
    const trail = duration("double");
    const ringLife = duration("double", 2);

    const cellX = (i: number, j: number) => ox + (i + 0.5 + (j & 1) * 0.5) * CELL;
    const cellY = (j: number) => oy + (j + 0.5) * ROW;

    const build = () => {
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(HALFTONE_FIELD * ratio);
      canvas.height = Math.round(HALFTONE_FIELD * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const ink = getComputedStyle(canvas).color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
      const dark = ink[0] * 0.299 + ink[1] * 0.587 + ink[2] * 0.114 > 128;
      const solid = HALFTONE_SHAPES[shape];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          mask[j * cols + i] = solid(cellX(i, j) - HALFTONE_FIELD / 2, cellY(j) - HALFTONE_FIELD / 2, dark);
        }
      }
    };

    const paint = () => {
      context.clearRect(0, 0, HALFTONE_FIELD, HALFTONE_FIELD);
      context.fillStyle = getComputedStyle(canvas).color;
      const rings = state.rings.map((ring) => {
        const p = ring.t / ringLife;
        const eased = 1 - Math.pow(1 - p, 3);
        return { x: ring.x, y: ring.y, r: eased * RING_REACH, amp: 0.6 * (1 - p) * (1 - p) * Math.min(1, p * 6) };
      });
      context.beginPath();
      for (let j = 0; j < rows; j++) {
        const y = cellY(j);
        for (let i = 0; i < cols; i++) {
          const k = j * cols + i;
          const m = mask[k];
          if (m <= 0) continue;
          const x = cellX(i, j);
          let h = heat[k];
          for (const ring of rings) {
            const d = (Math.hypot(x - ring.x, y - ring.y) - ring.r) / (REACH * 0.8);
            if (d > -2.5 && d < 2.5) h += ring.amp * Math.exp(-d * d);
          }
          // La estela engorda el punto hacia lleno: en la luz se nota mas que en la sombra.
          const v = Math.min(1, m + h * (1 - m));
          const r = DOT * Math.sqrt(v) * state.grow;
          if (r < 0.2) continue;
          context.moveTo(x + r, y);
          context.arc(x, y, r, 0, Math.PI * 2);
        }
      }
      context.fill();
    };

    const run = () => {
      if (state.raf || reduced) return;
      let prev = performance.now();
      const step = (now: number) => {
        const dt = Math.min(0.05, (now - prev) / 1000);
        prev = now;
        const keep = Math.exp((-dt * 3) / trail);
        let warm = 0;
        for (let k = 0; k < heat.length; k++) {
          const h = heat[k] * keep;
          heat[k] = h < COLD ? 0 : h;
          if (heat[k] > warm) warm = heat[k];
        }
        state.rings = state.rings.filter((ring) => (ring.t += dt) < ringLife);
        paint();
        state.raf = warm === 0 && state.rings.length === 0 ? 0 : requestAnimationFrame(step);
      };
      state.raf = requestAnimationFrame(step);
    };

    const stamp = (x: number, y: number) => {
      const c0 = Math.max(0, Math.floor((x - ox - REACH) / CELL));
      const c1 = Math.min(cols - 1, Math.ceil((x - ox + REACH) / CELL));
      const r0 = Math.max(0, Math.floor((y - oy - REACH) / ROW));
      const r1 = Math.min(rows - 1, Math.ceil((y - oy + REACH) / ROW));
      for (let j = r0; j <= r1; j++) {
        for (let i = c0; i <= c1; i++) {
          const q = ((cellX(i, j) - x) ** 2 + (cellY(j) - y) ** 2) / (REACH * REACH);
          if (q >= 1) continue;
          const k = j * cols + i;
          heat[k] = Math.min(1, heat[k] + 0.5 * (1 - q) * (1 - q));
        }
      }
    };

    const local = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const k = box.width / HALFTONE_FIELD;
      return { x: (event.clientX - box.left) / k, y: (event.clientY - box.top) / k };
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const { x, y } = local(event);
      if (Number.isNaN(state.lx)) {
        state.lx = x;
        state.ly = y;
      }
      const n = Math.max(1, Math.ceil(Math.hypot(x - state.lx, y - state.ly) / (REACH / 3)));
      for (let s = 1; s <= n; s++) stamp(state.lx + ((x - state.lx) * s) / n, state.ly + ((y - state.ly) * s) / n);
      state.lx = x;
      state.ly = y;
      run();
    };
    const onLeave = () => {
      state.lx = NaN;
    };
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      state.rings.push({ ...local(event), t: 0 });
      run();
    };

    build();
    paint();

    // La entrada, una vez, con el desfase de su tarjeta en la serie: el mismo indice que
    // reparte el reveal, leido de la hoja.
    let cancelled = false;
    let tween: { kill: () => void } | undefined;
    const enter = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || state.entered) return;
        state.entered = true;
        enter.disconnect();
        const index = Number(getComputedStyle(canvas).getPropertyValue("--pg-reveal-index")) || 0;
        void loadMotion().then(({ gsap }) => {
          if (cancelled) return;
          tween = gsap.to(state, {
            grow: 1,
            duration: duration("onehalf"),
            delay: index * stagger("slice") * 2,
            ease: BRAND_EASE,
            onUpdate: paint,
          });
        });
      },
      { threshold: 0.4 },
    );
    if (!reduced) enter.observe(canvas);

    // El modo da la vuelta a la tinta, y con ella a la lectura de la luz.
    const mode = new MutationObserver(() => {
      build();
      paint();
    });
    mode.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const host = (hostSelector ? canvas.closest<HTMLElement>(hostSelector) : null) ?? canvas.parentElement ?? canvas;
    if (!reduced) {
      host.addEventListener("pointermove", onMove, { passive: true });
      host.addEventListener("pointerleave", onLeave);
      host.addEventListener("pointerdown", onDown, { passive: true });
    }

    return () => {
      cancelled = true;
      tween?.kill();
      cancelAnimationFrame(state.raf);
      enter.disconnect();
      mode.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
    };
  }, [shape, hostSelector]);

  return ref;
}
