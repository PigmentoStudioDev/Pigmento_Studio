"use client";

import type { CSSProperties } from "react";
import { cursorAttributes } from "../../../motion/cursor";
import { useAutoRotate } from "../../../motion/useAutoRotate";
import { RADIAL_COPIES, useRadialSlider } from "../../../motion/useRadialSlider";
import type { CandyFamily } from "../../../theme/candy";
import { GlassSurface } from "../../atoms/GlassSurface/GlassSurface";
import { IconButton } from "../../atoms/IconButton/IconButton";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import styles from "./ValueCards.module.scss";

/**
 * Los valores del estudio, en una corona de tarjetas candy que gira.
 *
 * Va debajo del manifiesto y SIN cabecera visible: las tarjetas continuan la frase en
 * vez de abrir otro bloque. El manifiesto dice QUE hace el estudio y las tarjetas
 * dicen COMO, asi que un titular y una entradilla entre los dos cortaban justo ese
 * hilo. El titular sigue en el documento, oculto a la vista: nombra la seccion y el
 * carrusel, y da a las tarjetas un h2 del que colgar.
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
 * Props serializables: cada tarjeta trae su familia de color como NOMBRE, que es lo
 * que guardaria un campo `select` de Payload.
 */
export interface ValueCard {
  title: string;
  text: string;
  family: CandyFamily;
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
  cards: ValueCard[];
  labels: ValueCardsLabels;
  titleId?: string;
}

const COPIES = Array.from({ length: RADIAL_COPIES }, (_, copy) => copy);

/** La copia que se anuncia. Es la del medio: las demas rodean a la activa. */
const ANNOUNCED_COPY = Math.floor(RADIAL_COPIES / 2);

export function ValueCards({ title, cards, labels, titleId }: ValueCardsProps) {
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
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>

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
                        <article className={styles.card} data-family={card.family}>
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
                <GlassSurface />
                <div className={styles.controlsRow}>
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
                </div>
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
