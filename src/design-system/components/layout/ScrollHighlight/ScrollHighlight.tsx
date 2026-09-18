"use client";

import type { ReactNode } from "react";
import { useScrollHighlight } from "../../../motion/useScrollHighlight";
import styles from "./ScrollHighlight.module.scss";

/**
 * El relleno del resaltado POR SCROLL, para un titular que va dentro.
 *
 * Mismo reparto que ScrollReveal: envuelve en vez de pedirle el gesto al titular, asi
 * que `Heading` sigue siendo server component y lo que cruza al navegador es este
 * envoltorio. `display: contents` en la hoja: no mete caja entre el contenedor y el
 * titular.
 *
 * Va POR FUERA del ScrollReveal, y no es indiferente: el reveal parte el titular por
 * lineas y la marca con el. El progreso se publica aqui, por encima de todo lo que se
 * parte, y las copias de la marca lo heredan.
 *
 * Primitiva de COMPOSICION: `children: ReactNode`, la excepcion declarada a las props
 * serializables.
 */
export interface ScrollHighlightProps {
  children: ReactNode;
}

export function ScrollHighlight({ children }: ScrollHighlightProps) {
  const ref = useScrollHighlight<HTMLDivElement>();

  return (
    <div ref={ref} className={styles.root}>
      {children}
    </div>
  );
}
