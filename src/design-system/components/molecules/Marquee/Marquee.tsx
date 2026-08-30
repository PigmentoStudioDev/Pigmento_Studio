"use client";

import { useSyncExternalStore } from "react";
import { useMarquee, type MarqueeDirection } from "../../../motion/useMarquee";
import { getServerThemeMode, getThemeMode, subscribeThemeMode } from "../../../theme/mode";
import { isLightZone, resolveZone, themeZoneClass, type ThemeRole } from "../../../theme/zone";
import styles from "./Marquee.module.scss";

/**
 * Tira infinita que invierte su sentido segun hacia donde se desplace la pagina.
 *
 * **El tema se declara como ROL, no como claro u oscuro**, que es el metodo de la
 * cabecera: un rol es relativo al modo y por eso sigue siendo cierto en los dos —
 * `alt` es g10 en claro y g90 en oscuro. Una prop `light`/`dark` diria una cosa y
 * el CSS pintaria otra en cuanto alguien tocara el conmutador.
 *
 * La zona se resuelve AQUI y no en el CSS, al reves que en Section: el modo solo
 * existe en el navegador, y Section es server component. Este ya cruzo la frontera
 * por GSAP, asi que leer el store no le cuesta nada.
 *
 * Props serializables, incluidos los dos juegos de contenido: un bloque de Payload
 * con un select de tipo lo alimenta 1:1.
 */
export interface MarqueeLogo {
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface MarqueeBase {
  direction?: MarqueeDirection;
  /** Segundos por vuelta. Cuanto MENOR, mas rapido. */
  speed?: number;
  /** Cuanto acelera con el scroll, en vw. */
  scrollSpeed?: number;
/**
   * Copias MINIMAS de la coleccion. El componente sube el numero por su cuenta si
   * hacen falta mas para cubrir la ventana — cuantas se necesitan es una medida, no
   * una decision, y depende del ancho de la pantalla y de lo larga que sea la lista.
   */
  copies?: number;
  /** `base` es el fondo de la pagina; `alt` la franja que se despega de el. */
  theme?: ThemeRole;
}

export type MarqueeProps = MarqueeBase &
  ({ kind: "text"; items: string[] } | { kind: "logos"; items: MarqueeLogo[] });

const MIN_COPIES = 2;

export function Marquee({
  direction = "left",
  speed,
  scrollSpeed,
  copies: minCopies = MIN_COPIES,
  theme,
  ...content
}: MarqueeProps) {
  const { rootRef, scrollRef, copies } = useMarquee<HTMLDivElement, HTMLDivElement>({
    direction,
    speed,
    scrollSpeed,
    minCopies,
  });

  const mode = useSyncExternalStore(subscribeThemeMode, getThemeMode, getServerThemeMode);

  // Sin rol, la tira hereda la zona de su seccion — que en una pagina normal es la
  // del documento, o sea la del modo. `base` da exactamente esa.
  const zone = resolveZone(mode, theme ?? "base");

  const className = [
    styles.root,
    theme ? themeZoneClass(zone) : undefined,
    // Los logos vienen en blanco, que es lo habitual en un kit de marcas: sobre una
    // zona clara son invisibles. Se invierten, y la decision de QUE zonas son claras
    // la toma theme/zone.ts, que es quien conoce la convencion de Carbon.
    isLightZone(zone) ? styles.onLight : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  /**
   * Las copias se RENDERIZAN, no se clonan con cloneNode.
   *
   * Clonar deja nodos en el DOM que React no conoce: al re-renderizar duplica sobre
   * lo ya duplicado, y la limpieza nunca alcanza a los clones. Es el mismo fallo por
   * el que useCharRoll usa revert() y no kill().
   *
   * Solo la primera copia se lee: las demas repiten el mismo texto, y anunciarlo
   * tres veces convierte una tira decorativa en ruido.
   */
  const collections = Array.from({ length: copies });

  return (
    <div ref={rootRef} className={className} data-marquee-status="normal">
      <div ref={scrollRef} className={styles.track}>
        {collections.map((_, copy) => (
          <div
            key={copy}
            className={styles.collection}
            aria-hidden={copy === 0 ? undefined : "true"}
          >
            {content.kind === "text"
              ? content.items.map((item) => (
                  <div key={item} className={styles.item}>
                    <p className={styles.text}>{item}</p>
                  </div>
                ))
              : content.items.map((logo) => (
                  <div key={logo.src} className={styles.item}>
                    {/*
                      <img> y no next/image, y no es un descuido. Un logo es un SVG:
                      no hay nada que optimizar — ni redimensionado, ni negociacion
                      de formato — y el optimizador de Next RECHAZA los SVG por
                      defecto (`dangerouslyAllowSVG`), porque un SVG puede traer
                      script dentro. Pasar por el devuelve un 400 y el logo no se
                      pinta. El ancho y el alto declarados reservan el hueco igual.
                    */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logo.src}
                      alt={copy === 0 ? logo.alt : ""}
                      width={logo.width}
                      height={logo.height}
                      loading="lazy"
                      decoding="async"
                      className={styles.logo}
                    />
                  </div>
                ))}
          </div>
        ))}
      </div>
    </div>
  );
}
