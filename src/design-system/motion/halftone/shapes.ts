/**
 * Los solidos del semitono. Cada uno es una funcion de un punto del lienzo (centrado
 * en 0,0, en unidades de `HALFTONE_FIELD`) al tamano de su punto, de 0 (fuera) a 1
 * (lleno). El volumen lo hace la LUZ: cada cara recibe una cantidad, y el semitono la
 * imprime —puntos densos en la sombra, escasos en la luz—, que es lo que separa un
 * objeto impreso de un pictograma dibujado.
 *
 * La luz es una para todos, desde arriba a la izquierda, para que se lean como una
 * familia. `dark` dice si la tinta es clara (pagina oscura): entonces los puntos son la
 * luz y la cara iluminada es la densa; en tinta oscura es al reves, como en papel.
 *
 * Metodo portado del "ASCII wake" de Bencho: alli un cubo, aqui los nuestros.
 */
export type HalftoneShapeName = "sphere" | "seal" | "pair" | "slab" | "steps";

/** El lado del lienzo, en unidades propias. La forma se dibuja dentro de un radio de 0.4. */
export const HALFTONE_FIELD = 240;

const R = HALFTONE_FIELD * 0.4;

/** La luz, normalizada: arriba, a la izquierda y algo hacia quien mira. */
const LIGHT = normalize([-0.5, -0.62, 0.6]);

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function normalize([x, y, z]: number[]): number[] {
  const n = Math.hypot(x, y, z);
  return [x / n, y / n, z / n];
}

/**
 * La luz de una cara como tamano de punto, leida segun la tinta. Ninguna cara baja de
 * un quinto de punto: la mas clara sigue leyendose como cara y la estela puede
 * escribir sobre ella.
 */
function lit(v: number, dark: boolean): number {
  return 0.18 + 0.82 * clamp(dark ? v : 1.05 - v, 0, 1);
}

/** El filo donde se juntan dos caras: una linea llena, la que dibuja el contorno. */
const SEAM = 0.05;

/**
 * Una esfera de radio `r` centrada en (cx, cy), con su luz: el sombreado de Lambert, y
 * el contorno lleno. `null` fuera, para que quien componga varias sepa que ahi no hay.
 */
function ball(x: number, y: number, cx: number, cy: number, r: number, dark: boolean): number | null {
  const nx = (x - cx) / r;
  const ny = (y - cy) / r;
  const d = Math.hypot(nx, ny);
  if (d > 1) return null;
  if (d > 1 - SEAM / 2) return 1;
  const z = Math.sqrt(1 - d * d);
  const diffuse = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + z * LIGHT[2]);
  return lit(0.08 + 0.92 * diffuse, dark);
}

function sphere(x: number, y: number, dark: boolean): number {
  return ball(x, y, 0, 0, R, dark) ?? 0;
}

/**
 * Trato directo: dos esferas que se tocan, sin nada en medio. La de delante tapa a la
 * de detras, y el filo donde se juntan lo dibuja su contorno.
 */
const PAIR_RADIUS = R * 0.56;
const PAIR_OFFSET = R * 0.44;

function pair(x: number, y: number, dark: boolean): number {
  const front = ball(x, y, -PAIR_OFFSET, PAIR_OFFSET * 0.35, PAIR_RADIUS, dark);
  if (front !== null) return front;
  return ball(x, y, PAIR_OFFSET, -PAIR_OFFSET * 0.35, PAIR_RADIUS, dark) ?? 0;
}

/**
 * Un sello: un disco grueso en perspectiva, con un anillo grabado en la cara de
 * arriba. La cara es una elipse; el canto, la banda entre esa elipse y la de abajo, con
 * la luz cayendo de izquierda a derecha.
 */
const SEAL_TILT = 0.5;
const SEAL_THICKNESS = R * 0.42;
const SEAL_RING = 0.62;

function seal(x: number, y: number, dark: boolean): number {
  const rx = R;
  const ry = R * SEAL_TILT;
  const topY = y + SEAL_THICKNESS / 2;
  const onTop = (x / rx) ** 2 + (topY / ry) ** 2;
  if (onTop <= 1) {
    if (onTop > (1 - SEAM) ** 2) return 1;
    const ring = Math.sqrt(onTop);
    if (Math.abs(ring - SEAL_RING) < SEAM / 2) return 1;
    // La cara de arriba recibe casi toda la luz, con un leve degradado hacia el fondo.
    return lit(0.92 - 0.18 * ((x / rx + topY / ry) / 2 + 0.5), dark);
  }
  if (Math.abs(x) > rx) return 0;
  const lower = ry * Math.sqrt(1 - (x / rx) ** 2);
  const top = -SEAL_THICKNESS / 2 + lower;
  const bottom = SEAL_THICKNESS / 2 + lower;
  if (y < top || y > bottom) return 0;
  if (bottom - y < SEAM * R) return 1;
  // El canto: en media luz a la izquierda, en sombra a la derecha.
  return lit(0.5 - 0.38 * ((x / rx + 1) / 2), dark);
}

/**
 * Una caja en isometrico, la geometria del cubo de la referencia generalizada: ancho
 * sobre el eje que baja a la derecha, fondo sobre el que baja a la izquierda y alto.
 * Se ven tres caras —arriba, izquierda y derecha—, cada una con su luz. `top` permite
 * grabar algo en la cara de arriba: recibe su posicion (0..1 en los dos ejes).
 */
const ISO_X = [Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)];
const ISO_Z = [-Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)];

interface Box {
  /** Centro de la base, en el lienzo. */
  cx: number;
  cy: number;
  width: number;
  depth: number;
  height: number;
  top?: (s: number, t: number, dark: boolean) => number | null;
}

function within(x: number, y: number, o: number[], p: number[], q: number[]): number[] | null {
  const dx = x - o[0];
  const dy = y - o[1];
  const det = p[0] * q[1] - p[1] * q[0];
  const s = (dx * q[1] - dy * q[0]) / det;
  const t = (p[0] * dy - p[1] * dx) / det;
  return s >= 0 && s <= 1 && t >= 0 && t <= 1 ? [s, t] : null;
}

const edge = (v: number) => v < SEAM || v > 1 - SEAM;

function box(x: number, y: number, b: Box, dark: boolean): number | null {
  const at = (a: number, d: number, h: number) => [
    b.cx + a * ISO_X[0] + d * ISO_Z[0],
    b.cy + a * ISO_X[1] + d * ISO_Z[1] - h,
  ];
  const W = [b.width * ISO_X[0], b.width * ISO_X[1]];
  const D = [b.depth * ISO_Z[0], b.depth * ISO_Z[1]];
  const H = [0, -b.height];
  const top = within(x, y, at(-b.width / 2, -b.depth / 2, b.height), W, D);
  if (top) {
    if (edge(top[0]) || edge(top[1])) return 1;
    return b.top?.(top[0], top[1], dark) ?? lit(0.96, dark);
  }
  const left = within(x, y, at(-b.width / 2, b.depth / 2, 0), W, H);
  if (left) return edge(left[0]) || left[1] < SEAM ? 1 : lit(0.56, dark);
  const right = within(x, y, at(b.width / 2, -b.depth / 2, 0), D, H);
  if (right) return edge(right[0]) || right[1] < SEAM ? 1 : lit(0.13, dark);
  return null;
}

/** Desarrollo web: una losa con una pantalla hundida en la cara de arriba. */
const SLAB_SIDE = R * 1.1;
const SLAB_HEIGHT = R * 0.32;
const SLAB_SCREEN = 0.2;

function slab(x: number, y: number, dark: boolean): number {
  return (
    box(
      x,
      y,
      {
        cx: 0,
        cy: SLAB_HEIGHT / 2,
        width: SLAB_SIDE,
        depth: SLAB_SIDE,
        height: SLAB_HEIGHT,
        top: (s, t) => {
          const inScreen = s > SLAB_SCREEN && s < 1 - SLAB_SCREEN && t > SLAB_SCREEN && t < 1 - SLAB_SCREEN;
          if (!inScreen) return null;
          const rim = Math.min(s - SLAB_SCREEN, 1 - SLAB_SCREEN - s, t - SLAB_SCREEN, 1 - SLAB_SCREEN - t);
          return rim < SEAM / 2 ? 1 : lit(0.42, dark);
        },
      },
      dark,
    ) ?? 0
  );
}

/**
 * Marketing: tres bloques que suben en escalera, alineados en la base. Se prueban de
 * delante hacia atras —el de mas a la derecha es el mas cercano—, y el primero que
 * cubre el punto lo tapa.
 */
const STEP_WIDTH = R * 0.5;
const STEP_DEPTH = R * 0.62;
const STEPS = [1.3, 0.9, 0.5].map((height, i) => ({
  offset: (1 - i) * STEP_WIDTH,
  height: R * height,
}));
const STEPS_GROUND = R * 0.55;

function steps(x: number, y: number, dark: boolean): number {
  for (const step of STEPS) {
    const hit = box(
      x,
      y,
      {
        cx: step.offset * ISO_X[0],
        cy: STEPS_GROUND + step.offset * ISO_X[1],
        width: STEP_WIDTH,
        depth: STEP_DEPTH,
        height: step.height,
      },
      dark,
    );
    if (hit !== null) return hit;
  }
  return 0;
}

export const HALFTONE_SHAPES: Record<HalftoneShapeName, (x: number, y: number, dark: boolean) => number> = {
  sphere,
  seal,
  pair,
  slab,
  steps,
};
