import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ProposalTerms, type ProposalTermsProps } from "./ProposalTerms";
import styles from "./ProposalTerms.module.scss";

const PROPS: ProposalTermsProps = {
  title: "Siguiente paso",
  terms: [{ term: "Vigencia", description: "15 dias naturales." }],
  closing: "Una ultima frase.",
};

describe("ProposalTerms", () => {
  it("empareja cada termino con lo que dice", () => {
    render(<ProposalTerms {...PROPS} />);

    expect(screen.getByText("Vigencia").tagName).toBe("DT");
    expect(screen.getByText("15 dias naturales.").tagName).toBe("DD");
  });

  it("el cierre es opcional", () => {
    const { rerender } = render(<ProposalTerms {...PROPS} />);
    expect(screen.getByText("Una ultima frase.")).toBeInTheDocument();

    rerender(<ProposalTerms {...PROPS} closing={null} />);
    expect(screen.queryByText("Una ultima frase.")).not.toBeInTheDocument();
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["root", "closing"];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ProposalTerms {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
