import Image from "next/image";
import Link from "next/link";
import { Tag } from "../../atoms/Tag/Tag";
import { RadialGallery, type RadialGalleryImage } from "../RadialGallery/RadialGallery";
import styles from "./NavBanner.module.scss";

/**
 * La tarjeta destacada del panel de navegacion: una pieza promocional que lleva a
 * un sitio concreto.
 *
 * Props serializables y una imagen descrita por sus dimensiones, que es lo que
 * `next/image` necesita para reservar el hueco antes de cargarla — sin eso, el
 * panel salta al terminar la descarga. Es la forma que tendra `ImageProps` cuando
 * la alimente el media de Payload.
 *
 * Toda la tarjeta es UN enlace: el titulo y la llamada a la accion apuntan al
 * mismo destino, asi que anidar un boton dentro seria un segundo control para el
 * mismo sitio — y un control dentro de un enlace no es HTML valido. La llamada a
 * la accion es texto con aspecto de boton, no un boton.
 */
export interface NavBannerImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface NavBannerProps {
  href: string;
  title: string;
  cta: string;
  tags?: string[];
  image?: NavBannerImage;
  /**
   * Escaparate giratorio en lugar de la imagen fija. Ocupa el mismo hueco: son dos
   * formas de llenar el fondo de la tarjeta, no dos capas — una tarjeta que anuncia
   * "el ultimo caso" con una foto detras y una corona de otros catorce encima
   * anuncia dos cosas a la vez.
   */
  gallery?: RadialGalleryImage[];
  onNavigate?: () => void;
}

export function NavBanner({ href, title, cta, tags, image, gallery, onNavigate }: NavBannerProps) {
  return (
    <Link href={href} onClick={onNavigate} className={styles.root}>
      {!gallery?.length && image ? (
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className={styles.image}
        />
      ) : null}

      <span className={styles.content}>
        {tags?.length ? (
          <span className={styles.tags}>
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </span>
        ) : null}

        <span className={styles.title}>{title}</span>

        {/*
          Fuera del arbol de accesibilidad a proposito. El enlace ya se llama por
          su titulo; anadirle "Verlo" solo alarga el anuncio con una palabra que no
          identifica el destino. Y hacerlo explicito evita depender del layout: el
          nombre accesible de varios nodos lleva separacion o no segun el display
          que les de el CSS, asi que en el navegador diria "Titulo Verlo" y en el
          test "TituloVerlo" — misma marca, dos resultados.
        */}
        <span aria-hidden="true" className={styles.cta}>
          {cta}
        </span>
      </span>

      {/*
        Despues del texto, que es donde se ve y donde se lee. Antes iba primero
        porque era el fondo de la tarjeta; ahora es la fila de abajo y el orden del
        DOM tiene que decir lo mismo que el orden visual.

        <div> y no <span> como el resto de la tarjeta: un <a> admite contenido de
        flujo, pero un <span> solo admite contenido de frase, y la galeria trae
        divs dentro. El resto de piezas son spans porque son texto; esta no lo es.
      */}
      {gallery?.length ? (
        <div className={styles.gallery}>
          <RadialGallery images={gallery} />
        </div>
      ) : null}
    </Link>
  );
}
