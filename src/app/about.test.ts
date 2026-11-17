import { describe, expect, it } from "vitest";
import { getServicesList } from "./about";

const t = (key: string) => key;

describe("getServicesList", () => {
  it("devuelve los cuatro servicios en el orden del sitio, cada uno con su texto", () => {
    const items = getServicesList(t);

    expect(items.map((item) => item.name)).toEqual([
      "items.branding.name",
      "items.web.name",
      "items.motion.name",
      "items.marketing.name",
    ]);
    expect(items[0].text).toBe("items.branding.text");
  });
});
