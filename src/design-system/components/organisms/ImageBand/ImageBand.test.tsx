import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ImageBand } from "./ImageBand";
import styles from "./ImageBand.module.scss";

const IMAGEN = { src: "/textura.jpg", width: 2560, height: 2090 };

describe("ImageBand", () => {
  /**
   * Es un respiro: el valor del bloque es que no haya NADA que procesar. Si algun dia
   * alguien le cuelga un titular o un boton encima, deja de separar dos actos y pasa a
   * ser el acto siguiente. El test lo dice contando roles, no mirando clases.
   */
  it("no mete nada que leer ni que pulsar", () => {
    const { container } = render(<ImageBand {...IMAGEN} alt="" />);

    expect(container).toHaveTextContent("");
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryAllByRole("heading")).toHaveLength(0);
  });

  /** Decorativa: sin texto alternativo no entra en el arbol de accesibilidad. */
  it("con alt vacio la imagen queda fuera del arbol accesible", () => {
    render(<ImageBand {...IMAGEN} alt="" />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  /** Y cuando la foto si dice algo que el texto de alrededor no dice, se anuncia. */
  it("con alt la imagen se anuncia", () => {
    render(<ImageBand {...IMAGEN} alt="Textura de chocolate derretido" />);

    expect(screen.getByRole("img", { name: "Textura de chocolate derretido" })).toBeInTheDocument();
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["root"];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ImageBand {...IMAGEN} alt="" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
