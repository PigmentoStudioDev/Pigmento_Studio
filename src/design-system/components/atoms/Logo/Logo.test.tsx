import { join } from "node:path";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { compile, type Options } from "sass";
import { describe, expect, it } from "vitest";
import { Logo } from "./Logo";

const SASS: Options<"sync"> = { loadPaths: ["node_modules"], quietDeps: true };

const declared = new Set(
  [
    ...compile(join(__dirname, "Logo.module.scss"), SASS).css.matchAll(/\.([a-zA-Z][\w-]*)/g),
  ].map(([, name]) => name),
);

describe("Logo", () => {
  /**
   * Decorativo a proposito: el nombre accesible lo pone quien lo envuelve. Si el
   * logo se nombrase a si mismo dentro del enlace al inicio — que ya esta
   * nombrado — un lector de pantalla anunciaria dos nombres para un solo destino.
   */
  it("no aporta nombre accesible: es decorativo", () => {
    const { container } = render(<Logo />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  /**
   * Las dos formas viven siempre en el DOM. Montar y desmontar reflowaria la fila
   * de la barra a mitad del scroll, que es lo que la transicion disimula.
   */
  it.each([{ compact: false }, { compact: true }])(
    "con compact=$compact mantiene las dos formas en el DOM",
    ({ compact }) => {
      const { container } = render(<Logo compact={compact} />);

      expect(container.querySelector("img")).toBeInTheDocument();
      expect(container.querySelector("svg")).toBeInTheDocument();
    },
  );

  it("compact cambia la clase de estado", () => {
    const full = render(<Logo />).container.firstElementChild?.className;
    const compact = render(<Logo compact />).container.firstElementChild?.className;

    expect(full).not.toBe(compact);
  });

  // El bug: en la cabecera movil el logotipo no cabia; la variante que encoge tiene
  // que poner una clase que exista de verdad en la hoja.
  it("compactBelowMd pone su clase, declarada en la hoja", () => {
    const root = render(<Logo compactBelowMd />).container.firstElementChild;
    const extra = [...(root?.classList ?? [])].filter((cls) => !render(<Logo />).container.firstElementChild?.classList.contains(cls));

    expect(extra).toHaveLength(1);
    expect(declared.has(extra[0] ?? "")).toBe(true);
  });

  it.each([{ label: "completo", compact: false }, { label: "compacto", compact: true }])(
    "$label usa clases que existen en Logo.module.scss",
    ({ compact }) => {
      const { container } = render(<Logo compact={compact} />);
      const root = container.firstElementChild;

      const used = [
        ...(root?.classList ?? []),
        ...[...(root?.querySelectorAll("[class]") ?? [])].flatMap((el) => [...el.classList]),
      ];

      // root + su clase de estado, wordmark y mark. Un mapa roto se ve contando:
      // `styles.x` inexistente es undefined y join() lo borra sin dejar rastro.
      expect(used).toHaveLength(4);
      expect(used.filter((cls) => !declared.has(cls))).toEqual([]);
    },
  );

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Logo />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
