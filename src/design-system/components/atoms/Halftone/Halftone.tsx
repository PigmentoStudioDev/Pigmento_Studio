"use client";

import type { HalftoneShapeName } from "../../../motion/halftone/shapes";
import { useHalftone } from "../../../motion/useHalftone";
import styles from "./Halftone.module.scss";

/**
 * Un solido impreso en semitono: la pieza de una tarjeta. La tinta es el color que
 * hereda (`currentcolor`), asi que en papel sale en la del tema y sobre un candy en la
 * de su familia. La estela del puntero y el anillo del clic los escucha la caja que lo
 * contiene, no el canvas: el gesto es de la tarjeta entera.
 *
 * Decorativo siempre: acompana a un nombre que ya esta escrito al lado.
 */
export interface HalftoneProps {
  shape: HalftoneShapeName;
  /** La caja la pone quien lo monta. */
  className?: string;
  /** El ancestro que recibe el puntero, para `closest()`. Sin el, el padre del canvas. */
  hostSelector?: string;
}

export function Halftone({ shape, className, hostSelector }: HalftoneProps) {
  const ref = useHalftone<HTMLCanvasElement>(shape, hostSelector);

  return <canvas ref={ref} className={[styles.root, className].filter(Boolean).join(" ")} aria-hidden="true" />;
}
