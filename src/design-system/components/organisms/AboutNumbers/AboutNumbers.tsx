import { NumberRoll } from "../../molecules/NumberRoll/NumberRoll";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import styles from "./AboutNumbers.module.scss";

/**
 * Cuatro columnas: la cifra grande que rueda hasta su valor, una pildora con lo que
 * cuenta y el parrafo que la vuelve argumento. Sin contexto una cifra no entra.
 */
export interface AboutNumber {
  value: string;
  label: string;
  context: string;
}

export interface AboutNumbersProps {
  figures: AboutNumber[];
}

export function AboutNumbers({ figures }: AboutNumbersProps) {
  return (
    <ScrollReveal by="block" inner>
    <ul className={styles.list}>
      {figures.map((figure) => (
        <li key={figure.label} className={styles.item}>
          <div className={styles.head}>
            <span className={styles.value}>
              <NumberRoll value={figure.value} />
            </span>
            <span className={styles.pill}>{figure.label}</span>
          </div>
          <p className={styles.text}>{figure.context}</p>
        </li>
      ))}
    </ul>
    </ScrollReveal>
  );
}
