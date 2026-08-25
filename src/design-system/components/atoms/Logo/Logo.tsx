import Image from "next/image";
import wordmark from "./pigmento-studio.webp";
import styles from "./Logo.module.scss";

/**
 * La marca, en sus dos formas: logotipo completo y marca compacta.
 *
 * Las dos estan SIEMPRE en el DOM y `compact` decide cual se ve. Es lo que
 * permite cruzarlas con una transicion sin que el ancho de la barra salte, y por
 * eso no es un condicional de React: desmontar una y montar la otra reflowaria la
 * fila entera a mitad del scroll.
 *
 * Decorativa por defecto: el nombre accesible lo pone quien la envuelve — en la
 * cabecera, el enlace al inicio. Un logo que se nombra a si mismo dentro de un
 * enlace ya nombrado produce dos nombres para un solo destino.
 */
export interface LogoProps {
  /** Colapsa al isotipo. La cabecera lo activa al empezar el scroll. */
  compact?: boolean;
}

export function Logo({ compact = false }: LogoProps) {
  return (
    <span
      aria-hidden="true"
      className={[styles.root, compact ? styles.isCompact : styles.isFull].join(" ")}
    >
      {/* Import estatico: Next lee el tamano del archivo y reserva el hueco solo,
          sin que haya que repetir 400x75 aqui y que se quede mintiendo el dia que
          cambie el logotipo. `priority` porque esta sobre la linea de flotacion en
          todas las rutas — la cabecera la monta el layout raiz. */}
      <Image src={wordmark} alt="" priority className={styles.wordmark} />

      {/* TODO(brand): isotipo real. La marca solo trae logotipo, asi que la forma
          compacta sigue siendo un placeholder. Va en currentColor, no en mapa de
          bits, y por eso no necesita el filtro de inversion. */}
      <svg className={styles.mark} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 20V7a3 3 0 0 1 3-3h6a6 6 0 0 1 0 12H9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
        />
      </svg>
    </span>
  );
}
