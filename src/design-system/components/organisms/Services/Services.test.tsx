import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { Services, type ServicesProps } from "./Services";

const IMAGE = { src: "/portfolio/01.png", width: 522, height: 522 };

const PROPS: ServicesProps = {
  title: "Servicios",
  titleHighlight: "Servicios",
  label: "Oferta",
  intro: "Cuatro disciplinas que trabajan juntas.",
  cta: "Ver servicio",
  services: [
    { name: "Branding", scope: "Identidad, naming y sistema visual", href: "/servicios", image: IMAGE },
    { name: "Motion", scope: "Animación de marca, video e interfaz", href: "/servicios/motion", image: IMAGE },
  ],
  titleId: "servicios",
};

describe("Services", () => {
  it("el titular es el de la seccion y lleva el id que la nombra", () => {
    render(<Services {...PROPS} />);

    expect(screen.getByRole("heading", { level: 2, name: PROPS.title })).toHaveAttribute("id", "servicios");
  });

  it("cada fila es UN enlace nombrado por el servicio y lo que incluye", () => {
    render(<Services {...PROPS} />);

    expect(screen.getAllByRole("listitem").map((item) => item.querySelectorAll("a").length)).toEqual([1, 1]);
    expect(screen.getByRole("link", { name: "Branding Identidad, naming y sistema visual" })).toHaveAttribute(
      "href",
      "/servicios",
    );
  });

  it("cada servicio es un titular dentro del esquema de la seccion", () => {
    render(<Services {...PROPS} />);

    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Branding",
      "Motion",
    ]);
  });

  it("la pista y la vista previa no se anuncian", () => {
    render(<Services {...PROPS} />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getAllByText("Ver servicio").every((hint) => hint.getAttribute("aria-hidden") === "true")).toBe(true);
  });

  it("sin servicios no se monta", () => {
    const { container } = render(<Services {...PROPS} services={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("las filas entran con el scroll, una detras de otra, como el resto de la pagina", () => {
    render(<Services {...PROPS} />);

    expect(screen.getAllByRole("listitem").every((row) => row.getAttribute("data-reveal-mode") === "block")).toBe(true);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<Services {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
