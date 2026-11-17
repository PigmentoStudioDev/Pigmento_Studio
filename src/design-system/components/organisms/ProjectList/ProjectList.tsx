"use client";

import Image from "next/image";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import styles from "./ProjectList.module.scss";

/**
 * La vista en lista: una linea y el titulo por proyecto, y la fila activa despliega
 * la portada y tres piezas mas. La activa es la que tiene el cursor o el foco; con
 * ninguno, la primera, para que la lista nunca se vea vacia de imagen.
 *
 * Sin cursor (tactil) o en pantalla estrecha todas las filas van desplegadas: no hay
 * nada que pase por encima para activarlas.
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
  const [active, setActive] = useState(0);

  return (
    <ul className={styles.list}>
      {items.map((item, index) => {
        const pieces = [item.image, ...(item.gallery ?? [])];

        return (
          <li key={item.slug} className={styles.row} data-active={index === active || undefined}>
            <Link
              href={`/trabajo/${item.slug}`}
              className={styles.link}
              onPointerEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
            >
              <span className={styles.line} aria-hidden="true" />
              <span className={styles.name}>{item.title}</span>
              <span className={styles.panel} aria-hidden="true">
                <span className={styles.pieces}>
                  {pieces.map((piece, position) => (
                    <span key={position} className={styles.piece}>
                      <Image className={styles.image} src={piece.src} alt="" fill sizes="125px" />
                    </span>
                  ))}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
