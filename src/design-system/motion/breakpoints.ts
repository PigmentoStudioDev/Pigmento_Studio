/**
 * Las condiciones de viewport que comparten los behaviors, en el formato que pide
 * `gsap.matchMedia()`.
 *
 * **Tienen que CUBRIR todos los anchos, y ese es el motivo de que vivan aqui.**
 * gsap solo invoca el callback si al menos una condicion hace match — en su fuente:
 *
 *     (cond[p] = mq.matches) && (active = 1);
 *     ...
 *     active && func(context, ...)
 *
 * Un juego de condiciones que solo mire hacia abajo (`max-width`) no coincide con
 * nada en un escritorio, asi que el callback no corre, no se crea ningun tween y el
 * efecto no existe. Sin error, sin aviso, y funcionando en el movil de quien lo
 * prueba. Paso: dos behaviors estuvieron muertos en escritorio por copiar el juego
 * de condiciones sin `isDesktop`.
 *
 * Por eso `isDesktop` no es "el breakpoint grande": es el que deja la escala ABIERTA
 * por arriba. Su test lo vigila.
 */
export const MOTION_BREAKPOINTS = {
  isMobile: "(max-width: 479px)",
  isMobileLandscape: "(max-width: 767px)",
  isTablet: "(max-width: 991px)",
  isDesktop: "(min-width: 992px)",
} as const;

/**
 * Va junto a los anchos y no en cada behavior porque se consulta igual: como una
 * condicion mas del mismo matchMedia, para que gsap revierta el efecto solo si
 * alguien cambia la preferencia en pleno uso.
 */
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

export type MotionConditions = Partial<
  Record<keyof typeof MOTION_BREAKPOINTS | "isReduced", boolean>
>;
