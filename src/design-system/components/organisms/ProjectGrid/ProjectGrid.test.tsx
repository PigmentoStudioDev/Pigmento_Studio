import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { buildWorkGridRows } from "./workGrid";
import { ProjectGrid, type ProjectGridItem } from "./ProjectGrid";

const IMAGE = { src: "/portfolio/01.png", alt: "Portada", width: 520, height: 700 };
const ITEMS: ProjectGridItem[] = ["Uno", "Dos", "Tres", "Cuatro", "Cinco", "Seis"].map((title) => ({
  slug: title.toLowerCase(),
  title,
  image: IMAGE,
}));

const PROPS = {
  rows: buildWorkGridRows(ITEMS),
  labels: { viewCase: "Ver caso" },
};

describe("ProjectGrid", () => {
  it("un enlace por proyecto, con el nombre de su caso", () => {
    render(<ProjectGrid {...PROPS} />);

    expect(screen.getAllByRole("link")).toHaveLength(ITEMS.length);
    expect(screen.getByRole("link", { name: "Uno" })).toHaveAttribute("href", "/trabajo/uno");
  });

  it("la pildora es decorativa: no se suma al nombre del enlace", () => {
    render(<ProjectGrid {...PROPS} />);

    expect(screen.getAllByText("Ver caso")[0]).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("link", { name: "Dos" })).toBeInTheDocument();
  });

  it("la pieza ancha de la pareja ocupa dos columnas", () => {
    const { container } = render(<ProjectGrid {...PROPS} />);

    expect(container.querySelectorAll("[data-wide='true']")).toHaveLength(1);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ProjectGrid {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
