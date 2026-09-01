import styles from "./SectionChip.module.scss";

/**
 * La etiqueta que nombra una seccion, encima de su titular.
 *
 * No es un `Tag` con otra forma, y la diferencia no es visual: un distintivo
 * califica al ELEMENTO que acompana —"Pronto", "Beta"— y su tono dice un estado.
 * Este nombra la SECCION en la que estas, siempre con la misma voz. Por eso no
 * tiene tonos: un chip que viene en tres colores deja de ser la marca que dice
 * "aqui empieza algo" y pasa a ser un distintivo mas.
 *
 * El punto es decorativo y va oculto para el lector de pantalla: lo que se anuncia
 * es la etiqueta, y un punto leido como "vinneta" delante de cada seccion es ruido.
 *
 * Server component y `children: string`, como el resto de la capa de texto: lo
 * traduce el sitio de llamada y lo alimentaria 1:1 un campo de Payload.
 */
export interface SectionChipProps {
  children: string;
}

export function SectionChip({ children }: SectionChipProps) {
  return (
    <span className={styles.root}>
      <span aria-hidden="true" className={styles.dot} />
      {children}
    </span>
  );
}
