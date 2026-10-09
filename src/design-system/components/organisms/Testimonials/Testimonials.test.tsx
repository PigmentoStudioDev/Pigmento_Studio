import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Testimonials, type TestimonialsProps } from "./Testimonials";
import styles from "./Testimonials.module.scss";

const PROPS: TestimonialsProps = {
  title: "Lo que dicen",
  label: "Clientes",
  intro: "Con nombre, cargo y empresa.",
  testimonials: [
    { quote: "Entregaron en seis semanas.", author: "Nombre Apellido", role: "Cargo", company: "Empresa" },
    { quote: "Hablamos siempre con quien disenaba.", author: "Otro Nombre", role: "Direccion", company: "Otra" },
  ],
};

describe("Testimonials", () => {
  it("pinta cada cita con su atribucion completa", () => {
    render(<Testimonials {...PROPS} />);

    expect(screen.getByText("Entregaron en seis semanas.")).toBeInTheDocument();
    expect(screen.getByText("Nombre Apellido")).toBeInTheDocument();
    expect(screen.getByText("Cargo, Empresa")).toBeInTheDocument();
  });

  /**
   * La cita y su fuente son una relacion que el navegador ya sabe expresar: quien
   * escucha la pagina oye donde empieza y acaba lo citado.
   */
  it("la cita es un blockquote y su firma un cite", () => {
    const { container } = render(<Testimonials {...PROPS} />);

    expect(container.querySelectorAll("blockquote")).toHaveLength(2);
    expect(container.querySelectorAll("cite")).toHaveLength(2);
  });

  /** Sin citas publicadas la seccion no existe, en vez de dejar una cabecera sola. */
  it("no se pinta sin citas", () => {
    const { container } = render(<Testimonials {...PROPS} testimonials={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("todas las clases que pone existen en la hoja", () => {
    const usadas = ["root", "header", "list", "item", "card", "quote", "text", "author", "name", "role"];

    expect(usadas.filter((clase) => clase in styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Testimonials {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
