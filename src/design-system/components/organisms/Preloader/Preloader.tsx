"use client";

import { useState, type AnimationEvent } from "react";
import { Logo } from "../../atoms/Logo/Logo";
import { markPageReady } from "../../../motion/pageReady";
import { themeZoneClass } from "../../../theme/zone";
import styles from "./Preloader.module.scss";

/**
 * Panel de carga: el logo sube desde su mascara, se sostiene y el panel se retira
 * hacia arriba con el borde inclinado, llevandose el logo. Los tiempos viven en la
 * hoja; aqui solo se encadenan los estados por `animationend`.
 *
 * Se pinta en el HTML para estar desde la primera pintura; la hoja lo esconde salvo
 * que el script de pageReady haya marcado la pagina como `loading`.
 */
type Phase = "entering" | "leaving" | "done";

// Oscuro en los dos modos: es un telon, no una seccion que se invierta con el sitio.
const PANEL_ZONE = "g100";

// Cada fase la cierra un elemento distinto y las animaciones de los hijos burbujean.
function isOwn(event: AnimationEvent<HTMLElement>): boolean {
  return event.target === event.currentTarget;
}

export function Preloader() {
  const [phase, setPhase] = useState<Phase>("entering");

  function handleMarkEnd(event: AnimationEvent<HTMLSpanElement>) {
    if (isOwn(event) && phase === "entering") setPhase("leaving");
  }

  // La pagina arranca cuando el panel EMPIEZA a abrirse: el contenido ya entra
  // mientras la cortina se retira.
  function handlePanelStart(event: AnimationEvent<HTMLDivElement>) {
    if (isOwn(event) && phase === "leaving") markPageReady();
  }

  function handlePanelEnd(event: AnimationEvent<HTMLDivElement>) {
    if (isOwn(event) && phase === "leaving") setPhase("done");
  }

  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      className={[styles.panel, themeZoneClass(PANEL_ZONE)].join(" ")}
      data-preloader={phase}
      onAnimationStart={handlePanelStart}
      onAnimationEnd={handlePanelEnd}
    >
      <span className={styles.mask}>
        <span className={styles.mark} onAnimationEnd={handleMarkEnd}>
          <Logo />
        </span>
      </span>
    </div>
  );
}
