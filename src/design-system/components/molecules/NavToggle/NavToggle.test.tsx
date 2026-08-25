import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { NavToggle } from "./NavToggle";

const setup = (open = false) => {
  const onToggle = vi.fn();
  render(<NavToggle open={open} controls="nav-panel" label="Menu" onToggle={onToggle} />);
  return { onToggle, button: screen.getByRole("button", { name: "Menu" }) };
};

describe("NavToggle", () => {
  it("es un boton con el nombre accesible que recibe", () => {
    const { button } = setup();

    expect(button).toHaveAttribute("type", "button");
  });

  /**
   * El contrato entero de este componente: aria-expanded dice el estado real y
   * aria-controls apunta al panel que gobierna. Sin lo primero, quien navega con
   * lector de pantalla no sabe si el menu esta abierto; sin lo segundo, no puede
   * saltar de un sitio al otro.
   */
  it.each([
    { open: false, expected: "false" },
    { open: true, expected: "true" },
  ])("con open=$open expone aria-expanded=$expected", ({ open, expected }) => {
    const { button } = setup(open);

    expect(button).toHaveAttribute("aria-expanded", expected);
    expect(button).toHaveAttribute("aria-controls", "nav-panel");
  });

  it("avisa al pulsarlo", async () => {
    const { onToggle, button } = setup();

    await userEvent.click(button);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  /**
   * Se llega y se acciona con teclado. Es un <button> de verdad justo por esto:
   * un div con onClick pasa el test de raton y deja fuera a quien no usa raton.
   */
  it("se acciona con teclado", async () => {
    const { onToggle } = setup();

    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("las barras no las anuncia el lector: son la ilustracion del estado", () => {
    const { button } = setup();

    expect(button.querySelector("[aria-hidden='true']")).toBeInTheDocument();
    expect(button).toHaveAccessibleName("Menu");
  });

  /**
   * El panel de mentira no es decorado del test: aria-controls que apunta a un id
   * que no existe es una violacion en cuanto aria-expanded pasa a "true", y axe lo
   * dice. Comprobar la accesibilidad de este boton sin el elemento que gobierna es
   * comprobar una situacion que en la cabecera no se da nunca.
   */
  it.each([{ open: false }, { open: true }])(
    "con open=$open no tiene violaciones de accesibilidad",
    async ({ open }) => {
      const { container } = render(
        <>
          <NavToggle open={open} controls="nav-panel" label="Menu" onToggle={vi.fn()} />
          <div id="nav-panel" />
        </>,
      );

      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
