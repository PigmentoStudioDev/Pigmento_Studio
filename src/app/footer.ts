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
export function getFooter(t: Translate, legals: LegalLink[] = []): SiteFooterProps {
  return {
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
