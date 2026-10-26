import { themeAttributes, type ThemeAssignment } from "../../../theme/zone";
import { LineDrawing } from "../../atoms/LineDrawing/LineDrawing";
import type { LineDrawingName } from "../../atoms/LineDrawing/drawings";
import { SectionChip } from "../../atoms/SectionChip/SectionChip";
import { Subheading } from "../../atoms/Subheading/Subheading";
import { PaperSurface } from "../../layout/PaperSurface/PaperSurface";
import styles from "./FeatureCard.module.scss";

/**
 * La tarjeta de la casa: la etiqueta y su numero arriba, una pieza al centro y lo que
 * dice debajo, separadas por lineas discontinuas. La pieza es un dibujo de linea o una
 * cifra; el resto no cambia, y por eso servicios y las cifras del estudio se leen como
 * el mismo sistema.
 *
 * Al pasar el puntero sube sobre la tarjeta una segunda cara del MISMO tono, con el
 * papel vivo de la placa de contacto, la reticula y las cruces, y en ella el dibujo se
 * traza de nuevo. No cambia de color (decision de Karen, 2026-10-26): lo que dice que
 * la tarjeta responde es el papel y el trazo, no un fondo que se da la vuelta. La cara
 * de encima va `inert` y oculta al lector: el contenido se oye una vez.
 *
 * Todo es CSS salvo el papel, que es lo unico que cruza al navegador: la tarjeta sigue
 * en servidor.
 */
export interface FeatureCardProps {
  label: string;
  /** Su posicion en la serie, desde 1. Se pinta como [01] y no se anuncia. */
  index: number;
  title?: string;
  text: string;
  /** La pieza del centro: un dibujo de linea... */
  drawing?: LineDrawingName;
  /** ...o una cifra. Con las dos, manda el dibujo. */
  figure?: string;
  /**
   * Sin papel vivo la cara de encima se queda con su grano CSS. Para copias que nadie
   * puede tocar (las inertes de un carrusel): cada papel es un contexto WebGL y el
   * navegador tira los mas viejos pasada una docena.
   */
  paper?: boolean;
  /**
   * `light`, la capa del tema. `dark`, negra en los dos modos —el material de la placa
   * de contacto—: sobre una seccion clara una tarjeta gris se pierde y una negra no.
   */
  tone?: "light" | "dark";
}

/** La negra es una asignacion de zona: el atributo re-declara los tokens dentro. */
const DARK: ThemeAssignment = { light: "dark", dark: "dark" };

const CORNERS = [styles.topLeft, styles.topRight, styles.bottomLeft, styles.bottomRight];

export function FeatureCard({ paper = true, tone = "light", ...props }: FeatureCardProps) {
  const dark = tone === "dark";

  return (
    <div
      className={[styles.root, dark ? styles.toneDark : undefined].filter(Boolean).join(" ")}
      {...(dark ? themeAttributes(DARK) : {})}
    >
      <Face {...props} heading />
      <div className={styles.overlay} aria-hidden="true" inert>
        {/* La cara es inert y no recibe el puntero: lo escucha la tarjeta. */}
        {paper ? <PaperSurface hostSelector={`.${styles.root}`} /> : null}
        <Face {...props} />
      </div>
    </div>
  );
}

function Face({ label, index, title, text, drawing, figure, heading = false }: FeatureCardProps & { heading?: boolean }) {
  const Name = heading ? "h3" : "p";

  return (
    <div className={styles.face}>
      <div className={styles.head}>
        <Name className={styles.name}>
          <SectionChip>{label}</SectionChip>
        </Name>
        <span className={styles.index} aria-hidden="true">
          [{String(index).padStart(2, "0")}]
        </span>
      </div>

      <div className={styles.media}>
        {drawing ? (
          <LineDrawing name={drawing} className={styles.drawing} />
        ) : figure ? (
          <p className={styles.figure}>{figure}</p>
        ) : null}
        {CORNERS.map((corner) => (
          <span key={corner} className={`${styles.plus} ${corner}`} aria-hidden="true" />
        ))}
      </div>

      <div className={styles.content}>
        {title ? (
          <Subheading size="lead" tone="primary">
            {title}
          </Subheading>
        ) : null}
        <Subheading size="body">{text}</Subheading>
      </div>
    </div>
  );
}
