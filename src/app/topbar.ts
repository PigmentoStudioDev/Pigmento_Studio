import type { TopBarProps } from "@/design-system/components/organisms/TopBar/TopBar";

/**
 * El contenido de la barra de promos. Vive en app/ por lo mismo que la navegacion y
 * el pie: es contenido del sitio, y devuelve datos planos con la forma que tendra la
 * global de Payload el dia que marketing la edite desde el CMS.
 *
 * Primer mensaje: la promo. Segundo: el aviso del estudio, que entra al bajar.
 */
type Translate = (key: string) => string;

export function getTopBar(t: Translate): TopBarProps {
  return {
    messages: [t("promo"), t("agency")],
    href: "/contacto",
  };
}
