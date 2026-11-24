import styles from "./AboutIntro.module.scss";

/**
 * La apertura de About: el titular en dos tonos —la segunda linea en gris— y las
 * columnas de parrafo bajo el, una por parrafo en la reticula de cuatro.
 */
export interface AboutIntroProps {
  title: string;
  /** La segunda linea, en el tono secundario. */
  subtitle: string;
  paragraphs: readonly string[];
  titleId?: string;
}

export function AboutIntro({ title, subtitle, paragraphs, titleId }: AboutIntroProps) {
  return (
    <div className={styles.root}>
      <h1 id={titleId} className={styles.title}>
        <span>{title}</span>
        <span className={styles.subtitle}>{subtitle}</span>
      </h1>
      <div className={styles.columns}>
        {paragraphs.map((text) => (
          <p key={text} className={styles.text}>
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}
