"use client";

import { useCustomCursor } from "../../../motion/useCustomCursor";
import styles from "./CustomCursor.module.scss";

/**
 * El cursor propio del sitio. Se monta una vez en el layout y no pinta nada hasta que
 * el puntero se mueve.
 *
 * Una capa por variante, siempre en el DOM: la flecha, que es la de por defecto; la
 * pastilla con texto de `data-cursor="scramble"`; y el disco de arrastre de
 * `data-cursor="drag"`. Cual se ve lo decide la hoja por el estado que publica el
 * hook — el mismo reparto que cualquier otro componente de la casa.
 *
 * Decoracion entera: fuera del arbol de accesibilidad y sin recibir el puntero. Quien
 * navega con teclado o con lector no pierde nada, porque lo que dice la pastilla ya lo
 * dice el nombre del enlace.
 */
export function CustomCursor() {
  const rootRef = useCustomCursor<HTMLDivElement>();

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      <div className={styles.follower} data-cursor-follower="" data-cursor-state="">
        {/* El disco de arrastre: dos flechas y la etiqueta del gesto. Centrado en el
            puntero, asi que no tiene que voltearse en los bordes. */}
        <div className={styles.drag}>
          <svg className={styles.dragArrow} viewBox="0 0 22 39" fill="none" aria-hidden="true">
            <path
              d="M1.875 36.875L19.375 19.375L1.875 1.875"
              stroke="currentColor"
              strokeWidth="5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.dragText} data-cursor-text-target="" />
          <svg className={styles.dragArrow} viewBox="0 0 22 39" fill="none" aria-hidden="true">
            <path
              d="M1.875 36.875L19.375 19.375L1.875 1.875"
              stroke="currentColor"
              strokeWidth="5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className={styles.scramble}>
          <span className={styles.scrambleText} data-cursor-text-target="" />
          <svg className={styles.chevron} viewBox="0 0 22 39" fill="none">
            <path
              d="M1.875 36.875L19.375 19.375L1.875 1.875"
              stroke="currentColor"
              strokeWidth="5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className={styles.pointer} data-cursor-pointer="">
        <svg className={styles.arrow} viewBox="0 0 40 40" fill="none">
          <path
            d="M1.8 4.4 7 36.2c.3 1.8 2.6 2.3 3.6.8l3.9-5.7c1.7-2.5 4.5-4.1 7.5-4.3l6.9-.5c1.8-.1 2.5-2.4 1.1-3.5L5 2.5c-1.4-1.1-3.5 0-3.3 1.9Z"
            className={styles.arrowShape}
          />
        </svg>
      </div>
    </div>
  );
}
