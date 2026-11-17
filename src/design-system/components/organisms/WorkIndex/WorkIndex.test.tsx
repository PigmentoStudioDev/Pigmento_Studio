import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { WorkIndex, type WorkIndexItem } from "./WorkIndex";

const IMAGE = { src: "/portfolio/01.png", alt: "Portada", width: 520, height: 700 };
const ITEMS: WorkIndexItem[] = ["Uno", "Dos", "Tres", "Cuatro"].map((title, index) => ({
  slug: title.toLowerCase(),
  title,
  discipline: index < 2 ? "branding" : "web",
  image: IMAGE,
  gallery: [IMAGE, IMAGE],
}));

const PROPS = {
  items: ITEMS,
  filters: [
    { value: "branding", label: "Branding" },
    { value: "web", label: "Web" },
  ],
  title: "Trabajo",
  titleId: "trabajo-titulo",
  labels: { viewCase: "Ver caso", viewGrid: "Ver en cuadricula", viewList: "Ver en lista", viewSwitch: "Vista", filterAll: "Todos", filterLabel: "Filtrar" },
};

describe("WorkIndex", () => {
  it("arranca en cuadricula, con el selector marcando esa vista", () => {
    render(<WorkIndex {...PROPS} />);

    expect(screen.getByRole("button", { name: "Ver en cuadricula" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Ver en lista" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getAllByText("Ver caso")).toHaveLength(ITEMS.length);
  });

  it("cambia a lista sin recargar y conserva un enlace por proyecto", () => {
    render(<WorkIndex {...PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: "Ver en lista" }));

    expect(screen.getByRole("button", { name: "Ver en lista" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Ver caso")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(ITEMS.length);
    expect(screen.getByRole("link", { name: "Uno" })).toHaveAttribute("href", "/trabajo/uno");
  });

  it("cada fila de la lista lleva la portada y las piezas de la galeria", () => {
    const { container } = render(<WorkIndex {...PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver en lista" }));

    for (const row of screen.getAllByRole("listitem")) {
      expect(row.querySelectorAll("img")).toHaveLength(3);
    }
    expect(container.querySelectorAll("li")).toHaveLength(ITEMS.length);
  });

  it("arranca con Todos marcado y todos los proyectos", () => {
    render(<WorkIndex {...PROPS} />);

    expect(screen.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("link")).toHaveLength(ITEMS.length);
  });

  it("filtrar deja solo la disciplina elegida, actualiza el contador y Todos lo deshace", () => {
    render(<WorkIndex {...PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: "Web" }));

    expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/trabajo/tres", "/trabajo/cuatro"]);
    expect(screen.getByText("(2)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Todos" })).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: "Todos" }));
    expect(screen.getAllByRole("link")).toHaveLength(ITEMS.length);
  });

  it("el filtro se conserva al cambiar de vista", () => {
    render(<WorkIndex {...PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: "Branding" }));
    fireEvent.click(screen.getByRole("button", { name: "Ver en lista" }));

    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("el titular de la pagina sigue ahi en las dos vistas", () => {
    render(<WorkIndex {...PROPS} />);
    expect(screen.getByRole("heading", { level: 1, name: "Trabajo" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver en lista" }));
    expect(screen.getByRole("heading", { level: 1, name: "Trabajo" })).toBeInTheDocument();
  });

  it("no tiene violaciones de accesibilidad en ninguna vista", async () => {
    const { container } = render(<WorkIndex {...PROPS} />);
    expect(await axe(container)).toHaveNoViolations();

    fireEvent.click(screen.getByRole("button", { name: "Ver en lista" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
