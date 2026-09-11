import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { CheckList, type CheckListProps } from "./CheckList";
import styles from "./CheckList.module.scss";

const PROPS: CheckListProps = {
  items: [{ text: "Lo primero" }, { text: "Lo segundo", included: false }],
  title: "En los tres paquetes",
  titleId: "en-los-tres",
  includedLabel: "incluido",
  excludedLabel: "no incluido",
};

describe("CheckList", () => {
  /**
   * El que importa. El icono es decorativo, asi que sin el texto oculto la fila
   * excluida y la incluida se anuncian EXACTAMENTE igual: quien no ve la pantalla
   * no tiene forma de saber cual entra en el paquete.
   */
  it("dice con palabras lo que el icono dice con dibujo", () => {
    render(<CheckList {...PROPS} />);

    const filas = screen.getAllByRole("listitem");
    expect(within(filas[0]).getByText("incluido")).toBeInTheDocument();
    expect(within(filas[1]).getByText("no incluido")).toBeInTheDocument();
  });

  /**
   * El texto del renglon SOBREVIVE junto a la marca. Es el fallo de colgar un
   * `aria-label` de la fila: sustituye al contenido en vez de sumarse, y el renglon
   * pasa a anunciarse solo "incluido".
   */
  it("la marca no se come el texto del renglon", () => {
    render(<CheckList {...PROPS} />);

    const fila = screen.getAllByRole("listitem")[0];
    expect(within(fila).getByText("Lo primero")).toBeInTheDocument();
    expect(fila).toHaveTextContent("incluido");
    expect(fila).toHaveTextContent("Lo primero");
  });

  it("incluido es el valor por defecto", () => {
    render(<CheckList {...PROPS} items={[{ text: "Sin decir nada" }]} />);

    expect(screen.getByText("incluido")).toBeInTheDocument();
    expect(screen.queryByText("no incluido")).not.toBeInTheDocument();
  });

  /** El icono es decorativo: nombrarse a si mismo daria dos nombres a un renglon. */
  it("los iconos quedan fuera del arbol de accesibilidad", () => {
    const { container } = render(<CheckList {...PROPS} />);

    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(2);
    for (const svg of svgs) expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("la lista toma su nombre del titulo cuando lo hay", () => {
    const { rerender } = render(<CheckList {...PROPS} />);
    expect(screen.getByRole("list", { name: "En los tres paquetes" })).toBeInTheDocument();

    rerender(<CheckList {...PROPS} title={undefined} titleId={undefined} />);
    expect(screen.getByRole("list")).not.toHaveAttribute("aria-labelledby");
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = [
      "root",
      "title",
      "list",
      "item",
      "markIncluded",
      "markExcluded",
      "srOnly",
      "text",
    ];

    for (const clase of usadas) {
      expect(styles[clase], `styles.${clase} no existe en la hoja`).toBeDefined();
    }
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<CheckList {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
