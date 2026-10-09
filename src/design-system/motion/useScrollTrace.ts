"use client";

import { useEffect, useRef } from "react";
import { MOTION_BREAKPOINTS, REDUCED_MOTION } from "./breakpoints";
import { loadMotion, type MatchMedia } from "./gsap";
import { EASE_LINEAR } from "./tokens";

/**
 * El trazo que se dibuja conforme un bloque cruza la pantalla.
 *
 * Mismo reparto que `useScrollHighlight`, del que esta copiada la forma: **no anima
 * una linea, anima un numero.** Publica el progreso en `--pg-trace-progress` sobre la
 * raiz y la hoja decide que dibuja con el — aqui, cuanto mide el tramo de tinta de la
 * guia y que hitos ya quedaron detras.
 *
 * Ese reparto es el que permite que el bloque entero siga siendo server component: lo
 * que cruza al navegador es un envoltorio sin caja que publica un numero, y las
 * cinco fases, sus textos y sus entregables se renderizan en servidor.
 *
 * No se fundio con `useScrollHighlight` aunque se parezcan: aquel lleva una guarda
 * propia —sin un `<mark>` dentro no hace nada— y un recorrido para saltarse los
 * envoltorios sin caja que trae el reveal. Unirlos pedia un tercer modulo con las dos
 * excepciones dentro, que es mas codigo que las veinte lineas que se repiten.
 *
 * `scrub` y no una duracion: el trazo ES la barra de scroll. Por eso tampoco lleva
 * curva propia — la pone quien desplaza.
 */
export interface ScrollTraceOptions {
  scrollStart?: string;
  scrollEnd?: string;
}

const DEFAULTS = {
  // Arranca cuando el bloque ya entro de verdad y acaba antes de salir: una guia que
  // termina de dibujarse con la ultima fase a medio metro de la ventana se completa
  // sin que nadie la vea completarse.
  scrollStart: "top 75%",
  scrollEnd: "bottom 65%",
  scrub: 0.35,
} as const;

export const TRACE_PROGRESS_PROPERTY = "--pg-trace-progress";

export function useScrollTrace<T extends HTMLElement>({
  scrollStart = DEFAULTS.scrollStart,
  scrollEnd = DEFAULTS.scrollEnd,
}: ScrollTraceOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    // El envoltorio no tiene caja (`display: contents`), asi que ScrollTrigger lo
    // mediria en cero y el trazo saldria entero desde el primer fotograma. Se mide
    // el primer hijo, que es la lista; el numero se sigue publicando en la raiz.
    const trigger = root.firstElementChild;
    if (!trigger) return;

    let mm: MatchMedia | undefined;
    let cancelled = false;

    void loadMotion().then(({ gsap }) => {
      if (cancelled) return;

      mm = gsap.matchMedia();

      mm.add({ ...MOTION_BREAKPOINTS, isReduced: REDUCED_MOTION }, (context) => {
        // Con la preferencia puesta no se toca nada: la hoja ya deja la guia entera
        // en su @media. Un trazo a medias seria peor que ninguno — diria que la
        // lectura va por la mitad cuando no la esta midiendo nadie.
        if (context.conditions?.isReduced) return;

        gsap.fromTo(
          root,
          { [TRACE_PROGRESS_PROPERTY]: 0 },
          {
            [TRACE_PROGRESS_PROPERTY]: 1,
            ease: EASE_LINEAR,
            scrollTrigger: { trigger, start: scrollStart, end: scrollEnd, scrub: DEFAULTS.scrub },
          },
        );
      });
    });

    return () => {
      cancelled = true;
      mm?.revert();
    };
  }, [scrollStart, scrollEnd]);

  return ref;
}
