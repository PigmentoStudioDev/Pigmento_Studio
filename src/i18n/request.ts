import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Que diccionario se carga en cada peticion.
 *
 * `hasLocale` y no una comparacion propia: el segmento de la URL es entrada de
 * fuera, y sin validarlo un `/xx/` cualquiera intentaria importar `messages/xx.json`
 * — una lectura de archivo con un nombre que elige quien visita.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    // Los diccionarios viven DENTRO del modulo de i18n, no en una carpeta suelta
    // en la raiz: son suyos, y el contrato de modularidad pide que un import que
    // sale del modulo se vea como tal. Aqui no sale.
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
