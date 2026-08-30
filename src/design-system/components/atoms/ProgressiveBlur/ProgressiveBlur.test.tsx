import { join } from "node:path";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { compile } from "sass";
import { describe, expect, it } from "vitest";
import { ProgressiveBlur } from "./ProgressiveBlur";

const CSS = compile(
  join(process.cwd(), "src/design-system/components/atoms/ProgressiveBlur/ProgressiveBlur.module.scss"),
  { loadPaths: ["node_modules"], quietDeps: true },
).css;

/** Los `mask:` sin prefijo, en el orden en que los declara la hoja. */
const masks = () => [...CSS.matchAll(/(?<!-)\bmask:\s*([^;]+);/g)].map((match) => match[1]);

describe("ProgressiveBlur", () => {
  /**
   * Cinco capas, ni una menos. `backdrop-filter` no acepta una intensidad variable,
   * asi que el degradado de desenfoque no existe como tal: lo que se percibe como
   * continuo es la SUMA de las cinco. Con cuatro se ve el escalon.
   */
  it("apila las cinco capas", () => {
    const { container } = render(<ProgressiveBlur />);

    expect(container.querySelectorAll("div")).toHaveLength(6); // el contenedor + 5
  });

  /**
   * La inversion respecto al efecto original vive ENTERA en la direccion de las
   * mascaras. Si una sola se quedara sin `to top`, esa capa difuminaria por el borde
   * contrario: el resultado no es un error, es un degradado sucio en medio de la
   * franja, y nada avisa.
   */
  it("todas las mascaras van hacia arriba, que es lo que invierte el efecto", () => {
    const found = masks();

    expect(found).toHaveLength(5);
    found.forEach((mask) => expect(mask).toContain("to top"));
  });

  /**
   * Cada capa dobla el desenfoque de la anterior. Es lo que hace que la progresion
   * se lea suave: en pasos iguales, el ojo ve bandas.
   */
  it("el desenfoque crece de forma monotona", () => {
    const blurs = [...CSS.matchAll(/(?<!-)\bbackdrop-filter:\s*blur\(([0-9.]+)em\)/g)].map((match) =>
      Number(match[1]),
    );

    expect(blurs).toHaveLength(5);
    blurs.forEach((blur, index) => {
      if (index > 0) expect(blur).toBeGreaterThan(blurs[index - 1]);
    });
  });

  /**
   * Es pintura sobre el contenido. Si interceptara el puntero, todo lo que quedara
   * bajo la franja — la cabecera entera — dejaria de poder pulsarse, y el sintoma no
   * se ve: los controles estan ahi, se pintan y no responden.
   */
  it("no intercepta el puntero", () => {
    expect(CSS).toMatch(/pointer-events:\s*none/);
  });

  it("es decoracion: fuera del arbol de accesibilidad", async () => {
    const { container } = render(<ProgressiveBlur />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(await axe(container)).toHaveNoViolations();
  });
});
