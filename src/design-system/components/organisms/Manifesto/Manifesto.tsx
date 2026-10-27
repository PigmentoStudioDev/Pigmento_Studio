"use client";

import type { CycledCandyFamily } from "../../../theme/candy";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Fragment } from "react";
import {
  MEDIA_BURST_PIECE,
  useMediaBurst,
} from "../../../motion/useMediaBurst";
import { SectionChip } from "../../atoms/SectionChip/SectionChip";
import { ScrollHighlight } from "../../layout/ScrollHighlight/ScrollHighlight";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import styles from "./Manifesto.module.scss";

/**
 * La frase que dice a que se dedica el estudio, con tres palabras que ENSENAN lo que
 * nombran: al senalarlas brota un chorro de piezas del portafolio.
 *
 * Es lo que hace que este bloque no compita con los dos que vienen despues. Dice la
 * oferta antes que el strip de servicios y ensena trabajo antes que el portafolio,
 * pero de las dos cosas da solo un vistazo: tres palabras y unas fotos que pasan.
 *
 * **Las palabras calientes son ENLACES, no adornos.** En el efecto de referencia son
 * `<span>` subrayados: parecen enlaces, no llevan a ningun sitio, y con teclado el
 * efecto no existe porque nada recibe foco. Siendo enlaces a su disciplina, el
 * subrayado deja de mentir, el tabulador las alcanza y la rafaga sale tambien al
 * enfocarlas — el equivalente con teclado del puntero encima.
 *
 * Props serializables: la frase viaja como una LISTA DE TROZOS y no como una cadena
 * con marcas dentro. Un campo `array` de Payload la alimenta 1:1, y el traductor ve
 * texto y no sintaxis.
 */
export interface ManifestoSegment {
  text: string;
  /** Con destino, el trozo es una palabra caliente: enlaza y escupe piezas. */
  href?: string;
  /** El color de la palabra caliente: el de su servicio. Sin el, el resalte neutro. */
  family?: CycledCandyFamily;
}

export interface ManifestoPiece {
  src: string;
  width: number;
  height: number;
}

export interface ManifestoProps {
  eyebrow: string;
  segments: ManifestoSegment[];
  /**
   * Las piezas que brotan. Se renderizan TODAS una vez y se reciclan: cuantas mas
   * haya, mas tarda la rafaga en repetir una.
   */
  pieces: ManifestoPiece[];
}

/**
 * El color de cada palabra caliente es el de su servicio: la palabra nombra la
 * disciplina y el color tambien. Cada clase se nombra entera: el gate de modulos busca
 * la forma literal en el TSX, en las dos direcciones.
 */
const WORD_FAMILY: Record<CycledCandyFamily, string> = {
  pink: styles.wordPink,
  periwinkle: styles.wordPeriwinkle,
  tangerine: styles.wordTangerine,
  lime: styles.wordLime,
};

export function Manifesto({ eyebrow, segments, pieces }: ManifestoProps) {
  const { rootRef, start, stop } = useMediaBurst<HTMLDivElement>();

  return (
    <div ref={rootRef} className={styles.root}>
      {/* La pildora llega como CAJA: partirla por lineas le mete un envoltorio de
          bloque entre el borde y su contenido y le deshace la fila del punto con la
          etiqueta. */}
      <ScrollReveal by="block">
        <SectionChip>{eyebrow}</SectionChip>
      </ScrollReveal>

      {/* El resaltado va POR FUERA del reveal, igual que en los titulares: el reveal
          parte la frase por lineas y se lleva las marcas con ella, asi que el progreso
          tiene que publicarse por encima de todo lo que se parte. */}
      <ScrollHighlight>
        <ScrollReveal>
          <p className={styles.sentence}>
            {segments.map((segment, index) =>
              segment.href ? (
                <Link
                  // El indice entra en la clave porque el mismo texto puede repetirse
                  // en una frase, y dos trozos iguales serian dos claves iguales.
                  key={`${segment.text}-${index}`}
                  href={segment.href}
                  className={styles.word}
                  onMouseEnter={(event) => start(event.currentTarget)}
                  onMouseLeave={stop}
                  onFocus={(event) => start(event.currentTarget)}
                  onBlur={stop}
                >
                  {/* La marca va DENTRO del enlace y no al reves: lo que navega es la
                      palabra entera, y un <a> dentro de un <mark> deja el resaltado
                      fuera del area de clic. El subrayado se queda — un resaltado es
                      color, y un enlace en medio de un parrafo no puede distinguirse
                      solo por color. */}
                  <mark className={segment.family ? `${styles.mark} ${WORD_FAMILY[segment.family]}` : styles.mark}>
                    {segment.text}
                  </mark>
                </Link>
              ) : (
                <Fragment key={`${segment.text}-${index}`}>{segment.text}</Fragment>
              ),
            )}
          </p>
        </ScrollReveal>
      </ScrollHighlight>

      {/*
        La reserva de piezas. Vive fuera del flujo y sin puntero: no ocupa sitio, no
        intercepta clics y no se anuncia — es decoracion que ilustra tres palabras
        que ya se leen solas.
      */}
      <div aria-hidden="true" className={styles.pieces}>
        {pieces.map((piece) => (
          <Image
            draggable={false}
            key={piece.src}
            className={styles.piece}
            src={piece.src}
            alt=""
            width={piece.width}
            height={piece.height}
            // Se ven a 20vw: sin esta pista, next/image sirve la variante del ancho
            // del contenedor y descarga de mas por cada una de las catorce.
            sizes="20vw"
            {...{ [MEDIA_BURST_PIECE]: "" }}
          />
        ))}
      </div>
    </div>
  );
}
