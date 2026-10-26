import type { MetadataRoute } from "next";
import type { LegalSitemapEntry } from "@/cms/legal";
import { routing } from "@/i18n/routing";
import { languagesFor, localizedUrl } from "./seo";

/**
 * Solo lo indexable: la home y los legales. Nosotros, trabajo, contacto y servicios
 * llevan `noindex` mientras su copy sea borrador, y listar en el sitemap una URL
 * `noindex` es una contradiccion que Search Console marca como error.
 *
 * Una entrada por idioma, cada una con las alternativas del grupo completo.
 */
export function sitemapEntries(legals: LegalSitemapEntry[]): MetadataRoute.Sitemap {
  const pages: { pathname: string; lastModified?: Date }[] = [
    { pathname: "/" },
    ...legals.map((legal) => ({ pathname: `/legales/${legal.slug}`, lastModified: new Date(legal.updatedAt) })),
  ];

  return pages.flatMap(({ pathname, lastModified }) =>
    routing.locales.map((locale) => ({
      url: localizedUrl(pathname, locale),
      ...(lastModified ? { lastModified } : {}),
      alternates: { languages: languagesFor(pathname) },
    })),
  );
}
