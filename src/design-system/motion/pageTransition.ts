/**
 * Que clics cruzan la cortina entre paginas. Funcion pura: el hook decide cuando
 * actuar, y aqui solo se responde si un clic es una navegacion interna normal.
 *
 * Lo que no se intercepta se deja al navegador tal cual: el clic con modificador
 * (abrir en pestana), el boton central, un enlace externo o con `download`, y las
 * rutas de API y de panel, que no son paginas del sitio. Un ancla que no cambia la
 * ruta tampoco, porque la pagina no se va a ninguna parte.
 */

import type { CycledCandyFamily } from "../theme/candy";

/** Lo que de un clic lee la regla. Un MouseEvent lo cumple sin adaptarlo. */
export interface ClickLike {
  readonly button: number;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly defaultPrevented: boolean;
}

/** Lo que del enlace lee la regla. Un Element lo cumple sin adaptarlo. */
export interface LinkLike {
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
}

/**
 * Las rutas que nunca se animan. El prefijo de idioma va opcional porque en ingles
 * la URL es `/en/api/...`, y sin el la regla dejaria pasar esa variante.
 */
const NON_TRANSITION_PATH = /^(\/en)?\/(admin|api)(\/|$)/;

/**
 * La URL de destino si el clic debe cruzar la cortina; null si debe seguir su camino
 * normal. `current` es la pagina en la que esta el usuario ahora mismo.
 */
export function transitionTarget(
  click: ClickLike,
  link: LinkLike,
  current: URL,
): URL | null {
  if (click.defaultPrevented) return null;
  if (click.button !== 0) return null;
  if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return null;

  const href = link.getAttribute("href");
  if (href === null) return null;

  const target = link.getAttribute("target");
  if (target && target !== "_self") return null;
  if (link.hasAttribute("download")) return null;

  let url: URL;
  try {
    url = new URL(href, current);
  } catch {
    return null;
  }

  if (url.origin !== current.origin) return null;
  if (NON_TRANSITION_PATH.test(url.pathname)) return null;

  // Misma ruta y misma busqueda: es un ancla o la misma pagina, no una navegacion.
  if (url.pathname === current.pathname && url.search === current.search) return null;

  return url;
}

/** Una ruta y el pigmento de la cortina que lleva a ella. */
export interface PageTransitionPigment {
  path: string;
  family: CycledCandyFamily;
}

/**
 * El pigmento del destino, o null si la ruta no tiene (va la cortina neutra). Mira la
 * ruta sin el prefijo de idioma y acepta sus subrutas: `/en/servicios/motion` y
 * `/servicios/motion/algo` son motion.
 */
export function pigmentFor(pathname: string, pigments: readonly PageTransitionPigment[]): CycledCandyFamily | null {
  const path = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  const match = pigments.find((pigment) => path === pigment.path || path.startsWith(`${pigment.path}/`));
  return match?.family ?? null;
}
