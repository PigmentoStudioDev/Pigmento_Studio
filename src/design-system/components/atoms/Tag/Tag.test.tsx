import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { compile, type Options } from "sass";
import { describe, expect, it } from "vitest";
import { Tag, type TagTone } from "./Tag";

const SASS: Options<"sync"> = { loadPaths: ["node_modules"], quietDeps: true };

const declared = new Set(
  [...compile(join(__dirname, "Tag.module.scss"), SASS).css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(
    ([, name]) => name,
  ),
);

const TONES: TagTone[] = ["neutral", "info", "progress"];

describe("Tag", () => {
  it("muestra su texto", () => {
    render(<Tag>Pronto</Tag>);

    expect(screen.getByText("Pronto")).toBeInTheDocument();
  });

  /**
   * Un distintivo etiqueta, no acciona. Si saliera como boton o enlace, el lector
   * de pantalla lo anunciaria como algo que se puede pulsar y el teclado se
   * detendria en el — dos promesas que no cumple.
   */
  it("no es un control", () => {
    render(<Tag>Pronto</Tag>);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it.each(TONES)("el tono %s usa clases que existen en Tag.module.scss", (tone) => {
    const { container } = render(<Tag tone={tone}>Pronto</Tag>);
    const own = [...(container.firstElementChild?.classList ?? [])];

    // root + la clase del tono. Una clase inexistente sale como undefined y
    // join() la borra: el hueco solo se ve contando.
    expect(own).toHaveLength(2);
    expect(own.filter((cls) => !declared.has(cls))).toEqual([]);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Tag>Pronto</Tag>);

    expect(await axe(container)).toHaveNoViolations();
  });
});
