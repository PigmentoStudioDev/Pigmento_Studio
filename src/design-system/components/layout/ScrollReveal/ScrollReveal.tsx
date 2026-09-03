"use client";

import type { ReactNode } from "react";
import { useScrollReveal, type ScrollRevealBy } from "../../../motion/useScrollReveal";
import styles from "./ScrollReveal.module.scss";

/**
 * El gesto de entrada POR SCROLL: lo que hay dentro llega cuando entra en cuadro.
 *
 * Es la pieza que `Reveal` decia que faltaba. Aquel entra al montar, mire donde mire
 * la ventana, y sirve para lo que ya esta en la primera pantalla; este es para todo
 * lo que hay debajo del pliegue, que es casi toda la pagina.
 *
 * Envuelve en vez de pedirle el gesto a cada componente, y eso tiene una consecuencia
 * que se paga en el bundle: **los hijos siguen siendo server components**. Lo que
 * cruza al navegador es este envoltorio, una vez, no cada bloque de texto que quiera
 * entrar. Con un hook por componente, cada parrafo del sitio se mudaria al cliente.
 *
 * `display: contents` en la hoja: el envoltorio no crea caja, asi que se mete entre un
 * contenedor y su hijo sin tocar el layout de ninguno de los dos — ni una columna flex
 * ni una rejilla se enteran de que hay un div nuevo por medio.
 *
 * Primitiva de COMPOSICION: vive en layout/ y recibe `children: ReactNode`, que es la
 * excepcion declarada a las props serializables.
 */
export interface ScrollRevealProps {
  children: ReactNode;
  /**
   * Como llega. `lines` es el gesto bueno y solo vale para texto corrido; `block`
   * mueve la caja entera y es lo unico que se puede hacer con una fila flex, una
   * pildora o una foto.
   */
  by?: ScrollRevealBy;
  /**
   * El grupo son los hijos del HIJO. Para una lista o una rejilla, donde este
   * envoltorio no puede meterse entre el contenedor y sus items sin romper la lista.
   */
  inner?: boolean;
}

export function ScrollReveal({ children, by = "lines", inner = false }: ScrollRevealProps) {
  const rootRef = useScrollReveal<HTMLDivElement>({ by, inner });

  return (
    <div ref={rootRef} className={styles.root}>
      {children}
    </div>
  );
}
