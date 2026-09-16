import { describe, expect, it } from "vitest";
import { bandRestX } from "./useHeroBand";

const GAP = 12;

describe("bandRestX", () => {
  it("deja una foto al ras del borde derecho y el carril cubriendo el izquierdo", () => {
    for (const viewport of [390, 768, 1280, 1440, 1920, 2560]) {
      for (const cardWidth of [180, 262, 340]) {
        for (const count of [3, 9, 14]) {
          const itemStep = cardWidth + GAP;
          const setShift = itemStep * count;
          const restX = bandRestX({ viewport, cardWidth, itemStep, setShift });

          // Alguna carta k termina exactamente en el borde derecho.
          const k = (viewport - cardWidth - restX) / itemStep;
          expect(Math.abs(k - Math.round(k))).toBeLessThan(1e-9);

          // Hay al menos un set entero a la izquierda del borde.
          expect(restX).toBeLessThanOrEqual(-setShift);
        }
      }
    }
  });
});
