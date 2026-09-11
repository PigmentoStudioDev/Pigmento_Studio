import { Heading } from "../../atoms/Heading/Heading";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { CheckList } from "../../molecules/CheckList/CheckList";
import { DefinitionRow } from "../../molecules/DefinitionRow/DefinitionRow";
import styles from "./ProposalBaseline.module.scss";

export interface ProposalBaselineProps {
  title: string;
  /** Los entregables numerados: "01 Home" y lo que incluye. */
  deliverables: { term: string; description: string }[];
  /** Lo que va en todas las rutas. */
  includedInAll: string[];
  includedTitle: string;
  includedTitleId: string;
  includedLabel: string;
  excludedLabel: string;
  titleId?: string;
}

/** La base comun: lo que llevan todas las rutas, antes de en que se diferencian. */
export function ProposalBaseline({
  title,
  deliverables,
  includedInAll,
  includedTitle,
  includedTitleId,
  includedLabel,
  excludedLabel,
  titleId,
}: ProposalBaselineProps) {
  return (
    <div className={styles.root}>
      <ScrollReveal>
        <Heading level={2} id={titleId}>
          {title}
        </Heading>
      </ScrollReveal>

      {/* `inner`: el grupo son las FILAS de la lista de definiciones, y este
          envoltorio no puede meterse entre el <dl> y sus filas sin romper la lista. */}
      <ScrollReveal by="block" inner>
        <DefinitionRow
          items={deliverables.map((d) => ({ term: d.term, description: d.description }))}
        />
      </ScrollReveal>

      {includedInAll.length ? (
        <ScrollReveal by="block">
        <CheckList
          items={includedInAll.map((text) => ({ text }))}
          title={includedTitle}
          titleId={includedTitleId}
          includedLabel={includedLabel}
          excludedLabel={excludedLabel}
        />
        </ScrollReveal>
      ) : null}
    </div>
  );
}
