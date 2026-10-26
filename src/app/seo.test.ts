import { describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://pigmento.test");

const { alternatesFor, siteJsonLd, serializeJsonLd } = await import("./seo");

describe("alternatesFor", () => {
  it("el espanol va sin prefijo y el ingles con /en, con x-default al espanol", () => {
    const { languages } = alternatesFor("/nosotros", "es");
    expect(languages).toEqual({
      es: "https://pigmento.test/nosotros",
      en: "https://pigmento.test/en/nosotros",
      "x-default": "https://pigmento.test/nosotros",
    });
  });

  it("el canonical sigue al idioma de la pagina", () => {
    expect(alternatesFor("/nosotros", "en").canonical).toBe("https://pigmento.test/en/nosotros");
    expect(alternatesFor("/", "es").canonical).toBe("https://pigmento.test");
    expect(alternatesFor("/", "en").canonical).toBe("https://pigmento.test/en");
  });
});

describe("siteJsonLd", () => {
  it("usa @id estables y enlaza el WebSite con la Organization", () => {
    const graph = siteJsonLd("Pigmento Studio", "desc")["@graph"];
    expect(graph[0]["@id"]).toBe("https://pigmento.test/#organization");
    expect(graph[1]).toMatchObject({ "@id": "https://pigmento.test/#website", publisher: { "@id": graph[0]["@id"] } });
  });
});

describe("serializeJsonLd", () => {
  it("escapa < para que un </script> no cierre la etiqueta", () => {
    expect(serializeJsonLd({ a: "</script>" })).not.toContain("<");
  });
});
