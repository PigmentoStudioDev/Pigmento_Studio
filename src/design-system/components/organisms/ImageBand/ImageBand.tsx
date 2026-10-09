import { ImageBackdrop } from "../../molecules/ImageBackdrop/ImageBackdrop";
import { BAND_PARALLAX } from "../../../motion/backdrop";
import styles from "./ImageBand.module.scss";

/**
 * Una imagen a sangre que separa dos actos de la pagina.
 *
 * **Sin `title` no tiene nada que leer, y ese sigue siendo su caso por defecto.** La
 * home encadena ocho bloques seguidos que piden atencion —servicios, proceso,
 * valores, citas, equipo, preguntas, llamada—, y entre dos de ellos hace falta un
 * sitio donde no haya nada que procesar.
 *
 * **Con `title`, una sola linea abajo y centrada, y nada mas** (decision de Karen,
 * 2026-10-09, con la referencia a la vista). No es la puerta a convertir la banda en
 * una seccion: no admite entradilla, ni boton, ni cifra. Una frase corta sobre una
 * foto a sangre se sigue leyendo de una pasada, que es lo que distingue una banda de
 * un bloque; dos elementos ya obligan a decidir cual se lee primero, y ahi deja de
 * ser una pausa.
 *
 * Es ademas la tercera capa de superficie que le faltaba a la pagina. El sistema de
 * secciones alterna por CAPAS y no por colores sueltos —base, secundaria, e imagen u
 * oscuro—, con una banda cada dos o tres secciones; aqui solo existian las dos
 * primeras (el tono `raised`), asi que los trece bloques se leian como una sola
 * superficie con un escalon.
 *
 * **El velo va atado al titular, y por eso es condicional.** Existe para garantizar
 * contraste cuando hay texto encima —y sobre un fondo que ademas se MUEVE es la unica
 * manera de garantizarlo—, asi que entra con `title` y no antes: sobre una imagen que
 * nadie tiene que leer, un velo solo la apaga. Y es un degradado desde abajo, no una
 * capa plana: lo que hay que proteger es el renglon del titular, no la foto entera.
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
   * La frase de la banda, si la lleva. Una linea: ver la nota de arriba.
   *
   * Sin ella, la banda es la pausa muda de siempre — y ademas se queda sin velo, que
   * es lo unico que el velo tiene que proteger.
   */
  title?: string;
  /**
   * Obligatorio y puede venir vacio. La banda es decorativa —no aporta informacion
   * que no este en el texto de alrededor—, asi que lo correcto suele ser la cadena
   * vacia; el campo obligatorio obliga a DECIDIRLO en vez de olvidarlo.
   */
  alt: string;
  width: number;
  height: number;
}

export function ImageBand({ src, title, alt, width, height }: ImageBandProps) {
  return (
    <div className={`${styles.root} ${title ? styles.withTitle : ""}`}>
      {/* La foto va ABSOLUTA y el titular en flujo, no al reves. `ImageBackdrop`
          recorta con `block-size: 100%`, que contra un alto automatico resuelve a
          cero: con un minimo y un texto que puede crecer, el unico alto definido que
          hay es el de la caja entera. */}
      <div className={styles.media}>
        <ImageBackdrop src={src} alt={alt} width={width} height={height} parallax={BAND_PARALLAX} />
      </div>

      {title ? <p className={styles.title}>{title}</p> : null}
    </div>
  );
}
