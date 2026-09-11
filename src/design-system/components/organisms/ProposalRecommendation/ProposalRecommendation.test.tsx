import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ProposalRecommendation, type ProposalRecommendationProps } from "./ProposalRecommendation";
import styles from "./ProposalRecommendation.module.scss";

const PROPS: ProposalRecommendationProps = {
  eyebrow: "Recomendacion",
  headline: "La ruta con mas logica",
  body: ["Por que."],
  technicalNote: "Habra que validar la API.",
};

describe("ProposalRecommendation", () => {
  it("titula la recomendacion y da su motivo", () => {
    render(<ProposalRecommendation {...PROPS} />);

    expect(screen.getByRole("heading", { level: 2, name: PROPS.headline })).toBeInTheDocument();
    expect(screen.getByText("Por que.")).toBeInTheDocument();
  });

  /**
   * La nota tecnica va EN el bloque. Separada, se vuelve letra pequena que nadie
   * relaciona con lo que se acaba de recomendar — y es su condicion.
   */
  it("la nota tecnica acompana a la recomendacion", () => {
    const { container, rerender } = render(<ProposalRecommendation {...PROPS} />);
    expect(container.firstChild).toHaveTextContent("Habra que validar la API.");

    rerender(<ProposalRecommendation {...PROPS} technicalNote={null} />);
    expect(screen.queryByText("Habra que validar la API.")).not.toBeInTheDocument();
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["root", "paragraph", "note"];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ProposalRecommendation {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
