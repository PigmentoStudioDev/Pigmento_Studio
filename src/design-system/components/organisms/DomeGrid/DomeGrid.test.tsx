import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import styles from "./DomeGrid.module.scss";
import { DomeGrid, type DomeGridItem } from "./DomeGrid";

const IMAGE = { src: "/portfolio/01.png", alt: "Portada uno", width: 520, height: 700 };

const ITEMS: DomeGridItem[] = [
  { slug: "uno", title: "Uno", meta: "Branding, 2026", image: IMAGE },
  { slug: "dos", title: "Dos", image: { ...IMAGE, alt: "Portada dos" } },
  { slug: "tres", title: "Tres", meta: "Motion, 2025", image: { ...IMAGE, alt: "Portada tres" } },
];

const PROPS = {
  items: ITEMS,
  title: "Trabajo",
  titleId: "trabajo-titulo",
  labels: { stage: "Portafolio", drag: "Arrastrar" },
};

describe("DomeGrid", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("un enlace por proyecto, con el nombre de su caso", () => {
    render(<DomeGrid {...PROPS} />);

    expect(screen.getAllByRole("link")).toHaveLength(ITEMS.length);
    expect(screen.getByRole("link", { name: /Uno Branding, 2026$/ })).toHaveAttribute("href", "/trabajo/uno");
    expect(screen.getByRole("link", { name: /Dos$/ })).toHaveAttribute("href", "/trabajo/dos");
  });

  it("cada enlace se nombra por su caption, sin repetir la pieza con el alt", () => {
    const { container } = render(<DomeGrid {...PROPS} />);

    expect(screen.queryByRole("img", { name: "Portada tres" })).not.toBeInTheDocument();
    for (const img of container.querySelectorAll("img")) expect(img).toHaveAttribute("alt", "");
  });

  it("el titular de la pagina va oculto a la vista pero sigue en el arbol accesible", () => {
    render(<DomeGrid {...PROPS} />);

    expect(screen.getByRole("heading", { level: 1, name: "Trabajo" })).toHaveAttribute("id", "trabajo-titulo");
  });

  it("el escenario pide el disco de arrastre con su texto", () => {
    const { container } = render(<DomeGrid {...PROPS} />);

    expect(container.firstElementChild).toHaveAttribute("data-cursor", "drag");
    expect(container.firstElementChild).toHaveAttribute("data-cursor-text", "Arrastrar");
  });

  it("las copias que tesela el motor no entran al arbol accesible ni al teclado", () => {
    // jsdom no maqueta: se da un tamano al escenario para que el motor cree copias.
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, top: 0, left: 0, right: 1200, bottom: 800, width: 1200, height: 800, toJSON: () => ({}),
    } as DOMRect);

    const { container } = render(<DomeGrid {...PROPS} />);

    const copies = container.querySelectorAll('li[aria-hidden="true"]');
    expect(copies.length).toBeGreaterThan(0);
    expect(copies[0]).toHaveAttribute("inert");
    expect(screen.getAllByRole("link")).toHaveLength(ITEMS.length);
  });

  it("sin proyectos no se monta", () => {
    const { container } = render(<DomeGrid {...PROPS} items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<DomeGrid {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DomeGrid: contrato TS <-> Sass", () => {
  it("toda clase que pide el TSX existe en la hoja, y la hoja no declara ninguna de mas", () => {
    const usadas = ["stage", "hiddenTitle", "cover", "list", "item", "link", "image", "caption", "name", "meta", "shade"];

    for (const clase of usadas) {
      expect(styles[clase], `styles.${clase} no existe en la hoja`).toBeDefined();
    }
    expect(Object.keys(styles)).toHaveLength(usadas.length);
  });
});
