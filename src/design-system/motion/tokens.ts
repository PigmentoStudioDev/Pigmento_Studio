/**
 * El motion de marca, del lado de JavaScript.
 *
 * Los tokens viven en `_brand.scss` y `_app.scss` los publica como custom properties
 * en la raiz. Aqui se LEEN, no se copian: una lista escrita en TypeScript se
 * desincroniza en cuanto la marca reafine un paso, y el sintoma es un gesto de gsap
 * que ya no suena con los de CSS sin que nada falle.
 *
 * Existe porque cada hook escribia su tiempo y su curva — cinco duraciones fuera de
 * la escala y siete curvas de gsap junto a una sola de marca —, y el gate de literales
 * solo miraba los `.tsx`.
 */

/** Los pasos de la escala de _brand.scss: cuarto, media, una, una y media, doble. */
export type DurationStep = "quarter" | "half" | "base" | "onehalf" | "double";

export type StaggerStep = "char" | "slice";

/**
 * La curva de marca, registrada en gsap con este nombre al cargar el motion. Es la
 * curva de un gesto que se mira; lo que persigue al puntero lleva la de seguir, y
 * lo atado al scroll no lleva ninguna.
 */
export const BRAND_EASE = "pg-default";

/**
 * La curva de seguir, registrada igual. Para lo que se reapunta en cada movimiento
 * (`quickTo`): la de marca arranca lenta, y reapuntada a cada frame no llega nunca.
 */
export const FOLLOW_EASE = "pg-follow";

/** Sin curva: el progreso lo dicta el scroll o una velocidad constante, no un gesto. */
export const EASE_LINEAR = "none";

/** "0.6s" o "150ms" a segundos, que es la unidad de gsap. Vacio es cero. */
export function toSeconds(value: string): number {
  const text = value.trim();
  if (!text) return 0;

  const amount = Number.parseFloat(text);
  if (Number.isNaN(amount)) return 0;

  return text.endsWith("ms") ? amount / 1000 : amount;
}

/** `cubic-bezier(a, b, c, d)` al "a,b,c,d" que acepta CustomEase; null si no es una. */
export function bezierPoints(value: string): string | null {
  const match = value.match(/cubic-bezier\(([^)]+)\)/);
  if (!match) return null;

  const points = match[1].split(",").map((point) => point.trim());
  return points.length === 4 ? points.join(",") : null;
}

function readToken(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name);
}

/**
 * Un paso de la escala, en segundos. `times` escribe un desfase como MULTIPLO de un
 * paso, igual que en la hoja (`calc($duration-quarter * 3)`): sumando, el tercero
 * deja de leerse como el tercero.
 */
export function duration(step: DurationStep, times = 1): number {
  return toSeconds(readToken(`--pg-duration-${step}`)) * times;
}

/** El desfase entre piezas de una secuencia, en segundos. */
export function stagger(step: StaggerStep): number {
  return toSeconds(readToken(`--pg-stagger-${step}`));
}

/** La curva de marca tal como la publica la hoja. */
export function brandEasePoints(): string | null {
  return bezierPoints(readToken("--pg-ease-default"));
}

/** La curva de seguir tal como la publica la hoja. */
export function followEasePoints(): string | null {
  return bezierPoints(readToken("--pg-ease-follow"));
}
