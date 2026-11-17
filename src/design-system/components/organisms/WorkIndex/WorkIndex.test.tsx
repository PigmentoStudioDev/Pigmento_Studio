import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { WorkIndex, type WorkIndexItem } from "./WorkIndex";

const IMAGE = { src: "/portfolio/01.png", alt: "Portada", width: 520, height: 700 };
const ITEMS: WorkIndexItem[] = ["Uno", "Dos", "Tres", "Cuatro"].map((title) => ({
  slug: title.toLowerCase(),
  title,
  image: IMAGE,
  gallery: [IMAGE, IMAGE],
}));

const PROPS = {
  items: ITEMS,
  title: "Trabajo",
  titleId: "trabajo-titulo",
  labels: { viewCase: "Ver caso", viewGrid: "Ver en cuadricula", viewList: "Ver en lista", viewSwitch: "Vista" },
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

  it("en la lista solo la fila con el cursor queda activa", () => {
    render(<WorkIndex {...PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver en lista" }));

    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveAttribute("data-active");

    fireEvent.pointerEnter(screen.getByRole("link", { name: "Tres" }));

    expect(rows[0]).not.toHaveAttribute("data-active");
    expect(rows[2]).toHaveAttribute("data-active");
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
