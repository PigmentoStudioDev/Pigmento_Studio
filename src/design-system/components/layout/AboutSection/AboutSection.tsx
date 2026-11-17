import type { ReactNode } from "react";
import { SectionHead } from "../SectionHead/SectionHead";
import styles from "./AboutSection.module.scss";

/**
 * Una seccion de About: su cabecera de filete y etiqueta, y el contenido debajo con el
 * margen lateral y el aire de abajo de la referencia. Es una primitiva de composicion y
 * por eso recibe `children`.
 */
export interface AboutSectionProps {
  label: string;
  labelId: string;
  children: ReactNode;
}

export function AboutSection({ label, labelId, children }: AboutSectionProps) {
  return (
    <section className={styles.root} aria-labelledby={labelId}>
      <SectionHead label={label} id={labelId} />
      {children}
    </section>
  );
}
