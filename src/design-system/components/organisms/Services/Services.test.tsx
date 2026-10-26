import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Services, type ServicesProps } from "./Services";

const PROPS: ServicesProps = {
  label: "Servicios",
  title: "Cuatro disciplinas que trabajan juntas.",
  intro: "Una marca no vive en una sola pieza.",
  services: [
    { key: "branding", name: "Branding", title: "Una identidad que se sostiene", text: "Nombre y sistema." },
    { key: "motion", name: "Motion", title: "La marca en movimiento", text: "Animacion y video." },
  ],
  titleId: "servicios",
};

describe("Services", () => {
  it("el titular lleva el id que nombra la seccion", () => {
    render(<Services {...PROPS} />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "servicios");
  });

  it("cada tarjeta se nombra solo por el servicio, sin el numero, y no navega", () => {
    render(<Services {...PROPS} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Branding",
      "Motion",
    ]);
  });

  it("las disciplinas se leen como lista ordenada", () => {
    render(<Services {...PROPS} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("list").tagName).toBe("OL");
  });

  it("los dibujos son decoracion y no repite imagenes del portafolio", () => {
    const { container } = render(<Services {...PROPS} />);

    expect(container.querySelectorAll("img")).toHaveLength(0);
    container.querySelectorAll("svg").forEach((svg) => expect(svg).toHaveAttribute("aria-hidden", "true"));
  });

  it("sin servicios no se monta", () => {
    const { container } = render(<Services {...PROPS} services={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Services {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
