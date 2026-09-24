import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FocusEvent } from "react";
import { REDUCED_MOTION } from "./breakpoints";
import { duration } from "./tokens";

/**
 * Un carrusel que avanza solo mientras nadie lo esta usando.
 *
 * Se para con el puntero encima o el foco dentro —quien esta ahi esta leyendo o a
 * punto de elegir, y la tarjeta no se le puede ir de debajo—, fuera de pantalla y
 * con la pestana oculta. Y se apaga del todo en cuanto la persona lo mueve: a partir
 * de ahi el ritmo es suyo, y seguir girando seria pelearle el gesto.
 *
 * Con reduced-motion no arranca: el carrusel ya es una fila con scroll nativo.
 */

/**
 * La pausa entre tarjetas, en pasos dobles de la escala: lo que se tarda en leer un
 * titulo y dos lineas. Un multiplo y no una duracion propia, para que reafinar la
 * escala mueva tambien este ritmo.
 */
export const AUTO_ROTATE_BEATS = 4;

// La escala no cambia mientras la pagina esta abierta: no hay nada a lo que suscribirse.
const subscribeNever = () => () => {};
const readHasBeat = () => duration("double") > 0;
// El servidor no puede leer la escala. Hidratar con falso y releer despues evita que
// el HTML diga una cosa y el primer render del cliente otra.
const serverHasBeat = () => false;

export function useAutoRotate<T extends HTMLElement>(advance: () => void, enabled: boolean) {
  const ref = useRef<T>(null);
  const [stopped, setStopped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const hasBeat = useSyncExternalStore(subscribeNever, readHasBeat, serverHasBeat);

  // En una ref: el intervalo llama siempre al avance de este render sin reiniciarse
  // cada vez que el padre crea una funcion nueva.
  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION);
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const sync = () => setPageVisible(document.visibilityState !== "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    const node = ref.current;
    // Sin IntersectionObserver (jsdom, navegadores muy viejos) se da por visible: el
    // resto de pausas siguen funcionando.
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Sin el token no hay ritmo que seguir: un intervalo de cero giraria sin parar.
  const rotating = hasBeat && enabled && !stopped && !reducedMotion;
  const running = rotating && !hovered && !focused && onScreen && pageVisible;

  useEffect(() => {
    if (!running) return;

    const dwellMs = duration("double", AUTO_ROTATE_BEATS) * 1000;
    const id = window.setInterval(() => advanceRef.current(), dwellMs);
    return () => window.clearInterval(id);
  }, [running]);

  const stop = useCallback(() => setStopped(true), []);

  const onBlur = useCallback((event?: FocusEvent<T>) => {
    // El foco que pasa de un control a otro dentro del carrusel no cuenta como salida.
    if (event?.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    setFocused(false);
  }, []);

  return {
    ref,
    /** Si el carrusel esta a cargo de su propio ritmo (aunque ahora mismo este en pausa). */
    rotating,
    stop,
    handlers: {
      onPointerEnter: () => setHovered(true),
      onPointerLeave: () => setHovered(false),
      onFocus: () => setFocused(true),
      onBlur,
    },
  };
}
