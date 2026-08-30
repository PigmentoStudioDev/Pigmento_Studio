import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroVideo } from "./HeroVideo";

const BASE = {
  title: "Marca que se nota",
  videoSrc: "https://cdn.example/hero.mp4",
  videoPoster: "/hero-poster.webp",
};

describe("HeroVideo", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /**
   * El titular del hero es el encabezado de nivel 1 de la pagina. Consultado por
   * rol y no por clase: lo que promete la prop es un titulo navegable, no un div
   * con cierta tipografia.
   */
  it("el titulo es el encabezado de la pagina", () => {
    render(<HeroVideo {...BASE} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Marca que se nota");
  });

  it("el distintivo y la llamada a la accion son opcionales", () => {
    const { rerender } = render(<HeroVideo {...BASE} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("Estudio")).not.toBeInTheDocument();

    rerender(<HeroVideo {...BASE} eyebrow="Estudio" ctaLabel="Ver el trabajo" ctaHref="/trabajo" />);

    expect(screen.getByText("Estudio")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver el trabajo" })).toHaveAttribute("href", "/trabajo");
  });

  /**
   * Un boton sin destino no es un boton. Con la etiqueta a medias no se pinta nada:
   * mas vale un hero sin llamada a la accion que una que no lleva a ningun sitio.
   */
  it("no pinta la llamada a la accion a medias", () => {
    const { rerender } = render(<HeroVideo {...BASE} ctaLabel="Ver el trabajo" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    rerender(<HeroVideo {...BASE} ctaHref="/trabajo" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(
      <HeroVideo {...BASE} eyebrow="Estudio" ctaLabel="Ver el trabajo" ctaHref="/trabajo" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
