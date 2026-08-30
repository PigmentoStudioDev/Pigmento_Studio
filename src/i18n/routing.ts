import { defineRouting } from "next-intl/routing";

/**
 * Los dos idiomas del sitio y como se ven en la URL.
 *
 * `localePrefix: "as-needed"` es la decision que hace que esto no rompa nada: el
 * idioma por defecto NO lleva prefijo, asi que las rutas en espanol siguen siendo
 * las de siempre — `/`, `/ds`, `/servicios/motion` — y el ingles cuelga de `/en`.
 * Con el prefijo siempre puesto, cada enlace ya publicado y cada marcador pasarian
 * a redirigir, y `/ds` —que es herramienta y no pagina— cambiaria de direccion sin
 * ninguna razon.
 */
export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
