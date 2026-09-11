import { Heading } from "../../atoms/Heading/Heading";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import styles from "./ProposalDiagnosis.module.scss";

export interface ProposalDiagnosisProps {
  /** El titular: "Tres rutas para convertir el inventario en una plataforma." */
  headline: string;
  /** Donde esta el cliente hoy. Un parrafo por bloque. */
  context: string[];
  titleId?: string;
}

/**
 * El diagnostico: lo que Pigmento entendio del problema, antes de cualquier precio.
 *
 * Va en nivel 2 y no en 1: el titulo del documento es el servicio, y esto es la
 * primera seccion. Dos niveles 1 en una pagina dejan a quien navega por titulares
 * sin saber cual es el documento.
 */
export function ProposalDiagnosis({ headline, context, titleId }: ProposalDiagnosisProps) {
  return (
    <div className={styles.root}>
      <ScrollReveal>
        <Heading level={2} id={titleId}>
          {headline}
        </Heading>
      </ScrollReveal>

      {context.map((paragraph) => (
        <ScrollReveal key={paragraph}>
          <p className={styles.paragraph}>{paragraph}</p>
        </ScrollReveal>
      ))}
    </div>
  );
}
