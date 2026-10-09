"use client";

import { PART, segmentar, useNumberRoll } from "../../../motion/useNumberRoll";
import styles from "./NumberRoll.module.scss";

export interface NumberRollProps {
  /** El valor final, tal y como se lee: "247,680 USD", "80%", "0". */
  value: string;
  /** Posicion de scroll donde arranca, en sintaxis de ScrollTrigger. */
  scrollStart?: string;
}

/**
 * Una cifra que rueda hasta su valor al entrar en pantalla.
 *
 * El valor viaja en el HTML del servidor y el hook solo lo sustituye por los
 * rodillos cuando gsap ha llegado y el movimiento esta permitido. Por eso la cifra
 * se lee siempre: sin JS, con `prefers-reduced-motion`, o en el instante anterior a
 * que el paquete termine de descargarse. Lo que cruza al navegador es el rodado, no
 * el dato.
 *
 * **Cada digito va en una CASILLA de `1ch`, y esa es la pieza central.**
 *
 * Un odometro da por hecho que todos los digitos miden lo mismo, y la sans de la casa
 * no tiene cifras tabulares: medido en el navegador, el "1" ocupa 37.7px donde el "0"
 * ocupa 83.8 al mismo cuerpo, y ni `font-variant-numeric: tabular-nums` ni
 * `font-feature-settings: "tnum"` cambian un pixel — la fuente no trae esa
 * caracteristica. Sin casillas no hay forma de tener las dos cosas a la vez: una
 * celda del ancho del digito final recorta los nueve que pasan por delante, y una
 * celda ancha deja la cifra mas ancha de lo que acaba siendo, que es el salto a la
 * izquierda al terminar.
 *
 * `1ch` es el ancho del "0" en la fuente que haya puesta, y el "0" es justo el digito
 * mas ancho de esta — 83.8 contra el maximo de 83.81. Asi que es la medida, no un
 * numero elegido: todos caben y ninguno sobra, y el dia que la marca cambie de fuente
 * la casilla cambia con ella sin tocar nada.
 *
 * Y las casillas estan SIEMPRE, ruede o no. Es lo que hace que no haya dos
 * maquetaciones que turnarse: la unica diferencia entre la cifra quieta y la cifra
 * rodando es que dentro de cada casilla hay un rodillo en vez de un caracter.
 *
 * El valor se duplica para quien use lector de pantalla. Partido en casillas, un
 * "120" son tres cajas en linea y algunas ayudas tecnicas las anuncian sueltas —
 * "uno, dos, cero"—; el duplicado oculto lo da como el numero que es.
 */
export function NumberRoll({ value, scrollStart }: NumberRollProps) {
  const ref = useNumberRoll<HTMLSpanElement>({ value, scrollStart });

  return (
    <span ref={ref} className={styles.root}>
      <span className={styles.srOnly}>{value}</span>

      {/* Dos mitades con dueno distinto: React pinta el texto y el hook llena la
          pista. Ninguno escribe en el nodo del otro, asi que la cifra no puede
          quedarse con un valor viejo cuando cambia.

          Las dos van ocultas a los lectores de pantalla: el valor ya lo da el
          duplicado de arriba, entero. */}
      <span className={styles.plain} aria-hidden="true" {...{ [PART]: "plain" }}>
        {segmentar(value).map((seg, i) =>
          seg.digito ? (
            // La clave es la POSICION y no el caracter: una cifra repite digitos
            // —"1,100"— y la casilla que los distingue es el sitio que ocupan.
            <span key={i} className={styles.slot}>
              {seg.char}
            </span>
          ) : (
            seg.char
          ),
        )}
      </span>

      <span className={styles.rollers} aria-hidden="true" {...{ [PART]: "rollers" }} />
    </span>
  );
}
