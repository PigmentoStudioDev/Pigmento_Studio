"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { REDUCED_MOTION } from "./breakpoints";
import {
  BOW,
  BULGE,
  BULGE_REACH,
  BULGE_RATE,
  CALM_VELOCITY,
  CLICK_SLOP,
  COVER_MS,
  CURSOR_RATE,
  DRAG_SPEED,
  DRAG_SPEED_TOUCH,
  LENS_FLOOR,
  PAN_RATE,
  PARALLAX,
  RESIZE_DEBOUNCE_MS,
  SETTLED,
  SETTLED_LENS,
  TORCH_RADIUS,
  TORCH_RADIUS_TOUCH,
  cardMatrix,
  cellCount,
  columnsFor,
  damp,
  driftOffset,
  insetToward,
  isHorizontalWheel,
  isVisible,
  shadeMask,
  travelled,
  warpPoint,
  wheelPixels,
  wrap,
  type Pt,
} from "./domeGeometry";

/**
 * Cupula infinita: la reticula se tesela por los cuatro lados, se abomba hacia el
 * borde y se arrastra. Una transformacion matrix3d por tarjeta, sin WebGL.
 *
 * Las funciones puras viven en domeGeometry.ts. Aqui queda el motor, que es DOM y estado
 * mutable: el loop escribe estilos por fotograma y no debe disparar renders de React.
 * El hook solo pone el numero de celdas en React; los clones los pinta el organismo y
 * el motor reposiciona las celdas que ya existen.
 */

interface Cell {
  el: HTMLElement;
  img: HTMLImageElement | null;
  end: Pt;
  mid: Pt;
  out: boolean;
}

interface Engine {
  layout: () => void;
  detach: () => void;
}

const reducedMotion = (): boolean =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION).matches;

function finePointer(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(pointer: fine)").matches;
}

/**
 * El motor. Vive fuera del hook para que su estado mutable no pase por React: el loop
 * escribe estilos en cada fotograma y no debe disparar renders.
 *
 * El loop corre solo mientras algo se asienta (arrastre, rueda, lupa) y se apaga al
 * quedar quieto; cualquier entrada lo vuelve a encender. Fuera de pantalla no corre.
 */
function attachDomeGrid(
  stage: HTMLDivElement,
  list: HTMLUListElement,
  shade: HTMLDivElement,
  sourceCount: number,
  setCount: (count: number) => void,
): Engine {
  const x = { t: 0, c: 0 };
  const y = { t: 0, c: 0 };
  const size = { w: 0, h: 0 };
  const mid: Pt = { x: 0, y: 0 };
  const max: Pt = { x: 0, y: 0 };
  const margin: Pt = { x: 0, y: 0 };
  const cursor = { x: 0, y: 0, cx: 0, cy: 0 };
  const lens = { t: 0, c: 0 };
  const drag = { x: 0, y: 0, tx: 0, ty: 0, travelled: false, suppressClick: false };
  const lit = { x: -1, y: -1 };

  let cells: Cell[] = [];
  let period = 0;
  let card = 0;
  let gap = 0;
  let cols = 0;
  let speed = DRAG_SPEED;
  let hole = 0;
  let edge = 0;
  let fine = false;
  let ready = false;
  let running = false;
  let visible = true;
  let destroyed = false;
  let frame = 0;
  let prev = 0;
  let resizeTimer = 0;
  let coverTimer = 0;
  let observers: { disconnect: () => void }[] = [];

  const warpAt = (p: Pt): Pt =>
    warpPoint(p, mid, BOW, {
      x: cursor.cx,
      y: cursor.cy,
      push: lens.c > LENS_FLOOR ? BULGE * lens.c : 0,
      reach: BULGE_REACH * (card + gap),
    });

  const quadOf = (c: Cell): [Pt, Pt, Pt, Pt] => {
    const ph = (card + gap) / 2;
    const tx = wrap(c.end.x + margin.x - max.x, c.end.x + margin.x, x.c);
    const ty = wrap(c.end.y + margin.y - max.y, c.end.y + margin.y, y.c);
    const ox = c.mid.x - tx - mid.x;
    const oy = c.mid.y - ty - mid.y;

    return [
      warpAt({ x: ox - ph, y: oy - ph }),
      warpAt({ x: ox + ph, y: oy - ph }),
      warpAt({ x: ox - ph, y: oy + ph }),
      warpAt({ x: ox + ph, y: oy + ph }),
    ];
  };

  const matrixOf = (c: Cell, q: [Pt, Pt, Pt, Pt]): string => {
    const g2 = gap / 2;
    const [tl, tr, bl, br] = q;
    const corners: [Pt, Pt, Pt, Pt] = [
      insetToward(tl, tr, bl, g2),
      insetToward(tr, tl, br, g2),
      insetToward(bl, tl, br, g2),
      insetToward(br, bl, tr, g2),
    ];
    const origin = { x: c.mid.x - card / 2 - mid.x, y: c.mid.y - card / 2 - mid.y };

    return cardMatrix(corners, origin, card);
  };

  const render = (all: boolean, parallax: number) => {
    const pad = card + gap;
    const reach = BULGE_REACH * pad;

    for (const c of cells) {
      const q = quadOf(c);

      if (isVisible(q, mid, pad) || all) c.out = false;
      else if (c.out) continue;
      else c.out = true;

      c.el.style.transform = matrixOf(c, q);

      if (c.img) {
        const center = { x: (q[0].x + q[3].x) / 2, y: (q[0].y + q[3].y) / 2 };
        const d = driftOffset({ x: cursor.cx, y: cursor.cy }, center, reach, parallax);
        c.img.style.transform = `translate3d(${d.x}px, ${d.y}px, 0)`;
      }
    }
  };

  const layout = () => {
    if (!ready || destroyed) return;

    const items = Array.from(list.children) as HTMLElement[];
    for (const el of items) el.style.transform = "translate3d(0, 0, 0)";

    const origin = stage.getBoundingClientRect();
    cells = items.map((el) => {
      const b = el.getBoundingClientRect();
      return {
        el,
        img: el.querySelector("img"),
        end: { x: b.right - origin.left, y: b.bottom - origin.top },
        mid: { x: b.left - origin.left + b.width / 2, y: b.top - origin.top + b.height / 2 },
        out: true,
      };
    });

    max.x = cols * period;
    max.y = (items.length / cols) * period;
    margin.x = (max.x - size.w) / 2;
    margin.y = (max.y - size.h) / 2;
    render(true, reducedMotion() ? 0 : PARALLAX);
  };

  const resize = () => {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;

    size.w = r.width;
    size.h = r.height;
    const visibleCount = columnsFor(size.w);
    period = size.w / visibleCount;
    gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    card = period - gap;
    cols = visibleCount + 2;
    list.style.gridTemplateColumns = `repeat(${cols}, ${card}px)`;

    fine = finePointer();
    speed = fine ? DRAG_SPEED : DRAG_SPEED_TOUCH;
    mid.x = size.w / 2;
    mid.y = size.h / 2;

    hole = period * (fine ? TORCH_RADIUS : TORCH_RADIUS_TOUCH);
    edge = hole * 2;
    shade.style.maskImage = shadeMask(hole, edge);
    shade.style.webkitMaskImage = shade.style.maskImage;

    ready = true;
    const need = cellCount(visibleCount, size.h, period, sourceCount);
    if (need !== list.children.length) setCount(need);
    else layout();
    kick();
  };

  const still = (snap: boolean, calm: number): boolean =>
    snap ||
    (Math.abs(x.t - x.c) < SETTLED &&
      Math.abs(y.t - y.c) < SETTLED &&
      Math.abs(cursor.x - cursor.cx) < SETTLED &&
      Math.abs(cursor.y - cursor.cy) < SETTLED &&
      Math.abs(lens.t * calm - lens.c) < SETTLED_LENS);

  const tick = (time: number) => {
    if (destroyed || !visible) {
      running = false;
      return;
    }

    const dt = Math.min((time - prev) / 1000, 1 / 30);
    prev = time;
    const snap = reducedMotion();
    if (snap) lens.t = 0;

    if (snap) {
      x.c = x.t;
      y.c = y.t;
      cursor.cx = cursor.x;
      cursor.cy = cursor.y;
      lens.c = 0;
    } else {
      x.c = damp(x.c, x.t, PAN_RATE, dt);
      y.c = damp(y.c, y.t, PAN_RATE, dt);
      cursor.cx = damp(cursor.cx, cursor.x, CURSOR_RATE, dt);
      cursor.cy = damp(cursor.cy, cursor.y, CURSOR_RATE, dt);
    }

    const fx = Math.round(mid.x + cursor.cx);
    const fy = Math.round(mid.y + cursor.cy);
    if (fx !== lit.x || fy !== lit.y) {
      lit.x = fx;
      lit.y = fy;
      shade.style.setProperty("--fx", `${fx}px`);
      shade.style.setProperty("--fy", `${fy}px`);
    }

    const vel = Math.abs(x.t - x.c) + Math.abs(y.t - y.c);
    const calm = 1 / (1 + vel / CALM_VELOCITY);
    if (!snap) lens.c = damp(lens.c, lens.t * calm, BULGE_RATE, dt);

    render(false, snap ? 0 : PARALLAX);

    if (still(snap, calm)) {
      running = false;
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  const kick = () => {
    if (running || !visible || destroyed || !ready) return;
    running = true;
    prev = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const onHover = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect();
    if (fine) {
      cursor.x = e.clientX - r.left - mid.x;
      cursor.y = e.clientY - r.top - mid.y;
      lens.t = reducedMotion() ? 0 : 1;
    }
    kick();
  };

  const onDragMove = (e: PointerEvent) => {
    if (travelled(e.clientX - drag.x, e.clientY - drag.y, CLICK_SLOP)) drag.travelled = true;
    x.t = drag.tx - (e.clientX - drag.x) * speed;
    y.t = drag.ty - (e.clientY - drag.y) * speed;
    onHover(e);
  };

  const endDrag = () => {
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
    stage.removeAttribute("data-dragging");
    drag.suppressClick = drag.travelled;
  };

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    drag.x = e.clientX;
    drag.y = e.clientY;
    drag.tx = x.t;
    drag.ty = y.t;
    drag.travelled = false;
    drag.suppressClick = false;
    stage.setAttribute("data-dragging", "");
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  };

  const onLeave = () => {
    lens.t = 0;
    kick();
  };

  const onWheel = (e: WheelEvent) => {
    if (!isHorizontalWheel(e.deltaX, e.deltaY)) return;
    e.preventDefault();
    x.t += wheelPixels(e.deltaX, e.deltaMode, size.h);
    kick();
  };

  const onKey = (e: KeyboardEvent) => {
    const step = card + gap;
    const moves: Record<string, () => void> = {
      ArrowLeft: () => (x.t -= step),
      ArrowRight: () => (x.t += step),
      ArrowUp: () => (y.t -= step),
      ArrowDown: () => (y.t += step),
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    move();
    kick();
  };

  // Captura y no burbuja: el Link de cada tarjeta actua en burbuja y mira defaultPrevented.
  const onClick = (e: MouseEvent) => {
    if (!drag.suppressClick) return;
    drag.suppressClick = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const listen = <K extends keyof HTMLElementEventMap>(
    type: K,
    fn: (e: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ) => {
    stage.addEventListener(type, fn as EventListener, options);
    return () => stage.removeEventListener(type, fn as EventListener, options);
  };

  const removers = [
    listen("pointerdown", onDown),
    listen("pointermove", onHover),
    listen("pointerleave", onLeave),
    listen("wheel", onWheel, { passive: false }),
    listen("keydown", onKey),
    listen("click", onClick, { capture: true }),
  ];

  stage.setAttribute("data-armed", "");

  const markLoaded = () => {
    clearTimeout(coverTimer);
    stage.setAttribute("data-loaded", "");
  };

  const pending = Array.from(stage.querySelectorAll("img")).map((img) =>
    img.complete
      ? Promise.resolve()
      : new Promise<void>((done) => {
          img.addEventListener("load", () => done(), { once: true });
          img.addEventListener("error", () => done(), { once: true });
        }),
  );
  coverTimer = window.setTimeout(markLoaded, COVER_MS);
  void Promise.all(pending).then(markLoaded);

  const onResizeSettled = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, RESIZE_DEBOUNCE_MS);
  };

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(onResizeSettled);
    ro.observe(stage);
    observers.push(ro);
  }

  if (typeof IntersectionObserver !== "undefined") {
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });
    io.observe(stage);
    observers.push(io);
  }

  resize();

  return {
    layout,
    detach: () => {
      destroyed = true;
      cancelAnimationFrame(frame);
      clearTimeout(resizeTimer);
      clearTimeout(coverTimer);
      for (const off of removers) off();
      window.removeEventListener("pointermove", onDragMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      for (const o of observers) o.disconnect();
      observers = [];
      stage.removeAttribute("data-dragging");
    },
  };
}

export interface DomeGridHandle {
  stageRef: RefObject<HTMLDivElement | null>;
  listRef: RefObject<HTMLUListElement | null>;
  shadeRef: RefObject<HTMLDivElement | null>;
  /** Celdas en pantalla: las primeras son las piezas reales y el resto, clones. */
  count: number;
}

export function useDomeGrid(sourceCount: number): DomeGridHandle {
  const stageRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [count, setCount] = useState(sourceCount);

  useEffect(() => {
    const stage = stageRef.current;
    const list = listRef.current;
    const shade = shadeRef.current;
    if (!stage || !list || !shade || sourceCount === 0) return;

    const engine = attachDomeGrid(stage, list, shade, sourceCount, setCount);
    engineRef.current = engine;

    return () => {
      engine.detach();
      engineRef.current = null;
    };
  }, [sourceCount]);

  // Tras cada cambio de celdas el DOM ya tiene los clones: se mide de nuevo.
  useEffect(() => {
    engineRef.current?.layout();
  }, [count]);

  return { stageRef, listRef, shadeRef, count };
}
