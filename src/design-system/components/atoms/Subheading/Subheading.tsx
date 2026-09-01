import styles from "./Subheading.module.scss";

/**
 * La linea de apoyo que acompana a un titular.
 *
 * Es un <p> y NUNCA un <h#>, y ahi esta la mitad del componente: un subtitulo
 * marcado como encabezado mete en el esquema una seccion que no existe, y quien
 * navega por encabezados aterriza en una entrada que no lleva a ningun sitio.
 * Cuando lo que hace falta de verdad es un encabezado mas pequeno, eso es un
 * <Heading> con `size` bajo — para eso el titular separa nivel de cuerpo.
 *
 * `tone` va a secundario por defecto: acompana a un titular, no compite con el.
 */
export type SubheadingSize = "body-l" | "body-m";
export type SubheadingTone = "primary" | "secondary";

export interface SubheadingProps {
  children: string;
  size?: SubheadingSize;
  tone?: SubheadingTone;
}

const SIZE: Record<SubheadingSize, string> = {
  "body-l": styles.sizeBodyL,
  "body-m": styles.sizeBodyM,
};

const TONE: Record<SubheadingTone, string> = {
  primary: styles.tonePrimary,
  secondary: styles.toneSecondary,
};

export function Subheading({ children, size = "body-l", tone = "secondary" }: SubheadingProps) {
  return <p className={[styles.root, SIZE[size], TONE[tone]].join(" ")}>{children}</p>;
}
