"use client";

import { useEffect, useRef } from "react";
import { REDUCED_MOTION } from "./breakpoints";
import { loadMotion } from "./gsap";

/**
 * La vista previa que acompana al puntero por una lista de servicios.
 *
 * Es el efecto de la referencia tal cual, con gsap: la caja sigue la altura del
 * puntero con un `quickTo` que llega con retraso, y cada fila que se pisa apila una
 * capa nueva que entra en cortina — el marco baja desde arriba mientras la imagen
 * sube desde abajo, y el cruce de los dos es lo que se lee como un barrido.
 *
 * Las capas se crean a mano dentro de la caja y no con React, igual que alli: son
 * decoracion efimera, una por cada fila pisada, y React no pinta nada dentro de esa
 * caja, asi que no hay nada que reconciliar. Al salir de la lista se vacia.
 *
 * Tres cambios de casa y ninguno toca el gesto: gsap entra por su unica puerta, la Y
 * se mide contra la raiz y no contra la pagina —la seccion no empieza arriba del
 * documento—, y sin puntero que pase por encima o con reduced-motion no hay vista
 * previa. Es decoracion: las filas se leen y navegan igual sin ella.
 */

/** Las capas que se conservan. Por encima de este numero la mas vieja sale del DOM. */
const MAX_LAYERS = 20;

const CAN_HOVER = "(hover: hover)";

export const SERVICE_PREVIEW_ON = "data-preview-on";

export function useServicePreview<T extends HTMLElement>() {
  const rootRef = useRef<T>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const list = root.querySelector<HTMLElement>("[data-preview-list]");
    const container = root.querySelector<HTMLElement>("[data-preview-container]");
    const rows = [...root.querySelectorAll<HTMLElement>("[data-preview-row]")];
    // Las imagenes van precargadas en la hoja, como en la referencia: la capa pide la
    // que el navegador ya eligio y descargo, y la cortina no arranca sobre un hueco.
    const sources = [...root.querySelectorAll<HTMLImageElement>("[data-preview-media] img")];
    if (!list || !container || rows.length === 0) return;

    let cancelled = false;
    let cleanup = () => {};

    void loadMotion().then(({ gsap }) => {
      if (cancelled) return;

      const enabled = () => window.matchMedia(CAN_HOVER).matches && !window.matchMedia(REDUCED_MOTION).matches;

      gsap.set(container, { yPercent: -50 });

      const yTo = gsap.quickTo(container, "y", {
        duration: 0.5,
        // conformance-exempt: motion-literal — la de la referencia. El seguimiento llega tarde y frena largo; con la curva de marca la caja se pegaba al puntero.
        ease: "power4",
      });

      const clear = () => {
        container.removeAttribute(SERVICE_PREVIEW_ON);
        [...container.children].forEach((child) => {
          gsap.killTweensOf([child, child.firstElementChild]);
          child.remove();
        });
      };

      const onListEnter = () => {
        if (enabled()) container.setAttribute(SERVICE_PREVIEW_ON, "");
      };

      const onListMove = (event: MouseEvent) => {
        if (enabled()) yTo(event.clientY - root.getBoundingClientRect().top);
      };

      const createMedia = (index: number) => {
        const source = sources[index];
        if (!enabled() || !source) return;

        const layer = document.createElement("div");
        const image = document.createElement("img");

        image.src = source.currentSrc || source.src;
        image.alt = "";
        layer.appendChild(image);
        container.appendChild(layer);

        gsap.to([layer, image], {
          y: 0,
          duration: 0.6,
          // conformance-exempt: motion-literal — la de la referencia. La cortina arranca y aterriza lenta y cruza rapida por el medio, que es lo que hace que el barrido se lea.
          ease: "expo.inOut",
        });

        if (container.children.length > MAX_LAYERS) container.children[0]?.remove();
      };

      const rowListeners = rows.map((row, index) => {
        const listener = () => createMedia(index);
        row.addEventListener("mouseenter", listener);
        return () => row.removeEventListener("mouseenter", listener);
      });

      list.addEventListener("mouseenter", onListEnter);
      list.addEventListener("mouseleave", clear);
      list.addEventListener("mousemove", onListMove);

      cleanup = () => {
        rowListeners.forEach((remove) => remove());
        list.removeEventListener("mouseenter", onListEnter);
        list.removeEventListener("mouseleave", clear);
        list.removeEventListener("mousemove", onListMove);
        clear();
        gsap.killTweensOf(container);
        gsap.set(container, { clearProps: "transform" });
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return rootRef;
}
