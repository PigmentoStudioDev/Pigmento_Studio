import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Heading } from "../../atoms/Heading/Heading";
import styles from "./ProjectDetail.module.scss";

/**
 * La pagina de un caso del portfolio: el titular, sus datos y su galeria completa.
 *
 * Es el destino del strip y de los casos de la home. Lo que lo distingue de esos es que
 * aqui no se elige nada: se ve el proyecto entero, en el orden que puso el CMS.
 *
 * **La portada es la LCP.** Va con `preload` para que el navegador la pida desde el
 * `<head>`, antes de llegar al marcado. No va dentro de ningun gesto de entrada: el
 * titular y la portada se pintan en el primer fotograma, y lo que se anima es lo que
 * viene despues del pliegue.
 *
 * Props planas: el CMS las alimenta 1:1. Las etiquetas de los metadatos llegan ya
 * traducidas desde la pagina, igual que en los otros organismos del caso.
 */
export interface ProjectDetailPiece {
  src: string;
  /** El que el CMS obliga a escribir: sin el, la imagen es decorativa y se pierde. */
  alt: string;
  width: number;
  height: number;
}

export interface ProjectDetailLabels {
  back: string;
  client: string;
  discipline: string;
  year: string;
  /** Nombre de la galeria para quien la recorra con lector de pantalla. */
  gallery: string;
}

export interface ProjectDetailProps {
  /** Id del titular: lo que <Section labelledBy> necesita para nombrar la seccion. */
  titleId?: string;
  title: string;
  client: string;
  /** Ya traducida: "Branding", "Desarrollo web". */
  disciplineLabel?: string;
  year?: number;
  summary?: string;
  cover: ProjectDetailPiece;
  gallery: ProjectDetailPiece[];
  labels: ProjectDetailLabels;
}

/** La portada ocupa el ancho de la columna: en pantalla grande no hay nada a los lados que la acompane. */
const COVER_SIZES = "100vw";
/** Una columna en movil y dos desde media ventana: la galeria es lectura, no un mosaico. */
const GALLERY_SIZES = "(max-width: 42rem) 100vw, 50vw";

export function ProjectDetail({
  titleId,
  title,
  client,
  disciplineLabel,
  year,
  summary,
  cover,
  gallery,
  labels,
}: ProjectDetailProps) {
  return (
    <article className={styles.root}>
      <Link href="/trabajo" className={styles.back}>
        {labels.back}
      </Link>

      <header className={styles.hero}>
        <Heading id={titleId} level={1} size="heading">
          {title}
        </Heading>

        <dl className={styles.meta}>
          <div className={styles.metaItem}>
            <dt className={styles.metaTerm}>{labels.client}</dt>
            <dd className={styles.metaValue}>{client}</dd>
          </div>
          {disciplineLabel ? (
            <div className={styles.metaItem}>
              <dt className={styles.metaTerm}>{labels.discipline}</dt>
              <dd className={styles.metaValue}>{disciplineLabel}</dd>
            </div>
          ) : null}
          {year !== undefined ? (
            <div className={styles.metaItem}>
              <dt className={styles.metaTerm}>{labels.year}</dt>
              <dd className={styles.metaValue}>{String(year)}</dd>
            </div>
          ) : null}
        </dl>

        {summary ? <p className={styles.summary}>{summary}</p> : null}
      </header>

      <div className={styles.cover}>
        <Image
          preload
          className={styles.image}
          src={cover.src}
          alt={cover.alt}
          width={cover.width}
          height={cover.height}
          sizes={COVER_SIZES}
        />
      </div>

      {gallery.length > 0 ? (
        <ul className={styles.gallery} aria-label={labels.gallery}>
          {gallery.map((piece, index) => (
            // La clave lleva la posicion: dos piezas pueden venir del mismo archivo.
            <li className={styles.galleryItem} key={`${piece.src}-${index}`}>
              <Image
                className={styles.image}
                src={piece.src}
                alt={piece.alt}
                width={piece.width}
                height={piece.height}
                sizes={GALLERY_SIZES}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
