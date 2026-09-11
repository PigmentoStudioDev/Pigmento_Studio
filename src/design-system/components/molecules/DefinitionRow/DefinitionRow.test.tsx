import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { DefinitionRow, type DefinitionRowProps } from "./DefinitionRow";
import styles from "./DefinitionRow.module.scss";

const PROPS: DefinitionRowProps = {
  items: [
    { term: "Uno", description: "Lo que dice del primero." },
    { term: "Dos", description: "Lo que dice del segundo." },
  ],
};

describe("DefinitionRow", () => {
  /**
   * El contrato que importa: cada definicion queda ASOCIADA a su termino. Con divs
   * se ven igual y quien usa lector de pantalla oye dos textos seguidos sin saber
   * que el segundo explica al primero. Se comprueba sobre el DOM real —dt seguido
   * de su dd dentro del mismo grupo— porque eso es lo que lee la tecnologia de
   * apoyo, no la clase que lleve puesta.
   */
  it("empareja cada termino con su definicion", () => {
    const { container } = render(<DefinitionRow {...PROPS} />);

    const lista = container.querySelector("dl");
    expect(lista).toBeInTheDocument();

    const grupos = lista?.querySelectorAll(":scope > div") ?? [];
    expect(grupos).toHaveLength(2);

    for (const [i, item] of PROPS.items.entries()) {
      const grupo = grupos[i];
      expect(within(grupo as HTMLElement).getByText(item.term).tagName).toBe("DT");
      expect(within(grupo as HTMLElement).getByText(item.description).tagName).toBe("DD");
    }
  });

  it("el aside solo sale cuando el dato lo trae", () => {
    const { rerender } = render(<DefinitionRow {...PROPS} />);
    expect(screen.queryByText("$12,000")).not.toBeInTheDocument();

    rerender(
      <DefinitionRow
        items={[{ term: "Uno", description: "Lo que dice.", aside: "$12,000" }]}
      />,
    );
    expect(screen.getByText("$12,000")).toBeInTheDocument();
  });

  it("el enfasis de etiqueta se aplica solo cuando se pide", () => {
    const { container, rerender } = render(<DefinitionRow {...PROPS} />);
    expect(container.querySelector("dt")).not.toHaveClass(styles.termLabel);

    rerender(<DefinitionRow {...PROPS} emphasis="label" />);
    expect(container.querySelector("dt")).toHaveClass(styles.termLabel);
  });

  /**
   * El circuito TS <-> Sass, contando: una clase que la hoja no declara sale como
   * `undefined`, que join() convierte en cadena vacia. La clase no sale rota, sale
   * ausente, y comprobar solo pertenencia pasaria verde.
   */
  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["root", "row", "term", "termLabel", "description", "aside"];

    for (const clase of usadas) {
      expect(styles[clase], `styles.${clase} no existe en la hoja`).toBeDefined();
    }
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<DefinitionRow {...PROPS} emphasis="label" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
