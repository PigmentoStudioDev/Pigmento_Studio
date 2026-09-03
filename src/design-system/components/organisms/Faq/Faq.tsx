"use client";

import { useCallback, useRef, useState } from "react";
import { Icon } from "../../atoms/Icon/Icon";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import styles from "./Faq.module.scss";

/**
 * Las preguntas que la gente hace ANTES de firmar, contestadas donde se hacen.
 *
 * Es el bloque que quita objeciones: precio, plazo, alcance y propiedad. Va a sangre
 * y en una lista de filetes — cada fila ocupa el ancho entero — porque una FAQ se
 * escanea antes de leerse, y una rejilla de tarjetas obliga a leer para escanear.
 *
 * **El movimiento no vive aqui.** El JS lleva UN numero —que fila esta abierta— y el
 * resto es CSS: el vertido del panel, el giro del icono y la respuesta subiendo desde
 * detras del borde. Es el mismo reparto que en RadialGallery, y lo que mantiene la
 * duracion y la curva dentro de la escala de marca, donde el gate las lee sobre el
 * CSS compilado.
 *
 * El panel se abre con `grid-template-rows` de `0fr` a `1fr` y no midiendo su alto en
 * JS: la reticula sabe cuanto mide su contenido, asi que no hay que preguntarselo al
 * DOM en cada apertura ni recalcularlo cuando el texto cambie de lineas al redimensionar.
 *
 * Abrir y cerrar NO duran lo mismo, que es la unica idea de motion que se copia tal
 * cual de la referencia: la apertura entra decidida y el cierre se retira mas calmado
 * — con la misma curva en los dos sentidos, cerrar se lee como si la fila rebotara.
 *
 * Props serializables: la lista es un campo `array` de Payload 1:1.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqProps {
  /** El titular del bloque. En la referencia, tres letras. */
  title: string;
  /** La etiqueta de la columna izquierda, en la voz de metadato del sitio. */
  label: string;
  /** El parrafo que presenta la lista. */
  intro: string;
  items: FaqItem[];
  /**
   * Una fila abierta a la vez. Es el default y no una preferencia: con varias
   * abiertas la pagina crece por debajo del puntero y lo que estabas leyendo se va
   * de la pantalla.
   */
  multiple?: boolean;
  /** Ancla del titular, para que la seccion pueda nombrarse a si misma. */
  titleId?: string;
}

export function Faq({
  title,
  label,
  intro,
  items,
  multiple = false,
  titleId,
}: FaqProps) {
  const [open, setOpen] = useState<number[]>([]);
  const triggersRef = useRef<(HTMLButtonElement | null)[]>([]);

  const toggle = useCallback(
    (index: number) => {
      setOpen((current) => {
        if (current.includes(index)) return current.filter((i) => i !== index);
        return multiple ? [...current, index] : [index];
      });
    },
    [multiple],
  );

  /**
   * Las flechas mueven el foco entre preguntas, que es lo que espera quien navega un
   * acordeon con teclado: el tabulador sale de la lista, las flechas se quedan dentro.
   * Da la vuelta por los dos extremos para no dejar al foco en un callejon.
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      const step =
        event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
      if (step === 0) return;

      event.preventDefault();
      const triggers = triggersRef.current.filter(
        (el): el is HTMLButtonElement => el !== null,
      );
      if (triggers.length === 0) return;

      triggers[(index + step + triggers.length) % triggers.length]?.focus();
    },
    [],
  );

  return (
    <div className={styles.root}>
      <StripHeader title={title} label={label} intro={intro} titleId={titleId} />

      {/* Las filas cuelgan de la raiz sin envoltorio: cada una trae su filete, asi
          que un contenedor intermedio no tendria nada que declarar. */}
      {items.map((item, index) => {
        const isOpen = open.includes(index);
        const panelId = `faq-panel-${index}`;
        const triggerId = `faq-trigger-${index}`;

        return (
          <div
            key={item.question}
            className={styles.row}
            data-faq-open={isOpen ? "true" : undefined}
          >
            {/* El titular es del DOCUMENTO y el boton es el control: envolver uno en
                  otro es lo que deja la FAQ navegable por encabezados sin renunciar a
                  que la fila entera se pulse. */}
            <h3 className={styles.questionHeading}>
              <button
                ref={(el) => {
                  triggersRef.current[index] = el;
                }}
                type="button"
                id={triggerId}
                className={styles.trigger}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                <span className={styles.question}>{item.question}</span>
                <span className={styles.icon}>
                  <Icon name="chevron" />
                </span>
              </button>
            </h3>

            {/*
                `inert` mientras esta cerrado, no `hidden`: el panel tiene que seguir
                midiendo para poder animarse, y un contenido que mide pero no se ve
                sigue recibiendo el tabulador y se sigue leyendo en voz alta. Inert lo
                saca de los dos sitios sin sacarlo del flujo.
              */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              className={styles.panel}
              inert={!isOpen}
            >
              <div className={styles.panelInner}>
                <p className={styles.answer}>{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
