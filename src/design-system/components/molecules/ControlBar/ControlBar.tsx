import type { ReactNode } from "react";
import styles from "./ControlBar.module.scss";

/**
 * El contenedor que agrupa los controles de un carrusel: flechas, puntos, lo que haga
 * falta. Solo agrupa y separa; no pinta superficie. Tuvo el cristal de la cabecera y se
 * retiro por decision de Karen: sobre el carrusel, los controles se leen mejor sueltos
 * que dentro de una pastilla.
 *
 * Recibe `children` y no una lista de datos, a proposito: no la alimenta el CMS, la
 * compone el organismo con sus propios controles. Cada carrusel pone dentro lo suyo
 * (la corona de valores, flechas y puntos; el equipo, solo flechas).
 *
 * No se coloca sola: quien la usa decide si flota sobre algo o va en la columna. Asi
 * no hay dos clases peleandose por la misma `position` segun el orden de carga.
 */
export interface ControlBarProps {
  children: ReactNode;
}

export function ControlBar({ children }: ControlBarProps) {
  return <div className={styles.root}>{children}</div>;
}
