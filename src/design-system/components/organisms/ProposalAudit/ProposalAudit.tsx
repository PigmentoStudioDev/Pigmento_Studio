import { Heading } from "../../atoms/Heading/Heading";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import styles from "./ProposalAudit.module.scss";

export interface AuditFinding {
  key: string;
  /** La etiqueta corta de la columna: captacion, calificacion, seguimiento. */
  area: string;
  title: string;
  /** Lo que cuesta hoy, en dinero o en tiempo del equipo. */
  cost: string;
}

export interface ProposalAuditProps {
  title: string;
  titleId?: string;
  /**
   * La invitacion a comprobarlo. Es prop REQUERIDA y no opcional a proposito: esta
   * seccion le dice al cliente que su sitio esta roto, y lo unico que separa eso de
   * un reproche es que se pueda verificar. Opcional, un dia no esta.
   */
  proof: string;
  costLabel: string;
  findings: AuditFinding[];
}

/**
 * La auditoria del sitio actual: cada hallazgo con lo que cuesta al lado.
 *
 * Va en <ol> porque el orden ES el dato — los hallazgos se listan por lo que cuestan,
 * de mas a menos. El "01..04" visible lo pinta un contador de CSS y no una prop: un
 * numero que viaja en los datos se desincroniza en cuanto alguien reordena la lista,
 * y entonces el documento senala a otro hallazgo del que cree.
 */
export function ProposalAudit({
  title,
  titleId,
  proof,
  costLabel,
  findings,
}: ProposalAuditProps) {
  return (
    <div className={styles.root}>
      <ScrollReveal>
        <Heading level={2} id={titleId}>
          {title}
        </Heading>
      </ScrollReveal>

      <ScrollReveal>
        <p className={styles.proof}>{proof}</p>
      </ScrollReveal>

      {/* `inner`: entra un hallazgo detras de otro, y el envoltorio no puede meterse
          entre la <ol> y sus <li> sin dejar de ser una lista. */}
      <ScrollReveal by="block" inner>
        <ol className={styles.list}>
        {findings.map((finding) => (
          <li className={styles.item} key={finding.key}>
            <p className={styles.area}>{finding.area}</p>

            <Heading level={3} size="lead">
              {finding.title}
            </Heading>

            <p className={styles.cost}>
              <span className={styles.costLabel}>{costLabel}</span>
              {finding.cost}
            </p>
          </li>
          ))}
        </ol>
      </ScrollReveal>
    </div>
  );
}
