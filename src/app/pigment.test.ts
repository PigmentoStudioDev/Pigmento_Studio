import { describe, expect, it } from "vitest";
import { CANDY_CYCLE } from "@/design-system/theme/candy";
import { SERVICE_FAMILY } from "./pigment";

describe("SERVICE_FAMILY", () => {
  // Si dos servicios comparten color, el color deja de nombrar la disciplina.
  it("cada servicio tiene su familia, sin repetir, y entre todos usan el pigmento entero", () => {
    const families = Object.values(SERVICE_FAMILY);

    expect(new Set(families).size).toBe(families.length);
    expect([...families].sort()).toEqual([...CANDY_CYCLE].sort());
  });
});
