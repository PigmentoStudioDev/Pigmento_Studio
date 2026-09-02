"use client";

import Link from "next/link";
import { useCharRoll } from "../../../motion/useCharRoll";
import styles from "./Button.module.scss";

/**
 * El boton de Pigmento.
 *
 * NUESTRO, no el de Carbon. Carbon aporta la plantilla de tokens — este componente
 * consume su tercera capa (`button-primary`, `button-secondary`…), la misma que
 * usaria el suyo — pero la forma, el radio y el motion son de la marca.
 *
 * Con `href` renderiza un enlace y sin el un boton, y no es azucar sintactico: un
 * <button> que navega deja fuera el clic con rueda, el "abrir en pestana nueva" y
 * el menu contextual, y se anuncia como boton a quien usa lector de pantalla
 * cuando en realidad es un destino.
 *
 * Es cliente desde que rueda: partir el texto pide DOM. El fondo va en su propio
 * nodo porque escalar el control escalaria tambien el texto y el anillo de foco.
 */
export type ButtonEmphasis = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonBase {
  /** Plano y no ReactNode: se parte en caracteres. */
  children: string;
  emphasis?: ButtonEmphasis;
  size?: ButtonSize;
  /**
   * Estira el control hasta el ancho de su contenedor. Por defecto mide lo que su
   * etiqueta: un boton siempre estirado deja de leerse como boton.
   */
  fullWidth?: boolean;
  className?: string;
}

interface ButtonAsButton extends ButtonBase {
  href?: undefined;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}

interface ButtonAsLink extends ButtonBase {
  href: string;
  type?: never;
  disabled?: never;
  onClick?: () => void;
}

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const EMPHASIS: Record<ButtonEmphasis, string> = {
  primary: styles.emphasisPrimary,
  secondary: styles.emphasisSecondary,
  ghost: styles.emphasisGhost,
};

const SIZE: Record<ButtonSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

export function Button(props: ButtonProps) {
  const { children, emphasis = "primary", size = "md", fullWidth = false, className } = props;
  const textRef = useCharRoll<HTMLSpanElement>(children);

  const classes = [
    styles.root,
    EMPHASIS[emphasis],
    SIZE[size],
    fullWidth ? styles.fullWidth : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Cuerpo compartido: con el markup duplicado, un cambio de forma se aplica a una
  // rama y se olvida en la otra.
  const inner = (
    <>
      <span aria-hidden="true" className={styles.bg} />
      <span className={styles.inner}>
        {/* Escondido: partido deja de ser una palabra. El nombre va en el control,
            que es donde aria-label vale — en un <span> sin rol esta prohibido. */}
        <span aria-hidden="true" ref={textRef} className={styles.text}>
          {children}
        </span>
      </span>
    </>
  );

  if (props.href !== undefined) {
    return (
      <Link href={props.href} aria-label={children} onClick={props.onClick} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      aria-label={children}
      disabled={props.disabled}
      onClick={props.onClick}
      className={classes}
    >
      {inner}
    </button>
  );
}
