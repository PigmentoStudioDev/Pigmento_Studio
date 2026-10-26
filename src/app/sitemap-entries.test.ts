import { describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://pigmento.test");

const { sitemapEntries } = await import("./sitemap-entries");

describe("sitemapEntries", () => {
  const entries = sitemapEntries(
    [{ slug: "privacidad", updatedAt: "2026-10-01T00:00:00.000Z" }],
    [{ slug: "calderoni", updatedAt: "2026-10-10T00:00:00.000Z" }],
  );

  it("lista home, legales y proyectos en los dos idiomas, y nada mas", () => {
    expect(entries.map((e) => e.url)).toEqual([
      "https://pigmento.test",
      "https://pigmento.test/en",
      "https://pigmento.test/legales/privacidad",
      "https://pigmento.test/en/legales/privacidad",
      "https://pigmento.test/trabajo/calderoni",
      "https://pigmento.test/en/trabajo/calderoni",
    ]);
  });

  it("cada entrada lleva las alternativas del grupo y el legal su fecha", () => {
    expect(entries[2].alternates?.languages).toMatchObject({
      es: "https://pigmento.test/legales/privacidad",
      en: "https://pigmento.test/en/legales/privacidad",
    });
    expect(entries[2].lastModified).toEqual(new Date("2026-10-01T00:00:00.000Z"));
  });

  it("el proyecto lleva su fecha de cambio y las alternativas de su propio grupo", () => {
    expect(entries[4].lastModified).toEqual(new Date("2026-10-10T00:00:00.000Z"));
    expect(entries[5].alternates?.languages).toMatchObject({
      es: "https://pigmento.test/trabajo/calderoni",
      en: "https://pigmento.test/en/trabajo/calderoni",
    });
  });

  it("sin proyectos el sitemap queda como antes", () => {
    expect(sitemapEntries([]).map((e) => e.url)).toEqual(["https://pigmento.test", "https://pigmento.test/en"]);
  });
});
