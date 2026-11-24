import type { CycledCandyFamily } from "../../../theme/candy";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { FeatureCard } from "../../molecules/FeatureCard/FeatureCard";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import styles from "./Services.module.scss";

/**
 * Las cuatro disciplinas en cuatro recuadros del color de su servicio, sin icono: el
 * color es el que cada disciplina lleva en todo el sitio, y basta para nombrarla
 * (ronda 2 de Pigmento, 2026-11-23).
 * La cabecera es la de todas las secciones de la home.
 */
export interface ServiceItem {
  key: string;
  name: string;
  text: string;
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
                family={service.family}
              />
            </li>
          ))}
        </ol>
      </ScrollReveal>
    </div>
  );
}
