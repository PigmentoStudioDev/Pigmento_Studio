"use client";

import { useSyncExternalStore } from "react";
import { useMarquee, type MarqueeDirection } from "../../../motion/useMarquee";
import { getServerThemeMode, getThemeMode, subscribeThemeMode } from "../../../theme/mode";
import { isLightZone, resolveZone, themeZoneClass, type ThemeAssignment } from "../../../theme/zone";
import styles from "./Marquee.module.scss";

/**
 * Tira infinita que invierte su sentido segun hacia donde se desplace la pagina.
 *
 * **El tema se ASIGNA por modo**, igual que en Section y la cabecera: que tono lleva
 * la tira en claro y cual en oscuro, y el modo que se omite sigue al sitio. Un solo
 * `light`/`dark` fijo diria una cosa y el sitio en el otro modo pintaria otra.
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

/**
 * Una resena firmada. Los tres campos de la atribucion son obligatorios por lo mismo
 * que en el bloque de testimonios: una cita anonima no prueba nada y se lee como
 * inventada, y el componente no puede pintar media firma.
 */
export interface MarqueeQuote {
  /** La frase, sin comillas: las pone la hoja si hacen falta. */
  quote: string;
  author: string;
  role: string;
  company: string;
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
  /** El tono de la tira en cada modo. Sin valor, hereda el de su seccion. */
  theme?: ThemeAssignment;
  /**
   * El tono de cada PIEZA, cuando la pieza es una superficie propia.
   *
   * Separado de `theme` porque son dos superficies distintas: una tarjeta de resena
   * oscura sobre la pagina clara necesita que la tira NO se pinte, y pintar la tira
   * oscura para oscurecer la tarjeta deja una franja negra de borde a borde. La zona
   * va en la tarjeta, asi que dentro de ella `layer-01`, `text-secondary` y
   * `border-subtle` resuelven en la paleta que toca sin escribir un solo color
   * invertido a mano.
   *
   * Solo lo leen las resenas: un logo no es una superficie, es una imagen.
   */
  itemTheme?: ThemeAssignment;
}

export type MarqueeProps = MarqueeBase &
  (
    | { kind: "text"; items: string[] }
    | { kind: "logos"; items: MarqueeLogo[] }
    | { kind: "quotes"; items: MarqueeQuote[] }
  );

const MIN_COPIES = 2;

export function Marquee({
  direction = "left",
  speed,
  scrollSpeed,
  copies: minCopies = MIN_COPIES,
  theme,
  itemTheme,
  ...content
}: MarqueeProps) {
  const { rootRef, scrollRef, copies } = useMarquee<HTMLDivElement, HTMLDivElement>({
    direction,
    speed,
    scrollSpeed,
    minCopies,
  });

  const mode = useSyncExternalStore(subscribeThemeMode, getThemeMode, getServerThemeMode);

  // Sin asignacion, la tira hereda la zona de su seccion — que en una pagina normal
  // es la del documento, o sea la del modo, y es la que resuelve una asignacion vacia.
  const zone = resolveZone(mode, theme);

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

  // La zona de la pieza se resuelve con el MISMO modo que la de la tira: las dos
  // salen del store, y leerlo dos veces podria devolver dos modos distintos.
  const quoteCardClass = [styles.quoteCard, itemTheme ? themeZoneClass(resolveZone(mode, itemTheme)) : undefined]
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
            {content.kind === "quotes" ? (
              content.items.map((cita, posicion) => (
                // La clave lleva la POSICION ademas de la firma: dos resenas pueden
                // venir de la misma persona, y React avisa de claves repetidas y
                // puede omitir una de las dos.
                <div key={`${cita.author}-${posicion}`} className={styles.item}>
                  <figure className={quoteCardClass}>
                    <blockquote className={styles.quote}>
                      <p className={styles.quoteText}>{cita.quote}</p>
                    </blockquote>
                    <figcaption className={styles.quoteAuthor}>
                      <cite className={styles.quoteName}>{cita.author}</cite>
                      <span className={styles.quoteRole}>
                        {cita.role}, {cita.company}
                      </span>
                    </figcaption>
                  </figure>
                </div>
              ))
            ) : content.kind === "text" ? (
              content.items.map((item) => (
                <div key={item} className={styles.item}>
                  <p className={styles.text}>{item}</p>
                </div>
              ))
            ) : (
              content.items.map((logo) => (
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
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
