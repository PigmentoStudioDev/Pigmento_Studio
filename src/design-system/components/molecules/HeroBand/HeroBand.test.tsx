import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { HeroBand } from "./HeroBand";

const ITEMS = [{ src: "/p/uno.png" }, { src: "/p/dos.png" }, { src: "/p/tres.png" }];

// En jsdom no hay medidas: se comprueba el primer render, el que viaja del servidor.
describe("HeroBand", () => {
  it("pinta dos sets de entrada para poder medir el paso del bucle", () => {
    const { container } = render(<HeroBand items={ITEMS} />);

    expect(container.querySelectorAll("img")).toHaveLength(ITEMS.length * 2);
  });

  it("ninguna foto aporta nombre accesible", () => {
    render(<HeroBand items={ITEMS} />);

    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("sin piezas no pinta nada", () => {
    const { container } = render(<HeroBand items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("arranca sin estado de entrada para que la hoja la mantenga oculta", () => {
    const { container } = render(<HeroBand items={ITEMS} />);

    expect(container.firstElementChild).not.toHaveAttribute("data-hero-band");
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<HeroBand items={ITEMS} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
