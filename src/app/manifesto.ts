import type { ManifestoProps } from "@/design-system/components/organisms/Manifesto/Manifesto";

/**
 * El contenido del manifiesto. Vive en app/ y no en el design system por lo mismo que
 * la navegacion y el pie: es contenido del sitio, no una pieza reutilizable, y el
 * contrato de modularidad exige que el DS pueda salir de este repo sin arrastrar sus
 * rutas.
 *
 * La frase se arma AQUI, trozo a trozo, en vez de escribirse con marcas dentro de una
 * sola cadena. Asi el diccionario solo tiene texto —quien traduce no ve sintaxis— y
 * el orden de las palabras puede cambiar de un idioma a otro sin tocar el componente.
 */
type Translate = (key: string) => string;

/**
 * Las piezas que brotan de las palabras. Son las mismas del portafolio, y ahi esta la
 * gracia del bloque: ensena trabajo dos strips antes de que llegue el portafolio, sin
 * duplicarlo. El dia que entre Payload, las alimenta esa misma coleccion.
 *
 * Las medidas van una a una porque NO son iguales: van de 477 a 796 de alto, y
 * next/image las necesita para reservar el hueco antes de descargarlas.
 */
const PIECES = [
  { src: "/portfolio/01.png", width: 522, height: 522 },
  { src: "/portfolio/02.png", width: 522, height: 715 },
  { src: "/portfolio/03.png", width: 521, height: 737 },
  { src: "/portfolio/04.png", width: 521, height: 690 },
  { src: "/portfolio/05.png", width: 516, height: 775 },
  { src: "/portfolio/06.png", width: 520, height: 601 },
  { src: "/portfolio/07.png", width: 521, height: 715 },
  { src: "/portfolio/08.png", width: 521, height: 477 },
  { src: "/portfolio/09.png", width: 523, height: 605 },
  { src: "/portfolio/10.png", width: 523, height: 753 },
  { src: "/portfolio/11.png", width: 521, height: 631 },
  { src: "/portfolio/12.png", width: 509, height: 718 },
  { src: "/portfolio/13.png", width: 520, height: 796 },
  { src: "/portfolio/14.png", width: 518, height: 688 },
];

export function getManifesto(t: Translate): ManifestoProps {
  return {
    eyebrow: t("eyebrow"),
    segments: [
      { text: t("open") },
      // TODO(rutas): branding no tiene pagina propia — la navegacion lista Motion,
      // Marketing y Desarrollo web — asi que apunta al indice hasta que exista.
      { text: t("branding"), href: "/servicios" },
      { text: t("afterBranding") },
      { text: t("sites"), href: "/servicios/web-development" },
      { text: t("afterSites") },
      { text: t("motion"), href: "/servicios/motion" },
      { text: t("close") },
    ],
    pieces: PIECES,
  };
}
