import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";
import { PENDING_KEYS } from "./pending";

/**
 * El inventario y el texto se escriben en tres sitios —la lista, el diccionario en
 * espanol y el de ingles— y una ruta a la que le falte su entrada no falla al
 * compilar: `next-intl` devuelve la clave cruda, asi que la pagina publicada ensena
 * "pending.work.title" a quien entra. Es el fallo que no se ve hasta que lo ve alguien
 * de fuera.
 */
const DICCIONARIOS = { es, en } as const;

describe("paginas pendientes", () => {
  it.each(Object.keys(DICCIONARIOS) as (keyof typeof DICCIONARIOS)[])(
    "cada ruta pendiente tiene titulo y entradilla en %s",
    (idioma) => {
      // `as unknown as` y no un cast directo: los dos diccionarios tienen la misma
      // FORMA pero TypeScript los infiere como dos tipos literales distintos, y la
      // union no solapa con el Record. El cast es justo lo que el test comprueba.
      const pending = DICCIONARIOS[idioma].pending as unknown as Record<
        string,
        { title: string; intro: string }
      >;

      for (const key of PENDING_KEYS) {
        expect(pending[key]?.title, `pending.${key}.title en ${idioma}`).toBeTruthy();
        expect(pending[key]?.intro, `pending.${key}.intro en ${idioma}`).toBeTruthy();
      }
    },
  );

  /**
   * La salida de cada pagina. `/contacto` usa la de Instagram y el resto la de volver
   * al inicio: sin las dos, una de las siete se queda con un boton sin etiqueta.
   */
  it.each(Object.keys(DICCIONARIOS) as (keyof typeof DICCIONARIOS)[])(
    "las dos salidas tienen etiqueta en %s",
    (idioma) => {
      const pending = DICCIONARIOS[idioma].pending as unknown as Record<string, unknown>;

      expect(pending.action).toBeTruthy();
      expect(pending.instagram).toBeTruthy();
    },
  );

  /**
   * El diccionario no puede traer texto de una ruta que ya no es un marcador: si se
   * escribe la pagina y nadie borra su entrada, el inventario miente y el proximo que
   * lo lea creera que sigue pendiente.
   */
  it("el diccionario no trae claves que no esten en el inventario", () => {
    const sobrantes = Object.keys(es.pending).filter(
      (k) => k !== "action" && k !== "instagram" && !PENDING_KEYS.includes(k as never),
    );

    expect(sobrantes).toEqual([]);
  });
});
