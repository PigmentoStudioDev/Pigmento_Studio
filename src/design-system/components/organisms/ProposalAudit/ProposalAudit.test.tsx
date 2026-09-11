import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ProposalAudit } from "./ProposalAudit";
import styles from "./ProposalAudit.module.scss";

const PROPS = {
  title: "Donde se pierde dinero hoy",
  proof: "Cada hallazgo se puede verificar en el sitio actual.",
  costLabel: "Lo que cuesta",
  findings: [
    { key: "captacion", area: "Captacion", title: "La ficha no capta", cost: "Se va a otro lado." },
    { key: "seguimiento", area: "Seguimiento", title: "El lead llega huerfano", cost: "Nadie responde." },
  ],
};

describe("ProposalAudit", () => {
  it("titula en nivel 2 y cada hallazgo en nivel 3", () => {
    render(<ProposalAudit {...PROPS} />);

    expect(screen.getByRole("heading", { level: 2, name: PROPS.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "La ficha no capta" })).toBeInTheDocument();
  });

  /**
   * El orden ES el dato: los hallazgos se listan por lo que cuestan. Una <ul> lo
   * perderia sin que nada lo dijera.
   */
  it("es una lista ordenada, con una fila por hallazgo", () => {
    render(<ProposalAudit {...PROPS} />);

    const lista = screen.getByRole("list");
    expect(lista.tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(PROPS.findings.length);
  });

  /**
   * El numero visible lo pinta un contador de CSS, no los datos. Si algun dia vuelve
   * al marcado, este test lo dice: el texto no debe contener ningun 01.
   */
  it("no mete el numero en el contenido", () => {
    const { container } = render(<ProposalAudit {...PROPS} />);
    expect(container.textContent).not.toMatch(/\b0\d\b/);
  });

  it("pinta la invitacion a verificarlo", () => {
    render(<ProposalAudit {...PROPS} />);
    expect(screen.getByText(PROPS.proof)).toBeInTheDocument();
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["root", "proof", "list", "item", "area", "cost", "costLabel"];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ProposalAudit {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
