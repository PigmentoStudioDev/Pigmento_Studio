import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import styles from "./ProjectQuote.module.scss";

/**
 * La voz del cliente sobre el caso: una sola cita, en grande y firmada. Nombre y cargo
 * son obligatorios por lo mismo que en la tira de resenas: una frase sin firma no
 * prueba nada.
 */
export interface ProjectQuoteProps {
  quote: string;
  author: string;
  role: string;
}

export function ProjectQuote({ quote, author, role }: ProjectQuoteProps) {
  return (
    <figure className={styles.root}>
      <blockquote className={styles.quote}>
        <ScrollReveal>
          <p className={styles.text}>{quote}</p>
        </ScrollReveal>
      </blockquote>
      <figcaption className={styles.caption}>
        <cite className={styles.author}>{author}</cite>
        <span className={styles.role}>{role}</span>
      </figcaption>
    </figure>
  );
}
