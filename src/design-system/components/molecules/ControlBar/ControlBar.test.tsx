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

  /** El cristal es pintura: no se anuncia ni se interpone entre el puntero y los controles. */
  it("el cristal no entra en el arbol de accesibilidad", () => {
    const { container } = render(
      <ControlBar>
        <button type="button">Siguiente</button>
      </ControlBar>,
    );

    const glass = container.querySelector('[aria-hidden="true"]');

    expect(glass).toBeInTheDocument();
    expect(glass).not.toContainElement(screen.getByRole("button", { name: "Siguiente" }));
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
