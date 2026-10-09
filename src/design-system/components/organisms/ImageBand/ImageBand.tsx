import { ImageBackdrop } from "../../molecules/ImageBackdrop/ImageBackdrop";
import { BAND_PARALLAX } from "../../../motion/backdrop";
import styles from "./ImageBand.module.scss";

/**
 * Una imagen a sangre que separa dos actos de la pagina.
 *
 * **No tiene nada que leer, y eso ES el componente.** La home encadena ocho bloques
 * seguidos que piden atencion —servicios, proceso, valores, comparativa, citas,
 * equipo, preguntas, llamada—, y entre dos de ellos hace falta un sitio donde no haya
 * nada que procesar. Cualquier cosa que se le anada encima —un titular, una cifra, un
 * boton— la convierte en el noveno bloque y la deja sin trabajo.
 *
 * Es ademas la tercera capa de superficie que le faltaba a la pagina. El sistema de
 * secciones alterna por CAPAS y no por colores sueltos —base, secundaria, e imagen u
 * oscuro—, con una banda cada dos o tres secciones; aqui solo existian las dos
 * primeras (el tono `raised`), asi que los trece bloques se leian como una sola
 * superficie con un escalon.
 *
 * No lleva velo. El velo existe para garantizar contraste cuando hay texto encima, y
 * sobre un fondo que ademas se MUEVE es la unica manera de garantizarlo; sin texto no
 * hay nada que garantizar, y un velo sobre una imagen que nadie tiene que leer solo
 * la apaga.
 *
 * El parallax y su geometria son los de `ImageBackdrop`, que ya existia para la
 * portada de las propuestas: el recorte hace de disparador y dentro se mueve algo mas
 * alto, de modo que el sobrante nunca descubre un borde vacio.
 *
 * Server component: lo unico que cruza al navegador es `ImageBackdrop`, que ya
 * cruzaba.
 *
 * Props serializables: es 1:1 un bloque de imagen de Payload.
 */
export interface ImageBandProps {
  src: string;
  /**
   * Obligatorio y puede venir vacio. La banda es decorativa —no aporta informacion
   * que no este en el texto de alrededor—, asi que lo correcto suele ser la cadena
   * vacia; el campo obligatorio obliga a DECIDIRLO en vez de olvidarlo.
   */
  alt: string;
  width: number;
  height: number;
}

export function ImageBand({ src, alt, width, height }: ImageBandProps) {
  return (
    <div className={styles.root}>
      <ImageBackdrop src={src} alt={alt} width={width} height={height} parallax={BAND_PARALLAX} />
    </div>
  );
}
