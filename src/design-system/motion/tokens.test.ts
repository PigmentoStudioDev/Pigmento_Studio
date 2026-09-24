import { afterEach, describe, expect, it } from "vitest";
import { bezierPoints, duration, stagger, toSeconds } from "./tokens";

describe("toSeconds", () => {
  it("lee las dos unidades que puede resolver el navegador", () => {
    expect(toSeconds("0.6s")).toBe(0.6);
    expect(toSeconds("150ms")).toBe(0.15);
  });

  it("sin valor, cero: el gesto pasa sin transicion en vez de romperse", () => {
    expect(toSeconds("")).toBe(0);
  });
});

describe("bezierPoints", () => {
  it("saca los cuatro puntos de la curva de marca en el formato de CustomEase", () => {
    expect(bezierPoints("cubic-bezier(0.625, 0.05, 0, 1)")).toBe("0.625,0.05,0,1");
  });

  it("lo que no es una curva cubica no se registra", () => {
    expect(bezierPoints("")).toBeNull();
    expect(bezierPoints("ease-out")).toBeNull();
  });
});

describe("duration y stagger", () => {
  const root = document.documentElement;

  afterEach(() => {
    root.style.removeProperty("--pg-duration-half");
    root.style.removeProperty("--pg-stagger-slice");
  });

  it("leen el token que publica la hoja, no una copia en TypeScript", () => {
    root.style.setProperty("--pg-duration-half", "0.3s");
    root.style.setProperty("--pg-stagger-slice", "0.048s");

    expect(duration("half")).toBe(0.3);
    expect(stagger("slice")).toBe(0.048);
  });

  it("un desfase es un MULTIPLO del paso, como en la hoja", () => {
    root.style.setProperty("--pg-duration-half", "0.3s");

    expect(duration("half", 3)).toBeCloseTo(0.9);
  });
});
