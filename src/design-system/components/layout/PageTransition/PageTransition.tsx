"use client";

import { useRef } from "react";
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
export function PageTransition() {
  const root = useRef<HTMLDivElement>(null);
  usePageTransition(root);

  return (
    <div ref={root} className={styles.root} aria-hidden="true">
      <div data-transition-panel="1" className={styles.lightPanel} />
      <div data-transition-panel="2" className={styles.darkPanel} />
    </div>
  );
}
