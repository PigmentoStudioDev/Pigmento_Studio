import type { ServicesProps } from "@/design-system/components/organisms/Services/Services";

/**
 * El strip de servicios. Vive en app/ por lo mismo que el resto del contenido.
 *
 * Los destinos son los del menu: el dia que cambie una ruta, cambia en los dos sitios
 * o en ninguno. TODO(rutas): branding no tiene pagina propia y apunta al indice, igual
 * que en el manifiesto.
 *
 * TODO(cms): la vista previa usa piezas del portafolio de marcador, la de la misma
 * disciplina que en las filas de trabajo, hasta que cada servicio tenga sus casos.
 */
type Translate = (key: string) => string;

const SERVICES = [
  { key: "branding", href: "/servicios", image: { src: "/portfolio/01.png", width: 522, height: 522 } },
  { key: "web", href: "/servicios/web-development", image: { src: "/portfolio/02.png", width: 522, height: 715 } },
  { key: "motion", href: "/servicios/motion", image: { src: "/portfolio/03.png", width: 521, height: 737 } },
  { key: "marketing", href: "/servicios/marketing", image: { src: "/portfolio/04.png", width: 521, height: 690 } },
] as const;

export function getServices(t: Translate): ServicesProps {
  return {
    title: t("title"),
    titleHighlight: t("titleHighlight"),
    label: t("label"),
    intro: t("intro"),
    cta: t("cta"),
    services: SERVICES.map(({ key, href, image }) => ({
      name: t(`items.${key}.name`),
      scope: t(`items.${key}.scope`),
      href,
      image,
    })),
  };
}
