import type { LineDrawingName } from "../../atoms/LineDrawing/drawings";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { FeatureCard } from "../../molecules/FeatureCard/FeatureCard";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import styles from "./Services.module.scss";

/**
 * Las cuatro disciplinas en cuatro tarjetas de la casa: la etiqueta y su numero, el
 * dibujo y lo que hace. La cabecera es la de todas las secciones de la home.
 */
export interface ServiceItem {
  key: LineDrawingName;
  name: string;
  title: string;
  text: string;
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
          {services.map((service, i) => (
            <li key={service.key} className={styles.item}>
              <FeatureCard
                label={service.name}
                index={i + 1}
                title={service.title}
                text={service.text}
                drawing={service.key}
              />
            </li>
          ))}
        </ol>
      </ScrollReveal>
    </div>
  );
}
