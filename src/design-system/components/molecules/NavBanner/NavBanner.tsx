import Image from "next/image";
import Link from "next/link";
import { Tag } from "../../atoms/Tag/Tag";
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
  onNavigate?: () => void;
}

export function NavBanner({ href, title, cta, tags, image, onNavigate }: NavBannerProps) {
  return (
    <Link href={href} onClick={onNavigate} className={styles.root}>
      {image ? (
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
    </Link>
  );
}
