import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { CustomCursor } from "./CustomCursor";

describe("CustomCursor", () => {
  it("es decoracion: fuera del arbol de accesibilidad", () => {
    const { container } = render(<CustomCursor />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("trae una capa por variante: la flecha, la pastilla y el disco de arrastre", () => {
    const { container } = render(<CustomCursor />);

    expect(container.querySelector("[data-cursor-pointer]")).not.toBeNull();
    expect(container.querySelector("[data-cursor-follower]")).toHaveAttribute("data-cursor-state", "");
    // Una por capa con texto: el hook las escribe todas de una y no sabe cual se ve.
    expect(container.querySelectorAll("[data-cursor-text-target]")).toHaveLength(2);
  });

  /**
   * Sin puntero fino —como en el entorno de test— no se instala nada: el documento no
   * se marca y el cursor del sistema sigue a la vista.
   */
  it("sin puntero fino no esconde el cursor del sistema", () => {
    render(<CustomCursor />);

    expect(document.documentElement).not.toHaveAttribute("data-custom-cursor");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<CustomCursor />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
