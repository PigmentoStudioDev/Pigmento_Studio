/**
 * El ritmo del indice de trabajo: filas de tres columnas que alternan tres iguales con
 * una pareja de dos mas uno, tras una primera fila de una sola pieza a todo el ancho.
 *
 * Es el ritmo de la referencia (docs/research/refs/byhuman.md en KarenOrtizPortfolio27),
 * medido sobre su HTML: en ella la pareja grande queda a la izquierda salvo en la segunda
 * pareja y en la ultima, que va a la derecha.
 */
export type WorkGridRowKind = "hero" | "even" | "pair";

export interface WorkGridRow<T> {
  kind: WorkGridRowKind;
  /** Solo en `pair`: en que lado cae la pieza que ocupa dos columnas. */
  wide?: "start" | "end";
  items: T[];
}

const EVEN = 3;
const PAIR = 2;

export function buildWorkGridRows<T>(items: readonly T[]): WorkGridRow<T>[] {
  if (items.length === 0) return [];

  const rows: WorkGridRow<T>[] = [{ kind: "hero", items: [items[0]] }];
  let cursor = 1;
  let rhythm = 0;

  while (cursor < items.length) {
    // Un hueco de una pieza deja de ser una pareja: ocuparia dos columnas sola.
    const wanted = rhythm % 2 === 0 ? EVEN : PAIR;
    const slice = items.slice(cursor, cursor + wanted);
    cursor += slice.length;
    rhythm += 1;

    if (wanted === PAIR && slice.length === PAIR) {
      rows.push({ kind: "pair", items: [...slice] });
    } else {
      rows.push({ kind: "even", items: [...slice] });
    }
  }

  // La alternancia de lado se decide al final porque la ultima pareja depende de cuantas hay.
  const pairs = rows.filter((row) => row.kind === "pair");
  pairs.forEach((row, index) => {
    row.wide = index === 1 || index === pairs.length - 1 ? "end" : "start";
  });

  return rows;
}
