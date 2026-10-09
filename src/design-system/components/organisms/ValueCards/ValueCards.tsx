"use client";

import type { CSSProperties } from "react";
import { cursorAttributes } from "../../../motion/cursor";
import { candyAt, type CycledCandyFamily } from "../../../theme/candy";
import { useAutoRotate } from "../../../motion/useAutoRotate";
import { RADIAL_COPIES, useRadialSlider } from "../../../motion/useRadialSlider";
import { IconButton } from "../../atoms/IconButton/IconButton";
import { ControlBar } from "../../molecules/ControlBar/ControlBar";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import styles from "./ValueCards.module.scss";

/**
 * Los valores del estudio, en una corona de tarjetas que gira.
 *
 * SIN cabecera visible: la corona es la respuesta a lo que la seccion de arriba acaba
 * de ofrecer, y un titular con entradilla delante la convertiria en un cuarto bloque
 * con la misma forma que los tres anteriores. El titular sigue en el documento, oculto
 * a la vista: nombra la seccion y el carrusel, y da a las tarjetas un h2 del que
 * colgar.
 *
 * Es un carrusel de verdad y se anuncia como tal: flechas, un punto por tarjeta con
 * su titulo como nombre, y una region viva que dice que tarjeta quedo al centro. Las
 * copias que cierran la vuelta estan fuera del arbol de accesibilidad y son inertes:
 * quien navega con lector oye cada valor una vez, no cinco.
 *
 * Que se arrastra no se ve solo, asi que lo dice el cursor: sobre la corona pide la
 * variante de arrastre, y es la unica pista del gesto para quien usa raton — las
 * flechas y los puntos van debajo y son otra manera de moverla, no el mismo gesto.
 *
 * El giro no esta aqui: el hook lleva el paso y el desvio del dedo, y la hoja los
 * convierte en rotacion con la curva de la marca. Con reduced-motion la hoja pinta
 * una fila con scroll nativo y esconde los controles, que ya no tendrian que girar.
 *
 * Gira sola hasta que la persona la toca. Mientras gira sola la region viva calla:
 * anunciar cada vuelta interrumpiria al lector de pantalla cada pocos segundos.
 *
 * Los controles flotan en una pastilla sobre el borde de abajo, para que la corona
 * llegue a los limites de la franja. Con el cristal de la cabecera, que es la otra
 * pildora flotante del sitio.
 *
 * Props serializables: titulo, texto y su sitio en la vuelta. El color no viaja en las
 * props porque ya no hay color que elegir — la tarjeta es una capa del tema.
 */
export interface ValueCard {
  title: string;
  text: string;
  /** Ya traducida: "1 de 5". Nombra la tarjeta como grupo dentro del carrusel. */
  position: string;
}

export interface ValueCardsLabels {
  /** El `aria-roledescription` del carrusel, en el idioma de la pagina. */
  carousel: string;
  previous: string;
  next: string;
  /** El nombre del grupo de puntos. */
  picker: string;
  /** Lo que dice el cursor sobre la corona: el gesto, en imperativo. */
  drag: string;
}

export interface ValueCardsProps {
  /** Solo para el lector de pantalla: nombra la seccion y el carrusel. */
  title: string;
  /** El trozo del titular que se resalta con el scroll. */
  titleHighlight?: string;
  /** La etiqueta corta del bloque, en la voz de metadato: "Criterio". */
  label: string;
  /** El parrafo que presenta la corona. Sin el, las tarjetas giran sin contexto. */
  intro: string;
  cards: ValueCard[];
  labels: ValueCardsLabels;
  titleId?: string;
  /**
   * De que familia candy es el resalte del titular. Sin valor, el azul del tema.
   * Lo reparte la PAGINA, que es quien conoce el orden de los bloques: el ciclo
   * alterna calidos y frios para que dos strips seguidas no caigan en el mismo tono.
   */
  highlightFamily?: CycledCandyFamily;
}

const COPIES = Array.from({ length: RADIAL_COPIES }, (_, copy) => copy);

/** La copia que se anuncia. Es la del medio: las demas rodean a la activa. */
const ANNOUNCED_COPY = Math.floor(RADIAL_COPIES / 2);

/**
 * La clase que pinta cada familia del candy.
 *
 * El mapa existe porque la FORMA del gradiente —tres paradas, 150deg, la media al
 * 52%— vive en `_candy.scss` y solo se puede invocar desde Sass; aqui viaja el
 * nombre. Explicito y no un nombre construido a mano: una clase
 * interpolada no la ve el gate que comprueba que toda clase del TSX exista en la
 * hoja, y el dia que se renombre una familia la tarjeta saldria transparente sin que
 * nada falle. Y al estar tipado contra el ciclo, anadir una familia al ciclo sin su
 * clase es un error de compilacion.
 */
const FAMILY_CLASS: Record<CycledCandyFamily, string> = {
  periwinkle: styles.familyPeriwinkle,
  tangerine: styles.familyTangerine,
  cyan: styles.familyCyan,
  pink: styles.familyPink,
  lime: styles.familyLime,
  amber: styles.familyAmber,
};

export function ValueCards({
  title,
  titleHighlight,
  label,
  intro,
  cards,
  labels,
  titleId,
  highlightFamily,
}: ValueCardsProps) {
  const count = cards.length;
  const { trackRef, step, active, dragDegrees, dragging, go, goTo, handlers, onTransitionEnd } =
    useRadialSlider<HTMLDivElement>(count);
  const {
    ref: rotateRef,
    rotating,
    stop: stopRotating,
    handlers: rotateHandlers,
  } = useAutoRotate<HTMLDivElement>(() => go(1), count > 1);

  if (count === 0) return null;

  const current = cards[active];

  // Mover la corona a mano le quita el ritmo a la rotacion automatica.
  const byHand = (move: () => void) => () => {
    stopRotating();
    move();
  };

  // Fuera del JSX: el gate de literales en estilo inline no distingue un valor
  // calculado de uno escrito a mano. Numeros puros; la unidad la pone la hoja.
  const trackStyle = {
    "--pg-radial-step": step,
    "--pg-radial-drag": dragDegrees,
  } as CSSProperties;

  return (
    <div className={styles.root}>
      {/* La cabecera del resto de strips, y no un <h2> escondido.
          Estaba `visually-hidden`: quien llegaba aqui aterrizaba en unas tarjetas
          girando sin una sola palabra que dijera de que van, y una banda de imagen
          justo encima lo empeoraba. Que el titular exista para quien escucha la
          pagina no basta si no existe para quien la mira. */}
      <div className={styles.header}>
        <StripHeader
          title={title}
          titleHighlight={titleHighlight}
          label={label}
          intro={intro}
          titleId={titleId}
          align="center" highlightFamily={highlightFamily}
        />
      </div>

      {/* La corona entra como el resto de la pagina. Entera y no tarjeta a tarjeta:
          las tarjetas ya las mueve el giro, y dos gestos sobre la misma pieza se
          pisarian. */}
      <ScrollReveal by="block">
        <div role="group" aria-roledescription={labels.carousel} aria-labelledby={titleId}>
          <div ref={rotateRef} className={styles.carousel} {...rotateHandlers}>
            <div
              className={styles.stage}
              data-dragging={dragging ? "true" : undefined}
              {...cursorAttributes("drag", labels.drag)}
              {...handlers}
              onPointerDown={(event) => {
                stopRotating();
                handlers.onPointerDown(event);
              }}
            >
              <div ref={trackRef} className={styles.track} style={trackStyle} onTransitionEnd={onTransitionEnd}>
                {COPIES.map((copy) =>
                  cards.map((card, index) => {
                    const announced = copy === ANNOUNCED_COPY;
                    const slideStyle = { "--pg-radial-position": (copy - ANNOUNCED_COPY) * count + index } as CSSProperties;

                    return (
                      <div
                        key={`${copy}-${index}`}
                        className={styles.slide}
                        style={slideStyle}
                        data-clone={announced ? undefined : "true"}
                        {...(announced
                          ? { role: "group", "aria-label": card.position }
                          : { "aria-hidden": true, inert: true })}
                      >
                        {/* La familia sale de la POSICION y no de una prop: el ciclo
                            alterna calidos y frios para que dos tarjetas vecinas no
                            caigan en la misma temperatura, y eso es una decision del
                            sistema, no del contenido. Quitar un valor del CMS
                            recoloca el resto solo. */}
                        <article className={`${styles.card} ${FAMILY_CLASS[candyAt(index)]}`}>
                          <span className={styles.index} aria-hidden="true">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className={styles.body}>
                            <h3 className={styles.cardTitle}>{card.title}</h3>
                            <p className={styles.text}>{card.text}</p>
                          </div>
                        </article>
                      </div>
                    );
                  }),
                )}
              </div>
            </div>

            {count > 1 ? (
              <div className={styles.controls}>
                <ControlBar>
                  {/* La flecha es una sola y apunta a la derecha: la de atras es la misma
                      reflejada, en un envoltorio para no pisar la escala del gesto de pulsar. */}
                  <span className={styles.previous}>
                    <IconButton icon="arrow" label={labels.previous} onClick={byHand(() => go(-1))} />
                  </span>

                  <div role="group" aria-label={labels.picker} className={styles.dots}>
                    {cards.map((card, index) => (
                      <button
                        key={card.title}
                        type="button"
                        className={styles.dot}
                        aria-label={card.title}
                        aria-current={index === active ? "true" : undefined}
                        onClick={byHand(() => goTo(index))}
                      />
                    ))}
                  </div>

                  <IconButton icon="arrow" label={labels.next} emphasis="primary" onClick={byHand(() => go(1))} />
                </ControlBar>
              </div>
            ) : null}
          </div>

          <p className={styles.status} aria-live={rotating ? "off" : "polite"}>
            {current.position}: {current.title}
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
}
