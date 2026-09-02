import { join } from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
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

  /**
   * El estirado es OPT-IN y esta es la mitad del contrato: por defecto el control
   * mide lo que su etiqueta. Un boton que se estirase siempre dejaria de leerse
   * como boton en cuanto cayera dentro de un contenedor ancho.
   */
  it("por defecto no se estira, y con fullWidth si", () => {
    const { rerender } = render(<Button>Enviar</Button>);
    expect([...screen.getByRole("button").classList]).not.toContain("fullWidth");

    rerender(<Button fullWidth>Enviar</Button>);
    const own = [...screen.getByRole("button").classList];

    // root + enfasis + tamano + fullWidth.
    expect(own).toHaveLength(4);
    expect(own).toContain("fullWidth");
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

  /**
   * El texto se parte en caracteres para poder escalonarlos, y partido deja de ser
   * una palabra en el DOM: es una fila de <span> de una letra. Estas dos pruebas
   * cubren los dos lados de eso.
   *
   * El nombre tiene que sobrevivir a la particion. Sale del control y no del
   * contenido justamente porque el contenido ya no sirve para nombrar — y en un
   * <span> sin rol, aria-label esta PROHIBIDO. Es el fallo que destapo axe cuando el
   * nombre lo ponia SplitText en el propio span partido.
   */
  it("el nombre sale del control, no del texto que se parte", () => {
    render(<Button>Enviar</Button>);

    expect(screen.getByRole("button", { name: "Enviar" })).toHaveAttribute(
      "aria-label",
      "Enviar",
    );
  });

  it("el texto no cuenta dos veces en el arbol de accesibilidad", () => {
    const { container } = render(<Button>Enviar</Button>);
    const text = container.querySelector(".text");

    // Escondido: si contara, el nombre seria "Enviar Enviar" — una vez por el
    // aria-label del control y otra por su contenido.
    expect(text).toHaveAttribute("aria-hidden", "true");
    expect(text).toHaveTextContent("Enviar");
  });

  /**
   * El desfase por caracter lo lee la hoja de --char, y --char lo emite SplitText.
   * Si algun dia deja de emitirlo — otra version, otra opcion — el calc() cae al
   * valor de respaldo y TODAS las letras salen a la vez. El gesto no desaparece:
   * se queda plano, que es de las cosas que no se miran dos veces.
   */
  it("cada caracter sale con su indice, que es lo que escalona el gesto", async () => {
    const { container } = render(<Button>Enviar</Button>);

    // Se ESPERA porque SplitText llega por import(): el hook lo pide bajo demanda
    // para que gsap no viaje en el bundle compartido de todas las rutas. En reposo
    // no se nota —un texto partido y uno entero se dibujan igual— pero un test que
    // mire el DOM en el mismo tick ve el texto todavia sin partir.
    await waitFor(() => {
      expect(container.querySelectorAll(".pg-char")).toHaveLength("Enviar".length);
    });

    const chars = [...container.querySelectorAll(".pg-char")];

    expect(chars.map((char) => char.getAttribute("style"))).toEqual(
      chars.map((_, index) => `--char: ${index + 1};`),
    );
  });
});
