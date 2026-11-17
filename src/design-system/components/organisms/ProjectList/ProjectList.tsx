import Image from "next/image";
import { Link } from "@/i18n/navigation";
import styles from "./ProjectList.module.scss";

/**
 * La vista en lista: un filete de lado a lado entre proyectos y, en cada fila, el
 * titulo a la izquierda y la portada con tres piezas mas a la derecha. Todas las filas
 * llevan sus imagenes a la vista; lo que cambia al pasar el cursor es el filete, que se
 * dibuja en negro de izquierda a derecha.
 */
export interface ProjectListItem {
  slug: string;
  title: string;
  image: { src: string; alt: string; width: number; height: number };
  gallery?: { src: string; alt: string; width: number; height: number }[];
}

export interface ProjectListProps {
  items: ProjectListItem[];
}

export function ProjectList({ items }: ProjectListProps) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.slug} className={styles.row}>
          <Link href={`/trabajo/${item.slug}`} className={styles.link}>
            <span className={styles.line} aria-hidden="true" />
            <span className={styles.content}>
              <span className={styles.name}>{item.title}</span>
              <span className={styles.pieces} aria-hidden="true">
                {[item.image, ...(item.gallery ?? [])].map((piece, position) => (
                  <span key={position} className={styles.piece}>
                    <Image className={styles.image} src={piece.src} alt="" fill sizes="(min-width: 1200px) 125px, 33vw" />
                  </span>
                ))}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
