"use client";

import { useEffect, useRef, useState } from "react";
import { MOTION_BREAKPOINTS, REDUCED_MOTION } from "./breakpoints";
import { loadMotion, type MatchMedia } from "./gsap";

/**
 * La barra de promos: cada fila en bucle horizontal, en sentidos opuestos, y al bajar
 * la primera sale por arriba mientras entra la segunda.
 *
 * El relevo de filas va atado a la barra de scroll y no a un temporizador: quien se
 * queda leyendo el hero lee el primer mensaje entero, y el segundo llega cuando ya
 * esta bajando, que es cuando tiene sentido cambiar de tema.
 *
 * La posicion de partida de la segunda fila (abajo, fuera de cuadro) la pone el CSS y
 * no este hook. Asi, sin JS o con reduced-motion, la barra ensena el primer mensaje
 * quieto en vez de dos filas encimadas.
 */

/** px/s. Mas lento que la tira de logos: esto se LEE, no se mira pasar. */
const LOOP_SPEED = 30;

/** Con una sola copia el bucle descubre un hueco entero cada vuelta. */
const MIN_COPIES = 2;

/** Cuanto scroll dura el relevo de filas, en alturas de ventana. */
const ROLL_VIEWPORTS = 1;

function whenMeasurable(): Promise<unknown> {
  return document.fonts?.ready ?? Promise.resolve();
}

export function useTopBar<T extends HTMLElement>() {
  const rootRef = useRef<T>(null);
  const [copies, setCopies] = useState(MIN_COPIES);

  // Cuantas copias hacen falta es una medida: la ventana mas una copia entera, para
  // que la que sale por un lado ya este entrando por el otro. Solo sube.
  useEffect(() => {
    const first = rootRef.current?.querySelector<HTMLElement>("[data-topbar-collection]");
    if (!first) return;

    const measure = () => {
      const width = first.offsetWidth;
      if (!width) return;
      const needed = Math.ceil(window.innerWidth / width) + 1;
      setCopies((current) => (needed > current ? needed : current));
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-topbar-row]"));
    if (rows.length === 0) return;

    let mm: MatchMedia | undefined;
    let cancelled = false;

    void Promise.all([loadMotion(), whenMeasurable()]).then(([{ gsap }]) => {
      if (cancelled) return;

      mm = gsap.matchMedia();

      mm.add({ ...MOTION_BREAKPOINTS, isReduced: REDUCED_MOTION }, (context) => {
        if (context.conditions?.isReduced) return;

        rows.forEach((row, index) => {
          const collections = Array.from(
            row.querySelectorAll<HTMLElement>("[data-topbar-collection]"),
          );
          if (collections.length === 0) return;

          const duration = (collections[0].offsetWidth || 1) / LOOP_SPEED;
          // Las filas pares van a la izquierda y las impares a la derecha: dos
          // mensajes que se cruzan se leen como dos, no como uno repetido.
          const toLeft = index % 2 === 0;

          gsap.fromTo(
            collections,
            { xPercent: toLeft ? 0 : -100 },
            {
              xPercent: toLeft ? -100 : 0,
              repeat: -1,
              duration,
              // conformance-exempt: motion-literal — un bucle a velocidad constante no lleva curva; 'none' es la AUSENCIA de ease.
              ease: "none",
            },
          );
        });

        if (rows.length > 1) {
          gsap.to(rows, {
            yPercent: -100,
            // conformance-exempt: motion-literal — atado al scrub, la curva la pone la barra de scroll.
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: () => `+=${window.innerHeight * ROLL_VIEWPORTS}`,
              scrub: true,
            },
          });
        }
      });
    });

    return () => {
      cancelled = true;
      mm?.revert();
    };
  }, [copies]);

  return { rootRef, copies };
}
