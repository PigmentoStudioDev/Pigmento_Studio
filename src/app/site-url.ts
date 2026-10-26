/**
 * La direccion publica del sitio, en un solo sitio.
 *
 * Sin esto, canonical, hreflang, sitemap y Open Graph se construian sobre
 * `localhost:3000` cuando la variable faltaba, y nada lo avisaba: el build salia
 * verde con URLs que ningun buscador puede usar.
 *
 * Orden: la variable propia (el dominio que se quiera anunciar); si falta, el dominio
 * de produccion que Vercel inyecta en cada build; y solo un deploy de produccion sin
 * ninguno de los dos rompe. Un `pnpm build` local tambien corre con NODE_ENV=production,
 * y romperlo ahi dejaria los gates sin poder medir nada.
 */
export interface SiteUrlEnv {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  VERCEL_ENV?: string;
}

export function resolveSiteUrl(env: SiteUrlEnv): string {
  const own = env.NEXT_PUBLIC_SITE_URL?.trim();
  // Vercel la da sin protocolo: "pigmento-studio.vercel.app".
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const value = own || (vercel ? `https://${vercel}` : "");

  if (!value) {
    if (env.VERCEL_ENV === "production") {
      throw new Error("Sin NEXT_PUBLIC_SITE_URL ni VERCEL_PROJECT_PRODUCTION_URL: canonical, sitemap y Open Graph saldrian sin dominio.");
    }
    return "http://localhost:3000";
  }

  // Origen sin barra final: las rutas se concatenan con "/" por delante.
  return new URL(value).origin;
}

export const SITE_URL = resolveSiteUrl({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  VERCEL_ENV: process.env.VERCEL_ENV,
});
