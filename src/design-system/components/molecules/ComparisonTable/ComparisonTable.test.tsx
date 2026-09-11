import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ComparisonTable, type ComparisonTableProps } from "./ComparisonTable";
import styles from "./ComparisonTable.module.scss";

/**
 * La forma real del caso que motivo el componente: tres rutas, y un criterio que
 * solo define UNA de ellas — como PERMISOS en la propuesta de MoEasy.
 */
const PROPS: ComparisonTableProps = {
  caption: "La diferencia",
  criterionLabel: "Criterio",
  scrollLabel: "Comparativa de rutas",
  emptyLabel: "no aplica",
  columns: [
    { key: "a", name: "Ruta A", meta: "$10" },
    { key: "b", name: "Ruta B", meta: "$20" },
    { key: "c", name: "Ruta C" },
  ],
  rows: [
    {
      criterion: "Inventario",
      values: [
        { key: "a", value: "Nuevo" },
        { key: "b", value: "Migrado" },
        { key: "c", value: "En el CRM" },
      ],
    },
    { criterion: "Permisos", values: [{ key: "c", value: "Segun la integracion" }] },
  ],
};

describe("ComparisonTable", () => {
  /**
   * Es una tabla de VERDAD. No se afirma sobre clases: se pregunta por los roles que
   * lee la tecnologia de apoyo, que es lo unico que distingue una comparativa de un
   * monton de cajas alineadas.
   */
  it("expone tabla, cabeceras de columna y cabeceras de fila", () => {
    render(<ComparisonTable {...PROPS} />);

    expect(screen.getByRole("table", { name: "La diferencia" })).toBeInTheDocument();

    // Criterio + las tres rutas.
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(screen.getAllByRole("rowheader")).toHaveLength(2);
  });

  /**
   * El valor tiene que quedar en la fila de su criterio Y bajo su columna. Buscar
   * el texto suelto pasaria verde con las celdas barajadas.
   */
  it("cada valor cae en la fila de su criterio", () => {
    render(<ComparisonTable {...PROPS} />);

    const fila = screen.getByRole("row", { name: /Inventario/ });
    expect(within(fila).getByText("Migrado")).toBeInTheDocument();
    expect(within(fila).queryByText("Segun la integracion")).not.toBeInTheDocument();
  });

  /**
   * El caso que justifica el componente. Una celda vacia se lee como un olvido de
   * quien redacto la propuesta; con su marca y su texto, la ausencia dice algo.
   */
  it("la columna que no define un criterio dice que no aplica", () => {
    render(<ComparisonTable {...PROPS} />);

    const fila = screen.getByRole("row", { name: /Permisos/ });
    expect(within(fila).getAllByText("no aplica")).toHaveLength(2);
    expect(within(fila).getByText("Segun la integracion")).toBeInTheDocument();
  });

  it("el meta de columna es opcional", () => {
    render(<ComparisonTable {...PROPS} />);

    expect(screen.getByText("$10")).toBeInTheDocument();
    const sinMeta = screen.getByRole("columnheader", { name: /Ruta C/ });
    expect(sinMeta).toHaveTextContent("Ruta C");
  });

  /**
   * Un contenedor con scroll al que no se llega con el teclado deja su contenido
   * inalcanzable para quien no usa raton.
   */
  it("la zona desplazable es alcanzable con teclado y tiene nombre", () => {
    render(<ComparisonTable {...PROPS} />);

    const region = screen.getByRole("region", { name: "Comparativa de rutas" });
    expect(region).toHaveAttribute("tabindex", "0");
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = [
      "scroller",
      "table",
      "caption",
      "corner",
      "columnHead",
      "columnName",
      "columnMeta",
      "criterion",
      "cell",
      "absent",
      "srOnly",
    ];

    for (const clase of usadas) {
      expect(styles[clase], `styles.${clase} no existe en la hoja`).toBeDefined();
    }
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ComparisonTable {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
