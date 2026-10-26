import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "./site-url";

describe("resolveSiteUrl", () => {
  it("rompe un deploy de produccion sin ningun dominio", () => {
    expect(() => resolveSiteUrl({ VERCEL_ENV: "production" })).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() => resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "  ", VERCEL_ENV: "production" })).toThrow();
  });

  it("usa el dominio de produccion de Vercel si falta la variable propia", () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "pigmento-studio.vercel.app", VERCEL_ENV: "production" })).toBe(
      "https://pigmento-studio.vercel.app",
    );
  });

  it("prefiere la variable propia sobre la de Vercel", () => {
    expect(
      resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://pigmento.studio/", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" }),
    ).toBe("https://pigmento.studio");
  });

  it("cae a localhost en un build local", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });
});
