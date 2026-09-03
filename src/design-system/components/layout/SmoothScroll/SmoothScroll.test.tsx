import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SmoothScroll } from "./SmoothScroll";

/**
 * Los dos casos declaran la preferencia de movimiento reducido, y el primero tambien.
 *
 * No es por comodidad: sin ella el efecto arranca a importar Lenis y gsap, el archivo
 * de test termina antes de que esas importaciones resuelvan y el entorno se cierra a
 * mitad — vitest lo canta como error suelto y contamina el resto de la corrida. Lo que
 * este archivo puede afirmar es lo que pasa ANTES de cargar nada; el scroll suavizado
 * de verdad necesita un navegador.
 */
function preferReducedMotion() {
  const matchMedia = vi.fn((query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));

  vi.stubGlobal("matchMedia", matchMedia);

  return matchMedia;
}

describe("SmoothScroll", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * No pinta nada, y esa es su promesa entera: instala un comportamiento de pagina.
   * Si algun dia devolviera un nodo, se colaria un elemento vacio como primer hijo del
   * <body> y cualquier `:first-child` del sitio dejaria de apuntar a lo que cree.
   */
  it("no aporta DOM", () => {
    preferReducedMotion();

    const { container } = render(<SmoothScroll />);

    expect(container).toBeEmptyDOMElement();
  });

  /**
   * EL gate de este componente. Un scroll que sigue moviendose despues de que el dedo
   * pare es de los movimientos que peor sientan a quien tiene sensibilidad vestibular.
   * Con la preferencia puesta no se instancia nada — ni siquiera se descarga la
   * libreria, que es lo que este caso comprueba de rebote: si el guardia dejara pasar,
   * la importacion quedaria viva y el entorno se cerraria encima.
   */
  it("con movimiento reducido no toca el scroll", () => {
    const matchMedia = preferReducedMotion();

    render(<SmoothScroll />);

    expect(matchMedia).toHaveBeenCalledWith(expect.stringContaining("prefers-reduced-motion"));
  });
});
