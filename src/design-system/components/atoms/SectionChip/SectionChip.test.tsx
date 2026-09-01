import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { compile, type Options } from "sass";
import { describe, expect, it } from "vitest";
import { SectionChip } from "./SectionChip";

const SASS: Options<"sync"> = { loadPaths: ["node_modules"], quietDeps: true };

const declared = new Set(
  [
    ...compile(join(__dirname, "SectionChip.module.scss"), SASS).css.matchAll(
      /\.([a-zA-Z][\w-]*)/g,
    ),
  ].map(([, name]) => name),
);

describe("SectionChip", () => {
  it("muestra su etiqueta", () => {
    render(<SectionChip>Servicios</SectionChip>);

    expect(screen.getByText("Servicios")).toBeInTheDocument();
  });

  /**
   * Nombra una seccion, no la acciona ni la titula. Como encabezado meteria en el
   * esquema del documento una entrada duplicada justo encima del titular de verdad;
   * como boton o enlace prometeria un destino que no tiene.
   */
  it("no es ni control ni encabezado", () => {
    render(<SectionChip>Servicios</SectionChip>);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  /**
   * El punto es forma, no contenido: leido en voz alta delante de cada seccion es
   * ruido. Oculto para la accesibilidad, el nombre accesible del chip es exactamente
   * su etiqueta — que es lo que comprueba la segunda afirmacion.
   */
  it("el punto no llega al lector de pantalla", () => {
    const { container } = render(<SectionChip>Servicios</SectionChip>);

    expect(container.firstElementChild?.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.firstElementChild).toHaveTextContent(/^Servicios$/);
  });

  it("usa clases que existen en SectionChip.module.scss", () => {
    const { container } = render(<SectionChip>Servicios</SectionChip>);
    const root = container.firstElementChild;
    const own = [...(root?.classList ?? []), ...(root?.firstElementChild?.classList ?? [])];

    // root + dot. Una clase inexistente sale como undefined y desaparece del DOM en
    // vez de escribirse: el hueco solo se ve contando.
    expect(own).toHaveLength(2);
    expect(own.filter((cls) => !declared.has(cls))).toEqual([]);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<SectionChip>Servicios</SectionChip>);

    expect(await axe(container)).toHaveNoViolations();
  });
});
