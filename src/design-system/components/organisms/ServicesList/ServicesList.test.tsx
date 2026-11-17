import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ServicesList } from "./ServicesList";

const ITEMS = [
  { name: "Branding", text: "Una identidad que se sostiene." },
  { name: "Motion", text: "La marca en movimiento." },
];

describe("ServicesList", () => {
  it("arranca con todas las filas cerradas", () => {
    render(<ServicesList items={ITEMS} />);

    for (const trigger of screen.getAllByRole("button")) expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("abre una fila a la vez: abrir la segunda cierra la primera", () => {
    render(<ServicesList items={ITEMS} />);
    const [first, second] = screen.getAllByRole("button");

    fireEvent.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(second);
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");
  });

  it("un segundo clic sobre la fila abierta la cierra", () => {
    render(<ServicesList items={ITEMS} />);
    const [first] = screen.getAllByRole("button");

    fireEvent.click(first);
    fireEvent.click(first);

    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<ServicesList items={ITEMS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
