import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ProposalCover, type ProposalCoverProps } from "./ProposalCover";
import styles from "./ProposalCover.module.scss";

const PROPS: ProposalCoverProps = {
  client: "Cliente A",
  serviceTitle: "Servicio",
  tagline: ["Una linea.", "Otra linea."],
  image: { url: "/uno.png", alt: "", width: 400, height: 300 },
};

describe("ProposalCover", () => {
  it("el servicio es el titulo del documento y el cliente lo acompana", () => {
    render(<ProposalCover {...PROPS} />);

    expect(screen.getByRole("heading", { level: 1, name: "Servicio" })).toBeInTheDocument();
    expect(screen.getByText("Cliente A")).toBeInTheDocument();
  });

  it("pinta una linea de tagline por renglon", () => {
    render(<ProposalCover {...PROPS} />);

    for (const line of PROPS.tagline) expect(screen.getByText(line)).toBeInTheDocument();
  });

  /**
   * La imagen es fondo. Con alt descriptivo competiria con el titular y quien use
   * lector de pantalla oiria dos veces de que va la pagina.
   */
  it("la portada sin imagen sigue siendo valida", () => {
    render(<ProposalCover {...PROPS} image={null} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["root", "backdrop", "content", "tagline", "taglineLine"];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ProposalCover {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
