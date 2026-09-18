"use client";

import { useCallback, useRef, useState, type PointerEvent, type TransitionEvent } from "react";
import { flushSync } from "react-dom";
import { REDUCED_MOTION } from "./breakpoints";

/**
 * Una corona de tarjetas que gira por pasos y que se puede arrastrar y lanzar.
 *
 * Es el mismo reparto que RadialGallery: el JS lleva dos numeros —en que paso va la
 * corona y cuantos grados la desvia el dedo— y el giro lo escribe la transicion de la
 * hoja, con la duracion y la curva de la marca. El lanzamiento tampoco es un tween:
 * la velocidad al soltar solo decide CUANTOS pasos se salta, y el enganche a ese paso
 * lo anima la misma transicion que el de un clic.
 *
 * **La vuelta infinita sale de copias, no de mover nodos.** La corona se pinta
 * RADIAL_COPIES veces seguidas, asi que siempre hay tarjetas a los dos lados de la
 * activa. Cuando el giro termina fuera de la vuelta central, el paso se devuelve a
 * ella de golpe y sin transicion: la corona queda identica, porque la tarjeta que
 * aterriza en el centro es una copia de la que estaba.
 *
 * La geometria no se repite en JS: el radio y el angulo por paso se leen de la hoja
 * una vez por gesto, al bajar el dedo.
 */

/** Cuantas veces se pinta la lista. Impar: la copia del medio es la que se anuncia. */
export const RADIAL_COPIES = 5;

/** La custom property con el angulo entre tarjetas, en grados. La declara la hoja. */
export const RADIAL_ANGLE_PROPERTY = "--pg-radial-angle";

/** Apaga la transicion de la corona mientras vuelve al centro. Lo lee la hoja. */
const JUMP_ATTRIBUTE = "data-radial-jumping";

/** Pixeles que hay que recorrer antes de que un toque cuente como arrastre. */
const DRAG_THRESHOLD_PX = 4;

const DEGREES_PER_RADIAN = 180 / Math.PI;

export function wrapIndex(step: number, count: number): number {
  return ((step % count) + count) % count;
}

/**
 * Hasta donde puede llegar el paso antes de que la vuelta vuelva al centro.
 *
 * Deja una vuelta entera de copias por fuera en los dos sentidos: es lo que hace
 * falta para que los clics seguidos —que llegan antes de que termine el giro, y por
 * tanto antes de la vuelta al centro— nunca asomen el borde de la corona.
 */
export function stepBounds(count: number): { min: number; max: number } {
  const half = Math.floor(RADIAL_COPIES / 2) * count;
  return { min: -half + count, max: RADIAL_COPIES * count - half - 1 - count };
}

/** El paso que deja `target` en el centro dando la menor vuelta posible. */
export function nearestStep(current: number, target: number, count: number): number {
  let delta = wrapIndex(target - wrapIndex(current, count), count);
  if (delta > count / 2) delta -= count;
  return current + delta;
}

/**
 * Cuantos pasos avanza la corona al soltar.
 *
 * A lo arrastrado se le suma lo que la corona recorreria si siguiera a la velocidad
 * de salida mientras frena hasta pararse en lo que dura el enganche: con una curva
 * que decelera hasta cero, eso es la mitad de velocidad por tiempo. Asi el lanzamiento
 * se mide con la duracion de la propia hoja y no con un numero de inercia en JS.
 *
 * El signo va invertido: la hoja gira -angulo por paso, asi que un grado positivo de
 * arrastre es un paso atras.
 */
export function releaseSteps(dragDegrees: number, degreesPerMs: number, snapMs: number, angle: number): number {
  const steps = Math.round((dragDegrees + (degreesPerMs * snapMs) / 2) / angle);
  return steps === 0 ? 0 : -steps;
}

/**
 * La velocidad que cuenta al soltar. La del ultimo movimiento se apaga con lo que el
 * dedo lleva quieto, y del todo en lo que dura un enganche: quien arrastra, se para y
 * suelta no esta lanzando, y sin esto la corona saldria disparada con la velocidad
 * que tenia antes de la pausa.
 */
export function releaseVelocity(lastVelocity: number, idleMs: number, snapMs: number): number {
  if (snapMs <= 0) return 0;
  return lastVelocity * Math.max(1 - idleMs / snapMs, 0);
}

/** Una duracion resuelta por el navegador ("0.6s", "300ms") en milisegundos. */
export function durationMs(value: string): number {
  const first = value.split(",")[0].trim();
  const amount = Number.parseFloat(first);
  if (Number.isNaN(amount)) return 0;
  return first.endsWith("ms") ? amount : amount * 1000;
}

function clamp(step: number, count: number): number {
  const { min, max } = stepBounds(count);
  return Math.min(Math.max(step, min), max);
}

interface Gesture {
  id: number;
  lastX: number;
  lastTime: number;
  startX: number;
  radius: number;
  angle: number;
  snapMs: number;
  velocity: number;
  moved: boolean;
}

const IDLE: Gesture = {
  id: -1,
  lastX: 0,
  lastTime: 0,
  startX: 0,
  radius: 0,
  angle: 0,
  snapMs: 0,
  velocity: 0,
  moved: false,
};

export function useRadialSlider<T extends HTMLElement>(count: number) {
  const trackRef = useRef<T>(null);
  const [step, setStep] = useState(0);
  const [dragDegrees, setDragDegrees] = useState(0);
  const [dragging, setDragging] = useState(false);

  // En una ref y no en estado: cambia en cada pointermove, y pasarlo por el render
  // pintaria la corona una vez por pixel para decidir lo que decide una resta.
  const gesture = useRef<Gesture>({ ...IDLE });

  const enabled = count > 1;

  const go = useCallback((delta: number) => setStep((current) => clamp(current + delta, count)), [count]);

  const goTo = useCallback(
    (index: number) => setStep((current) => clamp(nearestStep(current, index, count), count)),
    [count],
  );

  /**
   * La vuelta al centro, sin transicion.
   *
   * El atributo que la apaga se pone y se quita en el MISMO manejador, con un reflow
   * entre medias: el paso nuevo se pinta de forma sincrona y leer la caja obliga al
   * navegador a calcular estilos con la transicion apagada. Sin ese calculo veria el
   * apagado y el encendido de una vez, conservaria la transicion y la corona daria la
   * vuelta entera hacia atras.
   */
  const settle = useCallback(
    (event: TransitionEvent<T>) => {
      const track = trackRef.current;
      if (!track || event.target !== track || event.propertyName !== "transform") return;

      const wrapped = wrapIndex(step, count);
      if (wrapped === step) return;

      track.setAttribute(JUMP_ATTRIBUTE, "true");
      flushSync(() => setStep(wrapped));
      track.getBoundingClientRect();
      track.removeAttribute(JUMP_ATTRIBUTE);
    },
    [count, step],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<T>) => {
      const track = trackRef.current;
      if (!enabled || !track || event.button !== 0) return;
      // Con reduced-motion la hoja pinta una fila con scroll nativo: el gesto es del
      // navegador, no de la corona.
      if (window.matchMedia(REDUCED_MOTION).matches) return;

      const style = getComputedStyle(track);
      const pivot = Number.parseFloat(style.transformOrigin.split(" ")[1] ?? "0");

      // Radio medido al CENTRO de la tarjeta, que es donde se agarra: arrastrar ese
      // punto una distancia d gira la corona d/r radianes.
      gesture.current = {
        ...IDLE,
        id: event.pointerId,
        startX: event.clientX,
        lastX: event.clientX,
        lastTime: event.timeStamp,
        radius: pivot - track.offsetHeight / 2,
        angle: Number.parseFloat(style.getPropertyValue(RADIAL_ANGLE_PROPERTY)),
        snapMs: durationMs(style.transitionDuration),
      };

      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    },
    [enabled],
  );

  const onPointerMove = useCallback((event: PointerEvent<T>) => {
    const drag = gesture.current;
    if (drag.id !== event.pointerId || drag.radius <= 0) return;

    const dx = event.clientX - drag.startX;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX) drag.moved = true;

    const elapsed = event.timeStamp - drag.lastTime;
    if (elapsed > 0) {
      drag.velocity = ((event.clientX - drag.lastX) / drag.radius / elapsed) * DEGREES_PER_RADIAN;
      drag.lastX = event.clientX;
      drag.lastTime = event.timeStamp;
    }

    setDragDegrees((dx / drag.radius) * DEGREES_PER_RADIAN);
  }, []);

  const onPointerEnd = useCallback(
    (event: PointerEvent<T>) => {
      const drag = gesture.current;
      if (drag.id !== event.pointerId) return;

      event.currentTarget.releasePointerCapture(event.pointerId);

      // El desvio se pliega en pasos y vuelve a cero en el mismo render, asi que el
      // enganche lo anima la transicion de siempre.
      if (drag.moved && drag.angle > 0) {
        const velocity = releaseVelocity(drag.velocity, event.timeStamp - drag.lastTime, drag.snapMs);
        const steps = releaseSteps(dragDegrees, velocity, drag.snapMs, drag.angle);
        setStep((current) => clamp(current + steps, count));
      }

      gesture.current = { ...IDLE };
      setDragDegrees(0);
      setDragging(false);
    },
    [count, dragDegrees],
  );

  return {
    trackRef,
    step,
    active: wrapIndex(step, count),
    dragDegrees,
    dragging,
    go,
    goTo,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
    onTransitionEnd: settle,
  };
}
