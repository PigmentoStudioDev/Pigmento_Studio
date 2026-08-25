import Link from "next/link";
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
 */
export type ButtonEmphasis = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonBase {
  children: string;
  emphasis?: ButtonEmphasis;
  size?: ButtonSize;
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
  const { children, emphasis = "primary", size = "md", className } = props;
  const classes = [styles.root, EMPHASIS[emphasis], SIZE[size], className]
    .filter(Boolean)
    .join(" ");

  if (props.href !== undefined) {
    return (
      <Link href={props.href} onClick={props.onClick} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      disabled={props.disabled}
      onClick={props.onClick}
      className={classes}
    >
      {children}
    </button>
  );
}
