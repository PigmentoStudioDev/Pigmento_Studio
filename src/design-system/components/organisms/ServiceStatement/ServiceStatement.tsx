import type { CycledCandyFamily } from "../../../theme/candy";
import { Button } from "../../atoms/Button/Button";
import { Prose } from "../../atoms/Prose/Prose";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import styles from "./ServiceStatement.module.scss";

/**
 * Un bloque de texto de una pagina de servicio: rotulo, titular, parrafos y, segun el
 * caso, una lista numerada, una frase de cierre o una llamada.
 *
 * Cubre cinco secciones que el cliente escribio con la misma forma —la entrada bajo
 * el video, la filosofia, la forma de trabajar, la tecnologia y el cierre de marca—
 * en lugar de un organismo por cada una que solo cambiaria el nombre.
 *
 * Props serializables: cadenas y listas planas.
 */
export interface ServiceStatementItem {
  title: string;
  text: string;
}

export interface ServiceStatementProps {
  /** Sin titular, el bloque es solo texto: la entrada que sigue al video del hero. */
  title?: string;
  titleHighlight?: string;
  label?: string;
  /** Uno o varios parrafos, separados por linea en blanco. */
  text?: string;
  /** Puntos numerados ("01 / Estrategia antes que ejecucion"). */
  items?: ServiceStatementItem[];
  /** La frase que remata el bloque, a tamano de titular. */
  tagline?: string;
  cta?: { label: string; href: string };
  titleId?: string;
  highlightFamily?: CycledCandyFamily;
}

const ordinal = (index: number) => String(index + 1).padStart(2, "0");

export function ServiceStatement({
  title,
  titleHighlight,
  label,
  text,
  items = [],
  tagline,
  cta,
  titleId,
  highlightFamily,
}: ServiceStatementProps) {
  return (
    <div className={styles.root}>
      {title ? (
        <StripHeader
          title={title}
          titleHighlight={titleHighlight}
          label={label}
          intro={text}
          titleId={titleId}
          highlightFamily={highlightFamily}
        />
      ) : text ? (
        <ScrollReveal>
          <div className={styles.lone}>
            <Prose text={text} className={styles.loneText} />
          </div>
        </ScrollReveal>
      ) : null}

      {items.length > 0 ? (
        <ScrollReveal by="block" inner>
          <ol className={styles.items}>
            {items.map((item, index) => (
              <li key={item.title} className={styles.item}>
                <span className={styles.ordinal} aria-hidden="true">
                  {ordinal(index)}
                </span>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                <p className={styles.itemText}>{item.text}</p>
              </li>
            ))}
          </ol>
        </ScrollReveal>
      ) : null}

      {tagline ? (
        <ScrollReveal>
          <p className={styles.tagline}>{tagline}</p>
        </ScrollReveal>
      ) : null}

      {cta ? (
        <div className={styles.cta}>
          <Button href={cta.href} emphasis="primary" icon="arrow">
            {cta.label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
