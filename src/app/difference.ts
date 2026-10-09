import type { DifferenceProps } from "@/design-system/components/organisms/Difference/Difference";

/**
 * La comparativa de maneras de trabajar. Vive en app/ como el resto del contenido.
 *
 * TODO(copy): borrador; lo confirma Pigmento.
 *
 * Las columnas son MANERAS de trabajar y no competidores con nombre: la comparativa
 * tiene que poder discutirse fila a fila, y una tabla que gana las cinco se lee como
 * publicidad. Por eso la fila de disponibilidad la gana la agencia grande — es verdad,
 * y es lo que hace creibles las otras cuatro.
 */
type Translate = (key: string) => string;

/** La clave ata cada valor con su columna; no se traduce. */
const COLUMNS = ["studio", "agency", "freelance"] as const;
const ROWS = ["who", "start", "scope", "after", "availability"] as const;

export function getDifference(t: Translate): DifferenceProps {
  return {
    title: t("title"),
    titleHighlight: t("titleHighlight"),
    label: t("label"),
    intro: t("intro"),
    caption: t("caption"),
    criterionLabel: t("criterionLabel"),
    emptyLabel: t("emptyLabel"),
    scrollLabel: t("scrollLabel"),
    columns: COLUMNS.map((key) => ({ key, name: t(`columns.${key}`) })),
    rows: ROWS.map((row) => ({
      criterion: t(`rows.${row}.criterion`),
      values: COLUMNS.map((key) => ({ key, value: t(`rows.${row}.${key}`) })),
    })),
  };
}
