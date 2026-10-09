import type { SiteFooterProps } from "@/design-system/components/organisms/SiteFooter/SiteFooter";
import type { LegalLink } from "@/cms/legal";

/**
 * El contenido del pie. Vive en app/ y no en el design system por lo mismo que la
 * navegacion: es contenido del sitio, no una pieza reutilizable, y el contrato de
 * modularidad exige que el DS pueda salir de este repo sin arrastrar sus rutas.
 *
 * Es una funcion del traductor porque hay dos idiomas. Devuelve datos planos, que es
 * la forma que tendra la global de pie de Payload: el dia que exista, esto pasa a
 * ser una consulta y SiteFooter no se entera.
 */
type Translate = (key: string) => string;

// Las mismas direcciones que la navegacion, y ese es el unico dato de contacto que
// aparece aqui: no hay telefono ni correo publicos del estudio, y un pie es el
// ultimo sitio donde inventar uno.
const INSTAGRAM = "https://www.instagram.com/pigmento__studio";
const BEHANCE = "https://www.behance.net/pigmentostudio1";
const FACEBOOK = "https://www.facebook.com/pigmentostudiomx/";

/**
 * Los legales entran como DATO y no como constante, igual que el escaparate entra
 * en la navegacion: sus direcciones viven en el CMS y sus nombres se traducen ahi.
 * Lista vacia, fila sin enlaces legales — nunca un enlace a un 404.
 */
export function getFooter(t: Translate, legals: LegalLink[] = [], year = new Date().getFullYear()): SiteFooterProps {
  return {
    /**
     * El directorio: el mapa del sitio, la firma y la vuelta arriba. Es lo que las dos
     * filas de atajos no hacian — cuatro enlaces no son un mapa —, y va aparte de
     * ellas en vez de sustituirlas: la declaracion del pie se queda como esta.
     *
     * El año se INYECTA y no se lee aqui dentro: esto corre en el servidor, y una
     * funcion de contenido que consulta el reloj no se puede comprobar sin congelarlo.
     * El valor por defecto es el de hoy, asi que quien lo llama no tiene que saberlo.
     */
    directory: {
      brand: t("studio"),
      tagline: t("tagline"),
      copyright: `© ${year} Pigmento Studio. ${t("rights")}`,
      backToTop: t("backToTop"),
      columns: [
        {
          title: t("columnStudio"),
          links: [
            { label: t("work"), href: "/trabajo" },
            { label: t("services"), href: "/servicios" },
            { label: t("about"), href: "/nosotros" },
            // Sin href: anunciada y todavia no navegable, como en el menu.
            { label: t("lab") },
          ],
        },
        {
          title: t("columnServices"),
          links: [
            // Al indice mientras branding no tenga pagina propia: el mismo
            // TODO(rutas) que ya llevan el manifiesto y la navegacion.
            { label: t("branding"), href: "/servicios" },
            { label: t("motion"), href: "/servicios/motion" },
            { label: t("marketing"), href: "/servicios/marketing" },
            { label: t("web"), href: "/servicios/web-development" },
          ],
        },
        /**
         * La columna legal se cae entera si el CMS no tiene nada publicado, en vez de
         * quedarse con el titulo y el hueco: una columna vacia en un pie se lee como
         * algo que no cargo.
         */
        ...(legals.length > 0
          ? [
              {
                title: t("columnLegal"),
                links: legals.map((legal) => ({
                  label: legal.title,
                  href: `/legales/${legal.slug}`,
                })),
              },
            ]
          : []),
      ],
    },

    metaLabel: t("metaLabel"),
    meta: [
      { label: t("studio"), plain: true },
      { label: t("work"), href: "/trabajo" },
      { label: t("services"), href: "/servicios" },
      { label: t("contact"), href: "/contacto" },
    ],

    handle: {
      label: t("handle"),
      href: INSTAGRAM,
      name: t("handleName"),
      external: true,
    },

    linksLabel: t("linksLabel"),
    links: [
      { label: t("instagram"), href: INSTAGRAM, name: t("instagramName"), external: true },
      { label: t("behance"), href: BEHANCE, name: t("behanceName"), external: true },
      { label: t("facebook"), href: FACEBOOK, name: t("facebookName"), external: true },
      { label: t("city"), plain: true },
      ...legals.map((legal) => ({ label: legal.title, href: `/legales/${legal.slug}` })),
    ],
  };
}
