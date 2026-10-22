import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";
import { SERVICE_KEYS, SERVICE_PHASES, SERVICE_QUESTIONS } from "./service-pages";

/**
 * Las fases y las preguntas se listan en TS y su texto vive en dos diccionarios. Una
 * clave que falte no falla al compilar: next-intl devuelve la clave cruda y la pagina
 * publicada ensena "servicePages.web.faq.items.edit.answer".
 */
const DICCIONARIOS = { es, en } as const;

type Page = {
  title: string;
  process: { title: string; titleHighlight: string; phases: Record<string, { title: string; text: string; deliverable: string }> };
  faq: { items: Record<string, { question: string; answer: string }> };
  cta: { title: string; titleHighlight: string };
};

describe("paginas de servicio", () => {
  it.each(Object.keys(DICCIONARIOS) as (keyof typeof DICCIONARIOS)[])(
    "cada fase y cada pregunta tienen texto en %s",
    (idioma) => {
      const pages = DICCIONARIOS[idioma].servicePages as unknown as Record<string, Page>;

      for (const key of SERVICE_KEYS) {
        const page = pages[key];
        for (const phase of SERVICE_PHASES[key]) {
          expect(page?.process.phases[phase]?.deliverable, `${key}.${phase} en ${idioma}`).toBeTruthy();
        }
        for (const question of SERVICE_QUESTIONS[key]) {
          expect(page?.faq.items[question]?.answer, `${key}.${question} en ${idioma}`).toBeTruthy();
        }
        // El resaltado es un trozo del titular: si no esta dentro, no se pinta nada.
        expect(page?.cta.title).toContain(page?.cta.titleHighlight);
        expect(page?.process.title).toContain(page?.process.titleHighlight);
      }
    },
  );
});
