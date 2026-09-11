"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_BACKDROP_PARALLAX } from "../../../motion/backdrop";
import { useParallax, type ParallaxOptions } from "../../../motion/useParallax";
import styles from "./VideoBackdrop.module.scss";

/**
 * Video de fondo a sangre con parallax al hacer scroll.
 *
 * Son tres cajas y cada una tiene un trabajo: la mascara recorta y hace de
 * disparador, el objetivo mide mas alto que ella y es lo que se mueve, y el video
 * llena el objetivo. El sobrante de altura del objetivo es el recorrido: si midiera
 * lo mismo que la mascara, cualquier desplazamiento descubriria una franja vacia.
 *
 * Es DECORACION. No lleva nombre accesible ni controles: el contenido del hero va
 * encima, en su organismo, y un video de fondo que se anunciara a un lector de
 * pantalla solo mete ruido entre el titular y la llamada a la accion.
 *
 * Props serializables — `src` y `poster` son URLs, asi que un bloque de Payload lo
 * alimenta 1:1 el dia que entre.
 */
export interface VideoBackdropProps {
  src: string;
  /**
   * Fotograma que se ve antes de que el video cargue, y el que se queda fijo con
   * `prefers-reduced-motion`. No es opcional a proposito: sin el, el hueco es
   * negro hasta que descargue, y quien pide menos movimiento se queda sin nada.
   */
  poster: string;
  parallax?: ParallaxOptions;
}

export function VideoBackdrop({ src, poster, parallax }: VideoBackdropProps) {
  const { triggerRef, targetRef } = useParallax<HTMLDivElement, HTMLDivElement>({
    ...DEFAULT_BACKDROP_PARALLAX,
    ...parallax,
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // El autoplay se pide desde aqui y no con el atributo `autoPlay`. Dos razones:
    // decidirlo durante el render obligaria a consultar matchMedia en servidor,
    // donde no existe, y el resultado no coincidiria con el del cliente. Y un
    // bucle de fondo corriendo es justo lo que reduced-motion pide evitar, asi que
    // con esa preferencia el video se queda en su poster.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // play() devuelve una promesa que se RECHAZA si el navegador bloquea la
    // reproduccion. Sin capturarla es un unhandled rejection en la consola de cada
    // visitante; y no hay nada que hacer al respecto — el poster ya es el plan B.
    void video.play().catch(() => {});
  }, [src]);

  return (
    <div ref={triggerRef} className={styles.mask}>
      <div ref={targetRef} className={styles.target}>
        <video
          ref={videoRef}
          className={styles.video}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          // metadata y no auto: el poster cubre la espera, asi que adelantar la
          // descarga entera solo compite por ancho de banda con lo que si se ve.
          preload="metadata"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
