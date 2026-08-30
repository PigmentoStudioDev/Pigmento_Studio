import { join } from "node:path";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { compile } from "sass";
import { describe, expect, it } from "vitest";
import { GlassSurface } from "./GlassSurface";

const CSS = compile(
  join(process.cwd(), "src/design-system/components/atoms/GlassSurface/GlassSurface.module.scss"),
  { loadPaths: ["node_modules"], quietDeps: true },
).css;

describe("GlassSurface", () => {
  it("apila las siete capas del material", () => {
    const { container } = render(<GlassSurface />);

    expect(container.querySelectorAll("div")).toHaveLength(8); // la lamina + 7
  });

  /**
   * Sin `isolation: isolate` las capas en mix-blend-mode no se funden contra la
   * lamina sino contra TODA la pagina que tienen debajo. No es un error: es un
   * cristal que cambia de aspecto segun por donde pase el scroll, y para cuando
   * alguien lo nota ya nadie relaciona el sintoma con esta linea.
   */
  it("aisla su contexto de mezcla", () => {
    expect(CSS).toMatch(/isolation:\s*isolate/);
  });

  /**
   * Ninguna capa es redundante: cada una aporta una combinacion distinta de mezcla y
   * geometria. No basta con que los MODOS sean unicos — `overlay` sale dos veces a
   * proposito, en el reflejo suave y en el canto oscuro, y son cosas distintas
   * porque sus sombras caen en lados opuestos. Lo que no puede repetirse es el par
   * entero: dos capas identicas se ven casi igual que una, y esa es justo la razon
   * por la que una sobraria sin que nadie lo notase.
   */
  it("ninguna capa repite la combinacion de otra", () => {
    // Una regla por bloque, quedandose solo con las de UNA clase: la regla agrupada
    // que comparte posicion no describe a ninguna capa en concreto.
    const bodies = CSS.split("}")
      .map((chunk) => chunk.split("{"))
      .filter((parts) => parts.length === 2)
      // .root queda fuera: es la lamina que las contiene, no una capa.
      .filter(([selector]) => /^\s*\.\w+\s*$/.test(selector) && !/\.surface\b/.test(selector))
      .map(([, declarations]) => declarations.replace(/\s+/g, " ").trim());

    expect(bodies).toHaveLength(7);
    expect(new Set(bodies).size).toBe(bodies.length);
  });

  /**
   * Hereda el radio del padre en vez de declarar uno propio. Con un radio fijo, la
   * lamina asomaria por las esquinas de cualquier caja que no midiera exactamente
   * lo que ella supone — empezando por la pildora de la barra.
   */
  it("hereda la forma de su padre", () => {
    const radii = [...CSS.matchAll(/border-radius:\s*([^;]+);/g)].map((match) => match[1].trim());

    expect(radii.length).toBeGreaterThan(0);
    radii.forEach((radius) => expect(radius).toBe("inherit"));
  });

  /**
   * Cubre la barra entera, controles incluidos. Si interceptara el puntero, el menu
   * y los botones dejarian de poder pulsarse: siguen ahi, se pintan, y no responden.
   */
  it("no intercepta el puntero", () => {
    expect(CSS).toMatch(/pointer-events:\s*none/);
  });

  it("es decoracion: fuera del arbol de accesibilidad", async () => {
    const { container } = render(<GlassSurface />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(await axe(container)).toHaveNoViolations();
  });
});
