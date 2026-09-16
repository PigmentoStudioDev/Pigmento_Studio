"use client";

import Image from "next/image";
import {
  INFINITE_GRID_STATUS,
  itemIndexAt,
  useInfiniteGrid,
} from "../../../motion/useInfiniteGrid";
import styles from "./InfiniteGrid.module.scss";

/**
 * Mosaico infinito y arrastrable. Las celdas las pinta React (no cloneNode) para que
 * ningun nodo sobreviva fuera de su control al re-renderizar.
 */
export interface InfiniteGridItem {
  src: string;
}

export type InfiniteGridClearing = "none" | "center";

export interface InfiniteGridProps {
  items: InfiniteGridItem[];
  clearing?: InfiniteGridClearing;
}

/** Espeja `$grid-tile-inline-size`: 312px fijos bajo 1200px, 26vw por encima. */
const TILE_SIZES = "(max-width: 1199px) 312px, 26vw";

export function InfiniteGrid({ items, clearing = "none" }: InfiniteGridProps) {
  const { rootRef, fieldRef, columns, rows } = useInfiniteGrid<HTMLDivElement, HTMLDivElement>();

  const total = items.length;
  if (total === 0) return null;

  // Antes de medir, la lista una vez: es lo que el hook mide.
  const cells =
    columns === 0
      ? items.map((_, index) => index)
      : Array.from({ length: columns * rows }, (_, cell) =>
          itemIndexAt(Math.floor(cell / columns), cell % columns, total),
        );

  // Una precarga por archivo, no por copia: si no compiten con el titular.
  const seen = new Set<string>();
  const priority = cells.map((index) => {
    const { src } = items[index];
    if (seen.has(src)) return false;
    seen.add(src);
    return true;
  });

  const className = [styles.root, clearing === "center" ? styles.clearingCenter : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={rootRef} className={className} {...{ [INFINITE_GRID_STATUS]: "loading" }}>
      <div ref={fieldRef} className={styles.field}>
        {cells.map((index, cell) => (
          <div key={cell} className={styles.item}>
            <div className={styles.card}>
              {/* Decorativo: con alt las copias se anunciarian decenas de veces. */}
              <Image
                className={styles.image}
                src={items[index].src}
                alt=""
                fill
                sizes={TILE_SIZES}
                priority={priority[cell]}
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
