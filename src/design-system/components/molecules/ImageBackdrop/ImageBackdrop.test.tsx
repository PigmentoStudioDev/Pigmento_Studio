import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { compile } from "sass";
import { describe, expect, it } from "vitest";
import { TARGET_OVERFLOW } from "../../../motion/backdrop";
import { ImageBackdrop } from "./ImageBackdrop";
import styles from "./ImageBackdrop.module.scss";

const PROPS = {
  src: "https://cdn.example/portada.png",
  alt: "",
  width: 1672,
  height: 941,
};

describe("ImageBackdrop", () => {
  it("monta la imagen dentro del objetivo que se mueve", () => {
    const { container } = render(<ImageBackdrop {...PROPS} />);

    expect(container.querySelector(`.${styles.mask}`)).toBeInTheDocument();
    expect(container.querySelector(`.${styles.target}`)).toBeInTheDocument();
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  /**
   * Este fondo va DEBAJO del titular de la portada: una descripcion aqui se leeria
   * dos veces. Con alt vacio la imagen sale del arbol de accesibilidad, que es lo
   * correcto, y el test lo fija — un dia alguien la "arregla" poniendole texto.
   */
  it("con alt vacio es decorativa y no aparece como imagen", () => {
    render(<ImageBackdrop {...PROPS} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("con alt escrito si se anuncia", () => {
    render(<ImageBackdrop {...PROPS} alt="Una textura de espuma" />);
    expect(screen.getByRole("img", { name: "Una textura de espuma" })).toBeInTheDocument();
  });

  /**
   * El mismo contrato que el fondo de video, y por el mismo motivo: el recorrido se
   * calcula desde TARGET_OVERFLOW pero el alto real lo pone la hoja. Si se separan,
   * el fondo descubre una franja vacia al final del scroll — sin error y sin que
   * nadie lo vea en el diff.
   */
  it("el sobrante declarado en TS es el que pone la hoja", () => {
    const css = compile(
      join(process.cwd(), "src/design-system/components/molecules/ImageBackdrop/ImageBackdrop.module.scss"),
      { loadPaths: ["node_modules"], quietDeps: true },
    ).css;

    const declared = /\.target\b[^{]*\{[^}]*block-size:\s*([0-9.]+)%/.exec(css)?.[1];

    expect(declared, "no se encontro el block-size de .target en la hoja").toBeDefined();
    expect(Number(declared)).toBe(TARGET_OVERFLOW);
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["mask", "target", "image"];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ImageBackdrop {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
