"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useScrollReveal } from "../../../motion/useScrollReveal";
import type { WorkGridRow } from "@/app/work-grid";
import styles from "./ProjectGrid.module.scss";

/**
 * El indice de trabajo: filas de tres columnas con el nombre del proyecto dentro de la
 * imagen y una pildora que sube al pasar el cursor. Cada pieza es UN enlace a su caso.
 *
 * El ritmo de las filas lo decide `buildWorkGridRows`; aqui solo se pinta. Cada fila
 * entra por scroll como bloque, escalonada, con el gesto comun del sitio.
 */
export interface ProjectGridItem {
  slug: string;
  title: string;
  image: { src: string; alt: string; width: number; height: number };
}

export interface ProjectGridProps {
  rows: WorkGridRow<ProjectGridItem>[];
  /** El h1 de la pagina: oculto a la vista, leido por quien navega sin ver. */
  title: string;
  titleId: string;
  labels: {
    /** Texto de la pildora de cada pieza. */
    viewCase: string;
  };
}

/** Dos tercios del ancho en la pieza grande y un tercio en el resto; entera en movil. */
const SIZES = "(max-width: 809px) 100vw, 34vw";
const WIDE_SIZES = "(max-width: 809px) 100vw, 67vw";
const HERO_SIZES = "100vw";

export function ProjectGrid({ rows, title, titleId, labels }: ProjectGridProps) {
  const rootRef = useScrollReveal<HTMLDivElement>({ by: "block" });

  return (
    <div className={styles.root}>
      <h1 id={titleId} className={styles.hiddenTitle}>
        {title}
      </h1>
      <div ref={rootRef} className={styles.rows}>
        {rows.map((row, rowIndex) => (
          <ul
            key={rowIndex}
            className={styles.row}
            data-kind={row.kind}
            data-wide={row.wide}
            data-count={row.items.length}
          >
            {row.items.map((item, position) => {
              const wide = row.kind === "pair" && (row.wide === "start" ? position === 0 : position === 1);
              const sizes = row.kind === "hero" ? HERO_SIZES : wide ? WIDE_SIZES : SIZES;

              return (
                <li key={item.slug} className={styles.item} data-wide={wide || undefined}>
                  <Link href={`/trabajo/${item.slug}`} className={styles.link} draggable={false}>
                    <Image
                      className={styles.image}
                      src={item.image.src}
                      // El nombre ya da nombre al enlace: con el alt del CMS el lector
                      // decia la pieza dos veces seguidas.
                      alt=""
                      fill
                      sizes={sizes}
                      preload={rowIndex < 2}
                    />
                    <span className={styles.caption}>
                      <span className={styles.name}>{item.title}</span>
                      <span className={styles.cta} aria-hidden="true">
                        {labels.viewCase}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
    </div>
  );
}
