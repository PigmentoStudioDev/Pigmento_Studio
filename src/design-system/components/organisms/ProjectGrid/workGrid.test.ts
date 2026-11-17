import { describe, expect, it } from "vitest";
import { buildWorkGridRows } from "./workGrid";

const make = (count: number) => Array.from({ length: count }, (_, i) => i);

describe("buildWorkGridRows", () => {
  it("abre con una pieza sola y alterna tres iguales con pareja", () => {
    const rows = buildWorkGridRows(make(1 + 3 + 2 + 3 + 2));

    expect(rows.map((row) => [row.kind, row.items.length])).toEqual([
      ["hero", 1],
      ["even", 3],
      ["pair", 2],
      ["even", 3],
      ["pair", 2],
    ]);
  });

  it("la pareja grande va a la izquierda salvo la segunda y la ultima", () => {
    const rows = buildWorkGridRows(make(1 + 3 + 2 + 3 + 2 + 3 + 2 + 3 + 2));
    const sides = rows.filter((row) => row.kind === "pair").map((row) => row.wide);

    expect(sides).toEqual(["start", "end", "start", "end"]);
  });

  it("un resto de una sola pieza no se queda como pareja de dos columnas", () => {
    const rows = buildWorkGridRows(make(1 + 3 + 1));

    expect(rows.at(-1)).toMatchObject({ kind: "even", items: [4] });
  });

  it("sin proyectos no hay filas", () => {
    expect(buildWorkGridRows([])).toEqual([]);
  });
});
