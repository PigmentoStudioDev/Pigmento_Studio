import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { PriceBand, type PriceBandProps } from "./PriceBand";
import styles from "./PriceBand.module.scss";

/** Cifras que no parecen una cotizacion real: esto es el repo de una agencia. */
const PROPS: PriceBandProps = {
  kind: "fijo",
  amountCents: 1_000_00,
  currency: "MXN",
  locale: "es-MX",
  unitLabel: "MXN / proyecto",
  deliveryLabel: "Entrega estimada: 3 semanas",
  accent: "uno",
};

describe("PriceBand", () => {
  /**
   * Los importes llegan en CENTAVOS. Tratados como unidades, 100000 saldria como
   * $100,000 en vez de $1,000 — y un cero de mas en una cotizacion no es un fallo
   * de formato, es otra propuesta.
   */
  it("pinta los centavos como moneda, no como unidades", () => {
    render(<PriceBand {...PROPS} />);

    expect(screen.getByText("$1,000")).toBeInTheDocument();
    expect(screen.queryByText("$100,000")).not.toBeInTheDocument();
  });

  /**
   * Sin decimales cuando no los hay. Un documento con `.00` en cada cifra se lee
   * como un ticket, y el original de Pigmento escribe `$48,000`.
   */
  it("omite los centavos exactos y los muestra cuando existen", () => {
    const { rerender } = render(<PriceBand {...PROPS} />);
    expect(screen.getByText("$1,000")).toBeInTheDocument();

    rerender(<PriceBand {...PROPS} amountCents={1_000_50} />);
    expect(screen.getByText("$1,000.50")).toBeInTheDocument();
  });

  it("pinta el rango con sus dos extremos", () => {
    render(<PriceBand {...PROPS} kind="rango" amountCents={200_00} amountMaxCents={350_00} />);

    expect(screen.getByText("$200 – $350")).toBeInTheDocument();
  });

  /**
   * Sin extremo alto, el rango degrada a cifra suelta. La alternativa es pintar
   * "$200 –" colgando, que parece un error de datos y encima no dice nada.
   */
  it("degrada a cifra suelta si el rango no trae extremo alto", () => {
    render(<PriceBand {...PROPS} kind="rango" amountCents={200_00} amountMaxCents={null} />);

    expect(screen.getByText("$200")).toBeInTheDocument();
  });

  it("la entrega es opcional: los modulos adicionales no la llevan", () => {
    const { rerender } = render(<PriceBand {...PROPS} />);
    expect(screen.getByText("Entrega estimada: 3 semanas")).toBeInTheDocument();

    rerender(<PriceBand {...PROPS} deliveryLabel={null} />);
    expect(screen.queryByText("Entrega estimada: 3 semanas")).not.toBeInTheDocument();
    expect(screen.getByText("MXN / proyecto")).toBeInTheDocument();
  });

  /**
   * El tinte identifica la ruta, asi que un acento que no pinte no es un detalle
   * estetico: dos rutas se vuelven indistinguibles entre la banda y su columna.
   */
  it("cada acento pone su propia clase", () => {
    const { container, rerender } = render(<PriceBand {...PROPS} accent="uno" />);
    expect(container.firstChild).toHaveClass(styles.accentUno);

    rerender(<PriceBand {...PROPS} accent="tres" />);
    expect(container.firstChild).toHaveClass(styles.accentTres);
    expect(container.firstChild).not.toHaveClass(styles.accentUno);
  });

  /**
   * El circuito TS <-> Sass. Se CUENTA ademas de comprobar pertenencia: si el mapa
   * apunta a una clase que la hoja no declara, `styles.x` es undefined y join() lo
   * convierte en cadena vacia — la clase no sale rota, sale ausente, y comprobar
   * solo pertenencia pasaria verde.
   */
  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["root", "accentUno", "accentDos", "accentTres", "amount", "meta", "unit", "delivery"];

    for (const clase of usadas) {
      expect(styles[clase], `styles.${clase} no existe en la hoja`).toBeDefined();
    }
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<PriceBand {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
