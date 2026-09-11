import { Heading } from "../../atoms/Heading/Heading";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { DefinitionRow } from "../../molecules/DefinitionRow/DefinitionRow";
import styles from "./ProposalAddOns.module.scss";

export interface ProposalAddOnsProps {
  title: string;
  intro?: string | null;
  /** El precio llega YA formateado: el idioma es cosa de la pagina. */
  items: { term: string; description: string; aside: string }[];
  titleId?: string;
}

/** Los modulos que se contratan aparte, con su precio junto al concepto. */
export function ProposalAddOns({ title, intro, items, titleId }: ProposalAddOnsProps) {
  return (
    <div className={styles.root}>
      <ScrollReveal>
        <Heading level={2} id={titleId}>
          {title}
        </Heading>
      </ScrollReveal>

      {intro ? (
        <ScrollReveal>
          <p className={styles.intro}>{intro}</p>
        </ScrollReveal>
      ) : null}

      <ScrollReveal by="block" inner>
        <DefinitionRow items={items} />
      </ScrollReveal>
    </div>
  );
}
