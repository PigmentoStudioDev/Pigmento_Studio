import { describe, expect, it } from "vitest";
import { groupByRow } from "./useScrollReveal";

function box(top: number, height = 100): HTMLElement {
  const el = document.createElement("div");
  el.getBoundingClientRect = () => ({ top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) });
  return el;
}

/**
 * El bug: una lista vertical en modo caja entraba entera cuando asomaba la primera
 * pieza, y las de abajo terminaban su entrada fuera de la ventana.
 */
describe("groupByRow", () => {
  it("una lista vertical es una fila por pieza", () => {
    const list = [box(0), box(120), box(240)];
    expect(groupByRow(list)).toEqual([[list[0]], [list[1]], [list[2]]]);
  });

  it("una fila de rejilla con bordes desalineados sigue siendo una fila", () => {
    const grid = [box(0), box(4), box(10), box(200)];
    expect(groupByRow(grid)).toEqual([[grid[0], grid[1], grid[2]], [grid[3]]]);
  });
});
