"use client";

import { useEffect, useRef } from "react";
import { MOTION_BREAKPOINTS, REDUCED_MOTION } from "./breakpoints";
import { loadMotion, type MatchMedia } from "./gsap";

/**
 * Un titular que se entinta palabra a palabra conforme cruza la pantalla.
 *
 * Puerto del ScrollColorText de apta.agency (su fuente, recuperada de su source map):
 * un ScrollTrigger con scrub cuyo progreso dice cuantas palabras van llenas. El color
 * no se interpola en JS — cada palabra salta de un tono al otro y la transicion de la
 * hoja lo suaviza, que es lo que hace el original con su `transition: color`.
 *
 * El reposo es el titular ENTERO a tinta y vive en la hoja: lo que pone este hook es
 * el estado vacio, solo cuando hay movimiento que hacer. Sin JS, con reduced-motion o
 * antes de que gsap llegue, se lee completo.
 */
export const WORD_ATTRIBUTE = "data-word";
export const WORD_FILLED_ATTRIBUTE = "data-filled";

/** Los del original: empieza a llenarse con el titular abajo y acaba antes del centro. */
const DEFAULTS = {
  start: "top 90%",
  end: "top 40%",
  scrub: 0.3,
} as const;

export function useScrollColorWords<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const words = [...root.querySelectorAll<HTMLElement>(`[${WORD_ATTRIBUTE}]`)];
    if (words.length === 0) return;

    let mm: MatchMedia | undefined;
    let cancelled = false;

    void loadMotion().then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return;

      mm = gsap.matchMedia();

      mm.add({ ...MOTION_BREAKPOINTS, isReduced: REDUCED_MOTION }, (context) => {
        if (context.conditions?.isReduced) return;

        const paint = (progress: number) => {
          const filled = Math.floor(progress * words.length);
          words.forEach((word, i) => word.setAttribute(WORD_FILLED_ATTRIBUTE, String(i <= filled)));
        };

        paint(0);

        ScrollTrigger.create({
          trigger: root,
          start: DEFAULTS.start,
          end: DEFAULTS.end,
          scrub: DEFAULTS.scrub,
          onUpdate: (self) => paint(self.progress),
        });

        return () => words.forEach((word) => word.removeAttribute(WORD_FILLED_ATTRIBUTE));
      });
    });

    return () => {
      cancelled = true;
      mm?.revert();
    };
  }, []);

  return ref;
}
