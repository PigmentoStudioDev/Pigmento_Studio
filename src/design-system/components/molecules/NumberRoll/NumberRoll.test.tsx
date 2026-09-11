import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { segmentar } from "../../../motion/useNumberRoll";
import { NumberRoll } from "./NumberRoll";
import styles from "./NumberRoll.module.scss";

describe("segmentar", () => {
  it("separa digitos de lo que no lo es", () => {
    expect(segmentar("1,2%").map((s) => s.digito)).toEqual([true, false, true, false]);
  });

  /** Una cifra sin digitos no tiene nada que rodar, y no debe reventar por ello. */
  it("una cifra sin digitos no produce ningun rodillo", () => {
    expect(segmentar("N/D").every((s) => !s.digito)).toBe(true);
  });
});

describe("NumberRoll", () => {
  /**
   * El valor viaja en el HTML del servidor. Es lo que se lee sin JS, con
   * reduced-motion, y mientras gsap viene por la red — el rodado es lo unico que
   * cruza al navegador, nunca el dato.
   */
  it("el valor esta en el marcado antes de cualquier animacion", () => {
    render(<NumberRoll value="247,680 USD" />);
    expect(screen.getByText("247,680 USD")).toBeInTheDocument();
  });

  it("un cero tambien se pinta", () => {
    render(<NumberRoll value="0" />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["root", "plain", "rollers"];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<NumberRoll value="80%" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
