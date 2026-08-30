import { Button } from "../../atoms/Button/Button";
import { Tag } from "../../atoms/Tag/Tag";
import { VideoBackdrop } from "../../molecules/VideoBackdrop/VideoBackdrop";
import styles from "./HeroVideo.module.scss";

/**
 * Hero a sangre con video de fondo y parallax.
 *
 * Es un organismo, o sea UN bloque de Payload: props planas que un bloque alimenta
 * 1:1. No lleva margenes externos ni decide su tema — de eso se encarga el
 * `Section` que lo envuelve, para que el hueco entre dos bloques dependa del orden
 * de la pagina y no de cuales sean.
 *
 * Server component: todo lo que necesita navegador — el parallax y el autoplay —
 * vive dentro de `VideoBackdrop`, que es quien cruza la frontera. Lo que se manda
 * al cliente es el fondo, no el titular.
 */
export interface HeroVideoProps {
  title: string;
  eyebrow?: string;
  videoSrc: string;
  videoPoster: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function HeroVideo({
  title,
  eyebrow,
  videoSrc,
  videoPoster,
  ctaLabel,
  ctaHref,
}: HeroVideoProps) {
  return (
    <div className={styles.root}>
      <div className={styles.backdrop}>
        <VideoBackdrop src={videoSrc} poster={videoPoster} />
      </div>

      <div className={styles.content}>
        {eyebrow ? <Tag>{eyebrow}</Tag> : null}

        <h1 className={styles.title}>{title}</h1>

        {/* Los dos, o ninguno: un boton sin destino no es un boton, y un destino
            sin etiqueta no se puede pulsar. */}
        {ctaLabel && ctaHref ? (
          <Button href={ctaHref} size="lg">
            {ctaLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
