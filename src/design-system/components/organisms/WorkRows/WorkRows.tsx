"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useWorkRows } from "../../../motion/useWorkRows";
import { Button } from "../../atoms/Button/Button";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import styles from "./WorkRows.module.scss";

/**
 * Trabajo destacado: dos filas de piezas que se deslizan con el scroll, cada una a
 * su velocidad. Lo que se queda fijo es el bloque entero, desde el titular: el titulo
 * dice que es lo que pasa por delante, y si se fuera con el scroll las filas se
 * quedarian sin nombre justo mientras se mueven.
 *
 * Cada pieza es UN enlace a su caso, y su nombre accesible es el cliente y la
 * disciplina. Esos dos textos se ven al pasar el cursor o al enfocar; con opacidad y
 * no ocultos, asi que el lector de pantalla los lee siempre. En tactil no hay cursor,
 * y la hoja los deja a la vista.
 *
 * Las medidas de cada imagen viajan en las props: la pieza reserva su ancho antes de
 * que la imagen cargue, y la fila no salta ni cambia de largo a mitad del recorrido.
 */
export interface WorkPiece {
  client: string;
  /** Ya traducida: "Branding", "Desarrollo web". */
  discipline?: string;
  href: string;
  image: { src: string; width: number; height: number };
}

export interface WorkRowsProps {
  title: string;
  label: string;
  intro: string;
  rows: WorkPiece[][];
  /** El atajo al portafolio entero: las filas son una muestra, no el archivo. */
  ctaLabel: string;
  ctaHref: string;
  titleId?: string;
}

/** Una fila mide media ventana, menos el titular; en movil, un carril de altura fija. */
const PIECE_SIZES = "(max-width: 42rem) 60vw, 25vw";

export function WorkRows({ title, label, intro, rows, ctaLabel, ctaHref, titleId }: WorkRowsProps) {
  const rootRef = useWorkRows<HTMLDivElement>();

  const filled = rows.filter((row) => row.length > 0);
  if (filled.length === 0) return null;

  return (
    <div ref={rootRef} className={styles.root}>
      <div className={styles.stage} data-rows-stage="">
        <div className={styles.frame} data-rows-frame="">
          <div className={styles.header}>
            <StripHeader title={title} label={label} intro={intro} titleId={titleId} />
            {/* Arriba y no al final de las filas: el bloque entero se queda fijo mientras
                pasan, y un boton al final solo se veria cuando ya se ha terminado. */}
            <div className={styles.cta}>
              <Button href={ctaHref} size="lg">
                {ctaLabel}
              </Button>
            </div>
          </div>

          {filled.map((row, rowIndex) => (
            <ul key={rowIndex} className={styles.row} data-rows-row="">
              {row.map((piece, index) => (
                <li
                  key={`${piece.client}-${index}`}
                  className={styles.piece}
                  style={{ "--pg-piece-ratio": piece.image.width / piece.image.height } as CSSProperties}
                  data-rows-piece=""
                >
                  <a className={styles.card} href={piece.href}>
                    {/* Decorativa: el nombre del enlace lo ponen los textos de abajo. */}
                    <Image className={styles.image} src={piece.image.src} alt="" fill sizes={PIECE_SIZES} />
                    <span className={styles.caption}>
                      <span className={styles.client}>{piece.client}</span>
                      {/* Sin el espacio, el nombre del enlace sale "Cliente 01Branding". En
                          flex no se pinta. */}{" "}
                      {piece.discipline ? <span className={styles.discipline}>{piece.discipline}</span> : null}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
