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
    const { container } = render(<NumberRoll value="0" />);
    expect(container).toHaveTextContent("0");
  });

  /**
   * Cada digito va en su propia casilla de `1ch`, y de eso depende que la cifra
   * quieta y la cifra rodando ocupen la MISMA caja: la fuente de la casa no tiene
   * cifras tabulares, asi que sin casilla el "1" mide menos de la mitad que el "0" y
   * el numero se recoge hacia la izquierda al acabar el rodado. Lo que no va en
   * casilla es lo que no rueda.
   */
  it("cada digito va en su casilla y los separadores no", () => {
    const { container } = render(<NumberRoll value="1,2%" />);
    const plano = container.querySelector(`.${styles.plain}`);

    expect(plano?.querySelectorAll(`.${styles.slot}`)).toHaveLength(2);
    expect(plano).toHaveTextContent("1,2%");
  });

  /**
   * Partido en casillas, "120" son tres cajas en linea y algunas ayudas tecnicas las
   * anuncian sueltas. El duplicado oculto da el numero entero, y lo visible queda
   * fuera del arbol para que no se lea dos veces.
   */
  it("el valor se anuncia una sola vez y entero", () => {
    const { container } = render(<NumberRoll value="120" />);

    expect(container.querySelector(`.${styles.srOnly}`)).toHaveTextContent("120");
    expect(container.querySelector(`.${styles.plain}`)).toHaveAttribute("aria-hidden", "true");
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["root", "srOnly", "plain", "slot", "rollers"];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<NumberRoll value="80%" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
