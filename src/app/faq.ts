import type { FaqProps } from "@/design-system/components/organisms/Faq/Faq";

/**
 * Las preguntas del pie de la home. Viven en app/ y no en el design system por lo
 * mismo que la navegacion, el pie y el manifiesto: son contenido del sitio, y el
 * contrato de modularidad exige que el DS pueda salir de este repo sin arrastrarlo.
 *
 * Son SEIS y estan ordenadas por lo que frena una decision: primero el dinero, luego
 * el tiempo, y al final lo que hay que poner de tu parte. Las tres primeras son las
 * que se leen; las otras tres estan para quien ya decidio que si.
 */
type Translate = (key: string) => string;

/** Los indices de las preguntas. Fuera del bucle para que anadir una sea una linea. */
const ITEMS = ["price", "time", "remote", "ownership", "scope", "start"] as const;

export function getFaq(t: Translate): FaqProps {
  return {
    title: t("title"),
    label: t("label"),
    intro: t("intro"),
    items: ITEMS.map((key) => ({
      question: t(`${key}.question`),
      answer: t(`${key}.answer`),
    })),
  };
}
