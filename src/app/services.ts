import type { HalftoneShapeName } from "@/design-system/motion/halftone/shapes";
import type { ServicesProps } from "@/design-system/components/organisms/Services/Services";
import { SERVICE_FAMILY } from "./pigment";

/**
 * El strip de servicios. Vive en app/ por lo mismo que el resto del contenido.
 *
 * Los destinos son los del menu: el dia que cambie una ruta, cambia en los dos sitios
 * o en ninguno. La clave de cada servicio es tambien la de su icono.
 */
type Translate = (key: string) => string;

const SERVICES = ["branding", "web", "motion", "marketing"] as const;

// El solido de cada servicio: el sello de una identidad, la pantalla de una web, la
// esfera que gira y los escalones que suben.
const SHAPES: Record<(typeof SERVICES)[number], HalftoneShapeName> = {
  branding: "seal",
  web: "slab",
  motion: "sphere",
  marketing: "steps",
};

export function getServices(t: Translate): ServicesProps {
  return {
    label: t("label"),
    title: t("title"),
    intro: t("intro"),
    services: SERVICES.map((key) => ({
      key,
      name: t(`items.${key}.name`),
      text: t(`items.${key}.text`),
      shape: SHAPES[key],
      family: SERVICE_FAMILY[key],
    })),
  };
}
