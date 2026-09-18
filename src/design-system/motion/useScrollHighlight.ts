"use client";

import { useEffect, useRef } from "react";
import { MOTION_BREAKPOINTS, REDUCED_MOTION } from "./breakpoints";
import { loadMotion, type MatchMedia } from "./gsap";

/**
 * El resaltado que se rellena conforme el texto cruza la pantalla.
 *
 * Portado del de Portfolio2026 con los cambios de casa: props en vez de barrer el
 * documento, gsap por su unica puerta, y el reposo en la HOJA y no en JS.
 *
 * **No anima las marcas: anima un numero.** Publica el progreso en
 * `--pg-highlight-progress` sobre la raiz, y cada <mark> lo lee de su antepasado. Es
 * lo que le permite convivir con el reveal por lineas: SplitText corta una marca que
 * cruza dos lineas en dos copias, y vuelve a cortar al cambiar el ancho. Una marca
 * apuntada al montar dejaria de estar en el DOM; un numero heredado les llega a las
 * copias que haya en cada momento.
 *
 * `scrub` y no una duracion: el relleno ES la barra de scroll, y por eso no lleva
 * curva propia — la pone quien desplaza.
 */
export interface ScrollHighlightOptions {
  scrollStart?: string;
  scrollEnd?: string;
}

const DEFAULTS = {
  scrollStart: "top 85%",
  scrollEnd: "bottom 20%",
  scrub: 0.35,
} as const;

export const HIGHLIGHT_PROGRESS_PROPERTY = "--pg-highlight-progress";

/**
 * Lo primero con caja, bajando por el primer hijo. Un envoltorio con `display:
 * contents` no tiene caja y ScrollTrigger lo mediria en cero —el relleno saldria
 * completo desde el principio—, y aqui van dos seguidos: este y el del reveal. El
 * numero se sigue poniendo en la raiz, que es de quien lo heredan las marcas.
 */
function boxedElement(root: Element): Element | null {
  let element: Element | null = root;
  while (element && element.getClientRects().length === 0) element = element.firstElementChild;
  return element;
}

export function useScrollHighlight<T extends HTMLElement>({
  scrollStart = DEFAULTS.scrollStart,
  scrollEnd = DEFAULTS.scrollEnd,
}: ScrollHighlightOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !root.querySelector("mark")) return;

    const trigger = boxedElement(root);
    if (!trigger) return;

    let mm: MatchMedia | undefined;
    let cancelled = false;

    void loadMotion().then(({ gsap }) => {
      if (cancelled) return;

      mm = gsap.matchMedia();

      mm.add({ ...MOTION_BREAKPOINTS, isReduced: REDUCED_MOTION }, (context) => {
        // Con la preferencia puesta no se toca nada: la hoja ya deja la marca
        // rellena en su @media.
        if (context.conditions?.isReduced) return;

        gsap.fromTo(
          root,
          { [HIGHLIGHT_PROGRESS_PROPERTY]: 0 },
          {
            [HIGHLIGHT_PROGRESS_PROPERTY]: 1,
            // conformance-exempt: motion-literal — con scrub la curva la pone la barra de scroll; 'none' es la AUSENCIA de curva, no una segunda conviviendo con la de marca.
            ease: "none",
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
