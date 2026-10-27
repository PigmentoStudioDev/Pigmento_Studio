import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { CasePiece } from "../../molecules/CaseMedia/CaseMedia";
import styles from "./ProjectNext.module.scss";

/**
 * El siguiente caso en una fila: rotulo, nombre y una miniatura. Toda la fila es el
 * enlace y el caso no termina en el pie: cada uno empuja al siguiente. Fila y no
 * portada a sangre (decision de Karen, 2026-10-27): a sangre competia con el caso que
 * se acaba de leer.
 */
export interface ProjectNextProps {
  overline: string;
  title: string;
  meta?: string;
  href: string;
  image: CasePiece;
}

export function ProjectNext({ overline, title, meta, href, image }: ProjectNextProps) {
  return (
    <Link href={href} className={styles.root}>
      <span className={styles.text}>
        <span className={styles.overline}>{overline}</span>
        <span className={styles.title}>{title}</span>
        {meta ? <span className={styles.meta}>{meta}</span> : null}
      </span>
      <span className={styles.frame}>
        <Image
          className={styles.image}
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          sizes="(max-width: 42rem) 100vw, 33vw"
        />
      </span>
    </Link>
  );
}
