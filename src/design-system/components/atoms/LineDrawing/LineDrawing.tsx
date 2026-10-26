import type { CSSProperties } from "react";
import { LINE_DRAWINGS, type LineDrawingName } from "./drawings";
import styles from "./LineDrawing.module.scss";

/**
 * Un dibujo de linea por NOMBRE, la otra familia junto a `Icon`: aquel son glifos de
 * interfaz en la reticula de 24; estos son ilustraciones que se trazan.
 *
 * Cada trazo lleva `pathLength={1}` y su orden en `--i`, y nada mas: la hoja del
 * atomo deja el dibujo entero y en reposo, y QUIEN lo usa decide cuando se traza
 * (al hover de su tarjeta, de su enlace) con un keyframe de dashoffset 1 a 0 en su
 * propia hoja: CSS Modules renombra los keyframes por hoja y no se comparten. El
 * gesto es del contenedor, no del dibujo.
 *
 * Decorativo siempre: acompana a un nombre que ya esta escrito al lado.
 */
export interface LineDrawingProps {
  name: LineDrawingName;
  /** La caja y el gesto los pone quien lo monta. */
  className?: string;
}

export function LineDrawing({ name, className }: LineDrawingProps) {
  return (
    <svg
      className={[styles.root, className].filter(Boolean).join(" ")}
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {LINE_DRAWINGS[name].map((d, step) => (
        <path key={d} d={d} pathLength={1} style={{ "--i": step } as CSSProperties} />
      ))}
    </svg>
  );
}
