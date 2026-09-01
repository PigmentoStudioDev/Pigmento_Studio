import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { compile, type Options } from "sass";
import { describe, expect, it } from "vitest";
import { Reveal, type RevealStep } from "./Reveal";

const SASS: Options<"sync"> = { loadPaths: ["node_modules"], quietDeps: true };

const css = compile(join(__dirname, "Reveal.module.scss"), SASS).css;

const declared = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(([, name]) => name));

const STEPS: RevealStep[] = [0, 1, 2, 3, 4, 5];

describe("Reveal", () => {
  it("envuelve a su contenido sin taparlo", () => {
    render(
      <Reveal>
        <p>Estudio de marca</p>
      </Reveal>,
    );

    expect(screen.getByText("Estudio de marca")).toBeInTheDocument();
  });

  /**
   * Compone, no describe. Si el envoltorio saliera con rol o etiqueta propia,
   * meteria un nodo en el arbol de accesibilidad por una decision de movimiento —
   * y el movimiento no es contenido.
   */
  it("no anade semantica", () => {
    const { container } = render(
      <Reveal>
        <p>Estudio de marca</p>
      </Reveal>,
    );

    expect(container.firstElementChild?.tagName).toBe("DIV");
    expect(container.firstElementChild).not.toHaveAttribute("role");
  });

  it.each(STEPS)("el paso %i usa clases que existen en Reveal.module.scss", (step) => {
    const { container } = render(
      <Reveal step={step}>
        <p>Estudio de marca</p>
      </Reveal>,
    );
    const own = [...(container.firstElementChild?.classList ?? [])];

    // root + paso. Una clase inexistente sale como undefined y join() la borra: el
    // hueco solo se ve contando.
    expect(own).toHaveLength(2);
    expect(own.filter((cls) => !declared.has(cls))).toEqual([]);
  });

  /**
   * El bloque de reduced-motion tiene que DEVOLVER el estado final, no solo apagar
   * la animacion. Con `animation: none` el `both` deja de aplicar el ultimo
   * fotograma, asi que sin `opacity: 1` el contenido se queda invisible para quien
   * pidio que no se moviera nada — el fallo mas caro posible, porque no lo ve nadie
   * que no lo tenga activado.
   *
   * El contrato de motion ya comprueba que la hoja apague; esto comprueba que
   * ademas deje algo visible.
   */
  it("con reduced-motion el contenido queda visible", () => {
    const reduced = css.slice(css.indexOf("prefers-reduced-motion: reduce"));

    expect(reduced).toMatch(/animation:\s*none/);
    expect(reduced).toMatch(/opacity:\s*1/);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(
      <Reveal>
        <p>Estudio de marca</p>
      </Reveal>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
