import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ProjectDetail, type ProjectDetailProps } from "./ProjectDetail";
import styles from "./ProjectDetail.module.scss";

const PORTADA = { src: "/caso/portada.jpg", alt: "Portada del caso", width: 2560, height: 1486 };
const GALERIA = [
  { src: "/caso/01.jpg", alt: "Empaque frontal", width: 800, height: 1000 },
  { src: "/caso/02.jpg", alt: "Empaque lateral", width: 800, height: 1000 },
];

const PROPS: ProjectDetailProps = {
  titleId: "proyecto",
  title: "Calderoni",
  client: "Timbal de Azúcar",
  disciplineLabel: "Branding",
  year: 2025,
  summary: "El reto fue dar identidad a una marca nueva sin perder la cercania del oficio.",
  cover: PORTADA,
  gallery: GALERIA,
  labels: {
    back: "Volver al trabajo",
    client: "Cliente",
    discipline: "Disciplina",
    year: "Año",
    gallery: "Galería",
  },
};

describe("ProjectDetail", () => {
  /** El titular es el h1 de la pagina y lleva el id que nombra la seccion. */
  it("el titulo del proyecto es el h1 y nombra la seccion", () => {
    const { container } = render(<ProjectDetail {...PROPS} />);

    expect(screen.getByRole("heading", { level: 1, name: "Calderoni" })).toBeInTheDocument();
    expect(container.querySelectorAll("#proyecto")).toHaveLength(1);
  });

  /** Los datos del caso viajan como pares termino-valor, en la voz de metadato. */
  it("pinta cliente, disciplina y ano como pares termino-valor", () => {
    render(<ProjectDetail {...PROPS} />);
    const datos = screen.getByText("Cliente").closest("div");

    expect(within(datos!).getByText("Timbal de Azúcar")).toBeInTheDocument();
    expect(screen.getByText("Disciplina")).toBeInTheDocument();
    expect(screen.getByText("Branding")).toBeInTheDocument();
    expect(screen.getByText("2025")).toBeInTheDocument();
  });

  /** Sin disciplina ni ano no hay fila vacia: la pagina no inventa datos. */
  it("sin disciplina ni ano omite esas filas", () => {
    render(<ProjectDetail {...PROPS} disciplineLabel={undefined} year={undefined} />);

    expect(screen.queryByText("Disciplina")).not.toBeInTheDocument();
    expect(screen.queryByText("Año")).not.toBeInTheDocument();
    expect(screen.getByText("Timbal de Azúcar")).toBeInTheDocument();
  });

  it("el resumen se lee como texto del proyecto", () => {
    render(<ProjectDetail {...PROPS} />);

    expect(screen.getByText(/dar identidad a una marca nueva/)).toBeInTheDocument();
  });

  /**
   * La portada y cada pieza llevan el alt que escribio el CMS: son la prueba del trabajo,
   * no decoracion.
   */
  it("la portada y la galeria se anuncian con su alt", () => {
    render(<ProjectDetail {...PROPS} />);

    expect(screen.getByRole("img", { name: "Portada del caso" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Galería" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Empaque frontal" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Empaque lateral" })).toBeInTheDocument();
  });

  /** Sin galeria no se pinta la lista: una lista vacia es un landmark sin contenido. */
  it("sin galeria no hay lista", () => {
    render(<ProjectDetail {...PROPS} gallery={[]} />);

    expect(screen.queryByRole("list", { name: "Galería" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Portada del caso" })).toBeInTheDocument();
  });

  /** El enlace de vuelta lleva al listado, no a la pagina de este caso. */
  it("el enlace de vuelta lleva a /trabajo", () => {
    render(<ProjectDetail {...PROPS} />);

    expect(screen.getByRole("link", { name: "Volver al trabajo" })).toHaveAttribute("href", "/trabajo");
  });

  it("toda clase que pide el TSX existe en la hoja", () => {
    const usadas = [
      "root",
      "back",
      "hero",
      "meta",
      "metaItem",
      "metaTerm",
      "metaValue",
      "summary",
      "cover",
      "image",
      "gallery",
      "galleryItem",
    ];
    for (const c of usadas) expect(styles[c], `styles.${c}`).toBeDefined();
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ProjectDetail {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
