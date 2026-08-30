import { describe, expect, it } from "vitest";
import { MOTION_BREAKPOINTS } from "./breakpoints";

/** Evalua una media query de ancho contra un viewport, sin navegador. */
function matches(query: string, width: number): boolean {
  const max = /max-width:\s*(\d+)px/.exec(query);
  const min = /min-width:\s*(\d+)px/.exec(query);
  if (max) return width <= Number(max[1]);
  if (min) return width >= Number(min[1]);
  return false;
}

const QUERIES = Object.values(MOTION_BREAKPOINTS);

describe("condiciones de viewport del motion", () => {
  /**
   * EL gate de este archivo. gsap solo invoca el callback de matchMedia si alguna
   * condicion hace match:
   *
   *     (cond[p] = mq.matches) && (active = 1);
   *     active && func(context, ...)
   *
   * Un juego que solo mire hacia abajo no coincide con nada en un escritorio: el
   * callback no corre, no se crea ningun tween, y el efecto sencillamente no existe.
   * Sin error y sin aviso — y funcionando en el movil de quien lo prueba, que es lo
   * que hace que sobreviva a una revision. Dos behaviors estuvieron muertos asi.
   */
  it.each([320, 479, 480, 767, 768, 991, 992, 1440, 2560, 5120])(
    "a %ipx de ancho coincide al menos una condicion",
    (width) => {
      expect(QUERIES.some((query) => matches(query, width))).toBe(true);
    },
  );

  /**
   * Lo anterior comprobado en anchos sueltos podria pasar por casualidad. Lo que de
   * verdad garantiza la cobertura es que la escala quede ABIERTA por arriba: sin una
   * `min-width` sin techo, siempre existe una pantalla lo bastante ancha como para
   * no coincidir con nada.
   */
  it("la escala queda abierta por arriba", () => {
    expect(QUERIES.some((query) => /min-width/.test(query))).toBe(true);
  });
});
