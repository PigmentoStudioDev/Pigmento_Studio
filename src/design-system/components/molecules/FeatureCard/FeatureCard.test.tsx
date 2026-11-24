import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { FeatureCard } from "./FeatureCard";

describe("FeatureCard", () => {
  it("el nombre es el encabezado y el texto lo acompana, en las dos pieles", () => {
    render(
      <>
        <FeatureCard label="Branding" text="Nombre y sistema." shape="seal" />
        <FeatureCard label="Hablas con quien lo hace" text="Sin intermediarios." shape="pair" family="pink" />
      </>,
    );

    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Branding",
      "Hablas con quien lo hace",
    ]);
    expect(screen.getByText("Sin intermediarios.")).toBeInTheDocument();
  });

  it("el numero de paso se ve pero no se lee como parte del nombre", () => {
    render(<FeatureCard label="Diagnostico" text="Primero escuchamos." step="01" />);

    expect(screen.getByText("01")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(/^Diagnostico$/);
  });

  it("no tiene violaciones de accesibilidad en ninguna de las dos pieles", async () => {
    const { container } = render(
      <>
        <FeatureCard label="Motion" text="Animacion." shape="sphere" />
        <FeatureCard label="Se prueba" text="Con la gente." shape="seal" family="lime" />
      </>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
