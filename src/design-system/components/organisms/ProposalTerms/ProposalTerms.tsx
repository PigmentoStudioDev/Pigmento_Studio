import { Heading } from "../../atoms/Heading/Heading";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { DefinitionRow } from "../../molecules/DefinitionRow/DefinitionRow";
import styles from "./ProposalTerms.module.scss";

export interface ProposalTermsProps {
  title: string;
  terms: { term: string; description: string }[];
  closing?: string | null;
  titleId?: string;
}

/** Forma de pago, vigencia e impuestos: lo que hay que leer antes de decir que si. */
export function ProposalTerms({ title, terms, closing, titleId }: ProposalTermsProps) {
  return (
    <div className={styles.root}>
      <ScrollReveal>
        <Heading level={2} id={titleId}>
          {title}
        </Heading>
      </ScrollReveal>

      <ScrollReveal by="block" inner>
        <DefinitionRow items={terms} />
      </ScrollReveal>

      {closing ? (
        <ScrollReveal>
          <p className={styles.closing}>{closing}</p>
        </ScrollReveal>
      ) : null}
    </div>
  );
}
