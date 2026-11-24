import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Services, type ServicesProps } from "./Services";

const PROPS: ServicesProps = {
  label: "Servicios",
  title: "Cuatro disciplinas que trabajan juntas.",
  intro: "Una marca no vive en una sola pieza.",
  services: [
    { key: "branding", name: "Branding", text: "Nombre y sistema.", family: "pink" },
    { key: "motion", name: "Motion", text: "Animacion y video.", family: "periwinkle" },
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

  it("cada disciplina se distingue por su color, sin iconografia ni imagenes", () => {
    const { container } = render(<Services {...PROPS} />);

    expect(container.querySelectorAll("img, canvas")).toHaveLength(0);
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
