import { Heading } from "../../atoms/Heading/Heading";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { CaseGallery, type CaseMediaGroup } from "../../molecules/CaseMedia/CaseMedia";
import styles from "./ProjectChapter.module.scss";

/**
 * Un capitulo del caso: el problema, la estrategia, las decisiones o los resultados.
 *
 * El numero y el titulo a la izquierda y el texto a la derecha, como las referencias:
 * se recorre la columna de titulos para saber donde se esta y la de texto para leer.
 * Las decisiones de un capitulo van con su subtitulo, una debajo de otra, y las piezas
 * del capitulo cierran a todo el ancho.
 */
export interface ProjectChapterPoint {
  title: string;
  text: string;
}

export interface ProjectChapterProps {
  /** Ancla del capitulo, y el id que nombra su seccion. */
  titleId: string;
  /** "01": la posicion del capitulo en el caso. */
  index: string;
  title: string;
  paragraphs: string[];
  points: ProjectChapterPoint[];
  media: CaseMediaGroup[];
}

export function ProjectChapter({ titleId, index, title, paragraphs, points, media }: ProjectChapterProps) {
  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <span className={styles.index}>{index}</span>
        <Heading id={titleId} level={2} size="title">
          {title}
        </Heading>
      </div>

      <div className={styles.body}>
        <ScrollReveal>
          {paragraphs.map((paragraph) => (
            <p className={styles.paragraph} key={paragraph}>
              {paragraph}
            </p>
          ))}
        </ScrollReveal>

        {points.length > 0 ? (
          <ol className={styles.points}>
            {points.map((point) => (
              <li className={styles.point} key={point.title}>
                <Heading level={3} size="lead">
                  {point.title}
                </Heading>
                <p className={styles.pointText}>{point.text}</p>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      {media.length > 0 ? (
        <div className={styles.media}>
          <ScrollReveal by="block">
            <CaseGallery groups={media} label={title} />
          </ScrollReveal>
        </div>
      ) : null}
    </div>
  );
}
