import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { FeaturedCase } from "./FeaturedCase";
import styles from "./FeaturedCase.module.scss";

const PIEZAS = [
  { src: "/caso/01.jpg", width: 800, height: 1000 },
  { src: "/caso/02.jpg", width: 800, height: 1000 },
];

const PROPS = {
  client: "Señora Galleta",
  discipline: "Branding",
  summary: "El reto fue construir una identidad capaz de transmitir sofisticacion sin perder cercania.",
  label: "El caso",
  pieces: PIEZAS,
};

describe("FeaturedCase", () => {
  /** El nombre del caso ES el titular del bloque: es lo que lo nombra para quien escucha. */
  it("el cliente es el titular de la seccion", () => {
    render(<FeaturedCase {...PROPS} />);

    expect(screen.getByRole("heading", { level: 2, name: "Señora Galleta" })).toBeInTheDocument();
  });

  it("pinta el texto del caso y su disciplina", () => {
    render(<FeaturedCase {...PROPS} />);

    expect(screen.getByText(/identidad capaz de transmitir/)).toBeInTheDocument();
    expect(screen.getByText("Branding")).toBeInTheDocument();
  });

  /**
   * Las piezas son decorativas: el bloque ya esta nombrado por el cliente y descrito
   * por su texto, y describir una a una las piezas de una identidad repite lo dicho.
   */
  it("las piezas no se anuncian una a una", () => {
    render(<FeaturedCase {...PROPS} />);

    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(screen.getAllByRole("listitem")).toHaveLength(PIEZAS.length);
  });

  /**
   * Sin galeria no hay bloque, y no es una guarda de cortesia: con la portada sola
   * esto es el strip otra vez, y la pagina ya tiene uno.
   */
  it("sin piezas no se pinta", () => {
    const { container } = render(<FeaturedCase {...PROPS} pieces={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  /** La disciplina es opcional: un caso puede no tenerla y el bloque sigue en pie. */
  it("sin disciplina sigue pintando el caso", () => {
    render(<FeaturedCase {...PROPS} discipline={undefined} />);

    expect(screen.getByRole("heading", { level: 2, name: "Señora Galleta" })).toBeInTheDocument();
  });

  /** Dos piezas del mismo archivo no colisionan: la clave lleva la posicion. */
  it("dos piezas del mismo archivo se pintan las dos", () => {
    render(<FeaturedCase {...PROPS} pieces={[PIEZAS[0], PIEZAS[0]]} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = ["root", "text", "label", "discipline", "summary", "gallery", "piece", "image"];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<FeaturedCase {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
