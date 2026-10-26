"use client";

import { useEffect, useRef } from "react";
import { REDUCED_MOTION } from "../../../motion/breakpoints";
import { loadMotion } from "../../../motion/gsap";
import styles from "./PaperSurface.module.scss";

/**
 * Fondo de papel para una superficie oscura o clara: grano, estela del puntero,
 * anillos al clic, parallax de scroll y un pulso, en WebGL2. Es el papel del hero
 * del portfolio de Karen, portado tal cual: el motor no sabe de que sitio es.
 *
 * Va como primer hijo de una superficie con `position: relative` e
 * `isolation: isolate`; la llena y queda bajo su contenido. La estela y los anillos se
 * escuchan en esa superficie, y los clics sobre controles (campos, botones) no dejan
 * anillo: el clic es del control.
 *
 * El motor llega con `import()` y despues de gsap: son ~10 KB que no entran en el JS
 * inicial, y la placa ya se ve bien antes con su grano CSS. Sin WebGL2, con el
 * contexto perdido o si el gobernador lo retira por lentitud, el grano CSS se queda.
 * Con reduced motion el papel es estatico; al cambiar esa preferencia el canvas se
 * rehace, porque un canvas cuyo contexto se libero no puede pedir otro.
 */
export interface PaperSurfaceProps {
  /**
   * El ancestro que recibe el puntero, como selector para `closest()`. Sin el, el
   * padre: es lo que vale cuando el papel cuelga de la superficie que se toca.
   */
  hostSelector?: string;
}

export function PaperSurface({ hostSelector }: PaperSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const query = window.matchMedia(REDUCED_MOTION);
    let stop: (() => void) | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let run = 0;

    const teardown = () => {
      stop?.();
      stop = null;
      canvas?.remove();
      canvas = null;
    };

    const start = async () => {
      const ticket = ++run;
      teardown();
      const [{ paperHasRetreated, startPaper }, motion] = await Promise.all([import("../../../motion/paper/engine"), loadMotion()]);
      // Un arranque mas nuevo (o el desmontaje) gano mientras se descargaba el motor.
      if (ticket !== run || paperHasRetreated()) return;
      canvas = document.createElement("canvas");
      canvas.className = styles.canvas;
      container.append(canvas);
      const host = hostSelector ? (container.closest<HTMLElement>(hostSelector) ?? undefined) : undefined;
      stop = startPaper(container, canvas, { reducedMotion: query.matches, ticker: motion.gsap.ticker, host });
      // Un contexto alpha:false que no llego a dibujar se ve negro: se oculta y manda el CSS.
      if (!stop) canvas.hidden = true;
    };

    const restart = () => {
      start().catch((error: unknown) => console.warn("[paper] no arranco, se queda el grano CSS", error));
    };

    restart();
    query.addEventListener("change", restart);
    return () => {
      run += 1;
      query.removeEventListener("change", restart);
      teardown();
    };
  }, [hostSelector]);

  return <div ref={containerRef} className={styles.paper} aria-hidden="true" />;
}
