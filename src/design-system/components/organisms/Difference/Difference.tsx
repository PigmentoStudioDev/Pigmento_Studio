import type { CycledCandyFamily } from "../../../theme/candy";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import {
  ComparisonTable,
  type ComparisonColumn,
  type ComparisonRow,
} from "../../molecules/ComparisonTable/ComparisonTable";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import styles from "./Difference.module.scss";

/**
 * En que se diferencia trabajar con este estudio, criterio a criterio.
 *
 * La pagina dice lo que el estudio hace y como trabaja, y en ningun sitio contesta la
 * pregunta con la que llega quien esta pidiendo tres presupuestos: por que este y no
 * la agencia grande o el freelance. Decirlo en prosa suena a promesa; en una matriz
 * se lee como un hecho y se puede discutir fila a fila.
 *
 * **La matriz no es nueva.** Es la misma `ComparisonTable` que compara rutas en las
 * propuestas comerciales: una `<table>` de verdad, con los criterios como cabeceras
 * de fila, para que se lea de izquierda a derecha y comparar no sea cosa de la
 * memoria de quien lee. Reusarla es ademas lo que hace que la comparativa de la web y
 * la de una propuesta se lean como el mismo documento.
 *
 * **Las columnas no se nombran contra nadie.** "Agencia grande" y "Freelance" son
 * maneras de trabajar, no competidores: una tabla que gana en las diez filas se lee
 * como publicidad y no como criterio, y la que escribe Pigmento tiene que poder
 * perder alguna.
 *
 * Server component entero.
 */
export interface DifferenceProps {
  title: string;
  /** El trozo del titular que se resalta con el scroll. */
  titleHighlight?: string;
  label: string;
  intro: string;
  /** Titulo de la tabla: se ve y es su nombre accesible. */
  caption: string;
  /** Cabecera de la columna de criterios: "La diferencia". */
  criterionLabel: string;
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  /** Lo que se lee donde una columna no define el criterio. */
  emptyLabel: string;
  /** Nombre de la zona desplazable, para quien la recorra con teclado. */
  scrollLabel: string;
  titleId?: string;
  /**
   * De que familia candy es el resalte del titular. Sin valor, el azul del tema.
   * Lo reparte la PAGINA, que es quien conoce el orden de los bloques: el ciclo
   * alterna calidos y frios para que dos strips seguidas no caigan en el mismo tono.
   */
  highlightFamily?: CycledCandyFamily;
}

export function Difference({
  title,
  titleHighlight,
  label,
  intro,
  caption,
  criterionLabel,
  columns,
  rows,
  emptyLabel,
  scrollLabel,
  titleId,
  highlightFamily,
}: DifferenceProps) {
  if (rows.length === 0) return null;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <StripHeader
          title={title}
          titleHighlight={titleHighlight}
          label={label}
          intro={intro}
          titleId={titleId}
          highlightFamily={highlightFamily}
        />
      </div>

      {/* La tabla entra como una caja y no por lineas: partir por lineas una tabla
          mete un envoltorio de bloque entre ella y sus filas. */}
      <ScrollReveal by="block">
        <div className={styles.table}>
          <ComparisonTable
            caption={caption}
            criterionLabel={criterionLabel}
            columns={columns}
            rows={rows}
            emptyLabel={emptyLabel}
            scrollLabel={scrollLabel}
          />
        </div>
      </ScrollReveal>
    </div>
  );
}
