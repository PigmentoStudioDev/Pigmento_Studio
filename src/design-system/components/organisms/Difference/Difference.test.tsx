import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Difference, type DifferenceProps } from "./Difference";
import styles from "./Difference.module.scss";

const PROPS: DifferenceProps = {
  title: "La diferencia",
  label: "Por que nosotros",
  intro: "Tres maneras de resolver el mismo encargo.",
  caption: "Estudio, agencia y freelance, criterio a criterio",
  criterionLabel: "Criterio",
  emptyLabel: "no aplica",
  scrollLabel: "Comparativa, se desplaza en horizontal",
  columns: [
    { key: "studio", name: "Pigmento" },
    { key: "agency", name: "Agencia grande" },
  ],
  rows: [
    {
      criterion: "Con quien hablas",
      values: [
        { key: "studio", value: "Con quien hace el trabajo" },
        { key: "agency", value: "Con un ejecutivo de cuenta" },
      ],
    },
  ],
};

describe("Difference", () => {
  it("compara cada criterio contra cada columna", () => {
    render(<Difference {...PROPS} />);

    expect(screen.getByRole("rowheader", { name: "Con quien hablas" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Pigmento/ })).toBeInTheDocument();
    expect(screen.getByText("Con un ejecutivo de cuenta")).toBeInTheDocument();
  });

  /** Sin filas no hay nada que comparar, y la cabecera sola no dice nada. */
  it("no se pinta sin filas", () => {
    const { container } = render(<Difference {...PROPS} rows={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("todas las clases que pone existen en la hoja", () => {
    const usadas = ["root", "header", "table"];

    expect(usadas.filter((clase) => clase in styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Difference {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
