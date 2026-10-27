"use client";

import { useRef } from "react";
import type { PageTransitionPigment } from "../../../motion/pageTransition";
import { usePageTransition } from "../../../motion/usePageTransition";
import styles from "./PageTransition.module.scss";

/**
 * La cortina que tapa la pagina al navegar entre rutas. Se monta una vez en el layout
 * y no pinta nada hasta que alguien hace clic en un enlace interno.
 *
 * Vive en layout/ porque es una primitiva de composicion: la pagina entera cambia
 * detras de ella, y no conoce el contenido de ninguna ruta. Lo que la dispara es el
 * clic, no un bloque.
 *
 * aria-hidden: son dos paneles decorativos. El foco nunca cae aqui: no hay nada
 * enfocable dentro, y se mueve a la pagina nueva cuando la cortina se levanta.
 */
export interface PageTransitionProps {
  /**
   * Las rutas cuya cortina lleva un pigmento (decision de Karen, 2026-10-26): hacia la
   * pagina de un servicio, su color. Las conoce la app, no el DS.
   */
  pigments?: PageTransitionPigment[];
}

export function PageTransition({ pigments = [] }: PageTransitionProps) {
  const root = useRef<HTMLDivElement>(null);
  usePageTransition(root, pigments);

  // El carbon primero y el destino encima: lo ultimo que cubre la pantalla, y lo
  // primero que se levanta, es el color de adonde vas.
  return (
    <div ref={root} className={styles.root} aria-hidden="true">
      <div data-transition-panel="1" className={styles.darkPanel} />
      <div data-transition-panel="2" className={styles.coverPanel} />
    </div>
  );
}
