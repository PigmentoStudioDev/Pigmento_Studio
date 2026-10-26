import type { MetadataRoute } from "next";
import { SITE_URL } from "./site-url";

/**
 * `/propuesta` son cotizaciones privadas por token y `/ds` es herramienta interna: ninguna
 * debe aparecer en un buscador. Cubre tambien `/en/...` porque Disallow es por prefijo de
 * ruta y las del ingles empiezan en `/en`.
 */
const PRIVATE = ["/admin", "/api", "/propuesta", "/ds"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...PRIVATE, ...PRIVATE.map((path) => `/en${path}`)] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
