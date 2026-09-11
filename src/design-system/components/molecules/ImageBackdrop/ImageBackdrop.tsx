"use client";

import Image from "next/image";
import { DEFAULT_BACKDROP_PARALLAX } from "../../../motion/backdrop";
import { useParallax, type ParallaxOptions } from "../../../motion/useParallax";
import styles from "./ImageBackdrop.module.scss";

/**
 * Imagen de fondo con parallax al hacer scroll.
 *
 * Es el gemelo de `VideoBackdrop` y comparte con el las tres cajas y su geometria:
 * la mascara recorta y hace de disparador, el objetivo mide mas alto que ella y es
 * lo que se mueve, y la imagen llena el objetivo. Lo unico que cambia es que dentro
 * va un <Image> en vez de un <video> — y por eso la geometria vive en la capa de
 * motion y no en ninguno de los dos.
 *
 * `alt` NO es opcional, pero si puede venir vacio: este fondo va DEBAJO del titular
 * de la portada, asi que una descripcion aqui se leeria dos veces. Cuando el CMS no
 * trae texto, la imagen queda marcada como decorativa — que es lo correcto — y el
 * campo obligatorio obliga a decidirlo en vez de olvidarlo.
 */
export interface ImageBackdropProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  /**
   * La portada es lo primero que se ve. Sin esto, Next la carga en diferido y el
   * hero entra en blanco.
   */
  priority?: boolean;
  parallax?: ParallaxOptions;
}

export function ImageBackdrop({
  src,
  alt,
  width,
  height,
  priority,
  parallax,
}: ImageBackdropProps) {
  const { triggerRef, targetRef } = useParallax<HTMLDivElement, HTMLDivElement>({
    ...DEFAULT_BACKDROP_PARALLAX,
    ...parallax,
  });

  return (
    <div ref={triggerRef} className={styles.mask}>
      <div ref={targetRef} className={styles.target}>
        <Image
          className={styles.image}
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
        />
      </div>
    </div>
  );
}
