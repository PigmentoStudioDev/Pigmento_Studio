"use client";

import { useEffect, useRef } from "react";
import { REDUCED_MOTION } from "./breakpoints";
import { loadMotion, type Motion } from "./gsap";

/**
 * El gesto de entrada por scroll: lo que hay debajo del pliegue llega cuando le toca.
 *
 * Dos formas de llegar, y la diferencia no es de gusto sino de que se puede partir:
 *
 *   `lines` / `words` — el texto se parte y cada trozo entra desde debajo de su
 *   propio recorte. Es el gesto bueno, y solo vale para texto corrido.
 *
 *   `block` — la caja sube un poco y aparece, y los hermanos se escalonan. Es para
 *   todo lo demas: una pildora, una fila de enlaces, una rejilla de retratos. Partir
 *   por lineas una caja flex mete un envoltorio de bloque entre el contenedor y sus
 *   hijos y le deshace la fila; y una foto no tiene lineas que partir.
 *
 * **El movimiento no vive aqui.** El JS hace las dos cosas que el CSS no sabe —partir
 * un parrafo por lineas, que depende de como caiga el texto, y saber cuando el bloque
 * entra en cuadro— y publica el estado en un atributo. Distancia, duracion, curva y
 * desfase son transiciones de `_app.scss`, donde el gate de motion las lee sobre el
 * CSS compilado y donde `prefers-reduced-motion` se resuelve en una `@media`. Es el
 * mismo reparto que en RadialGallery.
 *
 * Y tiene una ventaja que se ve al re-partir: `autoSplit` rehace las lineas cuando
 * llega la fuente buena o cambia el ancho. Con un tween `from()` —que es como lo hace
 * el efecto de referencia— cada re-particion vuelve a animar un bloque que ya habia
 * entrado. Con el estado en el contenedor, las lineas nuevas nacen en su sitio porque
 * heredan el selector.
 *
 * IntersectionObserver y no ScrollTrigger: la pregunta es "esta a la vista", que es
 * lo que el observador contesta sin medir posiciones en cada scroll. En modo `block`
 * ademas no se carga gsap: no hay nada que partir.
 */
export type ScrollRevealBy = "lines" | "words" | "block";

export interface ScrollRevealOptions {
  /**
   * Que se mueve. No hay `chars`, y es una decision: el nivel de caracter ya tiene un
   * gesto en este sitio —el rodado de los controles— y dos gestos distintos sobre la
   * misma unidad se leen como dos sistemas.
   */
  by?: ScrollRevealBy;
  /**
   * El grupo son los hijos del HIJO, no el hijo.
   *
   * Es para una lista o una rejilla, donde el envoltorio no puede meterse entre el
   * contenedor y sus items: un <div> dentro de un <ul> no es HTML valido y rompe la
   * lista para quien la escucha. Con esto el envoltorio se queda fuera y el desfase
   * lo reparten igualmente las celdas.
   */
  inner?: boolean;
}

/** Las clases que crea el partido. Globales, en `_app.scss`, como `.pg-char`. */
const LINE_CLASS = "pg-line";
const WORD_CLASS = "pg-word";

/** El estado, legible desde el CSS: `idle` esperando su turno, `revealed` dentro. */
const STATE_ATTRIBUTE = "data-reveal";

/**
 * El sitio de cada pieza en la cola, que es lo que lee el retardo en la hoja. El paso
 * es un token de la escala; aqui solo viaja el orden, igual que en `Reveal`.
 */
const INDEX_PROPERTY = "--pg-reveal-index";

/** Y como llega, que decide QUE se mueve: la caja o los trozos de dentro. */
const MODE_ATTRIBUTE = "data-reveal-mode";

/**
 * Cuanto tiene que asomar el bloque para contar como visible. Un cuarto y no el
 * primer pixel: con el umbral en cero, un bloque alto empieza a entrar cuando solo se
 * ve su borde superior y la coreografia se gasta fuera de cuadro.
 *
 * Se calcula contra la caja, asi que en un bloque mas alto que la ventana nunca
 * llegaria a cumplirse: por eso el observador lleva tambien un margen negativo
 * abajo, que es la otra forma de preguntar lo mismo — "ya ha entrado un poco".
 */
const VISIBLE_RATIO = 0.25;
const VISIBLE_MARGIN = "0px 0px -10% 0px";

/**
 * Lo que YA se esta mirando no entra: se queda donde esta.
 *
 * Sin esto, un bloque que cae dentro de la primera pantalla se pinta en su sitio, el
 * efecto lo esconde al montar y lo vuelve a traer — un parpadeo justo en lo unico que
 * el visitante estaba leyendo. Y ademas es lo honesto: este es el gesto de lo que
 * LLEGA al bajar; para lo que ya esta en cuadro al cargar existe `Reveal`, que entra
 * al montar.
 */
function alreadyInView(element: HTMLElement): boolean {
  const box = element.getBoundingClientRect();

  return box.top < window.innerHeight && box.bottom > 0;
}

export function useScrollReveal<T extends HTMLElement>({
  by = "lines",
  inner = false,
}: ScrollRevealOptions = {}) {
  const rootRef = useRef<T>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    /**
     * Con la preferencia puesta no se parte nada, en vez de partir y no animar.
     * Partir tiene su propio coste —nodos de mas y un texto que algunos lectores leen
     * a trozos— y no hay razon para pagarlo cuando no va a haber gesto.
     */
    if (window.matchMedia(REDUCED_MOTION).matches) return;

    // Los bloques se toman por ESTRUCTURA — los hijos del envoltorio — y no por una
    // clase: quien lo usa decide que mete dentro, y este hook no tiene por que
    // enterarse de como se llaman sus cosas. Es como useMarquee lee sus copias.
    const container = inner ? (root.firstElementChild ?? root) : root;
    const blocks = [...container.children].filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    if (blocks.length === 0) return;

    let splits: ReturnType<Motion["SplitText"]["create"]>[] = [];
    let observer: IntersectionObserver | undefined;
    let cancelled = false;

    const watch = () => {
      /**
       * En modo caja el grupo entra JUNTO y escalonado, no pieza a pieza segun cada
       * una asoma: son hermanos de la misma rejilla o de la misma fila, y si cada uno
       * esperase su turno de scroll, una rejilla ancha entraria por columnas — que no
       * es un gesto, es un fallo de sincronia. Dispara la primera y las demas la
       * siguen con su retardo.
       *
       * Partiendo por lineas es al reves: cada bloque de texto se vigila a si mismo,
       * porque leer es secuencial y cada parrafo entra cuando llega.
       */
      const targets =
        by === "block"
          ? new Map<HTMLElement, HTMLElement[]>([[blocks[0], blocks]])
          : new Map(blocks.map((block) => [block, [block]]));

      blocks.forEach((block, index) => {
        if (by !== "block") return;

        block.setAttribute(MODE_ATTRIBUTE, "block");
        block.style.setProperty(INDEX_PROPERTY, String(index));
      });

      // Sin observador —un entorno que no lo trae— todo se da por revelado: el
      // contenido visible importa mas que el gesto.
      const observable = typeof IntersectionObserver !== "undefined";

      const pending = [...targets].filter(([watched, revealed]) => {
        if (!observable || alreadyInView(watched)) {
          revealed.forEach((block) => block.setAttribute(STATE_ATTRIBUTE, "revealed"));
          return false;
        }

        revealed.forEach((block) => block.setAttribute(STATE_ATTRIBUTE, "idle"));
        return true;
      });

      if (pending.length === 0) return;

      observer = new IntersectionObserver(
        (entries, self) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            targets
              .get(entry.target as HTMLElement)
              ?.forEach((block) => block.setAttribute(STATE_ATTRIBUTE, "revealed"));

            // Una vez dentro, ya esta: un texto que se re-anima cada vez que se pasa
            // por delante convierte el scroll en un parpadeo.
            self.unobserve(entry.target);
          });
        },
        { threshold: VISIBLE_RATIO, rootMargin: VISIBLE_MARGIN },
      );

      pending.forEach(([watched]) => observer?.observe(watched));
    };

    if (by === "block") {
      watch();
    } else {
      /**
       * Medir antes de que llegue la fuente buena parte por lineas que despues no son
       * esas: el texto cambia de ancho al cargar la tipografia y las lineas se
       * recolocan a mitad del gesto. `autoSplit` lo corregiria solo, pero se ahorra el
       * doble trabajo esperando.
       */
      void Promise.all([loadMotion(), document.fonts?.ready ?? Promise.resolve()]).then(
        ([{ SplitText }]) => {
          if (cancelled) return;

          splits = blocks.map((block) =>
            SplitText.create(block, {
              // Lo minimo que hace falta: para mover lineas no hay que llegar a las
              // palabras. Cada nivel de mas son nodos de mas en el DOM.
              type: by === "words" ? "lines, words" : "lines",
              // El recorte que hace que la linea entre desde fuera en vez de aparecer
              // en su sitio. Lo pone SplitText envolviendo cada linea en una copia de
              // si misma con overflow, que es lo que ningun CSS puede hacer solo.
              mask: "lines",
              autoSplit: true,
              tag: "span",
              linesClass: LINE_CLASS,
              wordsClass: WORD_CLASS,
              // El indice de cada trozo, que es lo que lee el desfase en la hoja.
              propIndex: true,
              /**
               * `aria: "none"` por lo mismo que en useCharRoll: el modo automatico
               * pone `aria-label` en el elemento partido, y en un parrafo —o en
               * cualquier elemento sin rol— ese atributo esta prohibido. Sin tocar
               * aria, el texto se sigue leyendo de sus propios trozos.
               */
              aria: "none",
            }),
          );

          watch();
        },
      );
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      // revert() y no kill(): kill deja los <span> puestos y React no sabe que estan
      // ahi, asi que el siguiente montaje partiria texto ya partido.
      splits.forEach((instance) => instance.revert());
      blocks.forEach((block) => {
        block.removeAttribute(STATE_ATTRIBUTE);
        block.removeAttribute(MODE_ATTRIBUTE);
        block.style.removeProperty(INDEX_PROPERTY);
      });
    };
  }, [by, inner]);

  return rootRef;
}
