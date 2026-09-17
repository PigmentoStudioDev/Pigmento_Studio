import { describe, expect, it } from "vitest";
import { revealProgress, rowDistance } from "./useWorkRows";

describe("rowDistance", () => {
  it("es lo que sobra de la fila fuera de la ventana", () => {
    expect(rowDistance(3000, 1440)).toBe(1560);
  });

  it("una fila que cabe entera no se mueve", () => {
    expect(rowDistance(900, 1440)).toBe(0);
  });
});

describe("revealProgress", () => {
  it("lleva la pieza al centro de la ventana", () => {
    // Centro de la pieza en 1720, ventana de 1440: hay que mover 1000 de 2000.
    const progress = revealProgress(1720, 1440, 2000);

    expect(1720 - progress * 2000).toBe(720);
  });

  it("las piezas del principio y del final se quedan en los extremos del recorrido", () => {
    expect(revealProgress(100, 1440, 2000)).toBe(0);
    expect(revealProgress(9000, 1440, 2000)).toBe(1);
  });

  it("en una fila que no se mueve no hay nada que recorrer", () => {
    expect(revealProgress(1200, 1440, 0)).toBe(0);
  });
});
