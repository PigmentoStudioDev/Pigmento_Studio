"use client";

import { useEffect, useRef } from "react";
import { pauseOnIntent } from "../../../motion/pauseOnIntent";

/**
 * Una pieza de video del caso: animaciones de marca que en el portfolio se leen como
 * una imagen mas, asi que van en bucle, mudas y sin controles.
 *
 * El autoplay se pide desde el efecto, como en VideoBackdrop: con reduced-motion se
 * queda en su primer fotograma. Y es un bucle que convive con texto, asi que se para
 * con el puntero encima o el foco dentro (WCAG 2.2.2) y fuera de pantalla.
 *
 * A diferencia del fondo, NO es decoracion: es trabajo del estudio, y lleva el alt
 * de su media como nombre accesible.
 */
export interface CaseVideoProps {
  src: string;
  label: string;
  width: number;
  height: number;
  className?: string;
}

export function CaseVideo({ src, label, width, height, className }: CaseVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // play() se rechaza si el navegador bloquea la reproduccion; el primer fotograma
    // ya es el plan B, asi que no hay nada que hacer con el rechazo.
    const playing = {
      pause: () => video.pause(),
      resume: () => void video.play().catch(() => {}),
    };
    return pauseOnIntent(video, () => [playing]);
  }, [src]);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      width={width}
      height={height}
      aria-label={label}
      // Sin poster: el primer fotograma es la pieza, y metadata basta para pintarlo.
      preload="metadata"
      muted
      loop
      playsInline
      // Enfocable para que el teclado pueda parar el bucle (pauseOnIntent escucha focusin).
      tabIndex={0}
    />
  );
}
