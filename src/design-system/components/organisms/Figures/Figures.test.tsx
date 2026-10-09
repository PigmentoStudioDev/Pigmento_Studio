import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Figures, type FiguresProps } from "./Figures";
import styles from "./Figures.module.scss";

const PROPS: FiguresProps = {
  title: "Lo que deja el trabajo",
  label: "En numeros",
  intro: "Cifras del estudio, con el contexto que las hace legibles.",
  figures: [
    { value: "120", label: "Proyectos entregados", context: "Desde 2018." },
    { value: "70%", label: "Clientes que repiten", context: "Siete de cada diez vuelven." },
  ],
};

describe("Figures", () => {
  it("pinta cada cifra con su rotulo y su contexto", () => {
    render(<Figures {...PROPS} />);

    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("Proyectos entregados")).toBeInTheDocument();
    expect(screen.getByText("Desde 2018.")).toBeInTheDocument();
  });

  /**
   * El valor viaja en el HTML del servidor: la cifra se lee sin JS, con
   * reduced-motion y antes de que gsap baje. Es lo que hace que el rodado sea
   * decoracion y no el dato.
   */
  it("la cifra esta en el documento aunque no haya rodado", () => {
    const { container } = render(<Figures {...PROPS} />);

    expect(container.textContent).toContain("70%");
  });

  /** Un bloque de cifras vacio seria una cabecera sin nada debajo. */
  it("no se pinta sin cifras", () => {
    const { container } = render(<Figures {...PROPS} figures={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("todas las clases que pone existen en la hoja", () => {
    const usadas = ["root", "header", "list", "item", "value", "label", "context"];

    expect(usadas.filter((clase) => clase in styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Figures {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
