import type { ReactNode } from "react";
import { themeZoneClass, type ThemeZone } from "../../../theme/zone";
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
export type SectionTheme = ThemeZone;
export type SectionWidth = "content" | "wide" | "full";
export type SectionSpacing = "none" | "compact" | "default" | "loose";

export interface SectionProps {
  children: ReactNode;
  /** Zona de tema de Carbon. Sin valor, la seccion hereda el tema de la pagina. */
  theme?: SectionTheme;
  width?: SectionWidth;
  spacing?: SectionSpacing;
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
};

const SPACING: Record<SectionSpacing, string> = {
  none: styles.spacingNone,
  compact: styles.spacingCompact,
  default: styles.spacingDefault,
  loose: styles.spacingLoose,
};

export function Section({
  children,
  theme,
  width = "content",
  spacing = "default",
  id,
  labelledBy,
}: SectionProps) {
  const className = [
    styles.root,
    WIDTH[width],
    SPACING[spacing],
    theme ? themeZoneClass(theme) : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    // data-theme-section es la marca legible desde JS de la zona que ocupa esta
    // seccion. La cabecera la observa para adoptar el tema de lo que tiene debajo,
    // sin conocer ninguna seccion concreta y sin leer las clases internas de
    // Carbon, que son suyas y pueden cambiar en cualquier minor.
    <section
      id={id}
      aria-labelledby={labelledBy}
      data-theme-section={theme}
      className={className}
    >
      <div className={styles.inner}>{children}</div>
    </section>
  );
}
