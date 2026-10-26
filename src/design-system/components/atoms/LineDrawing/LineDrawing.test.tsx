import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LineDrawing } from "./LineDrawing";
import { LINE_DRAWINGS } from "./drawings";

describe("LineDrawing", () => {
  it("es decoracion: oculto al lector y fuera del orden de foco", () => {
    const { container } = render(<LineDrawing name="work" />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
  });

  // El dasharray de la hoja es 1: un trazo sin pathLength={1} se queda a medio dibujar.
  it("cada trazo lleva longitud normalizada y su orden de dibujo", () => {
    const { container } = render(<LineDrawing name="studio" />);
    const paths = [...container.querySelectorAll("path")];

    expect(paths).toHaveLength(LINE_DRAWINGS.studio.length);
    paths.forEach((path, i) => {
      expect(path).toHaveAttribute("pathLength", "1");
      expect(path.style.getPropertyValue("--i")).toBe(String(i));
    });
  });
});
