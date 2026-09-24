import { useCallback, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { REDUCED_MOTION } from "./breakpoints";

/**
 * Una fila de tarjetas que se recorre por pasos: flechas, teclado y arrastre mueven el
 * mismo indice.
 *
 * El JS lleva dos numeros —la tarjeta activa y cuanto desvia el dedo— y el desplazamiento
 * lo escribe la hoja con una transicion de la marca, igual que la corona de valores. El
 * tope del final tambien es de la hoja: sabe cuanto mide la fila y cuanto la ventana, y
 * el JS no tiene que medir en cada cambio de tamano.
 *
 * El arrastre no captura el puntero hasta que el dedo se mueve de verdad: capturarlo al
 * bajar se tragaria el clic de la foto y de los enlaces que hay dentro.
 */

/** Pixeles que hay que recorrer antes de que un toque cuente como arrastre. */
const DRAG_THRESHOLD_PX = 6;

export function clampIndex(index: number, count: number): number {
  return Math.min(Math.max(index, 0), Math.max(count - 1, 0));
}

/** Cuantas tarjetas avanza la fila al soltar: el arrastre hacia la izquierda avanza. */
export function rosterSteps(dragPx: number, stepPx: number): number {
  if (stepPx <= 0) return 0;
  const steps = Math.round(-dragPx / stepPx);
  return steps === 0 ? 0 : steps;
}

interface Gesture {
  id: number;
  startX: number;
  step: number;
  moved: boolean;
}

const IDLE: Gesture = { id: -1, startX: 0, step: 0, moved: false };

/** Lo que mide un paso: una tarjeta mas el hueco que la separa de la siguiente. */
function measureStep(track: Element | null): number {
  const card = track?.firstElementChild;
  if (!(card instanceof HTMLElement) || !track) return 0;
  const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
  return card.offsetWidth + gap;
}

/** Con reduced-motion la hoja pinta una fila con scroll nativo y ya no lee el indice. */
function nativeScroll(): boolean {
  return window.matchMedia(REDUCED_MOTION).matches;
}

export function useRosterSlider<T extends HTMLElement>(count: number) {
  const viewportRef = useRef<T>(null);
  const [index, setIndex] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<Gesture>({ ...IDLE });
  // Tras un arrastre el navegador aun dispara el clic del elemento donde se solto: sin
  // esto, soltar sobre una foto la abriria.
  const swallowClick = useRef(false);

  const go = useCallback(
    (delta: number) => {
      // En la fila nativa el indice ya no desplaza nada: las flechas de la barra tienen
      // que mover el scroll de verdad, una tarjeta por pulsacion.
      if (nativeScroll()) {
        const viewport = viewportRef.current;
        viewport?.scrollBy({ left: delta * measureStep(viewport.firstElementChild) });
      }
      setIndex((current) => clampIndex(current + delta, count));
    },
    [count],
  );
  const reset = useCallback(() => setIndex(0), []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<T>) => {
      // Las flechas ya desplazan una fila con scroll nativo: tragarselas la dejaria quieta.
      if (nativeScroll()) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }
    },
    [go],
  );

  const onPointerDown = useCallback((event: PointerEvent<T>) => {
    if (event.button !== 0) return;
    // El gesto de la fila nativa es del navegador, no de la fila.
    if (nativeScroll()) return;

    gesture.current = {
      ...IDLE,
      id: event.pointerId,
      startX: event.clientX,
      step: measureStep(viewportRef.current?.firstElementChild ?? null),
    };
  }, []);

  const onPointerMove = useCallback((event: PointerEvent<T>) => {
    const drag = gesture.current;
    if (drag.id !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    if (!drag.moved) {
      if (Math.abs(dx) <= DRAG_THRESHOLD_PX) return;
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    setDragPx(dx);
  }, []);

  const onPointerEnd = useCallback(
    (event: PointerEvent<T>) => {
      const drag = gesture.current;
      if (drag.id !== event.pointerId) return;

      if (drag.moved) {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        const steps = rosterSteps(event.clientX - drag.startX, drag.step);
        setIndex((current) => clampIndex(current + steps, count));
        swallowClick.current = true;
      }

      gesture.current = { ...IDLE };
      setDragPx(0);
      setDragging(false);
    },
    [count],
  );

  const onClickCapture = useCallback((event: MouseEvent<T>) => {
    if (!swallowClick.current) return;
    swallowClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    viewportRef,
    index: clampIndex(index, count),
    dragPx,
    dragging,
    go,
    reset,
    handlers: {
      onKeyDown,
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onClickCapture,
    },
  };
}
