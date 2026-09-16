import { Button } from "../../atoms/Button/Button";
import { Heading } from "../../atoms/Heading/Heading";
import { SectionChip } from "../../atoms/SectionChip/SectionChip";
import { Subheading } from "../../atoms/Subheading/Subheading";
import { Reveal } from "../../layout/Reveal/Reveal";
import { InfiniteGrid, type InfiniteGridItem } from "../../molecules/InfiniteGrid/InfiniteGrid";
import styles from "./HeroExpose.module.scss";

/**
 * Hero con el portafolio en un mosaico arrastrable y el titular en un hueco central.
 *
 * El texto es hermano de la reticula, no hijo: asi el CTA siempre recibe el clic sin
 * repartir pointer-events por capas. El precio es que el arrastre no arranca sobre el texto.
 */
export interface HeroExposeProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  pieces: InfiniteGridItem[];
}

export function HeroExpose({
  title,
  eyebrow,
  subtitle,
  ctaLabel,
  ctaHref,
  pieces,
}: HeroExposeProps) {
  return (
    <div className={styles.root}>
      <div className={styles.backdrop}>
        <InfiniteGrid items={pieces} clearing="center" />
      </div>

      <div className={styles.content}>
        {eyebrow ? (
          <Reveal>
            <SectionChip>{eyebrow}</SectionChip>
          </Reveal>
        ) : null}

        <Reveal step={1}>
          <Heading level={1}>{title}</Heading>
        </Reveal>

        {subtitle ? (
          <Reveal step={2}>
            <Subheading size="lead">{subtitle}</Subheading>
          </Reveal>
        ) : null}

        {ctaLabel && ctaHref ? (
          <Reveal step={3}>
            <Button href={ctaHref} size="lg">
              {ctaLabel}
            </Button>
          </Reveal>
        ) : null}
      </div>
    </div>
  );
}
