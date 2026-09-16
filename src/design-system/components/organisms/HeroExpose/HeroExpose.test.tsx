import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { HeroExpose } from "./HeroExpose";

const BASE = {
  title: "Marca que se nota",
  pieces: [{ src: "/piezas/uno.avif" }, { src: "/piezas/dos.avif" }],
};

describe("HeroExpose", () => {
  it("el titulo es el encabezado de la pagina", () => {
    render(<HeroExpose {...BASE} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Marca que se nota");
  });

  it("el distintivo, el subtitulo y la llamada a la accion son opcionales", () => {
    const { rerender } = render(<HeroExpose {...BASE} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("Estudio")).not.toBeInTheDocument();

    rerender(
      <HeroExpose
        {...BASE}
        eyebrow="Estudio"
        subtitle="Marca y crecimiento"
        ctaLabel="Ver el trabajo"
        ctaHref="/trabajo"
      />,
    );

    expect(screen.getByText("Estudio")).toBeInTheDocument();
    expect(screen.getByText("Marca y crecimiento")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver el trabajo" })).toHaveAttribute("href", "/trabajo");
  });

  it("no pinta la llamada a la accion a medias", () => {
    const { rerender } = render(<HeroExpose {...BASE} ctaLabel="Ver el trabajo" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    rerender(<HeroExpose {...BASE} ctaHref="/trabajo" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  // Si el texto colgara del mosaico, el arrastre empezaria sobre el CTA.
  it("el bloque de texto es hermano del mosaico, no hijo suyo", () => {
    const { container } = render(<HeroExpose {...BASE} ctaLabel="Ver" ctaHref="/trabajo" />);

    const grid = container.querySelector("[data-infinite-grid-status]");

    expect(grid).toBeInTheDocument();
    expect(grid).not.toContainElement(screen.getByRole("link", { name: "Ver" }));
    expect(grid).not.toContainElement(screen.getByRole("heading", { level: 1 }));
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(
      <HeroExpose
        {...BASE}
        eyebrow="Estudio"
        subtitle="Marca y crecimiento"
        ctaLabel="Ver el trabajo"
        ctaHref="/trabajo"
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
