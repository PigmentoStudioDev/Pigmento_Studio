"use client";

import { useEffect, useRef } from "react";
import { MOTION_BREAKPOINTS, REDUCED_MOTION } from "./breakpoints";
import { loadMotion, type MatchMedia } from "./gsap";
import { scrollToY } from "./useSmoothScroll";

/**
 * Filas de trabajo que se deslizan hacia la izquierda mientras la seccion esta fija.
 *
 * Cada fila recorre SU distancia —lo que sobra de ella fuera de la ventana— con el
 * mismo progreso de scroll, asi que las filas largas avanzan mas rapido que las
 * cortas y todas terminan a la vez con su borde derecho en el de la ventana. La
 * profundidad sale de ahi, de que las filas midan distinto, y no de una velocidad
 * escrita a mano por fila.
 *
 * La seccion se alarga exactamente la distancia de la fila mas larga: esa fila se
 * mueve un pixel por pixel de scroll, que es el ritmo que se siente como arrastrar.
 *
 * El JS publica numeros en custom properties; la traslacion es de la hoja. Sin
 * escritorio o con reduced-motion no se pone nada y la hoja pinta cada fila como un
 * carril con scroll horizontal nativo.
 */

const MOTION_ATTRIBUTE = "data-rows-motion";
const TRAVEL_PROPERTY = "--pg-rows-travel";
const PROGRESS_PROPERTY = "--pg-rows-progress";
const DISTANCE_PROPERTY = "--pg-row-distance";

/** Lo que una fila tiene que recorrer para que su borde derecho llegue al de la ventana. */
export function rowDistance(rowWidth: number, viewportWidth: number): number {
  return Math.max(rowWidth - viewportWidth, 0);
}

/**
 * El progreso que deja una pieza al centro de la ventana, o lo mas cerca que su fila
 * permita. Es lo que usa el foco de teclado: la ventana recorta, y una pieza enfocada
 * fuera de cuadro seria un foco invisible.
 */
export function revealProgress(pieceCenter: number, viewportWidth: number, distance: number): number {
  if (distance <= 0) return 0;
  return Math.min(Math.max((pieceCenter - viewportWidth / 2) / distance, 0), 1);
}

export function useWorkRows<T extends HTMLElement>() {
  const rootRef = useRef<T>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const stage = root.querySelector<HTMLElement>("[data-rows-stage]");
    const frame = root.querySelector<HTMLElement>("[data-rows-frame]");
    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-rows-row]"));
    if (!stage || !frame || rows.length === 0) return;

    let mm: MatchMedia | undefined;
    let cancelled = false;

    void loadMotion().then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return;

      mm = gsap.matchMedia();

      mm.add({ ...MOTION_BREAKPOINTS, isReduced: REDUCED_MOTION }, (context) => {
        const { isDesktop, isReduced } = context.conditions ?? {};
        if (!isDesktop || isReduced) return;

        root.setAttribute(MOTION_ATTRIBUTE, "");

        let distances = rows.map(() => 0);

        // Antes de que ScrollTrigger calcule nada: la distancia decide el alto de la
        // seccion, y el alto decide donde empieza y acaba el recorrido.
        const measure = () => {
          const viewport = frame.clientWidth;
          distances = rows.map((row) => rowDistance(row.scrollWidth, viewport));
          rows.forEach((row, index) => row.style.setProperty(DISTANCE_PROPERTY, `${distances[index]}px`));
          root.style.setProperty(TRAVEL_PROPERTY, `${Math.max(...distances)}px`);
        };

        measure();
        ScrollTrigger.addEventListener("refreshInit", measure);

        const trigger = ScrollTrigger.create({
          trigger: stage,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => root.style.setProperty(PROGRESS_PROPERTY, String(self.progress)),
          onRefresh: (self) => root.style.setProperty(PROGRESS_PROPERTY, String(self.progress)),
        });

        ScrollTrigger.refresh();

        const onFocus = (event: FocusEvent) => {
          const piece = (event.target as Element).closest<HTMLElement>("[data-rows-piece]");
          const index = piece ? rows.findIndex((row) => row.contains(piece)) : -1;
          if (!piece || index < 0) return;

          const center = piece.offsetLeft + piece.offsetWidth / 2;
          const progress = revealProgress(center, frame.clientWidth, distances[index]);
          scrollToY(trigger.start + progress * (trigger.end - trigger.start));
        };

        stage.addEventListener("focusin", onFocus);

        return () => {
          stage.removeEventListener("focusin", onFocus);
          ScrollTrigger.removeEventListener("refreshInit", measure);
          trigger.kill();
          root.removeAttribute(MOTION_ATTRIBUTE);
          root.style.removeProperty(TRAVEL_PROPERTY);
          root.style.removeProperty(PROGRESS_PROPERTY);
          rows.forEach((row) => row.style.removeProperty(DISTANCE_PROPERTY));
        };
      });
    });

    return () => {
      cancelled = true;
      mm?.revert();
    };
  }, []);

  return rootRef;
}
