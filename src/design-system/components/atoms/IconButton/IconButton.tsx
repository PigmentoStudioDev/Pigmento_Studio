import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon, type IconName } from "../Icon/Icon";
import styles from "./IconButton.module.scss";

/**
 * Un control cuadrado con un icono y nada mas.
 *
 * El gesto es una CORTINA que sube por lonjas escalonadas mientras el icono da una
 * vuelta de campana: el de reposo sale por arriba y el de hover entra por abajo.
 * Son dos copias del mismo dibujo, no una sola que se recolorea — recolorear no se
 * puede escalonar contra el fondo, y el cruce a mitad de vuelo es justo lo que hace
 * que el cambio de color no se lea como un parpadeo.
 *
 * Mide con los tokens de control, igual que Button: la fila de la cabecera no puede
 * tener dos alturas. Lo que cambia es la forma — cuadrado, y por tanto circulo — y
 * el gesto, porque un icono no se puede partir en caracteres como se parte una
 * etiqueta.
 *
 * Y NO es componente de cliente, al reves que Button. Button cruza la frontera
 * porque parte su etiqueta en caracteres y eso pide DOM; aqui el gesto entero son
 * transiciones de la hoja, asi que no hay un solo hook ni una sola API de navegador
 * que justifique mover este arbol al bundle. Renderizado desde una pieza de cliente
 * —la cabecera— viaja con ella igual; puesto en una pagina de servidor, no viaja.
 */
export type IconButtonEmphasis = "primary" | "secondary";

interface IconButtonBase {
  icon: IconName;
  /**
   * El nombre accesible. Obligatorio y no opcional: un control cuyo contenido es un
   * dibujo no tiene texto del que sacarlo, asi que sin esto se anuncia como "boton"
   * a secas y no hay forma de saber a donde lleva.
   */
  label: string;
  emphasis?: IconButtonEmphasis;
  className?: string;
}

interface IconButtonAsButton extends IconButtonBase {
  href?: undefined;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}

interface IconButtonAsLink extends IconButtonBase {
  href: string;
  type?: never;
  disabled?: never;
  /** Un destino de fuera abre en pestana nueva y se anuncia como tal. */
  external?: boolean;
  onClick?: () => void;
}

export type IconButtonProps = IconButtonAsButton | IconButtonAsLink;

const EMPHASIS: Record<IconButtonEmphasis, string> = {
  primary: styles.emphasisPrimary,
  secondary: styles.emphasisSecondary,
};

/**
 * Las lonjas de la cortina.
 *
 * Cinco es lo que hace que se lea como un barrido y no como una persiana: con dos
 * el escalonamiento no se percibe y con diez el ultimo llega tarde a un control que
 * mide cuarenta pixeles.
 */
const SLICES = [0, 1, 2, 3, 4];

export function IconButton(props: IconButtonProps) {
  const { icon, label, emphasis = "secondary", className } = props;

  const classes = [styles.root, EMPHASIS[emphasis], className].filter(Boolean).join(" ");

  // Cuerpo compartido: con el markup duplicado, un cambio de forma se aplica a una
  // rama y se olvida en la otra.
  const inner = (
    <>
      <span aria-hidden="true" className={styles.bg}>
        {SLICES.map((index) => (
          <span
            key={index}
            className={styles.slice}
            style={{ "--icon-button-slice": index } as CSSProperties}
          />
        ))}
      </span>

      {/* Las dos caras estan SIEMPRE en el DOM y ninguna se anuncia: el nombre lo
          pone aria-label en el control. Montar la de hover al pasar por encima
          costaria el primer fotograma del gesto, que es donde se ve. */}
      <span aria-hidden="true" className={styles.inner}>
        <span className={[styles.face, styles.faceDefault].join(" ")}>
          <Icon name={icon} />
        </span>
        <span className={[styles.face, styles.faceHover].join(" ")}>
          <Icon name={icon} />
        </span>
      </span>
    </>
  );

  if (props.href !== undefined) {
    const external = props.external ?? false;

    return (
      <Link
        href={props.href}
        aria-label={label}
        onClick={props.onClick}
        className={classes}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      aria-label={label}
      disabled={props.disabled}
      onClick={props.onClick}
      className={classes}
    >
      {inner}
    </button>
  );
}
