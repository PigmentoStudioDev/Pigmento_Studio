import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Icon, type IconName } from "./Icon";

/** Logotipos y senales: siluetas rellenas. */
const FILLED: IconName[] = ["instagram", "facebook", "behance", "arrow"];
/** De interfaz: dibujados a linea. */
const STROKED: IconName[] = ["sun", "moon"];
const NAMES: IconName[] = [...FILLED, ...STROKED];

describe("Icon", () => {
  /**
   * Un icono no se nombra a si mismo: el nombre accesible lo pone quien lo
   * envuelve. Sin aria-hidden, un enlace con icono se anunciaria dos veces.
   */
  it.each(NAMES)("%s se dibuja oculto al arbol de accesibilidad", (name) => {
    const { container } = render(<Icon name={name} />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
  });

  /**
   * El gate que de verdad importa. Los SVG de marca llegan con `fill="black"`
   * incrustado, y ese negro sobrevive al modo oscuro dibujando un icono negro sobre
   * fondo negro: sin error, sin aviso y sin nada que lo delate salvo mirarlo.
   */
  it.each(FILLED)("%s se rellena con currentcolor y no con un color propio", (name) => {
    const { container } = render(<Icon name={name} />);
    const paths = [...container.querySelectorAll("path")];

    expect(paths.length).toBeGreaterThan(0);
    expect(paths.every((path) => path.getAttribute("fill") === "currentcolor")).toBe(true);
  });

  /**
   * Un icono de linea pintado con `fill` no sale mal coloreado: sale convertido en
   * una mancha, porque el relleno tapa el hueco que la linea dibujaba. Por eso cada
   * icono declara como se pinta en vez de que lo decida quien lo llama.
   */
  it.each(STROKED)("%s se traza con currentcolor y no se rellena", (name) => {
    const { container } = render(<Icon name={name} />);
    const paths = [...container.querySelectorAll("path")];

    expect(paths.length).toBeGreaterThan(0);
    expect(paths.every((path) => path.getAttribute("stroke") === "currentcolor")).toBe(true);
    expect(paths.every((path) => path.getAttribute("fill") === "none")).toBe(true);
  });

  /**
   * El lienzo por defecto es la reticula de 24 y solo se sale quien declare el suyo.
   * La flecha llega en 118x115: si el componente le impusiera el de la casa, el SVG
   * recortaria el dibujo por la mitad sin decir nada.
   */
  it("respeta el lienzo propio de un icono que lo declara", () => {
    const cuadricula = render(<Icon name="instagram" />);
    const flecha = render(<Icon name="arrow" />);

    expect(cuadricula.container.querySelector("svg")).toHaveAttribute("viewBox", "0 0 24 24");
    expect(flecha.container.querySelector("svg")?.getAttribute("viewBox")).not.toBe("0 0 24 24");
  });

  /** Instagram son tres trazados. Aplanarlos a uno los funde en una mancha. */
  it("conserva los trazados de un icono compuesto", () => {
    const { container } = render(<Icon name="instagram" />);

    expect(container.querySelectorAll("path")).toHaveLength(3);
  });

  it.each(NAMES)("%s no tiene violaciones de accesibilidad", async (name) => {
    const { container } = render(<Icon name={name} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
