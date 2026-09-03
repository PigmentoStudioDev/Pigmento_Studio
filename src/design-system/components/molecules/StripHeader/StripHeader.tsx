import { Heading } from "../../atoms/Heading/Heading";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import styles from "./StripHeader.module.scss";

/**
 * La cabecera de un bloque de pagina: el titular, una etiqueta y la entradilla.
 *
 * Se saca a una pieza propia en cuanto tuvo el segundo consumidor. La banda de dos
 * columnas con el hueco central vacio no es una casualidad de un bloque — es como
 * empiezan todos los de esta pagina — y mantenida dos veces se separa a la tercera
 * edicion: primero el filete, luego el aire, y acaban pareciendose sin ser iguales.
 *
 * El hueco de la izquierda esta vacio a proposito: es lo que hace que el ojo baje del
 * titular a lo que viene sin tropezar con un parrafo por el camino.
 *
 * Los tres textos entran por scroll y no todos igual: el titular y la entradilla por
 * LINEAS —el gesto de leer— y el rotulo por PALABRAS. La diferencia no es decorativa:
 * el rotulo son dos o tres palabras en una sola linea, y un revelado por lineas sobre
 * una sola linea es un bloque que sube. Partido por palabras se lee como lo que es,
 * una etiqueta que se escribe sola.
 *
 * Sigue siendo server component: lo que cruza al navegador es el envoltorio del gesto,
 * una vez, no este componente ni su contenido.
 */
export interface StripHeaderProps {
  title: string;
  /** La etiqueta corta de la columna izquierda, en la voz de metadato del sitio. */
  label: string;
  /** El parrafo que presenta el bloque. */
  intro: string;
  /**
   * Ancla del titular. `Section labelledBy` lo necesita para convertir su <section>
   * en un landmark con nombre, y sin un id en el titular esa prop no tiene a quien
   * apuntar.
   */
  titleId?: string;
}

export function StripHeader({ title, label, intro, titleId }: StripHeaderProps) {
  return (
    <>
      <ScrollReveal>
        <Heading level={2} size="heading" id={titleId}>
          {title}
        </Heading>
      </ScrollReveal>

      <div className={styles.band}>
        <ScrollReveal by="words">
          <p className={styles.label}>{label}</p>
        </ScrollReveal>

        <ScrollReveal>
          <p className={styles.intro}>{intro}</p>
        </ScrollReveal>
      </div>
    </>
  );
}
