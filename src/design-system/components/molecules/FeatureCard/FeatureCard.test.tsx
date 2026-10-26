import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { FeatureCard } from "./FeatureCard";

describe("FeatureCard", () => {
  // La cara de encima repite el contenido: si contara, cada tarjeta se oiria dos veces.
  it("la etiqueta es el unico encabezado y el contenido se anuncia una vez", () => {
    render(<FeatureCard label="Branding" index={1} title="Una identidad" text="Nombre y sistema." drawing="branding" />);

    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Branding"]);
    const copies = screen.getAllByText("Una identidad");
    expect(copies).toHaveLength(2);
    expect(copies.filter((copy) => copy.closest("[aria-hidden='true']") === null)).toHaveLength(1);
  });

  it("la pieza puede ser una cifra, y el numero de orden no se anuncia", () => {
    render(<FeatureCard label="Proyectos entregados" index={3} figure="120" text="Desde 2018." />);

    expect(screen.getAllByText("120")[0]).toBeVisible();
    screen.getAllByText("[03]").forEach((index) => expect(index).toHaveAttribute("aria-hidden", "true"));
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<FeatureCard label="Motion" index={2} text="Animacion." drawing="motion" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
