import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { compile, type Options } from "sass";
import { describe, expect, it } from "vitest";
import {
  Subheading,
  type SubheadingSize,
  type SubheadingTone,
} from "./Subheading";

const SASS: Options<"sync"> = { loadPaths: ["node_modules"], quietDeps: true };

const declared = new Set(
  [
    ...compile(join(__dirname, "Subheading.module.scss"), SASS).css.matchAll(/\.([a-zA-Z][\w-]*)/g),
  ].map(([, name]) => name),
);

const SIZES: SubheadingSize[] = ["body-l", "body-m"];
const TONES: SubheadingTone[] = ["primary", "secondary"];

describe("Subheading", () => {
  it("muestra su texto", () => {
    render(<Subheading>Diseno de marca y producto digital</Subheading>);

    expect(screen.getByText("Diseno de marca y producto digital")).toBeInTheDocument();
  });

  /**
   * Un subtitulo marcado como encabezado mete en el esquema del documento una
   * seccion que no existe: quien navega por encabezados aterriza en una entrada que
   * no lleva a ningun sitio. Es el fallo que este componente existe para no cometer.
   */
  it("no es un encabezado", () => {
    const { container } = render(<Subheading>Diseno de marca y producto digital</Subheading>);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(container.firstElementChild?.tagName).toBe("P");
  });

  it.each(SIZES)("el cuerpo %s usa clases que existen en Subheading.module.scss", (size) => {
    const { container } = render(<Subheading size={size}>Diseno de marca</Subheading>);
    const own = [...(container.firstElementChild?.classList ?? [])];

    // root + cuerpo + tono. Contar es lo que distingue un mapa correcto de uno con
    // un typo: la clase que falta no sale rota, sale ausente.
    expect(own).toHaveLength(3);
    expect(own.filter((cls) => !declared.has(cls))).toEqual([]);
  });

  it.each(TONES)("el tono %s usa clases que existen en Subheading.module.scss", (tone) => {
    const { container } = render(<Subheading tone={tone}>Diseno de marca</Subheading>);
    const own = [...(container.firstElementChild?.classList ?? [])];

    expect(own).toHaveLength(3);
    expect(own.filter((cls) => !declared.has(cls))).toEqual([]);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Subheading>Diseno de marca y producto digital</Subheading>);

    expect(await axe(container)).toHaveNoViolations();
  });
});
