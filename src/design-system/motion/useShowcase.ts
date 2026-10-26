"use client";

import { useEffect, useRef } from "react";
import { REDUCED_MOTION } from "./breakpoints";
import { loadMotion, type MatchMedia } from "./gsap";
import { duration, EASE_LINEAR } from "./tokens";

/**
 * El Showcase de locomotive (scroll.locomotive.ca), con su fuente: HoverShuffle.js y
 * FadeInText.js, recuperados de su source map, y las reglas de su main.css.
 *
 * Cuatro gestos, los cuatro del original:
 *
 * 1. La palabra gigante cruza la ventana mientras su bloque esta fijado. El JS solo
 *    publica cuanto se ha recorrido (`--pg-pass-progress`, 0 a 1); el desplazamiento
 *    lo hace la hoja, igual que alli con `--progress`.
 * 2. La frase de al lado se entinta por lineas: cada linea lleva un degradado de dos
 *    tintas cuyo borde avanza con el scroll, repartido por el ancho de cada linea.
 * 3. La lista se dibuja al entrar en cuadro: filetes que crecen y textos que suben,
 *    escalonados. Aqui solo se marca `data-inview`; el escalonado es de la hoja.
 * 4. Al pasar por una fila, sus textos se barajan cuatro veces en un cuarto de segundo
 *    y vuelven a su sitio.
 *
 * Con reduced-motion no se arma ninguno y la hoja deja todo en su reposo: la palabra
 * quieta, la frase entera a tinta, la lista dibujada.
 */
export const PASS_PROGRESS_PROPERTY = "--pg-pass-progress";
export const SHOWCASE_PASS = "data-showcase-pass";
export const SHOWCASE_FADE = "data-showcase-fade";
export const SHOWCASE_LIST = "data-showcase-list";
export const SHOWCASE_ROW = "data-showcase-row";
export const SHOWCASE_SHUFFLE = "data-showcase-shuffle";

/** El fijado solo existe en pantallas apaisadas, como en el original. */
const LANDSCAPE = "(min-aspect-ratio: 5/4)";

/** Los barajados por pasada del original. */
const SHUFFLES = 4;

const SHUFFLE_PATTERN = /\p{Extended_Pictographic}|\r|\n|./gu;

/** El ancho del borde del degradado, en puntos del 0 al 100, como en FadeInText. */
const FADE_EDGE = 100;

function shuffleWord(word: string): string {
  const chars = [...word.matchAll(SHUFFLE_PATTERN)].map((match) => match[0]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function fadeGradient(progress: number): string {
  const edge = -FADE_EDGE + progress * (100 + FADE_EDGE * 2);
  const from = Math.max(edge - FADE_EDGE, 0);
  const to = Math.min(edge + FADE_EDGE, 100);
  return `linear-gradient(to right, var(--pg-fade-ink) 0%, var(--pg-fade-ink) ${from}%, var(--pg-fade-ink) ${edge}%, var(--pg-fade-base) ${to}%, var(--pg-fade-base) 100%)`;
}

export function useShowcase<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia(REDUCED_MOTION).matches) return;

    // Sin observador (jsdom, navegadores muy viejos) la lista no se arma y se ve dibujada.
    const list = typeof IntersectionObserver === "undefined" ? null : root.querySelector<HTMLElement>(`[${SHOWCASE_LIST}]`);
    const observer = list && new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || !list) return;
        list.setAttribute("data-inview", "");
        observer?.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    if (list && observer) {
      list.setAttribute("data-armed", "");
      observer.observe(list);
    }

    const rows = [...root.querySelectorAll<HTMLElement>(`[${SHOWCASE_ROW}]`)];
    const timers = new Map<HTMLElement, number[]>();
    const restore = (row: HTMLElement) => {
      timers.get(row)?.forEach((timer) => window.clearTimeout(timer));
      timers.delete(row);
      row.querySelectorAll<HTMLElement>(`[${SHOWCASE_SHUFFLE}]`).forEach((target) => {
        target.textContent = target.getAttribute(SHOWCASE_SHUFFLE);
      });
    };
    const shuffle = (row: HTMLElement) => {
      restore(row);
      const step = (duration("quarter") * 1000) / SHUFFLES;
      const targets = [...row.querySelectorAll<HTMLElement>(`[${SHOWCASE_SHUFFLE}]`)];
      const pending = Array.from({ length: SHUFFLES }, (_, i) =>
        window.setTimeout(() => {
          targets.forEach((target) => {
            const text = target.getAttribute(SHOWCASE_SHUFFLE) ?? "";
            target.textContent = text.split(" ").map(shuffleWord).join(" ");
          });
        }, step * i),
      );
      pending.push(window.setTimeout(() => restore(row), step * SHUFFLES));
      timers.set(row, pending);
    };
    const listeners = rows.map((row) => {
      const enter = () => shuffle(row);
      const leave = () => restore(row);
      row.addEventListener("mouseenter", enter);
      row.addEventListener("mouseleave", leave);
      return () => {
        row.removeEventListener("mouseenter", enter);
        row.removeEventListener("mouseleave", leave);
        restore(row);
      };
    });

    let mm: MatchMedia | undefined;
    let cancelled = false;
    const cleanups: (() => void)[] = [];

    void loadMotion().then(({ gsap, ScrollTrigger, SplitText }) => {
      if (cancelled) return;
      mm = gsap.matchMedia();

      const pass = root.querySelector<HTMLElement>(`[${SHOWCASE_PASS}]`);
      const fade = root.querySelector<HTMLElement>(`[${SHOWCASE_FADE}]`);

      mm.add(LANDSCAPE, () => {
        if (!pass) return;
        gsap.fromTo(
          root,
          { [PASS_PROGRESS_PROPERTY]: 0 },
          {
            [PASS_PROGRESS_PROPERTY]: 1,
            ease: EASE_LINEAR,
            scrollTrigger: { trigger: pass, start: "top top", end: "bottom bottom", scrub: true },
          },
        );
      });

      if (!fade || !pass) return;

      let progress = 0;
      let metrics: { from: number; to: number }[] = [];
      let lines: HTMLElement[] = [];

      const paint = () => {
        lines.forEach((line, i) => {
          const { from, to } = metrics[i] ?? { from: 0, to: 1 };
          const local = gsap.utils.clamp(0, 1, gsap.utils.mapRange(from, to, 0, 1, progress));
          line.style.backgroundImage = fadeGradient(local);
        });
      };

      const split = SplitText.create(fade, {
        type: "lines",
        autoSplit: true,
        onSplit: (self) => {
          lines = self.lines as HTMLElement[];
          lines.forEach((line) => line.setAttribute("data-fade-line", ""));
          const widths = lines.map((line) => line.getBoundingClientRect().width);
          const total = widths.reduce((sum, width) => sum + width, 0) || 1;
          let run = 0;
          metrics = widths.map((width) => {
            const from = run / total;
            run += width;
            return { from, to: from + width / total };
          });
          requestAnimationFrame(paint);
        },
      });

      const trigger = ScrollTrigger.create({
        trigger: pass,
        start: "top bottom",
        end: "top top",
        onUpdate: (self) => {
          progress = self.progress;
          paint();
        },
      });

      cleanups.push(() => {
        trigger.kill();
        split.revert();
      });
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      listeners.forEach((detach) => detach());
      cleanups.forEach((cleanup) => cleanup());
      mm?.revert();
    };
  }, []);

  return ref;
}
