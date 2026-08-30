"use client";

import { useEffect, useRef } from "react";
import { MOTION_BREAKPOINTS, REDUCED_MOTION } from "./breakpoints";
import { loadMotion, type MatchMedia } from "./gsap";

/**
 * Parallax por scroll: el objetivo se desplaza dentro de su disparador mientras
 * este cruza la pantalla.
 *
 * La version de referencia de este efecto expone su configuracion como atributos
 * `data-parallax-*` y un unico `initGlobalParallax()` que barre el documento. Eso
 * existe porque alli el markup se edita en un panel donde no se pueden pasar
 * props — aqui si. Y el barrido tiene un problema propio en React: corre UNA vez
 * al cargar, asi que se queda ciego ante cualquier cosa que monte despues (el
 * panel del menu, un bloque del CMS). Mismas perillas y mismos valores por
 * defecto, como hook: es ademas lo que ya hace la casa con `useCharRoll`.
 *
 * Devuelve DOS refs porque el efecto de fondo los necesita separados: el
 * disparador es la mascara que recorta, y el objetivo el envoltorio mas alto que
 * se mueve por dentro. Sin `targetRef` puesto, se mueve el propio disparador.
 */
export type ParallaxDirection = "vertical" | "horizontal";

/** Breakpoint por debajo del cual el parallax no corre. */
export type ParallaxDisable = "mobile" | "mobileLandscape" | "tablet";

export interface ParallaxOptions {
  /** Posicion inicial del objetivo, en % de su propio tamano. */
  start?: number;
  /** Posicion final. */
  end?: number;
  direction?: ParallaxDirection;
  /**
   * Ata el avance a la barra de scroll. Un numero son los segundos que tarda en
   * alcanzarla; `true` la sigue al instante.
   */
  scrub?: number | boolean;
  /** Posicion de scroll donde empieza, en sintaxis de ScrollTrigger. */
  scrollStart?: string;
  /** Posicion de scroll donde termina. */
  scrollEnd?: string;
  disable?: ParallaxDisable;
}

const DEFAULTS = {
  start: 20,
  end: -20,
  direction: "vertical",
  scrub: true,
  scrollStart: "top bottom",
  scrollEnd: "bottom top",
} as const;

export function useParallax<T extends HTMLElement, U extends HTMLElement>({
  start = DEFAULTS.start,
  end = DEFAULTS.end,
  direction = DEFAULTS.direction,
  scrub = DEFAULTS.scrub,
  scrollStart = DEFAULTS.scrollStart,
  scrollEnd = DEFAULTS.scrollEnd,
  disable,
}: ParallaxOptions = {}) {
  const triggerRef = useRef<T>(null);
  const targetRef = useRef<U>(null);

  // useEffect y no useGSAP: gsap se carga bajo demanda para no viajar en el bundle
  // compartido, y un hook no se puede pedir a mitad de un render. Lo que useGSAP
  // aportaba —revertir los tweens del componente al desmontar— lo hace ya el
  // mm.revert() de la limpieza, que matchMedia necesitaba de todas formas.
  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const target = targetRef.current ?? trigger;
    const prop = direction === "horizontal" ? "xPercent" : "yPercent";

    let mm: MatchMedia | undefined;
    // El componente puede desmontarse mientras gsap viene por la red. Sin esto, el
    // tween se crearia sobre un nodo que ya no esta en el documento y su limpieza
    // no llegaria nunca: la unica pista seria un ScrollTrigger huerfano midiendo en
    // cada scroll para siempre.
    let cancelled = false;

    void loadMotion().then(({ gsap }) => {
      if (cancelled) return;

      // matchMedia y no listeners propios: gsap rehace el tween cuando cambia la
      // condicion y lo revierte cuando deja de cumplirse, incluido el estado que
      // el tween ya habia escrito en el elemento.
      mm = gsap.matchMedia();

      mm.add(
        // El juego ENTERO, incluido isDesktop: sin una condicion abierta por arriba
        // gsap no llama al callback en escritorio. Ver breakpoints.ts.
        { ...MOTION_BREAKPOINTS, isReduced: REDUCED_MOTION },
        (context) => {
          const { isMobile, isMobileLandscape, isTablet, isReduced } = context.conditions ?? {};

          // Decorativo puro: mover el fondo al ritmo del scroll es exactamente lo
          // que esta preferencia pide evitar. Entra como una condicion mas del
          // matchMedia en vez de como una rama aparte, asi que si alguien la
          // cambia en pleno uso el tween se revierte solo.
          if (isReduced) return;

          if (
            (disable === "mobile" && isMobile) ||
            (disable === "mobileLandscape" && isMobileLandscape) ||
            (disable === "tablet" && isTablet)
          ) {
            return;
          }

          gsap.fromTo(
            target,
            { [prop]: start },
            {
              [prop]: end,
              // conformance-exempt: motion-literal — en un tween con scrub la curva la pone la barra de scroll; 'none' es la AUSENCIA de curva, no una segunda conviviendo con la de marca.
              ease: "none",
              scrollTrigger: {
                trigger,
                // clamp() impide que el objetivo arranque ya desplazado cuando el
                // disparador entra en pantalla a medio recorrido — al cargar la
                // pagina con el scroll restaurado, o en un ancla.
                start: `clamp(${scrollStart})`,
                end: `clamp(${scrollEnd})`,
                scrub,
              },
            },
          );
        },
      );
    });

    return () => {
      cancelled = true;
      mm?.revert();
    };
  }, [start, end, direction, scrub, scrollStart, scrollEnd, disable]);

  return { triggerRef, targetRef };
}
