import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { PeopleStack } from "./PeopleStack";

const FACES = [
  { src: "/a.jpg", width: 400, height: 400 },
  { src: "/b.jpg", width: 400, height: 400 },
];

describe("PeopleStack", () => {
  // Unas caras sin nombre se oirian como imagenes mudas: lo dicen el titular y el boton.
  it("es decoracion entera, fuera del arbol de accesibilidad", () => {
    const { container } = render(<PeopleStack faces={FACES} count="+3" />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("img")).toHaveLength(2);
  });

  it("sin caras no se monta", () => {
    const { container } = render(<PeopleStack faces={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<PeopleStack faces={FACES} count="+3" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
