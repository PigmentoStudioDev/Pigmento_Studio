import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { HeroStatement } from "./HeroStatement";

const BASE = {
  title: "Marcas que se reconocen en la calle.",
  pieces: [{ src: "/piezas/uno.png" }, { src: "/piezas/dos.png" }, { src: "/piezas/tres.png" }],
};

const FULL = {
  ...BASE,
  eyebrow: "Diseño de marca y crecimiento",
  subtitle: "Cada pieza, probada frente a gente real.",
  ctaLabel: "Empezar un proyecto",
  ctaHref: "#contacto",
};

describe("HeroStatement", () => {
  it("el titular es el encabezado de la pagina", () => {
    render(<HeroStatement {...BASE} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(BASE.title);
  });

  it("chip, entradilla y CTA son opcionales", () => {
    render(<HeroStatement {...BASE} />);

    expect(screen.queryByText(FULL.eyebrow)).not.toBeInTheDocument();
    expect(screen.queryByText(FULL.subtitle)).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("pinta el chip, la entradilla y el CTA cuando llegan", () => {
    render(<HeroStatement {...FULL} />);

    expect(screen.getByText(FULL.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(FULL.subtitle)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: FULL.ctaLabel })).toHaveAttribute("href", FULL.ctaHref);
  });

  it("sin destino no hay CTA: un boton que no lleva a ningun sitio no se pinta", () => {
    render(<HeroStatement {...BASE} ctaLabel={FULL.ctaLabel} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("la tira es decorativa", () => {
    const { container } = render(<HeroStatement {...BASE} />);

    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(container.querySelectorAll("img").length).toBeGreaterThanOrEqual(BASE.pieces.length);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<HeroStatement {...FULL} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
