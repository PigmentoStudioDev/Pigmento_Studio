import Image from "next/image";
import styles from "./AboutApproach.module.scss";

/**
 * Tres columnas iguales: imagen, pildora con el numero, titulo y parrafo. El numero es
 * decoracion y va oculto al lector: la lista ya da el orden.
 */
export interface ApproachItem {
  title: string;
  text: string;
  image?: { src: string; alt: string; width: number; height: number };
}

export interface AboutApproachProps {
  items: ApproachItem[];
}

export function AboutApproach({ items }: AboutApproachProps) {
  return (
    <ol className={styles.list}>
      {items.map((item, index) => (
        <li key={item.title} className={styles.item}>
          <div className={styles.media}>
            {item.image ? (
              <Image
                className={styles.image}
                src={item.image.src}
                alt={item.image.alt}
                fill
                sizes="(max-width: 671px) 100vw, 33vw"
              />
            ) : null}
          </div>
          <span className={styles.pill} aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className={styles.title}>{item.title}</h3>
          <p className={styles.text}>{item.text}</p>
        </li>
      ))}
    </ol>
  );
}
