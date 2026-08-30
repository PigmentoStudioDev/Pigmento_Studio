"use client";

import { useEffect, useRef, useState } from "react";
import { MOTION_BREAKPOINTS, REDUCED_MOTION } from "./breakpoints";
import { loadMotion, type MatchMedia } from "./gsap";

/**
 * Tira infinita que invierte su sentido segun hacia donde se desplace la pagina.
 *
 * Son DOS movimientos superpuestos y conviene no confundirlos: el bucle, que corre
 * solo a velocidad constante, y un empujon atado a la barra de scroll que desplaza
 * la tira entera. El primero da la vida; el segundo es el que hace que bajar y
 * subir se noten distintos.
 *
 * La inversion es solo un cambio de signo en el `timeScale` del bucle. No se
 * reconstruye nada: el tween sigue siendo el mismo y cambia de sentido a mitad de
 * camino, que es lo que evita el salto de un reinicio.
 */
export type MarqueeDirection = "left" | "right";

export interface MarqueeOptions {
  direction?: MarqueeDirection;
  /** Copias MINIMAS. El hook sube el numero si hacen falta mas para cubrir. */
  minCopies?: number;
  /**
   * Velocidad en PIXELES POR SEGUNDO, no segundos por vuelta.
   *
   * Es la diferencia entre un ritmo y un numero arbitrario: en segundos por vuelta,
   * una tira de cuatro logos y otra de doce se mueven a velocidades distintas con el
   * mismo valor, porque tardan lo mismo en recorrer distancias distintas. En px/s el
   * numero significa siempre lo mismo, y por eso tampoco hace falta corregirlo por
   * breakpoint: la velocidad absoluta es lo que se lee como calma.
   */
  speed?: number;
  /** Cuanto acelera con el scroll, en vw. Cuanto mayor, mas empujon. */
  scrollSpeed?: number;
}

/** Con una sola copia el bucle descubre un hueco entero cada vuelta. */
const MIN_COPIES = 2;

const DEFAULTS = {
  direction: "left",
  speed: 40,
  scrollSpeed: 6,
} as const;

/**
 * Medir antes de que llegue la fuente buena da un ancho equivocado, y ese ancho es
 * justo el que decide donde cierra el bucle: la tira salta una vez al cargar, cuando
 * ya nadie esta mirando el codigo. Las imagenes no entran aqui — llevan ancho y alto
 * declarados, asi que su caja esta reservada desde el primer pintado.
 */
function whenMeasurable(): Promise<unknown> {
  return document.fonts?.ready ?? Promise.resolve();
}

export function useMarquee<T extends HTMLElement, U extends HTMLElement>({
  direction = DEFAULTS.direction,
  speed = DEFAULTS.speed,
  scrollSpeed = DEFAULTS.scrollSpeed,
  minCopies = MIN_COPIES,
}: MarqueeOptions = {}) {
  const rootRef = useRef<T>(null);
  const scrollRef = useRef<U>(null);
  // El minimo no es negociable: con una sola copia el bucle descubre un hueco
  // entero cada vuelta, pida lo que pida quien lo monta.
  const [copies, setCopies] = useState(Math.max(minCopies, MIN_COPIES));

  /**
   * Cuantas copias hacen falta NO es una decision de diseno, es una medida: la tira
   * tiene que cubrir la ventana MAS una copia entera, porque la que sale por un lado
   * debe estar entrando entera por el otro. Un numero fijo acierta a un ancho y deja
   * hueco en el siguiente — y el hueco solo aparece a mitad de vuelta.
   *
   * Solo sube, nunca baja. Al encoger la ventana las copias de mas se quedan fuera
   * de cuadro sin coste, y bajar el numero abriria la puerta a que una medida y un
   * render se persigan el uno al otro.
   */
  useEffect(() => {
    const scroll = scrollRef.current;
    const first = scroll?.firstElementChild as HTMLElement | null;
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
    const scroll = scrollRef.current;
    if (!root || !scroll) return;

    // Las colecciones se toman por ESTRUCTURA — los hijos del carril — y no por
    // clase. El componente decide cuantas copias renderiza, y el behavior no tiene
    // por que enterarse de cuantas son ni de como se llaman.
    const collections = Array.from(scroll.children) as HTMLElement[];
    if (collections.length === 0) return;

    const sign = direction === "right" ? 1 : -1;

    let mm: MatchMedia | undefined;
    let cancelled = false;

    void Promise.all([loadMotion(), whenMeasurable()]).then(([{ gsap, ScrollTrigger }]) => {
      if (cancelled) return;

      mm = gsap.matchMedia();

      mm.add(
        // El juego ENTERO, aunque aqui solo se lean tres: lo que hace falta es que
        // algun ancho coincida siempre, o gsap no llama al callback. Ver breakpoints.ts.
        { ...MOTION_BREAKPOINTS, isReduced: REDUCED_MOTION },
        (context) => {
          const { isReduced } = context.conditions ?? {};

          // Decorativo y en bucle infinito: el caso de manual de esta preferencia.
          // Sin animacion la tira se queda quieta con sus items a la vista, que es
          // el estado que ya pinta el CSS por su cuenta.
          if (isReduced) return;

          // La duracion sale de la DISTANCIA entre el ancho de una copia y la
          // velocidad pedida. Asi el numero es un ritmo y no un tiempo: anadir logos
          // alarga la tira y alarga la vuelta, pero no la acelera.
          const width = collections[0].offsetWidth || 1;
          const duration = width / speed;

          // El carril se ensancha y se recentra para tener margen por los dos lados:
          // el empujon del scroll lo mueve, y sin ese sobrante descubriria un hueco
          // en el extremo hacia el que empuja.
          scroll.style.marginLeft = `${-scrollSpeed}%`;
          scroll.style.width = `${scrollSpeed * 2 + 100}%`;

          const loop = gsap
            .to(collections, {
              xPercent: -100,
              repeat: -1,
              duration,
              // conformance-exempt: motion-literal — un bucle a velocidad constante no lleva curva; 'linear' es la AUSENCIA de ease, no una segunda conviviendo con la de marca.
              ease: "linear",
            })
            // A mitad del recorrido: asi la tira arranca ya poblada por los dos
            // lados en vez de entrar en cuadro desde un borde vacio.
            .totalProgress(0.5);

          gsap.set(collections, { xPercent: sign === 1 ? 100 : -100 });
          loop.timeScale(sign);

          const directionTrigger = ScrollTrigger.create({
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
              // Bajando invierte, subiendo recupera su sentido. El atributo deja el
              // estado legible desde el CSS, para lo que quiera reaccionar a el.
              const inverted = self.direction === 1;
              loop.timeScale(inverted ? -sign : sign);
              root.setAttribute("data-marquee-status", inverted ? "inverted" : "normal");
            },
          });

          const push = gsap.timeline({
            scrollTrigger: {
              trigger: root,
              start: "0% 100%",
              end: "100% 0%",
              scrub: 0,
            },
          });

          const from = sign === -1 ? scrollSpeed : -scrollSpeed;

          push.fromTo(
            scroll,
            { x: `${from}vw` },
            {
              x: `${-from}vw`,
              // conformance-exempt: motion-literal — atado al scrub, la curva la pone la barra de scroll.
              ease: "none",
            },
          );

          return () => {
            directionTrigger.kill();
            push.kill();
            loop.kill();
            scroll.style.marginLeft = "";
            scroll.style.width = "";
            root.removeAttribute("data-marquee-status");
          };
        },
      );
    });

    return () => {
      cancelled = true;
      mm?.revert();
    };
  }, [direction, speed, scrollSpeed, copies]);

  return { rootRef, scrollRef, copies };
}
