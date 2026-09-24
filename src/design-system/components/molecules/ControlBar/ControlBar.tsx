import type { ReactNode } from "react";
import { GlassSurface } from "../../atoms/GlassSurface/GlassSurface";
import styles from "./ControlBar.module.scss";

/**
 * La pastilla que agrupa los controles de un carrusel: flechas, puntos, lo que haga
 * falta. Mismo material que la cabecera, que es la otra pildora flotante del sitio —
 * cristal y un filo— para que las dos se lean como una sola familia.
 *
 * Recibe `children` y no una lista de datos, a proposito: no la alimenta el CMS, la
 * compone el organismo con sus propios controles. Cada carrusel pone dentro lo suyo
 * (la corona de valores, flechas y puntos; el equipo, solo flechas) y la pastilla solo
 * aporta la forma.
 *
 * No se coloca sola: quien la usa decide si flota sobre algo o va en la columna. Asi
 * no hay dos clases peleandose por la misma `position` segun el orden de carga.
 */
export interface ControlBarProps {
  children: ReactNode;
}

export function ControlBar({ children }: ControlBarProps) {
  return (
    <div className={styles.root}>
      <GlassSurface />
      <div className={styles.row}>{children}</div>
    </div>
  );
}
