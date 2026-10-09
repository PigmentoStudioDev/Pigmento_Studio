"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { cursorAttributes } from "../../../motion/cursor";
import { useRosterSlider } from "../../../motion/useRosterSlider";
import { Heading } from "../../atoms/Heading/Heading";
import { IconButton } from "../../atoms/IconButton/IconButton";
import { ControlBar } from "../../molecules/ControlBar/ControlBar";
import styles from "./FeaturedCases.module.scss";

/**
 * Los casos, de uno en uno y en profundidad, en mitad del argumento.
 *
 * La pagina enseña el trabajo UNA vez —el strip de portadas, en el primer tercio— y
 * despues argumenta durante seis secciones sin una sola imagen. Este bloque lo
 * devuelve justo donde la pagina solo afirma.
 *
 * **No es un segundo strip.** Alli pasan dieciocho portadas sin detenerse en ninguna;
 * aqui se para en una y se ven sus piezas. Son dos formatos distintos del mismo
 * material, que es lo que permite que el trabajo vuelva sin repetirse.
 *
 * **El texto es el del CMS**, no uno escrito para la home. Cada proyecto trae su
 * `summary` redactado, y ese parrafo —el reto real del encargo— argumenta mejor que
 * cualquier cosa que se escriba aqui. La prosa de una home de estudio funciona cuando
 * cuelga de un caso con nombre; suelta, se lee como relleno.
 *
 * **Cada caso es una TARJETA con su propia superficie**, y eso no es decoracion. La
 * pagina es una pila de bandas del mismo tono y el ojo no encuentra donde empieza una
 * cosa y acaba la otra; una capa por encima con su filete y su radio le da al bloque
 * un borde que el fondo no le daba. Es la capa `-01` de Carbon sobre la base, no un
 * gris inventado: re-tematiza sola en los dos modos.
 *
 * **Sin enlace, a proposito.** La pagina de cada caso todavia no existe
 * (`TODO(rutas)` en `app/work.ts`): una llamada a un 404 es peor que ninguna. El
 * bloque es prueba, no navegacion.
 *
 * El gesto es el MISMO que la fila del equipo (`useRosterSlider`): flechas, teclado y
 * arrastre mueven el mismo indice, y con reduced-motion la hoja lo convierte en una
 * fila con scroll nativo. Dos carruseles con dos mecanicas en la misma pagina se
 * notan aunque no se sepa nombrar.
 *
 * Cliente porque el gesto lo es. El resto de la pagina sigue siendo servidor.
 */
export interface FeaturedCasePiece {
  src: string;
  width: number;
  height: number;
}

export interface FeaturedCaseItem {
  /** El nombre del caso: es el titular de su tarjeta. */
  client: string;
  /** Ya traducida: "Branding", "Desarrollo web". */
  discipline?: string;
  /** El texto del propio proyecto, tal como esta en el CMS. */
  summary: string;
  pieces: FeaturedCasePiece[];
}

export interface FeaturedCasesLabels {
  previous: string;
  next: string;
  /** Nombre de la fila para quien la recorra con teclado o lector. */
  slider: string;
  /** Lo que dice el cursor sobre la fila: "Arrastra". */
  drag: string;
}

export interface FeaturedCasesProps {
  /** Lo que se lee antes del nombre, en la voz de metadato: "El caso". */
  label: string;
  cases: FeaturedCaseItem[];
  labels: FeaturedCasesLabels;
  titleId?: string;
}

/** Lo que mide el hueco de una pieza: media tarjeta, y la tarjeta casi la ventana. */
const PIECE_SIZES = "(max-width: 42rem) 88vw, 40vw";

export function FeaturedCases({ label, cases, labels, titleId }: FeaturedCasesProps) {
  const { viewportRef, index, dragPx, dragging, go, handlers } = useRosterSlider<HTMLDivElement>(
    cases.length,
  );

  if (cases.length === 0) return null;

  const trackStyle = { "--pg-roster-index": index, "--pg-roster-drag": dragPx } as CSSProperties;

  return (
    <div className={styles.root}>
      {/* Las flechas solo tienen sentido con mas de un caso: con uno estarian las dos
          apagadas, que es un control que solo dice que no se puede usar. */}
      {cases.length > 1 ? (
        <div className={styles.controls}>
          <ControlBar>
            {/* La flecha es una sola y apunta a la derecha: la de atras es la misma
                reflejada, en un envoltorio para no pisar la escala del gesto de pulsar. */}
            <span className={styles.previous}>
              <IconButton icon="arrow" label={labels.previous} disabled={index === 0} onClick={() => go(-1)} />
            </span>
            <IconButton
              icon="arrow"
              label={labels.next}
              emphasis="primary"
              disabled={index >= cases.length - 1}
              onClick={() => go(1)}
            />
          </ControlBar>
        </div>
      ) : null}

      <div
        ref={viewportRef}
        role="group"
        aria-label={labels.slider}
        tabIndex={0}
        className={styles.viewport}
        data-dragging={dragging ? "true" : undefined}
        {...cursorAttributes("drag", labels.drag)}
        {...handlers}
      >
        <ul className={styles.track} style={trackStyle}>
          {cases.map((item, position) => (
            <li
              key={`${item.client}-${position}`}
              className={styles.card}
              aria-current={position === index ? "true" : undefined}
            >
              <div className={styles.text}>
                <p className={styles.label}>{label}</p>
                {/* El id del landmark va en el PRIMER caso: es el que nombra la
                    seccion entera, y un id repetido por tarjeta no seria unico. */}
                <Heading id={position === 0 ? titleId : undefined} level={2}>
                  {item.client}
                </Heading>
                {item.discipline ? <p className={styles.discipline}>{item.discipline}</p> : null}
                <p className={styles.summary}>{item.summary}</p>
              </div>

              <ul className={styles.gallery}>
                {/* La clave lleva la posicion: dos piezas pueden venir del mismo archivo. */}
                {item.pieces.map((piece, pieceIndex) => (
                  <li className={styles.piece} key={`${piece.src}-${pieceIndex}`}>
                    {/* Decorativas: la tarjeta ya esta nombrada por el cliente y
                        descrita por su texto, y describir una a una las piezas de una
                        identidad repite lo que ya se dijo. */}
                    <Image
                      className={styles.image}
                      src={piece.src}
                      alt=""
                      width={piece.width}
                      height={piece.height}
                      sizes={PIECE_SIZES}
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
