import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { InfiniteGrid } from "./InfiniteGrid";

const PIECES = [
  { src: "/piezas/uno.avif" },
  { src: "/piezas/dos.avif" },
  { src: "/piezas/tres.avif" },
  { src: "/piezas/cuatro.avif" },
];

// En jsdom las cajas miden cero: se comprueba el primer render, el que viaja del servidor.
describe("InfiniteGrid", () => {
  it("pinta una celda por pieza antes de medir", () => {
    const { container } = render(<InfiniteGrid items={PIECES} />);

    expect(container.querySelectorAll("img")).toHaveLength(PIECES.length);
  });

  it("ninguna pieza aporta nombre accesible", () => {
    render(<InfiniteGrid items={PIECES} />);

    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("sin piezas no pinta nada", () => {
    const { container } = render(<InfiniteGrid items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("arranca en loading para que la hoja lo oculte hasta colocarlo", () => {
    const { container } = render(<InfiniteGrid items={PIECES} />);

    expect(container.firstElementChild).toHaveAttribute(
      "data-infinite-grid-status",
      "loading",
    );
  });

  it("el hueco solo cuando se pide", () => {
    const sin = render(<InfiniteGrid items={PIECES} />);
    const con = render(<InfiniteGrid items={PIECES} clearing="center" />);

    expect(sin.container.firstElementChild?.className).not.toMatch(/clearingCenter/);
    expect(con.container.firstElementChild?.className).toMatch(/clearingCenter/);
  });

  it("no tiene violaciones de accesibilidad", async () => {
    const { container } = render(<InfiniteGrid items={PIECES} clearing="center" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
