import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ControlBar } from "./ControlBar";

describe("ControlBar", () => {
  it("agrupa los controles que recibe", () => {
    render(
      <ControlBar>
        <button type="button">Anterior</button>
        <button type="button">Siguiente</button>
      </ControlBar>,
    );

    expect(screen.getByRole("button", { name: "Anterior" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeInTheDocument();
  });

  /**
   * Contenedor semantico y nada mas: sin cristal ni capa de pintura. Los controles
   * flotan sobre el contenido del carrusel por si mismos.
   */
  it("no pinta ninguna superficie", () => {
    const { container } = render(
      <ControlBar>
        <button type="button">Siguiente</button>
      </ControlBar>,
    );

    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
    expect(container.firstElementChild?.children).toHaveLength(1);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(
      <ControlBar>
        <button type="button">Siguiente</button>
      </ControlBar>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
