"use client";

import { useEffect, useRef } from "react";
import { MOTION_BREAKPOINTS, REDUCED_MOTION } from "./breakpoints";
import { loadMotion, type MatchMedia } from "./gsap";

/**
 * El subrayado que se rellena conforme la frase cruza la pantalla.
 *
 * Portado del de Portfolio2026 con los mismos tres cambios de casa que el odometro:
 * props en vez de barrer el documento buscando `[data-scroll-highlight]`, gsap por
 * su unica puerta, y el estado de reposo en la HOJA y no en JS.
 *
 * Ese tercero es el que mas cambia. Alli el relleno arranca poniendo
 * `backgroundSize: 0%` desde JS, asi que entre el primer pintado y la llegada de
 * gsap la marca se ve YA rellena y luego se vacia de golpe. Aqui el 0% lo pone el
 * CSS, gsap solo lo lleva al 100%, y con `prefers-reduced-motion` una @media lo deja
 * relleno sin que nada tenga que preguntar por la preferencia.
 *
 * `scrub` y no una duracion: el relleno ES la barra de scroll, y por eso no lleva
 * curva propia — la pone quien desplaza.
 */
export interface ScrollHighlightOptions {
  scrollStart?: string;
  scrollEnd?: string;
  /** Retardo entre marcas cuando hay varias, en segundos de la linea de tiempo. */
  stagger?: number;
}

const DEFAULTS = {
  scrollStart: "top 85%",
  scrollEnd: "bottom 20%",
  stagger: 0.12,
  scrub: 0.35,
} as const;

/** Lo que el hook rellena. El marcado lo pone el componente. */
export const HIGHLIGHT_ATTR = "data-highlight";

export function useScrollHighlight<T extends HTMLElement>({
  scrollStart = DEFAULTS.scrollStart,
  scrollEnd = DEFAULTS.scrollEnd,
  stagger = DEFAULTS.stagger,
}: ScrollHighlightOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const marcas = root.querySelectorAll<HTMLElement>(`[${HIGHLIGHT_ATTR}]`);
    if (!marcas.length) return;

    let mm: MatchMedia | undefined;
    let cancelled = false;

    void loadMotion().then(({ gsap }) => {
      if (cancelled) return;

      mm = gsap.matchMedia();

      mm.add({ ...MOTION_BREAKPOINTS, isReduced: REDUCED_MOTION }, (context) => {
        // Con la preferencia puesta no se toca nada: la hoja ya deja la marca
        // rellena en su @media, asi que el texto se lee subrayado y quieto.
        if (context.conditions?.isReduced) return;

        const tl = gsap.timeline({
          scrollTrigger: { trigger: root, start: scrollStart, end: scrollEnd, scrub: DEFAULTS.scrub },
        });

        marcas.forEach((marca, i) => {
          tl.to(
            marca,
            {
              backgroundSize: "100% 100%",
              // conformance-exempt: motion-literal — con scrub la curva la pone la barra de scroll; 'none' es la AUSENCIA de curva, no una segunda conviviendo con la de marca.
              ease: "none",
              duration: 1,
            },
            i * stagger,
          );
        });
      });
    });

    return () => {
      cancelled = true;
      mm?.revert();
    };
  }, [scrollStart, scrollEnd, stagger]);

  return ref;
}
