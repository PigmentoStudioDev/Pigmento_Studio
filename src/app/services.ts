import type { ServicesProps } from "@/design-system/components/organisms/Services/Services";

/**
 * El strip de servicios. Vive en app/ por lo mismo que el resto del contenido.
 *
 * Los destinos son los del menu: el dia que cambie una ruta, cambia en los dos sitios
 * o en ninguno. La clave de cada servicio es tambien la de su icono.
 */
type Translate = (key: string) => string;

const SERVICES = ["branding", "web", "motion", "marketing"] as const;

export function getServices(t: Translate): ServicesProps {
  return {
    label: t("label"),
    title: t("title"),
    intro: t("intro"),
    services: SERVICES.map((key) => ({
      key,
      name: t(`items.${key}.name`),
      title: t(`items.${key}.title`),
      text: t(`items.${key}.text`),
    })),
  };
}
