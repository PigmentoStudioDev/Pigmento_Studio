"use client";

import { useScrollHighlight } from "../../../motion/useScrollHighlight";
import styles from "./HighlightText.module.scss";

export interface HighlightPart {
  text: string;
  /** Si va subrayado. El relleno corre al hacer scroll. */
  highlight?: boolean;
}

export interface HighlightTextProps {
  /**
   * La frase partida en trozos, en orden. Props serializables: un bloque de Payload
   * la alimenta 1:1 el dia que el CMS sepa marcar que palabras se resaltan.
   */
  parts: HighlightPart[];
}

/**
 * Una frase donde las palabras marcadas se van subrayando al hacer scroll.
 *
 * Fuera de los titulares de seccion, que lo llevan con `Heading highlight` dentro de
 * un `ScrollHighlight`: esta pieza es para una frase suelta que no parte el reveal.
 *
 * El trozo marcado va en `<mark>`, que es el elemento que significa exactamente eso
 * —texto resaltado por relevancia en su contexto— y no un `<span>` con fondo. La
 * diferencia se oye: un lector de pantalla puede anunciar el resalte.
 *
 * El texto entero se renderiza siempre, y con `prefers-reduced-motion` la hoja deja
 * las marcas ya rellenas. Lo que cruza al navegador es el relleno, no la frase.
 */
export function HighlightText({ parts }: HighlightTextProps) {
  const ref = useScrollHighlight<HTMLSpanElement>();

  return (
    <span ref={ref} className={styles.root}>
      {parts.map((part, i) =>
        part.highlight ? (
          <mark className={styles.mark} key={`${part.text}-${i}`}>
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${i}`}>{part.text}</span>
        ),
      )}
    </span>
  );
}
