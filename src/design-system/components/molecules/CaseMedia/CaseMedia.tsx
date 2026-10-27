import Image from "next/image";
import styles from "./CaseMedia.module.scss";

/**
 * Las piezas de un caso, en marcos y composiciones fijas. Que pieza va en que
 * composicion lo decide quien arma el caso (por su orientacion); aqui solo se dibuja.
 *
 * Toda pieza entra en un marco y se recorta: con la proporcion natural una vertical a
 * sangre ocupa tres pantallas y dos piezas vecinas nunca alinean.
 */
export interface CasePiece {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** 16:9, 4:3, 4:5 y 1:1: las cuatro proporciones que usan las referencias medidas. */
export type CaseFrame = "wide" | "classic" | "portrait" | "square";

export interface CaseFramedPiece extends CasePiece {
  frame: CaseFrame;
}

/**
 * `wide` a sangre, `inset` centrada en diez columnas, `offset` una horizontal pequena y
 * una vertical grande (y `offsetMirror` con los lados cambiados), `pair` dos iguales a
 * medias y `single` una vertical sola en el centro.
 */
export type CaseMediaLayout = "wide" | "inset" | "offset" | "offsetMirror" | "pair" | "single";

export interface CaseMediaGroup {
  layout: CaseMediaLayout;
  pieces: CaseFramedPiece[];
}

const LAYOUT: Record<CaseMediaLayout, string> = {
  wide: styles.layoutWide,
  inset: styles.layoutInset,
  offset: styles.layoutOffset,
  offsetMirror: styles.layoutOffsetMirror,
  pair: styles.layoutPair,
  single: styles.layoutSingle,
};

const FRAME: Record<CaseFrame, string> = {
  wide: styles.frameWide,
  classic: styles.frameClassic,
  portrait: styles.framePortrait,
  square: styles.frameSquare,
};

/** El ancho que ocupa cada pieza en pantalla grande: lo que `next/image` necesita para no bajar de mas. */
const SIZES: Record<CaseMediaLayout, string> = {
  wide: "100vw",
  inset: "(max-width: 42rem) 100vw, 84vw",
  offset: "(max-width: 42rem) 100vw, 50vw",
  offsetMirror: "(max-width: 42rem) 100vw, 50vw",
  pair: "(max-width: 42rem) 100vw, 50vw",
  single: "(max-width: 42rem) 100vw, 50vw",
};

function Piece({ piece, sizes, className }: { piece: CaseFramedPiece; sizes: string; className?: string }) {
  return (
    <li className={`${styles.item} ${FRAME[piece.frame]} ${className ?? ""}`}>
      <Image className={styles.image} src={piece.src} alt={piece.alt} width={piece.width} height={piece.height} sizes={sizes} />
    </li>
  );
}

export interface CaseMediaProps {
  group: CaseMediaGroup;
  /** Nombre del grupo para el lector de pantalla. */
  label?: string;
}

export function CaseMedia({ group, label }: CaseMediaProps) {
  if (group.pieces.length === 0) return null;

  return (
    <ul className={`${styles.root} ${LAYOUT[group.layout]}`} aria-label={label}>
      {group.pieces.map((piece, index) => (
        // La clave lleva la posicion: dos piezas pueden venir del mismo archivo.
        <Piece key={`${piece.src}-${index}`} piece={piece} sizes={SIZES[group.layout]} />
      ))}
    </ul>
  );
}

export interface CaseGalleryProps {
  groups: CaseMediaGroup[];
  label?: string;
}

/** La galeria apilada: el medianil entre composiciones es el mismo que dentro de una. */
export function CaseGallery({ groups, label }: CaseGalleryProps) {
  if (groups.length === 0) return null;

  return (
    <div className={styles.stack}>
      {groups.map((group, index) => (
        // El grupo no tiene identidad propia: su posicion es su clave.
        <CaseMedia key={index} group={group} label={label} />
      ))}
    </div>
  );
}

export interface CaseStripProps {
  pieces: CaseFramedPiece[];
  label: string;
}

/**
 * Lo que pasa del tope de la galeria, en un carril horizontal con el scroll nativo: todas
 * a la misma altura y cada una a su orientacion. Se recorre con el dedo, el trackpad o
 * el teclado sin una linea de JS, y sin JS se ve igual.
 */
export function CaseStrip({ pieces, label }: CaseStripProps) {
  if (pieces.length === 0) return null;

  return (
    // Enfocable para que el teclado pueda desplazar el carril: sin foco no hay forma de llegar.
    <ul className={styles.strip} aria-label={label} tabIndex={0}>
      {pieces.map((piece, index) => (
        <Piece key={`${piece.src}-${index}`} piece={piece} sizes="60vw" className={styles.stripItem} />
      ))}
    </ul>
  );
}
