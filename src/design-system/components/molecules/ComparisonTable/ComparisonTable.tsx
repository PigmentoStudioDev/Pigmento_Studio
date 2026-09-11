import { Icon } from "../../atoms/Icon/Icon";
import styles from "./ComparisonTable.module.scss";

export interface ComparisonColumn {
  /** Ata la columna con el valor de cada fila. Es la clave del paquete. */
  key: string;
  name: string;
  /** Bajo el nombre: el precio ya formateado, por ejemplo. */
  meta?: string | null;
}

export interface ComparisonValue {
  key: string;
  value: string;
}

export interface ComparisonRow {
  criterion: string;
  /** Un valor por columna. La columna sin valor es informacion, no un hueco. */
  values: ComparisonValue[];
}

export interface ComparisonTableProps {
  /** El titulo de la tabla. Se ve, y es su nombre accesible. */
  caption: string;
  /** Cabecera de la columna de criterios: "La diferencia". */
  criterionLabel: string;
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  /** Se lee donde una columna no define el criterio. "no aplica". */
  emptyLabel: string;
  /** Nombre de la zona desplazable, para quien la recorra con teclado. */
  scrollLabel: string;
}

/**
 * La matriz que compara N rutas contra M criterios.
 *
 * **Es una `<table>` de verdad.** La alternativa que circula —divs con `role="table"`
 * y `role="cell"`— pasa las herramientas automaticas, pero obliga a mantener a mano
 * una semantica que el navegador ya da gratis, y basta que alguien meta un div sin
 * rol entre una fila y sus celdas para romper la cadena sin que nada avise.
 *
 * **Los criterios son las cabeceras de fila.** Ese es el motivo de que la comparativa
 * exista: leer una fila de un lado a otro y ver en que se diferencian las rutas. Con
 * tarjetas apiladas —lo que suele salir al "arreglar" el movil— cada ruta se lee
 * entera por separado y comparar vuelve a ser cosa de la memoria del lector.
 *
 * **La ausencia se dibuja.** Una columna que no define un criterio deja una celda con
 * su marca y su texto oculto: en la propuesta de MoEasy solo la plataforma conectada
 * define PERMISOS, y una celda en blanco se lee como un olvido de quien redacto.
 */
export function ComparisonTable({
  caption,
  criterionLabel,
  columns,
  rows,
  emptyLabel,
  scrollLabel,
}: ComparisonTableProps) {
  return (
    /**
     * La zona desplazable lleva `tabIndex` y nombre a proposito: un contenedor con
     * scroll al que no se puede llegar con el teclado deja su contenido inalcanzable
     * para quien no usa raton. Con `role="region"` y nombre, ademas, se anuncia al
     * entrar en vez de ser una parada muda en el orden de tabulacion.
     */
    <div className={styles.scroller} role="region" aria-label={scrollLabel} tabIndex={0}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>

        <thead>
          <tr>
            <th scope="col" className={styles.corner}>
              {criterionLabel}
            </th>

            {columns.map((column) => (
              <th scope="col" className={styles.columnHead} key={column.key}>
                <span className={styles.columnName}>{column.name}</span>
                {column.meta ? <span className={styles.columnMeta}>{column.meta}</span> : null}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.criterion}>
              <th scope="row" className={styles.criterion}>
                {row.criterion}
              </th>

              {columns.map((column) => {
                const valor = row.values.find((v) => v.key === column.key)?.value;

                return (
                  <td className={styles.cell} key={column.key}>
                    {valor ? (
                      valor
                    ) : (
                      <>
                        <span className={styles.absent}>
                          <Icon name="dash" />
                        </span>
                        <span className={styles.srOnly}>{emptyLabel}</span>
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
