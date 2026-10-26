import type { MetadataRoute } from "next";
import type { LegalSitemapEntry } from "@/cms/legal";
import type { ProjectSitemapEntry } from "@/cms/projects";
import { routing } from "@/i18n/routing";
import { languagesFor, localizedUrl } from "./seo";

/**
 * Lo indexable: la home, los legales y cada proyecto publicado. Nosotros, contacto y
 * servicios llevan `noindex` mientras su copy sea borrador, y listar en el sitemap una
 * URL `noindex` es una contradiccion que Search Console marca como error. El indice
 * `/trabajo` sigue en `noindex` (pagina pendiente); sus casos son contenido real del CMS
 * y si se indexan.
 *
 * Una entrada por idioma, cada una con las alternativas del grupo completo.
 */
export function sitemapEntries(
  legals: LegalSitemapEntry[],
  projects: ProjectSitemapEntry[] = [],
): MetadataRoute.Sitemap {
  const pages: { pathname: string; lastModified?: Date }[] = [
    { pathname: "/" },
    ...legals.map((legal) => ({ pathname: `/legales/${legal.slug}`, lastModified: new Date(legal.updatedAt) })),
    ...projects.map((project) => ({ pathname: `/trabajo/${project.slug}`, lastModified: new Date(project.updatedAt) })),
  ];

  return pages.flatMap(({ pathname, lastModified }) =>
    routing.locales.map((locale) => ({
      url: localizedUrl(pathname, locale),
      ...(lastModified ? { lastModified } : {}),
      alternates: { languages: languagesFor(pathname) },
    })),
  );
}
