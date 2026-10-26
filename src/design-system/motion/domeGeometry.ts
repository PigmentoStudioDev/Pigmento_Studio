/**
 * La geometria de la cupula: funciones puras que el motor del hook compone por fotograma.
 *
 * Viven aparte para que cada una tenga su prueba sin montar el DOM. La formula es la de
 * la referencia de diseno; lo que se cambia aqui son los nombres y la forma de llamarla,
 * no los numeros.
 */

export const COLUMNS = 4;
export const COLUMNS_MOBILE = 2;
export const MOBILE_BREAKPOINT = 767;

/** Abombado del domo: 0 es plano. */
export const BOW = 0.15;
/** Fuerza de la lupa del cursor, y su radio en tarjetas. */
export const BULGE = 0.25;
export const BULGE_REACH = 1.5;
/** Radio del hueco de la linterna, en tarjetas: en tactil descansa mas abierto. */
export const TORCH_RADIUS = 0.75;
export const TORCH_RADIUS_TOUCH = 1.5;
/** Px que la imagen se desplaza hacia el cursor dentro de su tarjeta. */
export const PARALLAX = 12;

export const DRAG_SPEED = 1.5;
export const DRAG_SPEED_TOUCH = 2.5;
/** Recorrido maximo de un gesto que sigue siendo un clic y no un arrastre. */
export const CLICK_SLOP = 10;

export const PAN_RATE = 0.1;
export const CURSOR_RATE = 0.12;
export const BULGE_RATE = 0.08;
export const CALM_VELOCITY = 40;
export const SETTLED = 0.1;
export const SETTLED_LENS = 0.001;
export const LENS_FLOOR = 0.001;

/** Con la lupa por debajo de este valor el abombado no se nota y no se calcula. */
const SHADE_STEPS = 12;
export const RESIZE_DEBOUNCE_MS = 100;
/** Tope de la cortina de carga: la reticula aparece aunque una imagen se atasque. */
export const COVER_MS = 1000;
/** Las primeras piezas de la primera pantalla; el resto carga con el navegador. */
export const PRELOAD_COUNT = 4;

export interface Pt {
  x: number;
  y: number;
}

/** Vuelve `v` al intervalo [min, max) — la tesela es infinita por dar la vuelta. */
export function wrap(min: number, max: number, v: number): number {
  const r = max - min;
  return min + ((((v - min) % r) + r) % r);
}

export function clamp(min: number, max: number, v: number): number {
  return Math.min(Math.max(v, min), max);
}

/**
 * Acercamiento exponencial independiente del fotograma: `rate` es lo que se mueve en
 * 1/60 s, y `dt` en segundos corrige a 120 Hz para no ir el doble de rapido.
 */
export function damp(from: number, to: number, rate: number, dt: number): number {
  return from + (to - from) * (1 - Math.pow(1 - rate, dt * 60));
}

export function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

export function columnsFor(width: number): number {
  return width < MOBILE_BREAKPOINT ? COLUMNS_MOBILE : COLUMNS;
}

/**
 * Celdas que cubren la pantalla: las columnas visibles mas dos de reserva, las filas
 * que caben mas dos, y siempre un multiplo de columnas para que la tesela cierre. Nunca
 * menos que las piezas: una pieza sin celda no se ve nunca.
 */
export function cellCount(visible: number, height: number, period: number, sources: number): number {
  const cols = visible + 2;
  const rows = Math.ceil(height / period) + 2;
  return Math.ceil(Math.max(cols * rows, sources) / cols) * cols;
}

export interface LensField {
  x: number;
  y: number;
  /** Empuje ya escalado por la fuerza de la lupa; 0 la apaga. */
  push: number;
  reach: number;
}

/**
 * El domo y la lupa: un punto se aleja del centro en proporcion a su distancia al
 * cuadrado, y el cursor empuja los puntos cercanos. Sin el domo la retícula es plana y
 * las tarjetas del borde no se leen como si estuvieran en una superficie curva.
 */
export function warpPoint(p: Pt, mid: Pt, bow: number, lens: LensField): Pt {
  const f = 1 + bow * ((p.x / mid.x) ** 2 + (p.y / mid.y) ** 2);
  let x = p.x * f;
  let y = p.y * f;

  if (lens.push > 0) {
    const dx = x - lens.x;
    const dy = y - lens.y;
    const falloff = Math.exp(-(dx * dx + dy * dy) / (lens.reach * lens.reach));
    x += dx * lens.push * falloff;
    y += dy * lens.push * falloff;
  }

  return { x, y };
}

/**
 * Mete un punto `by` px hacia el interior de la esquina `c`, a lo largo de las dos
 * aristas que salen de ella. Asi el hueco entre tarjetas sale del propio abombado y no
 * de restar un valor en el plano.
 */
export function insetToward(c: Pt, a: Pt, b: Pt, by: number): Pt {
  const la = Math.hypot(a.x - c.x, a.y - c.y) || 1;
  const lb = Math.hypot(b.x - c.x, b.y - c.y) || 1;

  return {
    x: c.x + (by * (a.x - c.x)) / la + (by * (b.x - c.x)) / lb,
    y: c.y + (by * (a.y - c.y)) / la + (by * (b.y - c.y)) / lb,
  };
}

/**
 * La matriz que lleva el cuadrado de la tarjeta a sus cuatro esquinas curvadas. Se
 * resuelve como una transformacion proyectiva y se emite como matrix3d: una sola
 * escritura de estilo por tarjeta, sin WebGL.
 */
export function cardMatrix(corners: readonly [Pt, Pt, Pt, Pt], origin: Pt, card: number): string {
  const [q0, q1, q2, q3] = corners;
  const x0 = q0.x - origin.x;
  const y0 = q0.y - origin.y;
  const x1 = q1.x - origin.x;
  const y1 = q1.y - origin.y;
  const x2 = q2.x - origin.x;
  const y2 = q2.y - origin.y;
  const x3 = q3.x - origin.x;
  const y3 = q3.y - origin.y;

  const dx1 = x1 - x3;
  const dy1 = y1 - y3;
  const dx2 = x2 - x3;
  const dy2 = y2 - y3;
  const sx = x0 - x1 - x2 + x3;
  const sy = y0 - y1 - y2 + y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = den ? (sx * dy2 - dx2 * sy) / den : 0;
  const h = den ? (dx1 * sy - sx * dy1) / den : 0;

  const a = x1 - x0 + g * x1;
  const b = x2 - x0 + h * x2;
  const d = y1 - y0 + g * y1;
  const e = y2 - y0 + h * y2;

  return `matrix3d(${a / card}, ${d / card}, 0, ${g / card}, ${b / card}, ${e / card}, 0, ${h / card}, 0, 0, 1, 0, ${x0}, ${y0}, 0, 1)`;
}

/** Una tarjeta fuera de la pantalla no se reescribe: se ahorra la escritura de estilo. */
export function isVisible(corners: readonly Pt[], mid: Pt, pad: number): boolean {
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);

  return (
    Math.max(...xs) > -mid.x - pad &&
    Math.min(...xs) < mid.x + pad &&
    Math.max(...ys) > -mid.y - pad &&
    Math.min(...ys) < mid.y + pad
  );
}

/**
 * La mascara de la linterna: transparente dentro del hueco y oscura fuera, con una
 * caida suave. Es un gradiente CSS con el cursor como centro, asi que mover la luz no
 * vuelve a escribir la mascara, solo `--fx` y `--fy`.
 */
export function shadeMask(hole: number, edge: number): string {
  const stops = [`transparent ${hole.toFixed(1)}px`];

  for (let i = 1; i <= SHADE_STEPS; i++) {
    const t = i / SHADE_STEPS;
    const at = hole + t * (edge - hole);
    stops.push(`rgba(0,0,0,${smooth(t).toFixed(4)}) ${at.toFixed(1)}px`);
  }

  return `radial-gradient(circle at var(--fx) var(--fy), ${stops.join(", ")})`;
}

/**
 * Un gesto es horizontal cuando domina la X. La rueda vertical es del scroll de la
 * pagina: el pie tiene que seguir siendo alcanzable desde la seccion.
 */
export function isHorizontalWheel(deltaX: number, deltaY: number): boolean {
  return Math.abs(deltaX) > Math.abs(deltaY);
}

/** La rueda cuenta lineas o paginas segun el modo del evento; aqui se lleva a px. */
export function wheelPixels(delta: number, deltaMode: number, height: number): number {
  const unit = deltaMode === 1 ? 16 : deltaMode === 2 ? height : 1;
  return delta * unit;
}

/** Un recorrido que pasa de `slop` ya es un arrastre, y no debe terminar en un clic. */
export function travelled(dx: number, dy: number, slop: number): boolean {
  return Math.hypot(dx, dy) > slop;
}

/** Desplazamiento de la imagen hacia el cursor, acotado al alcance de la lupa. */
export function driftOffset(cursor: Pt, center: Pt, reach: number, amount: number): Pt {
  return {
    x: clamp(-1, 1, (cursor.x - center.x) / reach) * amount,
    y: clamp(-1, 1, (cursor.y - center.y) / reach) * amount,
  };
}
