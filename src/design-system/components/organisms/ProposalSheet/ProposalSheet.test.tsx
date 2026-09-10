import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ProposalSheet, type ProposalSheetProps } from "./ProposalSheet";

/**
 * Nada con pinta de cotizacion real: ni nombres de clientes ni cifras
 * verosimiles. Un fixture realista acaba en una captura, y esto es el repo de
 * una agencia de marca.
 */
const PROPS: ProposalSheetProps = {
  client: "Cliente A",
  title: "Propuesta",
  items: [
    { concept: "Uno", detail: "Detalle de uno", amountCents: 1050 },
    { concept: "Dos", detail: "", amountCents: 2075 },
  ],
  totalCents: 3125,
  currency: "MXN",
  locale: "es-MX",
  totalLabel: "Total",
  conceptLabel: "Concepto",
  amountLabel: "Importe",
  validUntil: "1 de julio de 2026",
  validUntilLabel: "Vigente hasta",
  expiredLabel: null,
};

describe("ProposalSheet", () => {
  /**
   * Los importes llegan en CENTAVOS enteros y se pintan como moneda. Si alguien
   * los tratara como unidades, 1050 saldria como $1,050.00 en vez de $10.50 — y
   * un cero de mas en una cotizacion no es un fallo de formato.
   */
  it("pinta los centavos como moneda, no como unidades", () => {
    render(<ProposalSheet {...PROPS} />);

    const fila = screen.getByRole("row", { name: /Uno/ });

    expect(within(fila).getByText("$10.50")).toBeInTheDocument();
    expect(screen.queryByText("$1,050.00")).not.toBeInTheDocument();
  });

  /**
   * Tabla de verdad, con cabeceras de fila y de columna. Una lista de divs se ve
   * igual y deja a quien usa lector de pantalla sin saber de que fila es cada
   * cifra.
   */
  it("es una tabla con cabeceras que nombran filas y columnas", () => {
    render(<ProposalSheet {...PROPS} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Concepto" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: /Uno/ })).toBeInTheDocument();
  });

  it("el total sale del prop, el organismo no suma", () => {
    render(<ProposalSheet {...PROPS} totalCents={9900} />);

    expect(within(screen.getByRole("row", { name: /Total/ })).getByText("$99.00")).toBeInTheDocument();
  });

  /**
   * Que este vencida cambia lo que el cliente puede hacer con la propuesta, asi
   * que se ANUNCIA y no solo se pinta. Sin `role="status"` es un parrafo mas.
   */
  it("anuncia la propuesta vencida", () => {
    render(<ProposalSheet {...PROPS} expiredLabel="Esta propuesta vencio" />);

    expect(screen.getByRole("status")).toHaveTextContent("Esta propuesta vencio");
  });

  it("sin fecha limite no inventa la linea de vigencia", () => {
    render(<ProposalSheet {...PROPS} validUntil={null} />);

    expect(screen.queryByText(/Vigente hasta/)).not.toBeInTheDocument();
  });

  it("el titular nombra la hoja", () => {
    render(<ProposalSheet {...PROPS} titleId="propuesta" />);

    expect(screen.getByRole("heading", { name: PROPS.title })).toHaveAttribute("id", "propuesta");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ProposalSheet {...PROPS} expiredLabel="Vencida" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
