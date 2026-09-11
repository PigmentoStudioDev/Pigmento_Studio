import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ProposalAddOns, type ProposalAddOnsProps } from "./ProposalAddOns";
import styles from "./ProposalAddOns.module.scss";

const PROPS: ProposalAddOnsProps = {
  title: "Modulos",
  intro: "Se contratan aparte.",
  items: [{ term: "Uno", description: "Lo que hace.", aside: "$120 · por proyecto" }],
};

describe("ProposalAddOns", () => {
  it("cada modulo lleva su precio junto al concepto", () => {
    render(<ProposalAddOns {...PROPS} />);

    expect(screen.getByText("Uno").tagName).toBe("DT");
    expect(screen.getByText("$120 · por proyecto")).toBeInTheDocument();
  });

  it("la intro es opcional", () => {
    const { rerender } = render(<ProposalAddOns {...PROPS} />);
    expect(screen.getByText("Se contratan aparte.")).toBeInTheDocument();

    rerender(<ProposalAddOns {...PROPS} intro={null} />);
    expect(screen.queryByText("Se contratan aparte.")).not.toBeInTheDocument();
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["root", "intro"];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ProposalAddOns {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
