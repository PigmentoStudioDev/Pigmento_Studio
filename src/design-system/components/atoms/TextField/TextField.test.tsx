import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { TextField } from "./TextField";

describe("TextField", () => {
  /** El error y la ayuda se anuncian con el campo, no solo se pintan debajo. */
  it("enlaza ayuda y error al campo y lo marca invalido", () => {
    render(<TextField label="Correo" name="email" value="" onChange={vi.fn()} description="Ayuda" error="Escribe tu correo" />);
    const field = screen.getByLabelText("Correo");

    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("Ayuda Escribe tu correo");
  });

  it("varias lineas es un textarea con la misma etiqueta", () => {
    render(<TextField multiline label="Mensaje" name="message" value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Mensaje").tagName).toBe("TEXTAREA");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<TextField label="Nombre" name="name" value="" onChange={vi.fn()} error="Falta" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
