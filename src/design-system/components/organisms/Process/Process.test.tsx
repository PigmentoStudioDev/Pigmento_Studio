import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Process, type ProcessProps } from "./Process";
import styles from "./Process.module.scss";

const PROPS: ProcessProps = {
  title: "Como trabajamos",
  label: "El proceso",
  intro: "Cinco fases, cada una con algo que recibes al terminarla.",
  deliverableLabel: "Entregable",
  phases: [
    { title: "Diagnostico", text: "Entendemos el negocio.", deliverable: "Brief firmado" },
    { title: "Estrategia", text: "Que promete la marca.", deliverable: "Plataforma de marca" },
  ],
};

describe("Process", () => {
  it("pinta cada fase con su texto y su entregable", () => {
    render(<Process {...PROPS} />);

    expect(screen.getByRole("heading", { name: "Diagnostico" })).toBeInTheDocument();
    expect(screen.getByText("Brief firmado")).toBeInTheDocument();
  });

  /**
   * El orden es la informacion del bloque, asi que vive en el documento y no en el
   * dibujo: una lista sin orden lo diria solo en el CSS.
   */
  it("las fases van en una lista ordenada", () => {
    const { container } = render(<Process {...PROPS} />);

    expect(container.querySelector("ol")).toBeInTheDocument();
  });

  /**
   * El numero es DATO —dice el orden— y por eso esta en el texto y no en un contador
   * de la hoja, que un lector de pantalla no anuncia.
   */
  it("el numero de fase se lee, no se pinta", () => {
    render(<Process {...PROPS} />);

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
  });

  it("no se pinta sin fases", () => {
    const { container } = render(<Process {...PROPS} phases={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("todas las clases que pone existen en la hoja", () => {
    const usadas = [
      "root", "header", "list", "phase", "ordinal", "body", "text",
      "deliverable", "deliverableLabel", "deliverableValue",
    ];

    expect(usadas.filter((clase) => clase in styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Process {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
