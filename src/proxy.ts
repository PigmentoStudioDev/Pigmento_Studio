import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Resuelve el idioma antes de que la peticion llegue a una ruta.
 *
 * Se llama proxy.ts y no middleware.ts: Next 16 lo renombro.
 */
export default createMiddleware(routing);

export const config = {
  /**
   * Todo menos lo que no es una pagina.
   *
   * `_next` son los artefactos del build y `_vercel` los del hosting; el ultimo
   * tramo descarta cualquier ruta con punto, que es como se ven los archivos
   * estaticos — favicon, fuentes, imagenes. Sin esa exclusion, el proxy correria en
   * cada .woff2 para decidir un idioma que a una fuente no le importa.
   */
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
