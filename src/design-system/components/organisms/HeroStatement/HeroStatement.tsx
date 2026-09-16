import { Button } from "../../atoms/Button/Button";
import { Heading } from "../../atoms/Heading/Heading";
import { SectionChip } from "../../atoms/SectionChip/SectionChip";
import { Subheading } from "../../atoms/Subheading/Subheading";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { HeroBand, type HeroBandItem } from "../../molecules/HeroBand/HeroBand";
import styles from "./HeroStatement.module.scss";

/**
 * Hero de declaracion: chip, titular, entradilla y CTA apilados al centro, y la tira de
 * fotos debajo. Todo el texto espera a que la tira aterrice; lo decide la hoja con
 * `:has()`, asi que el orden no depende de ningun temporizador.
 *
 * Las props son las de HeroExpose a proposito: los dos heros compiten en la misma
 * pagina, y el que se quede tiene que poder leer los mismos campos del CMS.
 */
export interface HeroStatementProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  pieces: HeroBandItem[];
}

export function HeroStatement({
  title,
  eyebrow,
  subtitle,
  ctaLabel,
  ctaHref,
  pieces,
}: HeroStatementProps) {
  return (
    <div className={styles.root}>
      <div className={styles.content}>
        {eyebrow ? (
          <ScrollReveal by="block">
            <SectionChip>{eyebrow}</SectionChip>
          </ScrollReveal>
        ) : null}

        <div className={styles.title}>
          <ScrollReveal by="lines">
            <Heading level={1} size="heading">
              {title}
            </Heading>
          </ScrollReveal>
        </div>

        {subtitle ? (
          <div className={styles.subtitle}>
            <ScrollReveal by="lines">
              <Subheading size="lead">{subtitle}</Subheading>
            </ScrollReveal>
          </div>
        ) : null}

        {ctaLabel && ctaHref ? (
          <div className={styles.cta}>
            <ScrollReveal by="block">
              <Button href={ctaHref} size="lg">
                {ctaLabel}
              </Button>
            </ScrollReveal>
          </div>
        ) : null}
      </div>

      <div className={styles.band}>
        <HeroBand items={pieces} />
      </div>
    </div>
  );
}
