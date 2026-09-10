import type { SiteHeaderProps } from "@/design-system/components/organisms/SiteHeader/SiteHeader";
import type { ProjectPiece } from "@/cms/projects";

/**
 * El contenido de la navegacion. Vive en app/ y no en el design system porque es
 * contenido del sitio, no una pieza reutilizable — y el contrato de modularidad
 * exige que el DS pueda salir de este repo sin arrastrar las rutas de la app.
 *
 * Es una FUNCION del traductor y no una constante desde que hay dos idiomas. Sigue
 * devolviendo la forma exacta que tendra la global de navegacion de Payload: datos
 * planos, sin nodos de React. El dia que exista, esto pasa a ser una consulta y
 * SiteHeader no se entera.
 *
 * Las RUTAS no se traducen y los ICONOS tampoco: una ruta es una direccion y un
 * icono es un dibujo. Lo unico que cambia de idioma son las cadenas que alguien lee.
 */
type Translate = (key: string) => string;

export function getNavigation(t: Translate, gallery: ProjectPiece[]): SiteHeaderProps {
  return {
    label: t("label"),
    homeHref: "/",
    homeLabel: t("homeLabel"),
    toggleLabel: t("toggleLabel"),
    groups: [
      {
        label: t("estudio.label"),
        featured: true,
        items: [
          { label: t("estudio.trabajo"), href: "/trabajo" },
          { label: t("estudio.servicios"), href: "/servicios" },
          { label: t("estudio.nosotros"), href: "/nosotros" },
        ],
        secondary: [{ label: t("estudio.laboratorio"), tag: t("estudio.pronto") }],
      },
      {
        label: t("servicios.label"),
        items: [
          { label: t("servicios.motion"), href: "/servicios/motion" },
          { label: t("servicios.marketing"), href: "/servicios/marketing" },
          { label: t("servicios.web"), href: "/servicios/web-development" },
        ],
        // Al pie de esta columna. El nombre accesible dice la red Y que abre fuera:
        // el enlace lleva target="_blank", y un destino que cambia de pestana sin
        // avisar desorienta a quien no ve que la ventana cambio.
        socials: [
          { icon: "instagram", href: "https://www.instagram.com/pigmento__studio", label: t("social.instagram") },
          { icon: "facebook", href: "https://www.facebook.com/pigmentostudiomx/", label: t("social.facebook") },
          { icon: "behance", href: "https://www.behance.net/pigmentostudio1", label: t("social.behance") },
        ],
        themeToggle: { label: t("themeToggle") },
        soundToggle: { label: t("soundToggle") },
        languageToggle: { label: t("languageToggle") },
      },
    ],
    actions: [{ label: t("cta"), href: "/contacto", emphasis: "primary" }],

    // La tercera columna del panel. En la referencia es una pieza promocional fija —
    // no una lista mas — y por eso el componente es otro: no tiene enlaces sueltos,
    // toda la tarjeta lleva a un solo sitio.
    banner: {
      href: "/trabajo",
      title: t("banner.title"),
      cta: t("banner.cta"),
      tags: [t("banner.tag")],

      gallery,
    },
  };
}
