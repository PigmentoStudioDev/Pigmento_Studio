import styles from "./DefinitionRow.module.scss";

export interface DefinitionRowItem {
  /** Lo que se define: "01 Home", "INVENTARIO", "Vigencia". */
  term: string;
  /** Lo que dice de ello. */
  description: string;
  /** El precio del modulo, ya formateado. Solo lo llevan los modulos adicionales. */
  aside?: string | null;
}

export interface DefinitionRowProps {
  items: DefinitionRowItem[];
  /** El termino en versalitas, como los criterios de la comparativa. */
  emphasis?: "normal" | "label";
}

/**
 * La fila de "termino a la izquierda, lo que significa a la derecha".
 *
 * Aparece CUATRO veces en una propuesta de Pigmento — los entregables 01-06, la
 * diferencia en concreto, los modulos adicionales y la tabla de terminos — y por
 * eso es una molecula y no marcado repetido en cuatro organismos.
 *
 * Es una `<dl>` de verdad y no una tabla ni una lista de divs. Un `<dl>` es
 * exactamente esto: parejas de termino y definicion. Con divs, quien navega con
 * lector de pantalla oye dos textos seguidos sin saber que el segundo explica al
 * primero; con una tabla, se anuncia una reticula de filas y columnas que aqui no
 * existe — no hay nada que cruzar, solo pares.
 *
 * El `<div>` que envuelve cada pareja es parte del contrato de HTML: desde HTML 5.2
 * un `<dl>` admite envolver cada grupo `dt`+`dd` en un div, y es lo unico que
 * permite darle a la pareja su propia linea sin romper la asociacion.
 */
export function DefinitionRow({ items, emphasis = "normal" }: DefinitionRowProps) {
  const termClass = [styles.term, emphasis === "label" ? styles.termLabel : null]
    .filter(Boolean)
    .join(" ");

  return (
    <dl className={styles.root}>
      {items.map((item) => (
        <div className={styles.row} key={item.term}>
          <dt className={termClass}>{item.term}</dt>

          <dd className={styles.description}>
            {item.description}
            {item.aside ? <span className={styles.aside}>{item.aside}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
