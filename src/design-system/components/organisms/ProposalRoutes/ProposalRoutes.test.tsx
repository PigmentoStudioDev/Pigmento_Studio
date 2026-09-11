import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ProposalRoutes, type ProposalRoutesProps } from "./ProposalRoutes";
import styles from "./ProposalRoutes.module.scss";

const PROPS: ProposalRoutesProps = {
  eyebrow: "Para lanzar",
  title: "Las rutas",
  currency: "MXN",
  locale: "es-MX",
  routes: [
    {
      key: "a", name: "Ruta A", accent: "uno", kind: "fijo",
      amountCents: 1_000_00, unitLabel: "MXN · por proyecto",
      deliveryLabel: "Entrega: 3 semanas", body: ["Por que existe."],
    },
    {
      key: "b", name: "Ruta B", accent: "tres", kind: "fijo",
      amountCents: 2_000_00, unitLabel: "MXN · por proyecto",
      body: [], recommended: true,
    },
  ],
  criteria: [{ key: "inv", label: "Inventario" }],
  values: [{ criterion: "Inventario", cells: [{ key: "a", value: "Nuevo" }, { key: "b", value: "" }] }],
  comparisonCaption: "La diferencia",
  criterionLabel: "Criterio",
  emptyLabel: "no aplica",
  scrollLabel: "Comparativa",
  recommendedLabel: "Recomendada",
};

describe("ProposalRoutes", () => {
  it("presenta cada ruta con su nombre y su precio", () => {
    render(<ProposalRoutes {...PROPS} />);

    expect(screen.getByRole("heading", { level: 3, name: "Ruta A" })).toBeInTheDocument();
    expect(screen.getByText("$1,000")).toBeInTheDocument();
    expect(screen.getByText("$2,000")).toBeInTheDocument();
  });

  /**
   * La recomendada lleva PALABRA y no solo tinte. Si el color fuera la unica senal,
   * quien no lo distinga —o quien imprima en gris— no sabria cual recomienda el
   * estudio, que es justo el dato que la propuesta quiere transmitir.
   */
  it("la recomendada se dice con palabras, no solo con color", () => {
    render(<ProposalRoutes {...PROPS} />);

    const rutas = screen.getAllByRole("listitem");
    expect(within(rutas[1]).getByText("Recomendada")).toBeInTheDocument();
    expect(within(rutas[0]).queryByText("Recomendada")).not.toBeInTheDocument();
  });

  it("la matriz compara las rutas contra los criterios", () => {
    render(<ProposalRoutes {...PROPS} />);

    const tabla = screen.getByRole("table", { name: "La diferencia" });
    expect(within(tabla).getByText("Nuevo")).toBeInTheDocument();
    expect(within(tabla).getByText("no aplica")).toBeInTheDocument();
  });

  /** Sin criterios declarados no se pinta una tabla de una sola columna. */
  it("omite la matriz cuando no hay criterios", () => {
    render(<ProposalRoutes {...PROPS} criteria={[]} values={[]} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["root", "header", "routes", "route", "routeHead", "paragraph"];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ProposalRoutes {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
