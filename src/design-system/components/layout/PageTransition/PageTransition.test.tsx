import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { PageTransition } from "./PageTransition";

// La cortina solo usa el router para navegar al clic; el render no lo toca.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: () => {} }),
}));

describe("PageTransition", () => {
  it("es decoracion: fuera del arbol de accesibilidad", () => {
    const { container } = render(<PageTransition />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("trae dos paneles en el orden de la coreografia", () => {
    const { container } = render(<PageTransition />);

    const panels = container.querySelectorAll("[data-transition-panel]");
    expect(Array.from(panels, (panel) => panel.getAttribute("data-transition-panel"))).toEqual(["1", "2"]);
  });

  it("no deja nada enfocable dentro: no puede atrapar el foco", () => {
    const { container } = render(<PageTransition />);

    expect(container.querySelector("a, button, input, [tabindex]")).toBeNull();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<PageTransition />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
