import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ProposalFigures } from "./ProposalFigures";
import styles from "./ProposalFigures.module.scss";

const PROPS = {
  title: "El mercado en el que operan",
  sourceLabel: "Fuente:",
  figures: [
    { value: "247,680 USD", label: "Renta anual de una nave.", source: "Datoz, enero 2026" },
    { value: "0", label: "Formularios en las fichas.", source: "Verificado en el codigo" },
  ],
};

describe("ProposalFigures", () => {
  it("titula en nivel 2", () => {
    render(<ProposalFigures {...PROPS} />);
    expect(screen.getByRole("heading", { level: 2, name: PROPS.title })).toBeInTheDocument();
  });

  it("pinta una fila por cifra, con su numero y su frase", () => {
    render(<ProposalFigures {...PROPS} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(PROPS.figures.length);
    expect(screen.getByText("247,680 USD")).toBeInTheDocument();
    expect(screen.getByText("Renta anual de una nave.")).toBeInTheDocument();
  });

  /**
   * La fuente es la razon de ser de este bloque: una cifra sin ella es un pasivo. Si
   * alguien la vuelve opcional en el camino, esto lo dice.
   */
  it("ninguna cifra sale sin su fuente a la vista", () => {
    render(<ProposalFigures {...PROPS} />);

    for (const figura of PROPS.figures) {
      expect(screen.getByText(`${PROPS.sourceLabel} ${figura.source}`)).toBeInTheDocument();
    }
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["root", "list", "item", "value", "label", "source"];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ProposalFigures {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
