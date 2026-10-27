import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HALFTONE_SHAPES } from "../../../motion/halftone/shapes";
import { Halftone } from "./Halftone";

describe("Halftone", () => {
  it("es decoracion: el canvas va oculto al lector", () => {
    const { container } = render(<Halftone shape="sphere" />);

    expect(container.querySelector("canvas")).toHaveAttribute("aria-hidden", "true");
  });

  // El volumen lo hace la luz: si la cara iluminada y la de sombra dieran el mismo
  // punto, el solido se imprimiria plano.
  it("la esfera imprime luz y sombra distintas, y en tinta clara se invierten", () => {
    const lightSide = HALFTONE_SHAPES.sphere(-30, -30, false);
    const shadowSide = HALFTONE_SHAPES.sphere(30, 30, false);

    expect(lightSide).toBeLessThan(shadowSide);
    expect(HALFTONE_SHAPES.sphere(-30, -30, true)).toBeGreaterThan(HALFTONE_SHAPES.sphere(30, 30, true));
    expect(HALFTONE_SHAPES.sphere(200, 200, false)).toBe(0);
  });
});
