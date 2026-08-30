"use client";

import { useEffect, useRef } from "react";
import { loadMotion, type Motion } from "./gsap";

/**
 * Parte una etiqueta en caracteres para que el CSS pueda escalonarlos.
 *
 * El movimiento no vive aqui: lo hacen transiciones sobre :hover y :focus-visible,
 * que se revierten solas a mitad de camino. Un tween tendria que reimplementar eso
 * en el hilo de JS.
 *
 * `autoSplit` re-parte al llegar la fuente buena — es local y con display: swap, asi
 * que el texto cambia de ancho. `propIndex` emite --char, que es lo que lee el
 * retardo en la hoja.
 *
 * `aria: "none"` porque el modo automatico pone aria-label en el elemento partido, y
 * es un <span> sin rol: ahi aria-label esta prohibido. El nombre lo pone el control
 * que envuelve, que es quien puede llevarlo.
 *
 * `enabled` evita partir texto que nunca va a rodar: rompe las busquedas por texto y
 * cambia el arbol de accesibilidad a cambio de nada.
 *
 * SplitText llega por `import()` y no estatico, y ese detalle es el que mas pesaba
 * del sitio: este hook lo usan Button y NavLinkList, las dos dentro de la cabecera,
 * y la cabecera la monta el layout raiz. Con import estatico, gsap viajaba en el
 * bundle COMPARTIDO de todas las rutas — 47.7kb gzip sobre un presupuesto de 230,
 * pagados incluso por una pagina sin una sola animacion.
 *
 * Que el texto se parta un instante tarde no se ve: en reposo un texto partido y uno
 * entero se dibujan igual, y el gesto no existe hasta que alguien pasa por encima.
 */
export function useCharRoll<T extends HTMLElement>(text: string, enabled = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current || !enabled) return;

    let split: ReturnType<Motion["SplitText"]["create"]> | undefined;
    // El elemento puede desmontarse mientras SplitText viene por la red. Sin esto,
    // se partiria un nodo que ya no esta en el documento y su revert no llegaria.
    let cancelled = false;

    void loadMotion().then(({ SplitText }) => {
      if (cancelled || !ref.current) return;

      split = SplitText.create(ref.current, {
        type: "chars",
        tag: "span",
        charsClass: "pg-char",
        aria: "none",
        autoSplit: true,
        propIndex: true,
      });
    });

    // revert() y no kill(): kill deja los <span> puestos, y React no sabe que
    // estan ahi. El siguiente montaje partiria texto ya partido.
    return () => {
      cancelled = true;
      split?.revert();
    };
  }, [text, enabled]);

  return ref;
}
