import { Button } from "../../atoms/Button/Button";
import { Heading } from "../../atoms/Heading/Heading";
import { SectionChip } from "../../atoms/SectionChip/SectionChip";
import { Reveal } from "../../layout/Reveal/Reveal";
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
 * al cliente es el fondo, no el titular. La entrada escalonada tampoco lo cruza:
 * es una animacion de CSS, asi que el orden del desfase viaja en el HTML.
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

      {/* El desfase se escribe aqui y no dentro de cada pieza: el orden en que
          entran es una decision de esta composicion, y un atomo que decidiera su
          propio retardo llegaria descolocado en cuanto se le pusiera algo delante.

          Los pasos van seguidos aunque el distintivo sea opcional. Sin el, el
          titular sigue siendo el paso 1 y arranca 48ms mas tarde — un desfase que
          nadie percibe, contra un `step` calculado que habria que rehacer cada vez
          que el hero gane o pierda una pieza. */}
      <div className={styles.content}>
        {eyebrow ? (
          <Reveal>
            <SectionChip>{eyebrow}</SectionChip>
          </Reveal>
        ) : null}

        <Reveal step={1}>
          <Heading level={1}>{title}</Heading>
        </Reveal>

        {/* Los dos, o ninguno: un boton sin destino no es un boton, y un destino
            sin etiqueta no se puede pulsar. */}
        {ctaLabel && ctaHref ? (
          <Reveal step={2}>
            <Button href={ctaHref} size="lg">
              {ctaLabel}
            </Button>
          </Reveal>
        ) : null}
      </div>
    </div>
  );
}
