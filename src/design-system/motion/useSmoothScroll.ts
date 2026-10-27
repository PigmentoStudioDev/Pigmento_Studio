"use client";

import { useEffect } from "react";
import { REDUCED_MOTION } from "./breakpoints";
import { loadMotion, watchPageHeight } from "./gsap";

/**
 * El scroll suavizado de la pagina.
 *
 * Lenis intercepta la rueda y mueve la pagina con inercia en vez de a saltos. El
 * teclado y la barra de scroll siguen siendo nativos: Lenis solo escucha wheel y touch. No es un adorno: el sitio esta hecho de bloques que entran al llegar a
 * cuadro, y con el scroll a saltos esas entradas se disparan a trompicones.
 *
 * **Con `prefers-reduced-motion` no suaviza, y esta es de las que mas importan.** Un
 * scroll que no obedece al gesto exacto de la rueda es de los movimientos que peor
 * sientan a quien tiene sensibilidad vestibular — la pagina sigue moviendose despues
 * de que el dedo pare. Con la preferencia ya puesta al cargar no se monta nada y el
 * scroll es el nativo entero; si se activa a mitad de visita, Lenis deja de suavizar
 * solo (ver el efecto de abajo).
 *
 * **En tactil no se toca nada**, y son los defaults de Lenis: `syncTouch` viene
 * apagado. El movil ya trae su propia inercia y suavizar encima la vuelve pastosa.
 *
 * `anchors: true` para que un enlace a `#faq` llegue con el mismo gesto que el resto
 * del scroll. Sin eso, los anclas saltan en seco dentro de una pagina que se desliza.
 */
/**
 * La instancia viva, para quien necesite desplazar la pagina a mano. Con Lenis
 * activo, un `window.scrollTo` nativo compite con su interpolacion y la pagina da un
 * tiron; sin Lenis (antes de cargar) el nativo es lo correcto, sin animar si la
 * preferencia pide no moverse.
 */
let active: { scrollTo: (target: number) => void } | undefined;

export function scrollToY(y: number): void {
  if (active) {
    active.scrollTo(y);
    return;
  }

  const reduced = window.matchMedia(REDUCED_MOTION).matches;
  window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
}

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
     *
     * **La preferencia a mitad de visita la resuelve Lenis**, sin escucharla aqui: desde
     * la 1.3.26 lee `prefers-reduced-motion` en cada frame (`respectReducedMotion`,
     * activo por defecto), el scroll pasa a 1:1 y los saltos programados son
     * instantaneos. Destruirlo al cambiar daria el mismo scroll y ademas cortaria la
     * sincronia con ScrollTrigger (darkroomengineering/lenis#534).
     */
    void Promise.all([import("lenis"), loadMotion()]).then(
      ([{ default: Lenis }, { gsap, ScrollTrigger }]) => {
        if (cancelled) return;

        // `stopInertiaOnNavigate`: mientras Lenis interpola, un window.scrollTo no lo
        // interrumpe (lenis#452), y el salto arriba de Next al navegar con <Link> se
        // perdia: la pagina nueva abria a media altura.
        const lenis = new Lenis({ anchors: true, stopInertiaOnNavigate: true });
        active = lenis;
        const advance = (time: number) => {
          // El ticker de gsap cuenta en segundos y Lenis en milisegundos.
          lenis.raf(time * 1000);
        };

        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(advance);
        gsap.ticker.lagSmoothing(0);

        const stopWatching = watchPageHeight(() => {
          // Lenis primero: su limite se recalcula con 250 ms de espera propia, y si
          // ScrollTrigger mide antes, el scroll queda recortado al alto viejo.
          lenis.resize();
          // HACK: gsap 3.15.0 (greensock/GSAP#655) restaura una posicion de scroll vieja
          // si refresh() llega justo despues de UN evento de scroll, que es lo que deja
          // la navegacion de Next. Dos eventos lo evitan. Quitar al subir de 3.15.0.
          window.dispatchEvent(new Event("scroll"));
          window.dispatchEvent(new Event("scroll"));
          ScrollTrigger.refresh(true);
        });

        stop = () => {
          stopWatching();
          gsap.ticker.remove(advance);
          // Los valores de fabrica de gsap: sin devolverlos, cualquier cosa que anime
          // despues de desmontar esto se queda sin correccion de saltos.
          gsap.ticker.lagSmoothing(500, 33);
          if (active === lenis) active = undefined;
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
