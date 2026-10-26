"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { REDUCED_MOTION } from "./breakpoints";
import { duration } from "./tokens";

/**
 * La vista previa de un servicio: sus piezas pasan una detras de otra mientras se mira.
 *
 * Puerto del ImageSequence de apta.agency (su fuente, recuperada de su source map).
 * En reposo se ve la primera pieza; al entrar el puntero empieza a pasar las demas a
 * paso fijo y en bucle, y al salir vuelve a la primera. En un telefono no hay puntero
 * que entre, asi que el original cambia de disparador: pasa las piezas mientras la
 * tarjeta cruza la franja central de la pantalla. Aqui igual.
 *
 * Dos cambios de casa y ninguno toca el gesto. El paso es el `base` de la escala y no
 * los 0.7s del original: fuera de la escala, el gate de motion no lo dejaria pasar. Y
 * con reduced-motion no pasa nada, ni con el puntero: una imagen que cambia sola cada
 * medio segundo es exactamente lo que esa preferencia pide evitar.
 *
 * Devuelve el indice de la pieza a la vista; quien pinta decide como se muestra.
 */
const PHONE = "(max-width: 809.98px)";

/** La franja central del original: un cuarto de la altura de la ventana. */
const CENTER_ZONE = 0.25;

export function useServicePreview<T extends HTMLElement>(frames: number) {
  const ref = useRef<T>(null);
  const [active, setActive] = useState(false);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const root = ref.current;
    if (!root || frames <= 1) return;
    if (window.matchMedia(REDUCED_MOTION).matches) return;

    const toggle = (next: boolean) => startTransition(() => setActive(next));

    if (!window.matchMedia(PHONE).matches) {
      const enter = () => toggle(true);
      const leave = () => toggle(false);

      root.addEventListener("mouseenter", enter);
      root.addEventListener("mouseleave", leave);

      return () => {
        root.removeEventListener("mouseenter", enter);
        root.removeEventListener("mouseleave", leave);
      };
    }

    let raf = 0;
    const check = () => {
      raf = 0;
      const box = root.getBoundingClientRect();
      const center = box.top + box.height / 2;
      const half = (window.innerHeight * CENTER_ZONE) / 2;
      const middle = window.innerHeight / 2;

      toggle(center >= middle - half && center <= middle + half);
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };

    check();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);

    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      cancelAnimationFrame(raf);
    };
  }, [frames]);

  useEffect(() => {
    if (!active) {
      startTransition(() => setFrame(0));
      return;
    }

    const timer = window.setInterval(() => {
      startTransition(() => setFrame((previous) => (previous + 1) % frames));
    }, duration("base") * 1000);

    return () => window.clearInterval(timer);
  }, [active, frames]);

  return { ref, frame };
}
