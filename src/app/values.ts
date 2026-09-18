import type { ValueCardsProps } from "@/design-system/components/organisms/ValueCards/ValueCards";
import { candyAt } from "@/design-system/theme/candy";

/**
 * Los valores del estudio. Viven en app/ por lo mismo que el resto del contenido.
 *
 * TODO(copy): borrador; el texto final lo decide Pigmento.
 *
 * Las tarjetas CONTINUAN la frase del manifiesto, que va justo encima sin cabecera de
 * por medio: no repiten sus palabras —criterio, cargan, convierten— sino que dicen
 * como se consigue lo que ella promete. Van en el orden en que un cliente vive el
 * proyecto: con quien habla, como se decide, como se construye, cuanto dura, como se
 * mide.
 *
 * El color se reparte por POSICION y no se elige por tarjeta: un valor no es mas
 * naranja que otro, y el dia que se reordenen los colores siguen alternando.
 */
type Translate = (key: string, values?: Record<string, string | number>) => string;

const KEYS = ["direct", "tested", "sameTable", "criteria", "measured"] as const;

export function getValues(t: Translate): ValueCardsProps {
  return {
    title: t("title"),
    cards: KEYS.map((key, index) => ({
      title: t(`cards.${key}.title`),
      text: t(`cards.${key}.text`),
      family: candyAt(index),
      position: t("position", { current: index + 1, total: KEYS.length }),
    })),
    labels: {
      carousel: t("carousel"),
      previous: t("previous"),
      next: t("next"),
      picker: t("picker"),
      drag: t("drag"),
    },
  };
}
