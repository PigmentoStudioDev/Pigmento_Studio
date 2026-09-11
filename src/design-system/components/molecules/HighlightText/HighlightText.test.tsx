import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { HighlightText } from "./HighlightText";
import styles from "./HighlightText.module.scss";

const PARTS = [
  { text: "MoEasy no vende " },
  { text: "un solo tipo de inmueble", highlight: true },
  { text: " en una plataforma de productos." },
];

describe("HighlightText", () => {
  it("pinta la frase entera, marcada y sin marcar", () => {
    const { container } = render(<HighlightText parts={PARTS} />);
    expect(container.textContent).toBe(PARTS.map((p) => p.text).join(""));
  });

  /**
   * <mark> y no un span con fondo: significa texto resaltado por relevancia en su
   * contexto, y eso un lector de pantalla puede anunciarlo. Un fondo no.
   */
  it("lo resaltado va en <mark>", () => {
    render(<HighlightText parts={PARTS} />);
    const marca = screen.getByText("un solo tipo de inmueble");

    expect(marca.tagName).toBe("MARK");
    expect(marca).toHaveAttribute("data-highlight");
  });

  it("sin nada marcado no hay ningun <mark>", () => {
    const { container } = render(<HighlightText parts={[{ text: "Una frase lisa." }]} />);
    expect(container.querySelector("mark")).toBeNull();
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["root", "mark"];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<HighlightText parts={PARTS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
