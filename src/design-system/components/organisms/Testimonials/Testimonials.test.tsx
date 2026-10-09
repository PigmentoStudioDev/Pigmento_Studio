import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Testimonials, type TestimonialsProps } from "./Testimonials";

const PROPS: TestimonialsProps = {
  testimonials: [
    { quote: "Entregaron en seis semanas.", author: "Nombre Apellido", role: "Cargo", company: "Empresa" },
    { quote: "Hablamos siempre con quien disenaba.", author: "Otro Nombre", role: "Direccion", company: "Otra" },
  ],
};

/**
 * La tira repite la coleccion para que el bucle no deje hueco, asi que cada cita esta
 * en el documento tantas veces como copias haya. Lo que se COMPRUEBA es que esta, no
 * cuantas veces: cuantas lo decide la tira midiendo la ventana, y es asunto suyo.
 */
describe("Testimonials", () => {
  it("pinta cada cita con su atribucion completa", () => {
    render(<Testimonials {...PROPS} />);

    expect(screen.getAllByText("Entregaron en seis semanas.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Nombre Apellido").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cargo, Empresa").length).toBeGreaterThan(0);
  });

  /**
   * Las citas pasan a la tira, que es quien las maqueta. Si un dia dejan de llegarle
   * —otro `kind`, otro orden de props— el bloque se quedaria vacio sin que nada
   * fallara, y la prueba social desapareceria de la pagina en silencio.
   */
  it("las citas van dentro de la tira, en blockquote", () => {
    const { container } = render(<Testimonials {...PROPS} />);

    expect(container.querySelectorAll("blockquote").length).toBeGreaterThan(0);
  });

  /** Sin citas publicadas la seccion no existe, en vez de dejar un carril vacio. */
  it("no se pinta sin citas", () => {
    const { container } = render(<Testimonials {...PROPS} testimonials={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Testimonials {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
