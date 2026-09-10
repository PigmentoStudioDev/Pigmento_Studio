import type { ManifestoProps } from "@/design-system/components/organisms/Manifesto/Manifesto";
import type { ProjectPiece } from "@/cms/projects";

/**
 * El contenido del manifiesto. Vive en app/ y no en el design system por lo mismo que
 * la navegacion y el pie: es contenido del sitio, no una pieza reutilizable, y el
 * contrato de modularidad exige que el DS pueda salir de este repo sin arrastrar sus
 * rutas.
 *
 * La frase se arma AQUI, trozo a trozo, en vez de escribirse con marcas dentro de una
 * sola cadena. Asi el diccionario solo tiene texto —quien traduce no ve sintaxis— y
 * el orden de las palabras puede cambiar de un idioma a otro sin tocar el componente.
 */
type Translate = (key: string) => string;

export function getManifesto(t: Translate, pieces: ProjectPiece[]): ManifestoProps {
  return {
    eyebrow: t("eyebrow"),
    segments: [
      { text: t("open") },
      // TODO(rutas): branding no tiene pagina propia — la navegacion lista Motion,
      // Marketing y Desarrollo web — asi que apunta al indice hasta que exista.
      { text: t("branding"), href: "/servicios" },
      { text: t("afterBranding") },
      { text: t("sites"), href: "/servicios/web-development" },
      { text: t("afterSites") },
      { text: t("motion"), href: "/servicios/motion" },
      { text: t("close") },
    ],
    pieces,
  };
}
