"use client";

import { PART, useNumberRoll } from "../../../motion/useNumberRoll";
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
 * No lleva `aria-hidden` ni texto alternativo: el contenido final del elemento ES el
 * valor, y durante el rodado un lector de pantalla no esta leyendo esta cifra.
 */
export function NumberRoll({ value, scrollStart }: NumberRollProps) {
  const ref = useNumberRoll<HTMLSpanElement>({ value, scrollStart });

  return (
    <span ref={ref} className={styles.root}>
      {/* Dos mitades con dueno distinto: React pinta el texto y el hook llena la
          pista. Ninguno escribe en el nodo del otro, asi que la cifra no puede
          quedarse con un valor viejo cuando cambia.

          La pista va oculta a los lectores de pantalla: son diez digitos apilados
          por columna y lo que hay que leer es el valor, que esta al lado. */}
      <span className={styles.plain} {...{ [PART]: "plain" }}>
        {value}
      </span>

      <span className={styles.rollers} aria-hidden="true" {...{ [PART]: "rollers" }} />
    </span>
  );
}
