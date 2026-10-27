import type { HalftoneShapeName } from "../../../motion/halftone/shapes";
import type { CycledCandyFamily } from "../../../theme/candy";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { FeatureCard } from "../../molecules/FeatureCard/FeatureCard";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import styles from "./Services.module.scss";

/**
 * Las cuatro disciplinas en cuatro tarjetas de la casa: su solido en una baldosa del
 * color del servicio, el nombre y lo que hace. La forma distingue y el color nombra.
 * La cabecera es la de todas las secciones de la home.
 */
export interface ServiceItem {
  key: string;
  name: string;
  text: string;
  shape: HalftoneShapeName;
  /** El color del servicio. */
  family: CycledCandyFamily;
}

export interface ServicesProps {
  label: string;
  title: string;
  intro: string;
  services: ServiceItem[];
  titleId?: string;
}

export function Services({ label, title, intro, services, titleId }: ServicesProps) {
  if (services.length === 0) return null;

  return (
    <div className={styles.root}>
      <StripHeader title={title} label={label} intro={intro} titleId={titleId} />

      <ScrollReveal by="block" inner>
        <ol className={styles.list}>
          {services.map((service) => (
            <li key={service.key} className={styles.item}>
              <FeatureCard
                label={service.name}
                text={service.text}
                shape={service.shape}
                accent={service.family}
              />
            </li>
          ))}
        </ol>
      </ScrollReveal>
    </div>
  );
}
