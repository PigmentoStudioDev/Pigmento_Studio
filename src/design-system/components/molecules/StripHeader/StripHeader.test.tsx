import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { StripHeader } from "./StripHeader";

const PROPS = {
  title: "Equipo",
  label: "Quién lo hace",
  intro: "Un estudio pequeño.",
};

describe("StripHeader", () => {
  /**
   * El titular es el que nombra la seccion, asi que tiene que ser un ENCABEZADO de
   * verdad: por ahi navega quien usa lector de pantalla.
   */
  it("el titulo es un encabezado", () => {
    render(<StripHeader {...PROPS} />);

    expect(screen.getByRole("heading", { name: "Equipo" })).toBeInTheDocument();
  });

  /**
   * El ancla es el contrato con `Section labelledBy`: sin un id en el titular, esa
   * prop apunta a nada y el <section> se queda como contenedor generico en vez de
   * landmark con nombre. Falla en silencio, que es lo peor que puede hacer.
   */
  it("publica el ancla que la seccion necesita para nombrarse", () => {
    render(<StripHeader {...PROPS} titleId="equipo" />);

    expect(screen.getByRole("heading", { name: "Equipo" })).toHaveAttribute("id", "equipo");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<StripHeader {...PROPS} titleId="equipo" />);

    expect(await axe(container)).toHaveNoViolations();
  });

  /**
   * El reparto partido deja el titular a un lado y la entradilla al otro. Sobre un
   * bloque simetrico —la corona de valores— eso apunta a un eje que abajo no existe,
   * y por eso la variante existe y no es una preferencia.
   */
  it("centrado envuelve los tres en una sola caja", () => {
    const { container } = render(<StripHeader {...PROPS} align="center" />);

    const caja = container.firstElementChild;
    expect(caja?.className).toContain("centered");
    expect(caja?.querySelector("h2")).not.toBeNull();
    expect(caja?.textContent).toContain(PROPS.intro);
  });

  /** Sin la prop, nada cambia: es el reparto de todas las strips de la pagina. */
  it("sin align no lleva la clase de centrado", () => {
    const { container } = render(<StripHeader {...PROPS} />);

    expect(container.firstElementChild?.className).toBe("");
  });
});
