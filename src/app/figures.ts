import type { FiguresProps } from "@/design-system/components/organisms/Figures/Figures";

/**
 * Las cifras del estudio. Viven en app/ por lo mismo que el resto del contenido.
 *
 * TODO(copy): los numeros son PLACEHOLDER y los tiene que confirmar Pigmento. Una
 * cifra inventada en una web no es relleno como lo es un parrafo: es una afirmacion
 * sobre el estudio, y la primera persona que la lea en una reunion la va a repetir.
 *
 * El contexto de cada una tampoco es decorado: es la condicion para que el numero
 * entre. "120 proyectos" no dice nada sin saber de que y desde cuando.
 */
type Translate = (key: string) => string;

const KEYS = ["projects", "years", "industries", "repeat"] as const;

export function getFigures(t: Translate): FiguresProps {
  return {
    title: t("title"),
    titleHighlight: t("titleHighlight"),
    label: t("label"),
    intro: t("intro"),
    figures: KEYS.map((key) => ({
      value: t(`items.${key}.value`),
      label: t(`items.${key}.label`),
      context: t(`items.${key}.context`),
    })),
  };
}
