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
      {/* TODO(brand): logotipo real de Pigmento. Hoy es el nombre compuesto con
          los tokens tipograficos de Carbon, no un SVG: un logotipo falso seria
          mas dificil de sustituir que un texto que ya se lee bien. */}
      <span className={styles.wordmark}>Pigmento</span>

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
