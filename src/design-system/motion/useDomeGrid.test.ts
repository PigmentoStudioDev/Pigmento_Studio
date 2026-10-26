import { describe, expect, it } from "vitest";
import {
  cardMatrix,
  cellCount,
  columnsFor,
  damp,
  driftOffset,
  insetToward,
  isHorizontalWheel,
  isVisible,
  shadeMask,
  travelled,
  warpPoint,
  wheelPixels,
  wrap,
} from "./domeGeometry";

const NO_LENS = { x: 0, y: 0, push: 0, reach: 1 };

describe("tesela", () => {
  it("vuelve al intervalo por los dos lados", () => {
    expect(wrap(0, 10, 25)).toBe(5);
    expect(wrap(0, 10, -3)).toBe(7);
  });

  it("el acercamiento no depende de cuantos fotogramas quepan en el mismo tiempo", () => {
    expect(damp(0, 10, 0.1, 0)).toBe(0);
    expect(damp(0, 10, 0.1, 1 / 60)).toBeCloseTo(1);
  });
});

describe("cuadricula", () => {
  it("cuatro columnas en escritorio y dos bajo el umbral movil", () => {
    expect(columnsFor(766)).toBe(2);
    expect(columnsFor(767)).toBe(4);
  });

  it("las celdas cierran la tesela: multiplo de columnas y nunca menos que las piezas", () => {
    expect(cellCount(4, 800, 300, 3)).toBe(30);
    expect(cellCount(2, 100, 200, 50)).toBe(52);
  });
});

describe("domo y lupa", () => {
  it("el abombado empuja los puntos hacia el borde", () => {
    const p = warpPoint({ x: 100, y: 0 }, { x: 100, y: 100 }, 0.15, NO_LENS);

    expect(p.x).toBeCloseTo(115);
    expect(p.y).toBe(0);
  });

  it("el centro no se mueve con ningun abombado", () => {
    expect(warpPoint({ x: 0, y: 0 }, { x: 100, y: 100 }, 0.15, NO_LENS)).toEqual({ x: 0, y: 0 });
  });

  it("la lupa sin empuje no cambia el punto", () => {
    expect(warpPoint({ x: 30, y: 40 }, { x: 100, y: 100 }, 0, NO_LENS)).toEqual({ x: 30, y: 40 });
  });

  it("insetToward mete la esquina a lo largo de sus dos aristas", () => {
    const p = insetToward({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }, 1);

    expect(p.x).toBeCloseTo(1);
    expect(p.y).toBeCloseTo(1);
  });
});

describe("matrix3d de la tarjeta", () => {
  it("un cuadrado sin deformar sale como identidad", () => {
    const card = 100;
    const matrix = cardMatrix(
      [
        { x: 0, y: 0 },
        { x: card, y: 0 },
        { x: 0, y: card },
        { x: card, y: card },
      ],
      { x: 0, y: 0 },
      card,
    );

    expect(matrix).toBe("matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)");
  });
});

describe("visibilidad y linterna", () => {
  it("una tarjeta fuera del marco de la pantalla no se reescribe", () => {
    const mid = { x: 100, y: 100 };
    const far = [{ x: 900, y: 0 }, { x: 950, y: 0 }, { x: 900, y: 50 }, { x: 950, y: 50 }];
    const inside = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 0, y: 50 }, { x: 50, y: 50 }];

    expect(isVisible(far, mid, 10)).toBe(false);
    expect(isVisible(inside, mid, 10)).toBe(true);
  });

  it("la mascara es transparente en el hueco y opaca al borde del alcance", () => {
    const mask = shadeMask(10, 20);

    expect(mask).toContain("transparent 10.0px");
    expect(mask).toContain("rgba(0,0,0,1.0000) 20.0px");
  });
});

describe("entrada", () => {
  it("la rueda pan solo cuando domina lo horizontal", () => {
    expect(isHorizontalWheel(10, 2)).toBe(true);
    expect(isHorizontalWheel(2, 10)).toBe(false);
    expect(isHorizontalWheel(0, 0)).toBe(false);
  });

  it("la rueda en lineas y paginas se lleva a pixeles", () => {
    expect(wheelPixels(3, 1, 800)).toBe(48);
    expect(wheelPixels(1, 2, 800)).toBe(800);
  });

  it("un recorrido igual al umbral sigue siendo un clic", () => {
    expect(travelled(10, 0, 10)).toBe(false);
    expect(travelled(11, 0, 10)).toBe(true);
  });

  it("la imagen se desplaza hacia el cursor y se acota al alcance", () => {
    expect(driftOffset({ x: 1000, y: 0 }, { x: 0, y: 0 }, 100, 12)).toEqual({ x: 12, y: 0 });
    expect(driftOffset({ x: 0, y: 0 }, { x: 0, y: 0 }, 100, 12)).toEqual({ x: 0, y: 0 });
  });
});
