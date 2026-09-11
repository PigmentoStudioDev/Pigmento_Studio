import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ProposalBaseline, type ProposalBaselineProps } from "./ProposalBaseline";
import styles from "./ProposalBaseline.module.scss";

const PROPS: ProposalBaselineProps = {
  title: "Lo que incluye",
  deliverables: [{ term: "01 Home", description: "Lo que lleva." }],
  includedInAll: ["Lo primero", "Lo segundo"],
  includedTitle: "En todas las rutas",
  includedTitleId: "en-todas",
  includedLabel: "incluido",
  excludedLabel: "no incluido",
};

describe("ProposalBaseline", () => {
  it("empareja cada entregable con lo que incluye", () => {
    render(<ProposalBaseline {...PROPS} />);

    expect(screen.getByText("01 Home").tagName).toBe("DT");
    expect(screen.getByText("Lo que lleva.").tagName).toBe("DD");
  });

  it("la lista de incluidos toma su nombre del titulo", () => {
    render(<ProposalBaseline {...PROPS} />);
    expect(screen.getByRole("list", { name: "En todas las rutas" })).toBeInTheDocument();
  });

  /** Sin puntos comunes no se pinta una lista vacia con su titulo colgando. */
  it("omite la lista cuando no hay nada que listar", () => {
    render(<ProposalBaseline {...PROPS} includedInAll={[]} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    expect(styles.root).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(1);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ProposalBaseline {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
