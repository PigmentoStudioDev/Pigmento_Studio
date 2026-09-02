import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { compile, type Options } from "sass";
import { describe, expect, it } from "vitest";
import { Heading, type HeadingLevel, type HeadingSize, type HeadingTone } from "./Heading";

const SASS: Options<"sync"> = { loadPaths: ["node_modules"], quietDeps: true };

const declared = new Set(
  [
    ...compile(join(__dirname, "Heading.module.scss"), SASS).css.matchAll(/\.([a-zA-Z][\w-]*)/g),
  ].map(([, name]) => name),
);

const LEVELS: HeadingLevel[] = [1, 2, 3, 4, 5, 6];

const SIZES: HeadingSize[] = ["display", "heading", "lead"];

const TONES: HeadingTone[] = ["primary", "secondary"];

describe("Heading", () => {
  it.each(LEVELS)("con level %i sale como encabezado de ese nivel", (level) => {
    render(<Heading level={level}>Estudio de marca</Heading>);

    expect(screen.getByRole("heading", { level, name: "Estudio de marca" })).toBeInTheDocument();
  });

  /**
   * La razon de ser del componente. Si el cuerpo arrastrase al nivel, pedir un
   * titular grande dentro de una seccion anidada obligaria a subir de nivel y el
   * esquema del documento saldria mal — sin que nada lo dijera.
   */
  it("el cuerpo no decide el nivel", () => {
    const { container } = render(
      <Heading level={3} size="display">
        Estudio de marca
      </Heading>,
    );

    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
    expect([...(container.firstElementChild?.classList ?? [])]).toContain("sizeDisplay");
  });

  /**
   * Es lo que <Section labelledBy> necesita para nombrar su landmark: sin id en el
   * titular, esa prop apunta a un elemento que no existe y la seccion se queda como
   * un contenedor generico.
   */
  it("acepta el id con el que Section nombra su landmark", () => {
    render(
      <Heading level={2} id="servicios">
        Servicios
      </Heading>,
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "servicios");
  });

  it.each(SIZES)("el cuerpo %s usa clases que existen en Heading.module.scss", (size) => {
    const { container } = render(
      <Heading level={2} size={size}>
        Estudio de marca
      </Heading>,
    );
    const own = [...(container.firstElementChild?.classList ?? [])];

    // root + cuerpo + tono. Una clase inexistente sale como undefined y join() la
    // borra en vez de escribir la palabra: el hueco solo se ve contando.
    expect(own).toHaveLength(3);
    expect(own.filter((cls) => !declared.has(cls))).toEqual([]);
  });

  it.each(TONES)("el tono %s usa clases que existen en Heading.module.scss", (tone) => {
    const { container } = render(
      <Heading level={2} tone={tone}>
        Estudio de marca
      </Heading>,
    );
    const own = [...(container.firstElementChild?.classList ?? [])];

    expect(own).toHaveLength(3);
    expect(own.filter((cls) => !declared.has(cls))).toEqual([]);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Heading level={1}>Estudio de marca</Heading>);

    expect(await axe(container)).toHaveNoViolations();
  });
});
