import { Heading } from "../../atoms/Heading/Heading";
import { SectionChip } from "../../atoms/SectionChip/SectionChip";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import styles from "./ProposalRecommendation.module.scss";

export interface ProposalRecommendationProps {
  eyebrow: string;
  headline: string;
  body: string[];
  /** La letra pequena: lo que aun no se puede prometer. */
  technicalNote?: string | null;
  titleId?: string;
}

/**
 * Cual ruta conviene, dicho por Pigmento y con su motivo.
 *
 * La nota tecnica va en el mismo bloque y no en un pie de pagina suelto: es la
 * condicion de lo que se acaba de recomendar, y separarla la convierte en letra
 * pequena que nadie relaciona con la recomendacion.
 */
export function ProposalRecommendation({
  eyebrow,
  headline,
  body,
  technicalNote,
  titleId,
}: ProposalRecommendationProps) {
  return (
    <div className={styles.root}>
      {/* La pildora entra como CAJA: partirla por lineas no tiene sentido en algo
          que siempre mide una, y el gesto se comeria su forma. */}
      <ScrollReveal by="block">
        <SectionChip>{eyebrow}</SectionChip>
      </ScrollReveal>

      <ScrollReveal>
        <Heading level={2} id={titleId}>
          {headline}
        </Heading>
      </ScrollReveal>

      {body.map((paragraph) => (
        <ScrollReveal key={paragraph}>
          <p className={styles.paragraph}>{paragraph}</p>
        </ScrollReveal>
      ))}

      {technicalNote ? (
        <ScrollReveal>
          <p className={styles.note}>{technicalNote}</p>
        </ScrollReveal>
      ) : null}
    </div>
  );
}
