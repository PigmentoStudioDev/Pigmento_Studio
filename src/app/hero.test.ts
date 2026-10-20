import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";
import { getHero } from "./hero";

const DICCIONARIOS = { es, en } as const;

describe("hero", () => {
  /**
   * El resaltado busca `titleHighlight` dentro de `title`: si la traduccion cambia una
   * palabra de uno y no del otro, el scroll deja de resaltar sin ningun error.
   */
  it.each(Object.keys(DICCIONARIOS) as (keyof typeof DICCIONARIOS)[])(
    "el trozo resaltado esta dentro del titular en %s",
    (idioma) => {
      const hero: Record<string, string> = DICCIONARIOS[idioma].home.hero;
      const props = getHero((key) => hero[key] ?? "", "#cta");

      expect(props.title).toContain(props.titleHighlight);
      expect(props.ctaHref).toBe("#cta");
    },
  );
});
