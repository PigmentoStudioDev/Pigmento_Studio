"use client";

import { useEffect, useRef, useState } from "react";
import { REDUCED_MOTION } from "./breakpoints";
import { whenPageReady } from "./pageReady";

/**
 * Tira del hero. Dos capas que nunca se pasan el relevo: el carril deriva de izquierda
 * a derecha desde el primer fotograma, y encima cada foto entra desde fuera por la
 * izquierda con desfase. El aterrizaje es la deriva alcanzando su sitio: la ultima
 * foto queda al ras del borde derecho justo cuando termina su entrada.
 *
 * Duraciones y desfases viven en la hoja. Este hook mide la geometria y los lee ya
 * resueltos del CSS para saber donde tiene que arrancar la deriva.
 */

export const HERO_BAND = "data-hero-band";
export const HERO_BAND_LANDED = "data-hero-band-landed";
export const HERO_BAND_CARD = "data-hero-band-card";

/** px/s, como el marquee. */
const DRIFT_SPEED = 60;
const TRAVEL_MARGIN_PX = 60;
const SETS_BEYOND_VIEWPORT = 3;
const MIN_SETS = 2;

/** Arranca cuando la seccion ha subido un 40%: arriba del todo es al cargar. */
const IN_VIEW_MARGIN = "0px 0px -40% 0px";

/** Red de seguridad si la geometria no llega (caja oculta): tira quieta, no invisible. */
const GEOMETRY_TIMEOUT_MS = 1000;

export interface BandLayout {
  viewport: number;
  cardWidth: number;
  itemStep: number;
  setShift: number;
}

/** Posicion de reposo del carril: la ultima foto del set que aterriza, al ras del borde derecho. */
export function bandRestX({ viewport, cardWidth, itemStep, setShift }: BandLayout): number {
  const landSet = 1 + Math.ceil((viewport + itemStep - cardWidth) / setShift);
  return viewport - cardWidth - (landSet * setShift - itemStep);
}

function seconds(value: string): number {
  const first = value.split(",")[0].trim();
  const n = parseFloat(first);
  if (Number.isNaN(n)) return 0;
  return first.endsWith("ms") ? n / 1000 : n;
}

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
}

function deferred(): Deferred {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

export function useHeroBand<T extends HTMLElement, U extends HTMLElement>(count: number) {
  const rootRef = useRef<T>(null);
  const trackRef = useRef<U>(null);
  const lastCardRef = useRef<HTMLElement | null>(null);
  const [sets, setSets] = useState(MIN_SETS);
  const [width, setWidth] = useState(0);
  const [geometry] = useState(deferred);

  // Cuantos sets hacen falta es una medida: la ventana mas tres sets de margen.
  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track || count === 0 || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      const cards = track.children;
      if (cards.length < count * MIN_SETS) return;

      const setShift =
        (cards[count] as HTMLElement).offsetLeft - (cards[0] as HTMLElement).offsetLeft;
      if (!setShift) return;

      const needed = Math.ceil((root.clientWidth + setShift * SETS_BEYOND_VIEWPORT) / setShift);
      setSets((current) => Math.max(current, needed));
      setWidth(root.clientWidth);
    });

    observer.observe(root);
    return () => observer.disconnect();
  }, [count]);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track || width === 0) return;

    const cards = Array.from(track.children) as HTMLElement[];
    if (cards.length < count * MIN_SETS) return;

    const setShift = cards[count].offsetLeft - cards[0].offsetLeft;
    const itemStep = count > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : setShift;
    const cardWidth = cards[0].offsetWidth;
    if (!setShift || !cardWidth) return;

    const restX = bandRestX({ viewport: width, cardWidth, itemStep, setShift });

    let flying = cards.filter((card) => {
      const left = restX + card.offsetLeft;
      return left + card.offsetWidth > 0 && left < width + setShift;
    });

    const orderOf = (card: HTMLElement, list: HTMLElement[]) => list.length - 1 - list.indexOf(card);
    const paint = (list: HTMLElement[]) => {
      const set = new Set(list);
      cards.forEach((card) => {
        card.setAttribute(HERO_BAND_CARD, set.has(card) ? "fly" : "still");
        if (set.has(card)) card.style.setProperty("--pg-band-order", String(orderOf(card, list)));
      });
    };
    paint(flying);

    const landing =
      [...flying].reverse().find((card) => restX + card.offsetLeft < width) ?? flying[flying.length - 1];
    const timing = landing ? getComputedStyle(landing) : null;
    let driftLead = timing
      ? DRIFT_SPEED * (seconds(timing.transitionDelay) + seconds(timing.transitionDuration))
      : 0;

    // Si la deriva recorriera un set entero antes de aterrizar, el bucle saltaria a
    // mitad de la entrada. No pasa con cartas de hero, pero se corta limpio.
    if (driftLead >= setShift) {
      flying = [];
      driftLead = 0;
      paint(flying);
    }

    const travel =
      flying.reduce((need, card) => {
        const right = restX + card.offsetLeft + card.offsetWidth;
        const waitDrift = DRIFT_SPEED * seconds(getComputedStyle(card).transitionDelay);
        return Math.max(need, right - driftLead + waitDrift);
      }, 0) + TRAVEL_MARGIN_PX;

    const from = restX - driftLead;

    root.style.setProperty("--pg-band-travel", `${-travel}px`);
    root.style.setProperty("--pg-band-from", `${from}px`);
    root.style.setProperty("--pg-band-to", `${from + setShift}px`);
    root.style.setProperty("--pg-band-loop", `${setShift / DRIFT_SPEED}s`);

    // La que mas espera es la que termina ultima: su final es el aterrizaje.
    lastCardRef.current = flying[0] ?? null;
    geometry.resolve();
  }, [sets, width, count, geometry]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    let detach: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const land = () => root.setAttribute(HERO_BAND_LANDED, "");

    const enter = () => {
      if (cancelled) return;
      root.setAttribute(HERO_BAND, "entered");

      const card = lastCardRef.current;
      if (!card || window.matchMedia(REDUCED_MOTION).matches) {
        land();
        return;
      }

      const onEnd = (event: TransitionEvent) => {
        if (event.target !== card || event.propertyName !== "translate") return;
        detach?.();
        if (!cancelled) land();
      };
      card.addEventListener("transitionend", onEnd);
      detach = () => card.removeEventListener("transitionend", onEnd);
    };

    const inView = new Promise<void>((resolve) => {
      if (typeof IntersectionObserver === "undefined") {
        resolve();
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer?.disconnect();
          resolve();
        },
        { rootMargin: IN_VIEW_MARGIN },
      );
      observer.observe(root.closest("section") ?? root);
    });

    const measured = Promise.race([
      geometry.promise,
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, GEOMETRY_TIMEOUT_MS);
      }),
    ]);

    void Promise.all([whenPageReady(), inView, measured]).then(() => {
      // Un frame para que el punto de salida este pintado antes de soltar la entrada.
      if (!cancelled) requestAnimationFrame(enter);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      detach?.();
      clearTimeout(timer);
      root.removeAttribute(HERO_BAND);
      root.removeAttribute(HERO_BAND_LANDED);
    };
  }, [geometry]);

  return { rootRef, trackRef, sets };
}
