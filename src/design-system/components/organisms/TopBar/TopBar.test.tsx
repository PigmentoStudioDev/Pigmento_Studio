import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { TopBar } from "./TopBar";

const PROPS = {
  messages: ["Nueva promo de branding", "Agenda abierta"],
};

describe("TopBar", () => {
  it("es un aviso sin enlace que nombra los mensajes una sola vez", () => {
    render(<TopBar {...PROPS} />);

    expect(screen.getByRole("note", { name: "Nueva promo de branding. Agenda abierta" })).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("el texto en movimiento no se anuncia", () => {
    const { container } = render(<TopBar {...PROPS} />);

    const rows = container.querySelector("[data-topbar-row]")?.parentElement;
    expect(rows).toHaveAttribute("aria-hidden", "true");
  });

  it("una fila por mensaje, hasta dos", () => {
    const { container, rerender } = render(<TopBar {...PROPS} />);
    expect(container.querySelectorAll("[data-topbar-row]")).toHaveLength(2);

    rerender(<TopBar {...PROPS} messages={["uno", "dos", "tres"]} />);
    expect(container.querySelectorAll("[data-topbar-row]")).toHaveLength(2);

    rerender(<TopBar {...PROPS} messages={["uno"]} />);
    expect(container.querySelectorAll("[data-topbar-row]")).toHaveLength(1);
  });

  it("sin mensajes no se monta, y sin barra no hay hueco que reservar", () => {
    const { container } = render(<TopBar {...PROPS} messages={[]} />);

    expect(container.querySelector("[data-topbar]")).not.toBeInTheDocument();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<TopBar {...PROPS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
