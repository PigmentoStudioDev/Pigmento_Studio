"use client";

import { useLayoutEffect, useRef } from "react";
import { REDUCED_MOTION } from "../../../motion/breakpoints";
import { brandEasePoints, duration } from "../../../motion/tokens";
import styles from "./WorkFilter.module.scss";

/**
 * El filtro del indice de trabajo, con el lenguaje de los "gooey filter chips" de
 * Annnimate: chips en pildora, una bandeja oscura que lleva el contador de resultados y
 * la opcion elegida, y la opcion que cambia VUELA entre la fila y la bandeja.
 *
 * Dos diferencias con la referencia, y las dos son decision: aqui el filtro es de UNA
 * opcion (siempre hay una elegida, "Todos" al principio), asi que no hay "Clear all"; y
 * el cuello liquido entre el chip y la bandeja —un filtro SVG de metaballs— no se porta:
 * el vuelo es el mismo y cuesta cero dependencias.
 *
 * El vuelo es FLIP con la Web Animations API: se miden los chips antes del cambio, React
 * los coloca en su sitio nuevo y cada uno parte desde donde estaba. Sin gsap porque el
 * estado inicial tiene que aplicarse antes de pintar, y `loadMotion()` es asincrono.
 */
export interface WorkFilterOption {
  value: string;
  label: string;
}

export interface WorkFilterProps {
  options: WorkFilterOption[];
  value: string;
  onChange: (value: string) => void;
  /** Cuantos proyectos deja el filtro actual. */
  count: number;
  labels: {
    /** Nombre accesible del grupo de opciones. */
    group: string;
    /** El texto junto al contador: "proyectos". */
    results: string;
  };
}

interface Snapshot {
  chips: Map<string, DOMRect>;
  tray: DOMRect;
  count: number;
}

const FLIGHT_STEP = "base" as const;

export function WorkFilter({ options, value, onChange, count, labels }: WorkFilterProps) {
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());
  const trayRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const before = useRef<Snapshot | null>(null);
  const refocus = useRef<string | null>(null);

  function choose(next: string) {
    if (next === value) return;

    const tray = trayRef.current;
    if (tray) {
      before.current = {
        chips: new Map([...chipRefs.current].map(([key, element]) => [key, element.getBoundingClientRect()])),
        tray: tray.getBoundingClientRect(),
        count,
      };
    }
    // El chip que cambia de padre se remonta y el foco se pierde con el: se devuelve.
    refocus.current = document.activeElement instanceof HTMLButtonElement ? next : null;
    onChange(next);
  }

  useLayoutEffect(() => {
    if (refocus.current) {
      chipRefs.current.get(refocus.current)?.focus({ preventScroll: true });
      refocus.current = null;
    }

    const snapshot = before.current;
    before.current = null;
    // Sin Web Animations (jsdom, navegadores viejos) el filtro cambia sin vuelo.
    if (!snapshot || typeof Element.prototype.animate !== "function") return;
    if (window.matchMedia(REDUCED_MOTION).matches) return;

    const points = brandEasePoints();
    const timing = {
      duration: duration(FLIGHT_STEP) * 1000,
      easing: points ? `cubic-bezier(${points})` : "ease",
    };

    for (const [key, element] of chipRefs.current) {
      const from = snapshot.chips.get(key);
      if (!from) continue;

      const to = element.getBoundingClientRect();
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;

      element.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0 0" }], timing);
    }

    const tray = trayRef.current;
    if (tray) {
      const width = tray.getBoundingClientRect().width;
      if (Math.abs(snapshot.tray.width - width) >= 0.5) {
        tray.animate([{ inlineSize: `${snapshot.tray.width}px` }, { inlineSize: `${width}px` }], timing);
      }
    }

    // El contador sube desde abajo al cambiar la cifra.
    if (snapshot.count !== count) {
      countRef.current?.animate(
        [
          { translate: "0 0.6em", opacity: 0 },
          { translate: "0 0", opacity: 1 },
        ],
        timing,
      );
    }
  }, [value, count]);

  const selected = options.find((option) => option.value === value);
  const rest = options.filter((option) => option.value !== value);

  const chip = (option: WorkFilterOption, inTray: boolean) => (
    <button
      key={option.value}
      ref={(element) => {
        if (element) chipRefs.current.set(option.value, element);
        else chipRefs.current.delete(option.value);
      }}
      type="button"
      className={styles.chip}
      data-in-tray={inTray || undefined}
      aria-pressed={inTray}
      onClick={() => choose(option.value)}
    >
      {option.label}
    </button>
  );

  return (
    <div className={styles.root} role="group" aria-label={labels.group}>
      <div ref={trayRef} className={styles.tray}>
        <span className={styles.readout} aria-live="polite">
          <span ref={countRef} className={styles.count}>
            {String(count).padStart(2, "0")}
          </span>
          <span className={styles.results}>{labels.results}</span>
        </span>
        {selected ? chip(selected, true) : null}
      </div>
      {rest.map((option) => chip(option, false))}
    </div>
  );
}
