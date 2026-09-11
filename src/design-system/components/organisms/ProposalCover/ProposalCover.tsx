import { Heading } from "../../atoms/Heading/Heading";
import { SectionChip } from "../../atoms/SectionChip/SectionChip";
import { Reveal } from "../../layout/Reveal/Reveal";
import { ImageBackdrop } from "../../molecules/ImageBackdrop/ImageBackdrop";
import styles from "./ProposalCover.module.scss";

export interface ProposalCoverImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface ProposalCoverProps {
  /** A quien va dirigida. Es el dato que la vuelve suya. */
  client: string;
  /** El servicio: "Digital Growth Strategy". */
  serviceTitle: string;
  /** Una frase por renglon. */
  tagline: string[];
  image?: ProposalCoverImage | null;
  titleId?: string;
}

/**
 * La portada de la propuesta: el slot de hero, en pequeno.
 *
 * La imagen es de fondo y el texto va encima, asi que la imagen **no puede llevar
 * texto alternativo descriptivo compitiendo con el titular**: si lo llevara, quien
 * usa lector de pantalla oiria dos veces de que va la pagina. Cuando el alt viene
 * vacio del CMS se marca decorativa a proposito.
 *
 * Sigue siendo componente de SERVIDOR. El parallax necesita cliente, pero eso vive
 * dentro de `ImageBackdrop`, que es quien cruza la frontera — el mismo reparto que
 * `HeroVideo` con su fondo de video. Lo que se manda al navegador es una URL y tres
 * numeros, no el titular ni la lista de frases.
 */
export function ProposalCover({
  client,
  serviceTitle,
  tagline,
  image,
  titleId,
}: ProposalCoverProps) {
  return (
    <div className={styles.root}>
      {image ? (
        <div className={styles.backdrop}>
          <ImageBackdrop
            src={image.url}
            alt={image.alt}
            width={image.width}
            height={image.height}
            priority
          />
        </div>
      ) : null}

      {/* `Reveal` y no `ScrollReveal`: la portada esta SIEMPRE sobre el pliegue, y un
          gesto por scroll sobre algo que ya se ve o no dispara o dispara tarde. Este
          entra al pintar, es CSS puro y no pide gsap.

          El desfase se escribe aqui y no dentro de cada pieza: el orden en que entran
          es una decision de esta composicion. Los pasos van seguidos aunque la frase
          sea opcional — sin ella el titular sigue siendo el paso 1. */}
      <div className={styles.content}>
        <Reveal>
          <SectionChip>{client}</SectionChip>
        </Reveal>

        <Reveal step={1}>
          <Heading level={1} id={titleId}>
            {serviceTitle}
          </Heading>
        </Reveal>

        {tagline.length ? (
          <Reveal step={2}>
            <p className={styles.tagline}>
              {tagline.map((line) => (
                <span className={styles.taglineLine} key={line}>
                  {line}
                </span>
              ))}
            </p>
          </Reveal>
        ) : null}
      </div>
    </div>
  );
}
