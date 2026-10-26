import type { MetadataRoute } from "next";
import { getLegalSitemapEntries } from "@/cms/legal";
import { sitemapEntries } from "./sitemap-entries";

// Vive en la raiz de app/ y no bajo [locale]: el proxy de next-intl excluye las rutas con
// punto, asi que /sitemap.xml no recibe prefijo de idioma.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapEntries(await getLegalSitemapEntries());
}
