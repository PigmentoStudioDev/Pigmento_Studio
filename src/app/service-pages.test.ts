import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";
import { getServiceForm, SERVICE_KEYS, type ServicePageContent } from "./service-pages";

/**
 * El copy de servicio vive en arrays que la pagina lee con `t.raw`, asi que una clave o
 * una entrada que falte en un idioma no falla al compilar: sale una seccion vacia o un
 * servicio de menos. Lo que se exige es que es y en tengan la MISMA forma.
 */
const pages = (dict: typeof es) => dict.servicePages as unknown as Record<string, ServicePageContent>;

/** La forma de un valor: claves y largo de cada array, sin el texto. */
function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)]));
  }
  return typeof value;
}

describe("paginas de servicio", () => {
  it.each(SERVICE_KEYS)("%s tiene la misma forma en es y en", (key) => {
    expect(shape(pages(en)[key])).toEqual(shape(pages(es)[key]));
  });

  it.each(SERVICE_KEYS)("%s trae hero, proceso, preguntas y llamada, y el resalte cabe en su titular", (key) => {
    for (const page of [pages(es)[key]!, pages(en)[key]!]) {
      expect(page.hero.title).toBeTruthy();
      expect(page.process.phases.length).toBeGreaterThan(0);
      expect(page.faq.items.length).toBeGreaterThan(0);
      if (page.cta.titleHighlight) expect(page.cta.title).toContain(page.cta.titleHighlight);
    }
  });

  it("los temas del formulario tienen el mismo identificador en los dos idiomas", () => {
    const ids = (dict: typeof es) => getServiceForm(pages(dict).marketing!, "marketing")?.topics.map((topic) => topic.value);

    expect(ids(en)).toEqual(ids(es));
    expect(ids(es)?.[0]).toBe("marketing-1");
  });
});
