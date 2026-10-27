import Image from "next/image";
import type { CSSProperties } from "react";
import styles from "./PeopleStack.module.scss";

/**
 * Las caras del equipo en fila, solapadas: la primera encima y una pastilla con la
 * cuenta al final, la anatomia de la referencia de motion. Aqui la cuenta no es de
 * clientes sino de personas: despues de cinco valores que dicen "hablas con quien lo
 * hace", la prueba es su cara.
 *
 * Decoracion entera (`aria-hidden`): lo que dice el bloque lo dicen el titular y el
 * boton que lo acompanan. Unas caras sin nombre se oirian como imagenes mudas.
 */
export interface PeopleStackFace {
  src: string;
  width: number;
  height: number;
}

export interface PeopleStackProps {
  faces: PeopleStackFace[];
  /** La pastilla: "+4". Sin ella, solo caras. */
  count?: string;
}

export function PeopleStack({ faces, count }: PeopleStackProps) {
  if (faces.length === 0) return null;

  return (
    <div className={styles.root} aria-hidden="true">
      {faces.map((face, index) => (
        <span
          key={face.src}
          className={styles.face}
          // La primera encima, como en una mano de cartas: el orden de lectura.
          style={{ "--pg-face-depth": faces.length - index } as CSSProperties}
        >
          <Image className={styles.photo} src={face.src} alt="" width={face.width} height={face.height} sizes="2rem" />
        </span>
      ))}
      {count ? <span className={styles.count}>{count}</span> : null}
    </div>
  );
}
