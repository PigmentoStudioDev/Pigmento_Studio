import { describe, expect, it } from "vitest";
import {
  durationMs,
  nearestStep,
  RADIAL_COPIES,
  releaseSteps,
  releaseVelocity,
  stepBounds,
  wrapIndex,
} from "./useRadialSlider";

describe("wrapIndex", () => {
  it("un paso fuera de la vuelta cae en su tarjeta", () => {
    expect(wrapIndex(7, 5)).toBe(2);
    expect(wrapIndex(-1, 5)).toBe(4);
    expect(wrapIndex(-10, 5)).toBe(0);
  });
});

describe("stepBounds", () => {
  it("desde cualquier tarjeta se puede avanzar una vuelta entera en los dos sentidos", () => {
    const { min, max } = stepBounds(5);

    for (let index = 0; index < 5; index++) {
      expect(index - 5).toBeGreaterThanOrEqual(min);
      expect(index + 5).toBeLessThanOrEqual(max);
    }
  });

  it("no pasa de las copias que se pintan: fuera de ellas la corona se quedaria vacia", () => {
    const { min, max } = stepBounds(5);
    const half = Math.floor(RADIAL_COPIES / 2) * 5;

    expect(min).toBeGreaterThanOrEqual(-half);
    expect(max).toBeLessThan(RADIAL_COPIES * 5 - half);
  });
});

describe("nearestStep", () => {
  it("va a la tarjeta pedida por el camino corto", () => {
    expect(nearestStep(0, 4, 5)).toBe(-1);
    expect(nearestStep(0, 2, 5)).toBe(2);
  });

  it("parte del paso real aunque este fuera de la vuelta", () => {
    expect(nearestStep(6, 0, 5)).toBe(5);
  });

  it("pedir la tarjeta activa no mueve nada", () => {
    expect(nearestStep(8, 3, 5)).toBe(8);
  });
});

describe("releaseSteps", () => {
  it("sin velocidad engancha a la tarjeta mas cercana", () => {
    expect(releaseSteps(10, 0, 600, 18)).toBe(-1);
    expect(releaseSteps(8, 0, 600, 18)).toBe(0);
  });

  it("la velocidad al soltar suma pasos: un gesto corto y rapido pasa varias", () => {
    // 5deg de arrastre, pero soltado a 0.1deg/ms durante un enganche de 600ms.
    expect(releaseSteps(-5, -0.1, 600, 18)).toBe(2);
  });

  it("arrastrar a la derecha retrocede", () => {
    expect(releaseSteps(40, 0, 600, 18)).toBe(-2);
  });
});

describe("releaseVelocity", () => {
  it("soltar en pleno movimiento conserva la velocidad", () => {
    expect(releaseVelocity(0.2, 0, 600)).toBe(0.2);
  });

  it("pararse antes de soltar la apaga", () => {
    expect(releaseVelocity(0.2, 300, 600)).toBeCloseTo(0.1);
    expect(releaseVelocity(0.2, 900, 600)).toBe(0);
  });
});

describe("durationMs", () => {
  it("lee la duracion resuelta en las dos unidades", () => {
    expect(durationMs("0.6s")).toBe(600);
    expect(durationMs("300ms")).toBe(300);
  });

  it("la primera de una lista es la que manda", () => {
    expect(durationMs("0.6s, 0.3s")).toBe(600);
  });
});
