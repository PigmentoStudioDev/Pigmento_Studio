import type { ProcessProps } from "@/design-system/components/organisms/Process/Process";

/**
 * Las fases de un proyecto. Viven en app/ por lo mismo que el resto del contenido.
 *
 * TODO(copy): borrador; los nombres de fase y sus entregables los confirma Pigmento.
 *
 * El orden es el del proyecto real y no una lista de capacidades: cada fase existe
 * aqui porque produce algo que el cliente recibe. Una fase sin entregable es una
 * reunion, y en un bloque que contesta "como trabajan" una reunion no es una
 * respuesta.
 */
type Translate = (key: string) => string;

const KEYS = ["diagnosis", "strategy", "design", "build", "growth"] as const;

export function getProcess(t: Translate): ProcessProps {
  return {
    title: t("title"),
    titleHighlight: t("titleHighlight"),
    label: t("label"),
    intro: t("intro"),
    deliverableLabel: t("deliverableLabel"),
    phases: KEYS.map((key) => ({
      title: t(`phases.${key}.title`),
      text: t(`phases.${key}.text`),
      deliverable: t(`phases.${key}.deliverable`),
    })),
  };
}
