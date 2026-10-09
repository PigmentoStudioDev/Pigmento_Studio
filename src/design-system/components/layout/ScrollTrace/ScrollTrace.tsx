"use client";

import type { ReactNode } from "react";
import { useScrollTrace } from "../../../motion/useScrollTrace";
import styles from "./ScrollTrace.module.scss";

/**
 * El progreso del trazo POR SCROLL, para una lista que va dentro.
 *
 * Mismo reparto que `ScrollReveal` y `ScrollHighlight`: envuelve en vez de pedirle el
 * gesto al bloque, asi que el organismo sigue siendo server component y lo que cruza
 * al navegador es este envoltorio. `display: contents` en la hoja: no mete caja entre
 * el contenedor y la lista, que en una `<ol>` ademas seria HTML invalido.
 *
 * Quien dibuja es la hoja de quien lo use. Aqui solo se publica el numero.
 *
 * Primitiva de COMPOSICION: `children: ReactNode`, la excepcion declarada a las props
 * serializables.
 */
export interface ScrollTraceProps {
  children: ReactNode;
}

export function ScrollTrace({ children }: ScrollTraceProps) {
  const ref = useScrollTrace<HTMLDivElement>();

  return (
    <div ref={ref} className={styles.root}>
      {children}
    </div>
  );
}
