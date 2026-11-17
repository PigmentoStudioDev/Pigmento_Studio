import styles from "./SectionHead.module.scss";

/**
 * La cabecera de seccion de la pagina About de la referencia: un filete de lado a lado y
 * debajo una etiqueta de una linea. No es un titular: nombra la seccion y se calla.
 */
export interface SectionHeadProps {
  label: string;
  /** Ancla de la etiqueta, para `Section labelledBy`. */
  id?: string;
}

export function SectionHead({ label, id }: SectionHeadProps) {
  return (
    <div className={styles.root}>
      <span className={styles.line} aria-hidden="true" />
      <h2 id={id} className={styles.label}>
        {label}
      </h2>
    </div>
  );
}
