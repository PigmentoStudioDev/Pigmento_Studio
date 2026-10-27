import type { HalftoneShapeName } from "../../../motion/halftone/shapes";
import type { CycledCandyFamily } from "../../../theme/candy";
import { Halftone } from "../../atoms/Halftone/Halftone";
import { Subheading } from "../../atoms/Subheading/Subheading";
import styles from "./FeatureCard.module.scss";

/**
 * La tarjeta de la casa (decision de Karen, 2026-10-26): la anatomia de las tarjetas
 * de servicios de la referencia de estudio. Una baldosa pequena con su solido arriba
 * a la izquierda, el nombre y lo que hace. La pieza es una marca, no la ilustracion:
 * lo que llena la tarjeta es el contenido.
 *
 * Dos pieles con la misma anatomia:
 *
 * - **Superficie** (sin `family`): la capa del tema, limpia. El papel vivo se quito:
 *   competia con el texto por la mirada.
 * - **Pigmento** (con `family`): el gradiente candy de esa familia, que no
 *   re-tematiza; la baldosa toma su parada clara y el texto su tinta.
 *
 * Solo el semitono cruza al navegador: la tarjeta sigue en servidor.
 */
export interface FeatureCardProps {
  /** El nombre de la tarjeta, su encabezado. */
  label: string;
  text?: string;
  /** El solido en semitono de la baldosa. */
  shape?: HalftoneShapeName;
  /** La piel de pigmento, con el candy de esta familia. Sin ella, la capa del tema. */
  family?: CycledCandyFamily;
  /**
   * En la piel de superficie, la familia de la baldosa: el color de lo que la tarjeta
   * nombra. Sin ella, la baldosa es una capa mas del tema.
   */
  accent?: CycledCandyFamily;
}

/**
 * Una clase por familia, explicita: la FORMA del candy vive en `_candy.scss` y solo se
 * invoca desde Sass, y una clase interpolada no la ve el gate que cruza el TSX con la
 * hoja. Tipado contra el ciclo, una familia nueva sin su clase no compila.
 */
const FAMILY_CLASS: Record<CycledCandyFamily, string> = {
  periwinkle: styles.familyPeriwinkle,
  tangerine: styles.familyTangerine,
  pink: styles.familyPink,
  lime: styles.familyLime,
};

export function FeatureCard({ label, text, shape, family, accent }: FeatureCardProps) {
  const skin = family === undefined ? styles.surface : FAMILY_CLASS[family];

  return (
    <div className={`${styles.root} ${skin}`}>
      {shape ? (
        <span className={family === undefined && accent ? `${styles.tile} ${FAMILY_CLASS[accent]}` : styles.tile}>
          <Halftone shape={shape} className={styles.tileShape} hostSelector={`.${styles.root}`} />
        </span>
      ) : null}
      <h3 className={styles.name}>{label}</h3>
      {text ? (
        <div className={styles.text}>
          <Subheading size="body" tone={family === undefined ? "secondary" : "inherit"}>
            {text}
          </Subheading>
        </div>
      ) : null}
    </div>
  );
}
