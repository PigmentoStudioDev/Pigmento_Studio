import { describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://pigmento.test");

const { sitemapEntries } = await import("./sitemap-entries");

describe("sitemapEntries", () => {
  const entries = sitemapEntries([{ slug: "privacidad", updatedAt: "2026-10-01T00:00:00.000Z" }]);

  it("lista home y legales en los dos idiomas, y nada mas", () => {
    expect(entries.map((e) => e.url)).toEqual([
      "https://pigmento.test",
      "https://pigmento.test/en",
      "https://pigmento.test/legales/privacidad",
      "https://pigmento.test/en/legales/privacidad",
    ]);
  });

  it("cada entrada lleva las alternativas del grupo y el legal su fecha", () => {
    expect(entries[2].alternates?.languages).toMatchObject({
      es: "https://pigmento.test/legales/privacidad",
      en: "https://pigmento.test/en/legales/privacidad",
    });
    expect(entries[2].lastModified).toEqual(new Date("2026-10-01T00:00:00.000Z"));
  });
});
