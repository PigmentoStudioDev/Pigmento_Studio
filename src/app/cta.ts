import type { FinalCtaProps } from "@/design-system/components/organisms/FinalCta/FinalCta";

/**
 * La llamada final. Vive en app/ y no en el design system por lo mismo que el resto
 * del contenido: el contrato de modularidad exige que el DS pueda salir de este repo
 * sin arrastrar sus rutas.
 */
type Translate = (key: string) => string;

export function getFinalCta(t: Translate): FinalCtaProps {
  return {
    label: t("label"),
    title: t("title"),
    cta: t("cta"),
    href: "/contacto",
  };
}
