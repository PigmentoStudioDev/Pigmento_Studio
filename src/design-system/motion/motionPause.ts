import { REDUCED_MOTION } from "./breakpoints";

/**
 * El conmutador global de movimiento: para todos los bucles del sitio a la vez.
 *
 * WCAG 2.2.2 (nivel A) pide un mecanismo para detener lo que se mueve solo mas de
 * cinco segundos, y parar mientras el puntero o el foco estan encima NO cuenta: el
 * documento Understanding de W3C lo dice expresamente, y en tactil no hay ninguna de
 * las dos cosas. Un solo control en la fila de utilidades, junto a tema e idioma, en
 * vez de un boton por bucle: es lo que recomiendan W3C, GSAP y Val Head, y un bucle
 * nuevo solo tiene que escuchar este estado.
 *
 * Sin eleccion guardada arranca segun el sistema: quien tiene puesto reduced-motion
 * entra con todo parado. Despues manda lo que la persona elija, y se recuerda.
 *
 * Lo publica tambien como atributo en la raiz para lo que se mueve solo con CSS.
 */
export const MOTION_STORAGE_KEY = "pigmento-motion";
export const MOTION_PAUSED_ATTRIBUTE = "data-motion-paused";

const listeners = new Set<() => void>();

let current: boolean | null = null;

function stored(): boolean | null {
  try {
    const value = localStorage.getItem(MOTION_STORAGE_KEY);
    return value === "paused" ? true : value === "running" ? false : null;
  } catch {
    return null;
  }
}

function paint(paused: boolean) {
  document.documentElement.toggleAttribute(MOTION_PAUSED_ATTRIBUTE, paused);
}

export function getMotionPaused(): boolean {
  if (typeof window === "undefined") return false;
  if (current === null) {
    current = stored() ?? window.matchMedia(REDUCED_MOTION).matches;
    paint(current);
  }
  return current;
}

export function getServerMotionPaused(): boolean {
  return false;
}

export function setMotionPaused(paused: boolean) {
  current = paused;
  paint(paused);
  try {
    localStorage.setItem(MOTION_STORAGE_KEY, paused ? "paused" : "running");
  } catch {
    // Sin storage la eleccion dura lo que la visita; no es un fallo.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeMotionPaused(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
