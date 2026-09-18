import type { ReactNode } from "react";
import { themeAttributes, type ThemeAssignment } from "../../../theme/zone";
import styles from "./Section.module.scss";

/**
 * Una seccion de pagina: ritmo vertical, ancho de contenedor y zona de tema.
 *
 * Es la unica primitiva de composicion del DS y vive en el fondo del grafo: no
 * importa atomos, moleculas ni organismos, asi que puede envolver a cualquiera.
 * Cuando entre Payload, el renderer de bloques envuelve CADA bloque en un Section
 * con los campos de layout que trae el bloque — por eso los organismos no llevan
 * margenes externos ni deciden su propio tema: si lo hicieran, el hueco entre dos
 * bloques dependeria de cuales sean y no del orden que arme la pagina.
 *
 * Es la excepcion declarada a la regla de props serializables: `children` es
 * ReactNode porque esta capa COMPONE, no mapea contenido. La regla sigue firme
 * para moleculas y organismos, que son los que alimenta el CMS.
 */
export type SectionTheme = ThemeAssignment;
/**
 * `full` va a sangre sin techo, para lo que tiene que llegar de borde a borde (una
 * tira, un marquee). `strip` es la seccion a sangre cuyo CONTENIDO si para: el fondo
 * sigue a todo lo ancho y lo de dentro se centra bajo $container-full.
 */
export type SectionWidth = "content" | "wide" | "full" | "strip";
export type SectionSpacing = "none" | "compact" | "default" | "loose";
/** `solid` pinta solo el color del tema, sin grano. */
export type SectionSurface = "grain" | "solid";

export interface SectionProps {
  children: ReactNode;
  /**
   * El tono de la seccion en cada modo: `{ light: "dark", dark: "dark" }` es oscura
   * siempre. El modo que se omite sigue al sitio, y sin valor la seccion sigue al
   * sitio en los dos.
   *
   * Asignado y no un rol relativo: el modo oscuro no le da la vuelta a nada. Lo que
   * se ve en cada modo es lo que la pagina escribio para ese modo.
   */
  theme?: SectionTheme;
  width?: SectionWidth;
  spacing?: SectionSpacing;
  /**
   * El aire de ARRIBA cuando no es el de `spacing`. Existe para el organismo que ya
   * trae su propio aire superior —el que se queda fijo y descuenta la cabecera—: con
   * los dos sumados, el titular quedaba flotando lejos del bloque de encima.
   */
  spacingStart?: SectionSpacing;
  /**
   * El aire de ABAJO cuando no es el de `spacing`. Para el organismo cuyo contenido ya
   * termina en su propio aire, como la corona de tarjetas bajo sus controles.
   */
  spacingEnd?: SectionSpacing;
  /**
   * El fondo es del tema en los dos casos —blanco en claro, oscuro en oscuro—; lo
   * que cambia es el grano. Una seccion llena de imagenes lo pide liso: el ruido
   * sobre el hueco entre fotos se lee como suciedad, no como textura.
   */
  surface?: SectionSurface;
  /** Ancla de navegacion. En Payload sale del blockName del bloque. */
  id?: string;
  /**
   * Id del encabezado que nombra la seccion. Un <section> sin nombre accesible es
   * un contenedor generico; con el pasa a ser un landmark `region` navegable.
   */
  labelledBy?: string;
}

const WIDTH: Record<SectionWidth, string> = {
  content: styles.widthContent,
  wide: styles.widthWide,
  full: styles.widthFull,
  strip: styles.widthStrip,
};

const SPACING: Record<SectionSpacing, string> = {
  none: styles.spacingNone,
  compact: styles.spacingCompact,
  default: styles.spacingDefault,
  loose: styles.spacingLoose,
};

const SPACING_START: Record<SectionSpacing, string> = {
  none: styles.spacingStartNone,
  compact: styles.spacingStartCompact,
  default: styles.spacingStartDefault,
  loose: styles.spacingStartLoose,
};

const SPACING_END: Record<SectionSpacing, string> = {
  none: styles.spacingEndNone,
  compact: styles.spacingEndCompact,
  default: styles.spacingEndDefault,
  loose: styles.spacingEndLoose,
};

export function Section({
  children,
  theme,
  width = "content",
  spacing = "default",
  spacingStart,
  spacingEnd,
  surface = "grain",
  id,
  labelledBy,
}: SectionProps) {
  // Sin clase de tema: la zona la resuelve el CSS desde los atributos de tema, bajo
  // la del documento. Resolverla aqui obligaria a conocer el modo, y el modo solo
  // existe en el navegador — Section se quedaria sin poder ser server component
  // por una cuenta que la cascada ya sabe hacer.
  const className = [
    styles.root,
    WIDTH[width],
    SPACING[spacing],
    spacingStart ? SPACING_START[spacingStart] : undefined,
    spacingEnd ? SPACING_END[spacingEnd] : undefined,
    surface === "solid" ? styles.surfaceSolid : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    // Los atributos de tema hacen dos trabajos. Para el CSS son lo que aplica el
    // tono asignado bajo el modo del documento; para la cabecera, la marca legible
    // desde JS de lo que pide esta seccion, que observa para adoptar el tema de lo
    // que tiene debajo — sin conocer ninguna seccion concreta y sin leer las clases
    // internas de Carbon, que son suyas.
    <section id={id} aria-labelledby={labelledBy} className={className} {...themeAttributes(theme)}>
      <div className={styles.inner}>{children}</div>
    </section>
  );
}
