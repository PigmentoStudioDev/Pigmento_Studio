import { describe, expect, it } from "vitest";
import { itemIndexAt } from "./useInfiniteGrid";

// Dentro de un mosaico; la costura entre copias es un limite conocido (ver HACK).
const NEIGHBOURS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

describe("itemIndexAt", () => {
  it("ninguna pieza toca a otra igual", () => {
    const repeated: string[] = [];

    for (let total = 4; total <= 12; total++) {
      for (let columns = 1; columns <= 9; columns++) {
        for (let row = 0; row < 6; row++) {
          for (let column = 0; column < columns; column++) {
            const index = itemIndexAt(row, column, total);

            for (const [rowStep, columnStep] of NEIGHBOURS) {
              const neighbourColumn = column + columnStep;
              if (neighbourColumn < 0 || neighbourColumn >= columns) continue;

              if (itemIndexAt(row + rowStep, neighbourColumn, total) === index) {
                repeated.push(`${total} piezas, ${columns} columnas: ${row},${column}`);
              }
            }
          }
        }
      }
    }

    expect(repeated).toEqual([]);
  });

  it("siempre devuelve un indice de la lista", () => {
    for (let total = 1; total <= 12; total++) {
      for (let row = 0; row < 8; row++) {
        for (let column = 0; column < 8; column++) {
          const index = itemIndexAt(row, column, total);

          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThan(total);
        }
      }
    }
  });

  it("sin piezas devuelve cero", () => {
    expect(itemIndexAt(3, 5, 0)).toBe(0);
  });
});
