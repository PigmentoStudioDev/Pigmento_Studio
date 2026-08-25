import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { compile, type Options } from "sass";
import { describe, expect, it, vi } from "vitest";
import { Button, type ButtonEmphasis, type ButtonSize } from "./Button";

const SASS: Options<"sync"> = { loadPaths: ["node_modules"], quietDeps: true };

const declared = new Set(
  [
    ...compile(join(__dirname, "Button.module.scss"), SASS).css.matchAll(
      /\.([a-zA-Z][\w-]*)/g,
    ),
  ].map(([, name]) => name),
);

const EMPHASES: ButtonEmphasis[] = ["primary", "secondary", "ghost"];
const SIZES: ButtonSize[] = ["sm", "md", "lg"];

describe("Button", () => {
  /**
   * Con href es un enlace y sin el un boton. No es azucar: un <button> que navega
   * deja fuera el clic con rueda, el abrir en pestana nueva y el menu contextual,
   * y se anuncia como boton cuando en realidad es un destino.
   */
  it("sin href es un boton", () => {
    render(<Button>Enviar</Button>);

    expect(screen.getByRole("button", { name: "Enviar" })).toHaveAttribute("type", "button");
  });

  it("con href es un enlace", () => {
    render(<Button href="/contacto">Hablemos</Button>);

    expect(screen.getByRole("link", { name: "Hablemos" })).toHaveAttribute("href", "/contacto");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("type submit se respeta: un boton de formulario no puede ser button", () => {
    render(<Button type="submit">Enviar</Button>);

    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("deshabilitado no responde", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Enviar
      </Button>,
    );

    await userEvent.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("responde al teclado", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Enviar</Button>);

    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  /**
   * Cierra el circuito TS <-> Sass. Cuenta ademas de comprobar pertenencia: una
   * clase inexistente sale como undefined y join() la borra sin dejar rastro, asi
   * que el hueco solo se ve contando.
   */
  it.each([
    ...EMPHASES.map((emphasis) => ({ label: `emphasis=${emphasis}`, props: { emphasis } })),
    ...SIZES.map((size) => ({ label: `size=${size}`, props: { size } })),
  ])("$label usa clases que existen en Button.module.scss", ({ props }) => {
    render(<Button {...props}>Enviar</Button>);
    const own = [...screen.getByRole("button").classList];

    // root + la clase de enfasis + la de tamano.
    expect(own).toHaveLength(3);
    expect(own.filter((cls) => !declared.has(cls))).toEqual([]);
  });

  it("acepta una clase extra sin perder las suyas", () => {
    render(<Button className="extra">Enviar</Button>);

    expect(screen.getByRole("button").classList).toHaveLength(4);
  });

  it.each([
    { label: "boton", node: <Button>Enviar</Button> },
    { label: "enlace", node: <Button href="/x">Ir</Button> },
    { label: "deshabilitado", node: <Button disabled>Enviar</Button> },
  ])("$label no tiene violaciones de accesibilidad", async ({ node }) => {
    const { container } = render(node);

    expect(await axe(container)).toHaveNoViolations();
  });
});
