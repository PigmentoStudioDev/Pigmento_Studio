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
 * `inherit` deja el color de quien lo contiene: sobre un candy, la tinta de su familia,
 * que es la unica que aguanta contraste; el gris del tema ahi se ve sucio.
 *
 * Y el cuerpo por defecto es `lead` y no `body`. Al lado de un display, un parrafo
 * de cuerpo normal queda a una quinta parte de su tamano y deja de leerse como
 * entradilla para leerse como letra pequena. `body` esta para cuando el subtitulo
 * acompana a un titular de seccion y no a una cima.
 */
export type SubheadingSize = "lead" | "body";
export type SubheadingTone = "primary" | "secondary" | "inherit";

export interface SubheadingProps {
  children: string;
  size?: SubheadingSize;
  tone?: SubheadingTone;
}

const SIZE: Record<SubheadingSize, string> = {
  lead: styles.sizeLead,
  body: styles.sizeBody,
};

const TONE: Record<SubheadingTone, string | undefined> = {
  primary: styles.tonePrimary,
  secondary: styles.toneSecondary,
  inherit: undefined,
};

export function Subheading({ children, size = "lead", tone = "secondary" }: SubheadingProps) {
  return <p className={[styles.root, SIZE[size], TONE[tone]].filter(Boolean).join(" ")}>{children}</p>;
}
