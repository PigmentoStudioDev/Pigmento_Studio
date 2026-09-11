import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ProposalDiagnosis } from "./ProposalDiagnosis";
import styles from "./ProposalDiagnosis.module.scss";

const PROPS = { headline: "El titular", context: ["Primero.", "Segundo."] };

describe("ProposalDiagnosis", () => {
  /** Nivel 2 y no 1: el titulo del documento es el servicio, esto es una seccion. */
  it("titula en nivel 2", () => {
    render(<ProposalDiagnosis {...PROPS} />);
    expect(screen.getByRole("heading", { level: 2, name: "El titular" })).toBeInTheDocument();
  });

  it("pinta un parrafo por bloque", () => {
    render(<ProposalDiagnosis {...PROPS} />);
    for (const p of PROPS.context) expect(screen.getByText(p)).toBeInTheDocument();
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["root", "paragraph"];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ProposalDiagnosis {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
