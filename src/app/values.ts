import type { ValueCardsProps } from "@/design-system/components/organisms/ValueCards/ValueCards";

/**
 * Los valores del estudio. Viven en app/ por lo mismo que el resto del contenido.
 *
 * TODO(copy): borrador; el texto final lo decide Pigmento.
 *
 * Van en el orden en que un cliente vive el proyecto: con quien habla, como se decide,
 * como se construye, cuanto dura, como se mide.
 */
type Translate = (key: string, values?: Record<string, string | number>) => string;

const KEYS = ["direct", "tested", "sameTable", "criteria", "measured"] as const;

export function getValues(t: Translate): ValueCardsProps {
  return {
    title: t("title"),
    cards: KEYS.map((key, index) => ({
      title: t(`cards.${key}.title`),
      text: t(`cards.${key}.text`),
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
