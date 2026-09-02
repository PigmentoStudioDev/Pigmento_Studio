import styles from "./Heading.module.scss";

/**
 * Un titular de la escala editorial de marca.
 *
 * Separa dos cosas que suelen ir atadas y no son la misma: `level` es el hueco que
 * ocupa en el esquema del documento —por ahi navega quien usa lector de pantalla— y
 * `size` es el cuerpo con el que se pinta. Atadas, la pagina acaba eligiendo un h3
 * porque el h2 se ve grande: el esquema se descuadra y no se rompe nada visible.
 *
 * `level` no lleva default a proposito. Un h2 implicito es exactamente como un
 * esquema se tuerce en silencio, y quien monta la seccion es el unico que sabe de
 * que cuelga. `size` si lo lleva, derivado del nivel, asi que el caso normal sigue
 * siendo una sola prop.
 *
 * El color sale de un ROL y no de un valor: `text-primary` y `text-secondary` son
 * custom properties que index.scss re-emite por zona, asi que dentro de un
 * <Section theme="dark"> el titular se invierte solo y sin ninguna prop.
 *
 * Server component y `children: string`: lo traduce el sitio de llamada con
 * next-intl, y el dia que entre Payload lo alimenta 1:1 un campo del bloque.
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HeadingSize = "display" | "heading" | "lead";

export type HeadingTone = "primary" | "secondary";

export interface HeadingProps {
  children: string;
  level: HeadingLevel;
  size?: HeadingSize;
  tone?: HeadingTone;
  /**
   * Lo que <Section labelledBy> necesita para que su <section> pase de contenedor
   * generico a landmark con nombre. Sin un id en el titular, esa prop no tiene a
   * quien apuntar.
   */
  id?: string;
}

const SIZE: Record<HeadingSize, string> = {
  display: styles.sizeDisplay,
  heading: styles.sizeHeading,
  lead: styles.sizeLead,
};

const TONE: Record<HeadingTone, string> = {
  primary: styles.tonePrimary,
  secondary: styles.toneSecondary,
};

/**
 * El cuerpo por defecto de cada nivel: la lectura razonable de una pagina bien
 * anidada. No es una atadura — existe `size` justamente para cuando la composicion
 * pida otra cosa — pero evita que el caso comun tenga que decir dos veces lo mismo.
 *
 * Del cuarto nivel hacia abajo todos comparten cuerpo, y no es dejadez: la escala
 * tiene tres titulares porque un cuarto escalon seria indistinguible del tercero.
 * Una pagina que necesite que su h4 se vea distinto de su h3 tiene un problema de
 * estructura y no de tipografia.
 */
const SIZE_FOR_LEVEL: Record<HeadingLevel, HeadingSize> = {
  1: "display",
  2: "heading",
  3: "lead",
  4: "lead",
  5: "lead",
  6: "lead",
};

export function Heading({ children, level, size, tone = "primary", id }: HeadingProps) {
  const Element: `h${HeadingLevel}` = `h${level}`;
  const classes = [styles.root, SIZE[size ?? SIZE_FOR_LEVEL[level]], TONE[tone]].join(" ");

  return (
    <Element id={id} className={classes}>
      {children}
    </Element>
  );
}
