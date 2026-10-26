import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { SOCIAL_PROFILES } from "./footer";
import { SITE_URL } from "./site-url";

/** URL absoluta de una ruta sin prefijo en un idioma; el prefijo lo decide next-intl. */
export function localizedUrl(pathname: string, locale: Locale): string {
  const path = getPathname({ href: pathname, locale });
  // La home en espanol es "/": con SITE_URL delante daria una barra final doble de sentido.
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

/** hreflang de una ruta: un idioma por entrada mas x-default, que es el idioma por defecto. */
export function languagesFor(pathname: string): Record<string, string> {
  return {
    ...Object.fromEntries(routing.locales.map((locale) => [locale, localizedUrl(pathname, locale)])),
    "x-default": localizedUrl(pathname, routing.defaultLocale),
  };
}

/**
 * `alternates` de generateMetadata. El canonical es el de ESTE idioma: apuntar el
 * ingles al espanol le diria al buscador que la version inglesa es un duplicado.
 */
export function alternatesFor(pathname: string, locale: Locale) {
  return { canonical: localizedUrl(pathname, locale), languages: languagesFor(pathname) };
}

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Organization + WebSite con @id estable, para que otras paginas puedan referirse a
 * ellos. Sin `logo`: el estudio no tiene un archivo de logo publicado y no se inventa
 * una URL; se anade cuando exista.
 */
export function siteJsonLd(name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name,
        url: SITE_URL,
        description,
        sameAs: [...SOCIAL_PROFILES],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name,
        publisher: { "@id": ORGANIZATION_ID },
      },
    ],
  };
}

/** Serializado con `<` escapado: un `</script>` dentro de un valor cerraria la etiqueta (misma guia que faqJsonLd). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
