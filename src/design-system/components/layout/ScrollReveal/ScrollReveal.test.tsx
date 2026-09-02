import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ScrollReveal } from "./ScrollReveal";

describe("ScrollReveal", () => {
  /**
   * El envoltorio no cambia lo que envuelve. Es toda su promesa: se mete entre un
   * contenedor y su hijo para anadir un gesto, no para meter una caja — de eso se
   * encarga `display: contents` en la hoja.
   */
  it("no altera el contenido que envuelve", () => {
    render(
      <ScrollReveal>
        <p>Una frase que entra</p>
      </ScrollReveal>,
    );

    expect(screen.getByText("Una frase que entra")).toBeInTheDocument();
  });

  /**
   * El estado se publica en el HIJO, no en el envoltorio, y ese es el contrato con la
   * hoja: el envoltorio no tiene caja —`display: contents`— asi que un atributo ahi
   * no podria mover nada.
   */
  it("publica el estado en el bloque que entra", () => {
    const { container } = render(
      <ScrollReveal by="block">
        <p>Una caja que entra</p>
      </ScrollReveal>,
    );

    expect(container.querySelector("p")).toHaveAttribute("data-reveal-mode", "block");
    expect(container.querySelector("p")).toHaveAttribute("data-reveal");
  });

  /**
   * El texto NO se esconde mientras gsap viene por la red.
   *
   * El efecto de referencia lo esconde por CSS y lo enciende desde JS para evitar
   * verlo un instante antes de que anime. Aqui no: si el paquete no llega —una red
   * mala, un bloqueador— ese texto no vuelve nunca, y una pagina sin texto es mucho
   * peor que un fotograma sin gesto. Mientras no haya particion, el parrafo esta y se
   * lee.
   */
  it("no esconde el texto mientras espera a que se pueda partir", () => {
    const { container } = render(
      <ScrollReveal>
        <p>Visible desde el primer pintado</p>
      </ScrollReveal>,
    );

    expect(container.querySelector("[data-reveal]")).toBeNull();
    expect(screen.getByText("Visible desde el primer pintado")).toBeInTheDocument();
  });

  /** Envolver texto no puede cambiar como se anuncia. */
  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(
      <ScrollReveal>
        <h2>Un titular</h2>
        <p>Y su parrafo</p>
      </ScrollReveal>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
