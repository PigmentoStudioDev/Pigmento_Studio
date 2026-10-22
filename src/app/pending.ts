import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { PendingPageProps } from "@/design-system/components/organisms/PendingPage/PendingPage";
import { routing } from "@/i18n/routing";

/**
 * Las rutas que la pagina ya enlaza y todavia no estan escritas.
 *
 * Existe porque el 404 era REAL y estaba publicado: la barra, el pie y la llamada final
 * de la home apuntan a estas siete, y medido en produccion la home respondia 200 y las
 * siete 404. Siete archivos de ruta casi identicos invitan a que se separen —uno sin
 * `noindex`, otro sin la guarda de idioma— asi que lo que comparten vive aqui y cada
 * ruta se queda en su export y su clave.
 *
 * **La clave de traduccion es tambien el inventario.** Cuando una de estas paginas se
 * escriba de verdad, su archivo de ruta deja de llamar aqui y su entrada se borra de
 * `pending` en los dos diccionarios; mientras la entrada exista, la ruta es un
 * marcador, y eso se ve en el diff sin tener que abrir siete archivos.
 */
export type PendingKey = "work" | "contact";

/**
 * El inventario, para quien tenga que recorrerlo. Su test lo usa para comprobar que
 * ninguna se queda sin texto en ninguno de los dos idiomas.
 */
export const PENDING_KEYS: readonly PendingKey[] = ["work", "contact"];

/**
 * El Instagram del estudio, que es el unico canal de contacto REAL que existe hoy.
 *
 * `/contacto` es la unica de las siete que no puede mandar a quien llega de vuelta a la
 * home: ahi llega quien decidio escribir, y devolverlo al principio es perderlo. No hay
 * correo del estudio en ningun sitio del repo y no me lo invento — un correo inventado
 * en la pagina de contacto es peor que no tenerla—, asi que la salida es la cuenta que
 * si esta publicada, la misma que lleva el pie.
 */
const INSTAGRAM = "https://www.instagram.com/pigmento__studio";

/**
 * Lo que de verdad arregla el problema, y no se ve en pantalla.
 *
 * Siete paginas casi vacias INDEXADAS son peor que siete 404. Un 404 le dice al buscador
 * que no hay nada y lo saca del indice; una pagina de cortesia le dice que si hay algo, y
 * entonces lo que sale en los resultados buscando el estudio es "todavia no esta
 * escrita". `follow: true` a proposito: los enlaces de dentro —la home— si se siguen.
 */
const SIN_INDEXAR: Metadata["robots"] = { index: false, follow: true };

/** La guarda de idioma que llevan todas las rutas del sitio, en un solo sitio. */
function localeValido(locale: string) {
  if (!hasLocale(routing.locales, locale)) notFound();
  // Sin esto la ruta se vuelve dinamica: leer traducciones cuenta como leer cabeceras
  // salvo que el segmento este entre los generados de antemano.
  setRequestLocale(locale);
}

export async function pendingMetadata(
  { locale }: { locale: string },
  key: PendingKey,
): Promise<Metadata> {
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: `pending.${key}` });

  return { title: t("title"), robots: SIN_INDEXAR };
}

export async function pendingProps(
  { locale }: { locale: string },
  key: PendingKey,
): Promise<PendingPageProps> {
  localeValido(locale);

  const t = await getTranslations("pending");

  return {
    title: t(`${key}.title`),
    intro: t(`${key}.intro`),
    ...(key === "contact"
      ? { actionLabel: t("instagram"), actionHref: INSTAGRAM }
      : { actionLabel: t("action"), actionHref: "/" }),
  };
}
