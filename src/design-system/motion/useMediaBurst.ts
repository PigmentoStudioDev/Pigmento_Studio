"use client";

import { useCallback, useEffect, useRef } from "react";
import { loadMotion, type Motion } from "./gsap";

/**
 * Un chorro de piezas que brota de una palabra mientras el puntero la senala.
 *
 * Cada cierto tiempo saca una pieza por debajo de la palabra, la deja subir hasta su
 * sitio y la retira encogiendola. No es un carrusel ni una galeria: es una rafaga que
 * dura lo que dura el gesto, y por eso el ritmo — cada cuanto sale una — es la unica
 * perilla que tiene.
 *
 * **Las piezas se RENDERIZAN una vez y se reciclan.** El efecto de referencia crea un
 * nodo con `createElement` cada 150ms y lo borra medio segundo despues; aqui las pinta
 * React y el hook solo las mueve. Son la misma leccion que ya costo una tarde en la
 * galeria del menu: un nodo que React no conoce sobrevive al re-render, se duplica
 * sobre lo duplicado y ninguna limpieza lo alcanza. Ademas insertar en el DOM en cada
 * rafaga fuerza un reflujo por pieza.
 *
 * Con reservarlas basta y sobra: una pieza vive 0.7s y la rafaga tarda todo el ciclo
 * en volver a ella, asi que ninguna se pide dos veces a la vez mientras haya mas
 * piezas que las que caben en ese tiempo.
 *
 * Las toma por ESTRUCTURA — los nodos marcados dentro de la raiz— y no por clase, que
 * es como useMarquee lee sus copias: el componente decide cuantas pinta y como se
 * llaman, y el behavior no tiene por que enterarse.
 */
export interface MediaBurstOptions {
  /**
   * Cada cuanto sale una pieza, en milisegundos. Es ritmo de CONTENIDO —cuantas
   * piezas se ven por segundo— y no motion: las duraciones del gesto viven en el
   * tween, que es de donde las lee el gate.
   */
  intervalMs?: number;
}

const DEFAULT_INTERVAL_MS = 150;

/**
 * La marca que el componente pone en cada pieza reservada. Se exporta para que el
 * TSX la escriba desde aqui: el hook busca por este nombre exacto, y con la cadena
 * copiada a mano un typo deja la rafaga sin piezas y sin un solo error.
 */
export const MEDIA_BURST_PIECE = "data-media-burst-piece";

/** Cuanto sube la pieza al aparecer, en px. Es el gesto entero: brota por debajo. */
const RISE_PX = 50;

/** Dispersion horizontal alrededor de la palabra, en px. Sin ella salen apiladas. */
const SPREAD_PX = 50;

/** Grados de inclinacion, a un lado y a otro. Una pila perfectamente recta no se lee
 *  como un monton de fotos sino como un error de posicionado. */
const TILT_DEG = 10;

const random = (range: number) => (Math.random() - 0.5) * range;

export function useMediaBurst<T extends HTMLElement>({
  intervalMs = DEFAULT_INTERVAL_MS,
}: MediaBurstOptions = {}) {
  const rootRef = useRef<T>(null);
  const motionRef = useRef<Motion | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  /** Por donde va la rotacion de piezas. Sobrevive a la rafaga: dos palabras
   *  seguidas no repiten las mismas fotos. */
  const cursorRef = useRef(0);

  // gsap se pide al montar y no en el primer hover: cargarlo cuando el puntero ya
  // esta encima significa que la primera pieza sale cuando el gesto va por la mitad.
  useEffect(() => {
    let cancelled = false;

    void loadMotion().then((motion) => {
      if (!cancelled) motionRef.current = motion;
    });

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, []);

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = undefined;
  }, []);

  const start = useCallback(
    (word: HTMLElement) => {
      const root = rootRef.current;
      const motion = motionRef.current;
      if (!root || !motion) return;

      /**
       * La preferencia se consulta AQUI y no al montar: quince fotos saltando es el
       * caso de manual de reduced-motion, y quien la cambia a mitad de sesion espera
       * que le haga caso sin recargar.
       */
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const pieces = [...root.querySelectorAll<HTMLElement>(`[${MEDIA_BURST_PIECE}]`)];
      if (pieces.length === 0) return;

      const { gsap } = motion;

      // Las dos cajas se miden en cada rafaga: la palabra cambia de sitio con el
      // scroll y con cada reflujo del texto. Se restan para tener la posicion
      // DENTRO de la raiz, que es el contenedor de las piezas — el efecto de
      // referencia trabaja en coordenadas de pagina y por eso tiene que sumar el
      // scroll a mano.
      const box = word.getBoundingClientRect();
      const rootBox = root.getBoundingClientRect();
      const x = box.left - rootBox.left + box.width / 2;
      const y = box.top - rootBox.top + box.height / 2;

      stop();

      const emit = () => {
        const piece = pieces[cursorRef.current % pieces.length];
        cursorRef.current += 1;

        gsap.killTweensOf(piece);

        gsap.fromTo(
          piece,
          {
            // Centrada en la palabra: la mitad de su propio tamano hacia atras, que
            // es lo que translate en porcentaje sabe hacer y un left/top no.
            xPercent: -50,
            yPercent: -50,
            autoAlpha: 1,
            scale: 1,
            x: x + random(SPREAD_PX),
            y: y + RISE_PX,
            rotation: random(TILT_DEG),
          },
          {
            y,
            rotation: random(TILT_DEG),
            duration: 0.4,
            // conformance-exempt: motion-literal — la curva de la referencia. El rebote es el gesto: la pieza se pasa de largo y vuelve, que es lo que la hace aterrizar en vez de deslizarse.
            ease: "back.out(3)",
          },
        );

        gsap.to(piece, {
          scale: 0.9,
          autoAlpha: 0,
          delay: 0.5,
          duration: 0.2,
          // conformance-exempt: motion-literal — la de salida, del mismo par que la anterior: encoge tomando impulso al reves.
          ease: "back.in(2)",
        });
      };

      emit();
      timerRef.current = setInterval(emit, intervalMs);
    },
    [intervalMs, stop],
  );

  return { rootRef, start, stop };
}
