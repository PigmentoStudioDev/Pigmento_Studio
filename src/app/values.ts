import type { HalftoneShapeName } from "@/design-system/motion/halftone/shapes";
import type { ValueCardsProps } from "@/design-system/components/organisms/ValueCards/ValueCards";
import type { TeamMemberData } from "@/cms/team";

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

// El solido de cada valor: dos personas que se hablan, la esfera que se pone a prueba,
// la mesa comun, el sello que dura y los escalones que se miden.
const SHAPES: Record<(typeof KEYS)[number], HalftoneShapeName> = {
  direct: "pair",
  tested: "sphere",
  sameTable: "slab",
  criteria: "seal",
  measured: "steps",
};

/** Las caras que caben antes de que la fila deje de leerse de un vistazo; el resto va en la cuenta. */
const MAX_FACES = 8;

export function getValues(t: Translate, members: TeamMemberData[] = []): ValueCardsProps {
  const faces = members.slice(0, MAX_FACES).map(({ photo }) => ({ src: photo.src, width: photo.width, height: photo.height }));
  const rest = members.length - faces.length;

  return {
    title: t("title"),
    titleHighlight: t("titleHighlight"),
    intro: t("intro"),
    cards: KEYS.map((key, index) => ({
      title: t(`cards.${key}.title`),
      text: t(`cards.${key}.text`),
      shape: SHAPES[key],
      position: t("position", { current: index + 1, total: KEYS.length }),
    })),
    ...(faces.length > 0
      ? {
          people: { faces, ...(rest > 0 ? { count: t("people.count", { count: rest }) } : {}) },
        }
      : {}),
    cta: { label: t("cta"), href: "/nosotros" },
    labels: {
      carousel: t("carousel"),
      previous: t("previous"),
      next: t("next"),
      picker: t("picker"),
      drag: t("drag"),
    },
  };
}
