"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cursorAttributes } from "../../../motion/cursor";
import { PRELOAD_COUNT } from "../../../motion/domeGeometry";
import { useDomeGrid } from "../../../motion/useDomeGrid";
import styles from "./DomeGrid.module.scss";

/**
 * La cupula de proyectos: una reticula infinita que se arrastra y se abomba hacia el
 * borde. Cada pieza es UN enlace a su caso; un arrastre no navega, un clic si.
 *
 * Las copias que tesela el motor van `inert` y `aria-hidden`: el lector de pantalla y
 * el teclado recorren cada proyecto una sola vez, y no entran en el orden de tabulacion.
 */
export interface DomeGridItem {
  slug: string;
  title: string;
  /** Disciplina y año, ya traducidos y unidos. */
  meta?: string;
  image: { src: string; alt: string; width: number; height: number };
}

export interface DomeGridLabels {
  /** Nombre accesible de la lista de proyectos. */
  stage: string;
  /** Texto del disco de arrastre del cursor. */
  drag: string;
}

export interface DomeGridProps {
  items: DomeGridItem[];
  /** El h1 de la pagina: oculto a la vista, leido por quien navega sin ver. */
  title: string;
  titleId: string;
  labels: DomeGridLabels;
}

/** Una tarjeta mide media ventana en escritorio y la mitad en movil. */
const SIZES = "(max-width: 767px) 50vw, 25vw";

export function DomeGrid({ items, title, titleId, labels }: DomeGridProps) {
  const { stageRef, listRef, shadeRef, count } = useDomeGrid(items.length);

  if (items.length === 0) return null;

  return (
    <div ref={stageRef} className={styles.stage} {...cursorAttributes("drag", labels.drag)}>
      <h1 id={titleId} className={styles.hiddenTitle}>
        {title}
      </h1>
      <ul ref={listRef} className={styles.list} aria-label={labels.stage}>
        {Array.from({ length: count }, (_, index) => {
          const copy = index >= items.length;
          const item = items[index % items.length];

          return (
            <li key={index} className={styles.item} aria-hidden={copy || undefined} inert={copy}>
              <Link href={`/trabajo/${item.slug}`} className={styles.link} draggable={false}>
                <Image
                  className={styles.image}
                  src={item.image.src}
                  // El caption ya da nombre al enlace: con el alt del CMS el lector
                  // decia la pieza dos veces seguidas.
                  alt=""
                  fill
                  sizes={SIZES}
                  draggable={false}
                  preload={!copy && index < PRELOAD_COUNT}
                />
                <span className={styles.caption}>
                  <span className={styles.name}>{item.title}</span>
                  {item.meta ? (
                    <>
                      {" "}
                      <span className={styles.meta}>{item.meta}</span>
                    </>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div ref={shadeRef} aria-hidden="true" className={styles.shade} />
      <div aria-hidden="true" className={styles.cover} />
    </div>
  );
}
