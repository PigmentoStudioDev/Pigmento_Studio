import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Manifesto, type ManifestoProps } from "./Manifesto";

const PROPS: ManifestoProps = {
  eyebrow: "Qué hacemos",
  segments: [
    { text: "Construimos marcas que se reconocen: " },
    { text: "branding", href: "/servicios" },
    { text: " con criterio, " },
    { text: "sitios", href: "/servicios/web-development" },
    { text: " que cargan y convierten." },
  ],
  pieces: [
    { src: "/portfolio/01.png", width: 522, height: 522 },
    { src: "/portfolio/02.png", width: 522, height: 715 },
  ],
};

describe("Manifesto", () => {
  /**
   * La frase se arma de trozos, y el contrato es que se lea SEGUIDA: si el
   * componente se comiera los espacios de los extremos —o los envolviera en cajas de
   * bloque— saldrian palabras pegadas o una lista vertical.
   */
  it("compone la frase entera", () => {
    const { container } = render(<Manifesto {...PROPS} />);

    expect(container.textContent).toContain(
      "Construimos marcas que se reconocen: branding con criterio, sitios que cargan y convierten.",
    );
  });

  /**
   * EL gate de este componente. En el efecto de referencia las palabras calientes son
   * <span> subrayados: parecen enlaces, no llevan a ningun sitio y el teclado no las
   * alcanza, asi que el efecto no existe sin raton. Aqui son enlaces de verdad.
   */
  it("las palabras calientes son enlaces navegables", () => {
    render(<Manifesto {...PROPS} />);

    expect(screen.getByRole("link", { name: "branding" })).toHaveAttribute("href", "/servicios");
    expect(screen.getByRole("link", { name: "sitios" })).toHaveAttribute(
      "href",
      "/servicios/web-development",
    );
  });

  /** Solo las que tienen destino. Un trozo de texto suelto no es un enlace. */
  it("no convierte en enlace el texto normal", () => {
    render(<Manifesto {...PROPS} />);

    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  /**
   * Las piezas se RENDERIZAN una vez y se reciclan. Si dejaran de estar en el DOM, la
   * rafaga no tendria nada que mover: el hook las busca por su marca, y sin ninguna
   * se sale sin animar y sin error.
   */
  it("reserva todas las piezas de antemano", () => {
    const { container } = render(<Manifesto {...PROPS} />);

    expect(container.querySelectorAll("[data-media-burst-piece]")).toHaveLength(
      PROPS.pieces.length,
    );
  });

  /**
   * Decoracion: ilustran tres palabras que ya se leen solas. Anunciarlas mete catorce
   * imagenes sin nombre en mitad de una frase.
   */
  it("las piezas no se anuncian", () => {
    render(<Manifesto {...PROPS} />);

    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Manifesto {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
