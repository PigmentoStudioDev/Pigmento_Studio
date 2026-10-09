import { describe, expect, it } from "vitest";
import { BAND_PARALLAX, DEFAULT_BACKDROP_PARALLAX, MAX_TRAVEL, TARGET_OVERFLOW } from "./backdrop";

/**
 * `ImageBackdrop` compone sus opciones como `{ ...DEFAULT_BACKDROP_PARALLAX,
 * ...parallax }`, asi que lo que una constante NO diga no cae en el valor por defecto
 * del hook: cae en el de la portada. Es una trampa silenciosa —el efecto se crea, no
 * falla y no se mueve— y la unica forma de verla es componer igual que el componente.
 */
const componer = (opciones: typeof BAND_PARALLAX) => ({
  ...DEFAULT_BACKDROP_PARALLAX,
  ...opciones,
});

describe("backdrop", () => {
  /**
   * El bug: sin `scrollStart` propio, la banda heredaba el `top top` de la portada.
   * Ese disparador arranca cuando el borde superior toca el techo de la ventana —o
   * sea, cuando la banda ya se esta yendo—, asi que durante todo el rato en que se la
   * mira el avance valia cero.
   */
  it("la banda mide su recorrido desde que entra por abajo, no desde que se va por arriba", () => {
    expect(componer(BAND_PARALLAX).scrollStart).toBe("top bottom");
  });

  /** La portada si arranca pegada al borde de arriba, y eso no cambia. */
  it("la portada sigue midiendo desde el techo", () => {
    expect(DEFAULT_BACKDROP_PARALLAX.scrollStart).toBe("top top");
  });

  /**
   * El recorrido no puede pasarse del sobrante o el borde del objetivo entra en la
   * mascara y se ve una franja vacia. Se comprueba sobre el numero compuesto, que es
   * el que acaba en el tween.
   */
  it("ninguna de las dos se pasa del sobrante del objetivo", () => {
    const tope = ((TARGET_OVERFLOW - 100) / TARGET_OVERFLOW) * 100;

    for (const opciones of [DEFAULT_BACKDROP_PARALLAX, BAND_PARALLAX]) {
      const { start = 0, end = 0 } = componer(opciones);
      expect(Math.abs(end - start)).toBeLessThanOrEqual(tope);
    }
    expect(MAX_TRAVEL).toBe(tope);
  });
});
