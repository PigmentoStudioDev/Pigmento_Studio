import type { ReactNode } from "react";
import styles from "./Reveal.module.scss";

/**
 * El gesto de entrada: lo que sube y aparece cuando la pagina se pinta.
 *
 * Es CSS puro y no toca GSAP, y eso no es un atajo. En la referencia de la que sale
 * este gesto, la coreografia de entrada convive con un overlay de carga y con
 * transiciones entre rutas, y por eso alli hace falta JS: alguien tiene que decidir
 * CUANDO empieza. Aqui no hay ninguna de las dos cosas — la pagina se pinta y ya
 * esta — asi que el momento correcto es el unico que hay, y una animacion de CSS lo
 * coge sola. Traer una dependencia para eso seria pagar por una decision que nadie
 * tiene que tomar.
 *
 * `both` en la animacion es lo que evita el parpadeo: el primer fotograma ya aplica
 * el estado inicial, asi que el HTML del servidor nunca se ve un instante en su
 * sitio antes de saltar al de partida.
 *
 * Es una primitiva de COMPOSICION y por eso vive en layout/ y recibe `children:
 * ReactNode` — la excepcion declarada a las props serializables. Envuelve en vez de
 * pedirle el gesto a cada componente: asi un atomo no tiene que saber si le toca
 * entrar, y el desfase lo decide quien arma la pagina, que es el unico que conoce
 * el orden.
 *
 * Lo que NO es: un reveal por scroll. Este gesto entra al montar, mire donde mire
 * la ventana. Lo de abajo del pliegue, cuando haga falta, es otra pieza.
 */
export type RevealStep = 0 | 1 | 2 | 3 | 4 | 5;

export interface RevealProps {
  children: ReactNode;
  /** Posicion en el desfase. El paso lo pone la escala, aqui solo va el orden. */
  step?: RevealStep;
}

const STEP: Record<RevealStep, string> = {
  0: styles.step0,
  1: styles.step1,
  2: styles.step2,
  3: styles.step3,
  4: styles.step4,
  5: styles.step5,
};

export function Reveal({ children, step = 0 }: RevealProps) {
  return <div className={[styles.root, STEP[step]].join(" ")}>{children}</div>;
}
