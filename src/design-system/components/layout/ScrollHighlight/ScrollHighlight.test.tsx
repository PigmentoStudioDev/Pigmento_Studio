import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { ScrollHighlight } from "./ScrollHighlight";

describe("ScrollHighlight", () => {
  it("no altera el titular que envuelve", () => {
    render(
      <ScrollHighlight>
        <h2>
          Trabajo <mark>destacado</mark>
        </h2>
      </ScrollHighlight>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Trabajo destacado" })).toBeInTheDocument();
  });

  /**
   * El reposo es de la hoja: hasta que gsap llega nadie escribe el progreso, y la
   * marca se lee sin relleno en vez de rellena y vaciada de golpe.
   */
  it("no escribe ningun progreso al montar", () => {
    const { container } = render(
      <ScrollHighlight>
        <h2>
          Trabajo <mark>destacado</mark>
        </h2>
      </ScrollHighlight>,
    );

    expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--pg-highlight-progress")).toBe("");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(
      <ScrollHighlight>
        <h2>
          Trabajo <mark>destacado</mark>
        </h2>
      </ScrollHighlight>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
