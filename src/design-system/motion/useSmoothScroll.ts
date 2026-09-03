"use client";

import { useEffect } from "react";
import { REDUCED_MOTION } from "./breakpoints";
import { loadMotion } from "./gsap";

/**
 * El scroll suavizado de la pagina.
 *
 * Lenis intercepta la rueda y el teclado y mueve la pagina con inercia en vez de a
 * saltos. No es un adorno: el sitio esta hecho de bloques que entran al llegar a
 * cuadro, y con el scroll a saltos esas entradas se disparan a trompicones.
 *
 * **Se apaga con `prefers-reduced-motion`, y esta es de las que mas importan.** Un
 * scroll que no obedece al gesto exacto de la rueda es de los movimientos que peor
 * sientan a quien tiene sensibilidad vestibular — la pagina sigue moviendose despues
 * de que el dedo pare. Ahi no se suaviza: se devuelve el scroll nativo entero.
 *
 * **En tactil no se toca nada**, y son los defaults de Lenis: `syncTouch` viene
 * apagado. El movil ya trae su propia inercia y suavizar encima la vuelve pastosa.
 *
 * `anchors: true` para que un enlace a `#faq` llegue con el mismo gesto que el resto
 * del scroll. Sin eso, los anclas saltan en seco dentro de una pagina que se desliza.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia(REDUCED_MOTION).matches) return;

    let cancelled = false;
    let stop: (() => void) | undefined;

    /**
     * gsap entra aqui aunque este hook no anime nada, y es a proposito.
     *
     * ScrollTrigger mide la posicion real de las cajas — lo usan el marquee y el
     * parallax del hero — y con el scroll suavizado esa posicion la manda Lenis, no
     * el navegador. Sin cablear los dos, ScrollTrigger lee una pagina que ya no esta
     * donde el cree: el efecto va un fotograma por detras y se nota como temblor.
     *
     * Por eso ademas se conduce Lenis DESDE el ticker de gsap y no con su propio
     * bucle: dos bucles de animacion independientes producen justo ese desfase de un
     * fotograma. `lagSmoothing(0)` apaga la correccion de saltos de gsap, que en un
     * scroll suavizado se pelea con la interpolacion de Lenis.
     */
    void Promise.all([import("lenis"), loadMotion()]).then(
      ([{ default: Lenis }, { gsap, ScrollTrigger }]) => {
        if (cancelled) return;

        const lenis = new Lenis({ anchors: true });
        const advance = (time: number) => {
          // El ticker de gsap cuenta en segundos y Lenis en milisegundos.
          lenis.raf(time * 1000);
        };

        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(advance);
        gsap.ticker.lagSmoothing(0);

        stop = () => {
          gsap.ticker.remove(advance);
          // Los valores de fabrica de gsap: sin devolverlos, cualquier cosa que anime
          // despues de desmontar esto se queda sin correccion de saltos.
          gsap.ticker.lagSmoothing(500, 33);
          lenis.destroy();
        };
      },
    );

    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
}
