"use client";

import type { CycledCandyFamily } from "../../../theme/candy";
import Image from "next/image";
import { useEffect, useState, type CSSProperties, type RefObject } from "react";
import { Link } from "@/i18n/navigation";
import { REDUCED_MOTION } from "../../../motion/breakpoints";
import { cursorAttributes } from "../../../motion/cursor";
import { scrollToY } from "../../../motion/useSmoothScroll";
import { useWorkRows } from "../../../motion/useWorkRows";
import { Button } from "../../atoms/Button/Button";
import { IconButton } from "../../atoms/IconButton/IconButton";
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
  image: { src: string; alt?: string; width: number; height: number };
}

export interface WorkRowsProps {
  title: string;
  /** El trozo del titular que se resalta con el scroll. */
  titleHighlight?: string;
  label: string;
  intro: string;
  rows: WorkPiece[][];
  /** El atajo al portafolio entero: las filas son una muestra, no el archivo. */
  ctaLabel: string;
  ctaHref: string;
  /** Lo que dice el cursor sobre cada pieza: "Ver caso". */
  cursorLabel?: string;
  titleId?: string;
  /**
   * Las flechas, para quien no puede o no quiere recorrer las filas con la rueda o
   * arrastrando. Sin ellas no se pintan.
   */
  labels?: { previous: string; next: string };
  /**
   * De que familia candy es el resalte del titular. Sin valor, el azul del tema.
   * Lo reparte la PAGINA, que es quien conoce el orden de los bloques: el ciclo
   * alterna calidos y frios para que dos strips seguidas no caigan en el mismo tono.
   */
  highlightFamily?: CycledCandyFamily;
}

/** Una fila mide media ventana, menos el titular; en movil, un carril de altura fija. */
const PIECE_SIZES = "(max-width: 42rem) 60vw, 25vw";

export function WorkRows({
  title,
  titleHighlight,
  label,
  intro,
  rows,
  ctaLabel,
  ctaHref,
  cursorLabel,
  titleId,
  labels,
  highlightFamily,
}: WorkRowsProps) {
  const rootRef = useWorkRows<HTMLDivElement>();
  const edge = useRowsEdge(rootRef);

  const filled = rows.filter((row) => row.length > 0);
  if (filled.length === 0) return null;

  return (
    <div ref={rootRef} className={styles.root}>
      <div className={styles.stage} data-rows-stage="">
        <div className={styles.frame} data-rows-frame="">
          <div className={styles.header}>
            <StripHeader
              title={title}
              titleHighlight={titleHighlight}
              label={label}
              intro={intro}
              titleId={titleId}
              highlightFamily={highlightFamily}
            />
            {/* Arriba y no al final de las filas: el bloque entero se queda fijo mientras
                pasan, y un boton al final solo se veria cuando ya se ha terminado. */}
            <div className={styles.cta}>
              <Button href={ctaHref} size="lg" icon="arrow-up-right">
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
                  {/* Sin arrastre en el enlace tampoco: arrastrar la pieza se lleva su URL, y en
                      una fila que se recorre es un gesto que se dispara sin querer. */}
                  <Link
                    className={styles.card}
                    href={piece.href}
                    draggable={false}
                    {...cursorAttributes("scramble", cursorLabel)}
                  >
                    {/* El alt describe la portada; el nombre del enlace sigue saliendo de
                        los textos de abajo, que se suman a el. Sin alt en el CMS queda
                        vacio y la imagen pasa a decorativa. */}
                    <Image className={styles.image} src={piece.image.src} alt={piece.image.alt ?? ""} fill sizes={PIECE_SIZES} draggable={false} />
                    <span className={styles.caption}>
                      <span className={styles.client}>{piece.client}</span>
                      {/* Sin el espacio, el nombre del enlace sale "Cliente 01Branding". En
                          flex no se pinta. */}{" "}
                      {piece.discipline ? <span className={styles.discipline}>{piece.discipline}</span> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}

          {/* Debajo de las filas y en los dos extremos: cada flecha queda del lado hacia
              el que mueve las piezas. Con ancho tope para que en pantallas grandes no se
              separen hasta perderse de vista una de la otra. */}
          {labels ? (
            <div className={styles.controls}>
              {/* La de atras es la misma flecha reflejada, como en los casos. */}
              <span className={styles.previous}>
                <IconButton
                  icon="arrow"
                  label={labels.previous}
                  disabled={edge.start}
                  onClick={() => stepRows(rootRef.current, -1)}
                />
              </span>
              <IconButton
                icon="arrow"
                label={labels.next}
                disabled={edge.end}
                onClick={() => stepRows(rootRef.current, 1)}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Lo que avanza una flecha: tres cuartos de ventana. Queda a la vista un trozo de lo
 * que ya se vio, y eso es lo que dice que la fila siguio y no salto a otra.
 */
const STEP = 0.75;

const isMotion = (root: HTMLElement) => root.hasAttribute("data-rows-motion");

/**
 * Las filas se mueven de dos maneras y la flecha sigue a la que este puesta. Con motion
 * las lleva el scroll de la PAGINA (la fila mas larga avanza un pixel por pixel), asi que
 * la flecha desplaza la pagina dentro del tramo fijo; sin motion cada fila es un carril y
 * la flecha desplaza los carriles.
 */
function stepRows(root: HTMLElement | null, direction: 1 | -1) {
  if (!root) return;
  const frame = root.querySelector<HTMLElement>("[data-rows-frame]");
  const distance = (frame?.clientWidth ?? window.innerWidth) * STEP * direction;

  if (isMotion(root)) {
    const { start, end } = pinnedRange(root);
    scrollToY(Math.min(Math.max(window.scrollY + distance, start), end));
    return;
  }

  const behavior = window.matchMedia(REDUCED_MOTION).matches ? "auto" : "smooth";
  root.querySelectorAll<HTMLElement>("[data-rows-row]").forEach((row) => {
    row.scrollTo({ left: snapTarget(row, distance), behavior });
  });
}

/**
 * Donde deja la flecha un carril: en la pieza que cae dentro del paso, y como minimo en
 * la siguiente. El carril tiene snap obligatorio, y un desplazamiento menor que una
 * pieza ancha se lo devolveria el snap al punto de partida: la flecha no haria nada.
 */
function snapTarget(row: HTMLElement, distance: number) {
  const padding = parseFloat(getComputedStyle(row).scrollPaddingInlineStart) || 0;
  const stops = Array.from(row.children, (child) => (child as HTMLElement).offsetLeft - padding);
  const from = row.scrollLeft;
  const wanted = from + distance;

  if (distance > 0) {
    const ahead = stops.filter((stop) => stop > from + 1);
    return ahead.filter((stop) => stop <= wanted).pop() ?? ahead[0] ?? from;
  }
  const behind = stops.filter((stop) => stop < from - 1);
  return behind.find((stop) => stop >= wanted) ?? behind.pop() ?? from;
}

/** El tramo de scroll en que el bloque esta fijo y las filas avanzan. */
function pinnedRange(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>("[data-rows-stage]") ?? root;
  const start = stage.getBoundingClientRect().top + window.scrollY;
  return { start, end: start + stage.offsetHeight - window.innerHeight };
}

/**
 * Si las filas estan en su principio o en su final, para apagar la flecha que ya no
 * lleva a ningun sitio. Se recalcula con el scroll de la pagina y con el de cada carril.
 */
function useRowsEdge(rootRef: RefObject<HTMLElement | null>) {
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-rows-row]"));

    // Un objeto nuevo cuenta como cambio para React aunque lleve lo mismo, y el
    // scroll dispara decenas de eventos por segundo: solo se actualiza si algun
    // booleano cambio de verdad.
    const apply = (start: boolean, end: boolean) =>
      setEdge((previous) => (previous.start === start && previous.end === end ? previous : { start, end }));

    const update = () => {
      if (isMotion(root)) {
        const { start, end } = pinnedRange(root);
        apply(window.scrollY <= start + 1, window.scrollY >= end - 1);
        return;
      }
      apply(
        rows.every((row) => row.scrollLeft <= 1),
        rows.every((row) => row.scrollLeft + row.clientWidth >= row.scrollWidth - 1),
      );
    };

    // Los eventos de scroll y resize llegan varias veces por frame: se lee una vez.
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    rows.forEach((row) => row.addEventListener("scroll", schedule, { passive: true }));
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      rows.forEach((row) => row.removeEventListener("scroll", schedule));
    };
  }, [rootRef]);

  return edge;
}
