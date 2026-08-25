import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { NavLinkList, type NavLinkItem } from "./NavLinkList";

const ITEMS: NavLinkItem[] = [
  { label: "Trabajo", href: "/trabajo" },
  { label: "Estudio", href: "/estudio", tag: "Beta" },
  { label: "Laboratorio", tag: "Pronto" },
];

describe("NavLinkList", () => {
  /**
   * El markup de origen colgaba <div> directamente de <ul>, que no es HTML valido.
   * Este assert es el que lo impide volver: el arbol de accesibilidad cuenta los
   * <li> de la lista, y con <div> por medio anuncia una lista vacia.
   */
  it("cada entrada es un item de lista de verdad", () => {
    render(<NavLinkList items={ITEMS} label="Secciones" />);

    expect(within(screen.getByRole("list", { name: "Secciones" })).getAllByRole("listitem")).toHaveLength(3);
  });

  it("las entradas con destino son enlaces navegables", () => {
    render(<NavLinkList items={ITEMS} />);

    expect(screen.getByRole("link", { name: /Trabajo/ })).toHaveAttribute("href", "/trabajo");
  });

  /**
   * Una entrada sin destino NO es un enlace. Un <a> sin href no entra en el orden
   * de tabulacion ni se anuncia como enlace: aparentaria funcionar solo con raton.
   */
  it("las entradas sin destino no se anuncian como enlace", () => {
    render(<NavLinkList items={ITEMS} />);

    expect(screen.queryByRole("link", { name: /Laboratorio/ })).not.toBeInTheDocument();
    expect(screen.getByText("Laboratorio").closest("[aria-disabled]")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("el distintivo viaja junto a su entrada", () => {
    render(<NavLinkList items={ITEMS} />);

    expect(screen.getByRole("link", { name: /Estudio/ })).toHaveTextContent("Beta");
  });

  it("avisa al navegar, para que la cabecera pueda cerrarse", async () => {
    const onNavigate = vi.fn();
    render(<NavLinkList items={ITEMS} onNavigate={onNavigate} />);

    await userEvent.click(screen.getByRole("link", { name: /Trabajo/ }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("no avisa al pulsar una entrada sin destino", async () => {
    const onNavigate = vi.fn();
    render(<NavLinkList items={ITEMS} onNavigate={onNavigate} />);

    await userEvent.click(screen.getByText("Laboratorio"));

    expect(onNavigate).not.toHaveBeenCalled();
  });

  it.each(["large", "small"] as const)("no tiene violaciones de accesibilidad en %s", async (size) => {
    const { container } = render(<NavLinkList items={ITEMS} size={size} label="Secciones" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
