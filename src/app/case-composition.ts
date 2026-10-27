import type {
  CaseFrame,
  CaseMediaGroup,
  CasePiece,
} from "@/design-system/components/molecules/CaseMedia/CaseMedia";

/**
 * Como se reparten las piezas de un caso. Las reglas salen de medir seis casos de las
 * referencias de portfolio a 1440px (2026-10-27):
 *
 * - **Ninguna pieza va en su proporcion natural.** Cada una entra en un marco fijo —16:9,
 *   4:3, 4:5 o 1:1— y se recorta. Con la proporcion natural una vertical a sangre ocupa
 *   tres pantallas y dos piezas vecinas nunca alinean.
 * - **Pocas composiciones, siempre las mismas:** a sangre, inset centrado, par
 *   asimetrico (una horizontal pequena y una vertical grande, alternando de lado), par
 *   de verticales y una vertical sola centrada.
 * - **La orientacion decide la composicion**, no la posicion: dos verticales hacen par,
 *   una horizontal y una vertical hacen el par asimetrico, una horizontal sola alterna
 *   entre a sangre e inset para que no se repitan dos iguales.
 */

/** Por encima es horizontal y por debajo vertical; entre medias se lee cuadrada. */
const LANDSCAPE_MIN = 1.2;
const PORTRAIT_MAX = 0.9;

/**
 * Cuantas piezas se apilan antes de pasar a la tira horizontal. Las referencias con
 * galeria larga paran en torno a ocho piezas en vertical y mandan el resto a un carril:
 * apilar mas convierte el caso en un rollo que nadie termina.
 */
export const STACK_CAP = 8;

type Orientation = "landscape" | "portrait" | "square";

function orientation(piece: CasePiece): Orientation {
  const ratio = piece.width / piece.height;
  if (ratio >= LANDSCAPE_MIN) return "landscape";
  if (ratio <= PORTRAIT_MAX) return "portrait";
  return "square";
}

const framed = (piece: CasePiece, frame: CaseFrame) => ({ ...piece, frame });

/** El marco de una pieza que va sola en la tira: su propia orientacion, sin recorte de mas. */
export function stripFrame(piece: CasePiece): CaseFrame {
  const kind = orientation(piece);
  return kind === "landscape" ? "wide" : kind === "portrait" ? "portrait" : "square";
}

export function compose(pieces: CasePiece[]): CaseMediaGroup[] {
  const groups: CaseMediaGroup[] = [];
  let mirror = false;
  let insetNext = false;
  let at = 0;

  while (at < pieces.length) {
    const first = pieces[at];
    const second = pieces[at + 1];
    const a = orientation(first);
    const b = second ? orientation(second) : undefined;

    if (second && a !== "landscape" && b !== "landscape") {
      // Dos verticales, o dos cuadradas, hacen par. Si una es vertical, mandan las dos a
      // 4:5: un par con dos marcos distintos no alinea por abajo.
      const frame: CaseFrame = a === "portrait" || b === "portrait" ? "portrait" : "square";
      groups.push({ layout: "pair", pieces: [framed(first, frame), framed(second, frame)] });
      at += 2;
      continue;
    }

    if (second && (a === "landscape") !== (b === "landscape")) {
      // El par asimetrico lleva la horizontal primero y la vertical despues en el
      // marcado; el lado lo cambia la composicion, no el orden de lectura.
      const [wide, tall] = a === "landscape" ? [first, second] : [second, first];
      groups.push({ layout: mirror ? "offsetMirror" : "offset", pieces: [framed(wide, "classic"), framed(tall, "portrait")] });
      mirror = !mirror;
      at += 2;
      continue;
    }

    if (a === "landscape") {
      groups.push({ layout: insetNext ? "inset" : "wide", pieces: [framed(first, "wide")] });
      insetNext = !insetNext;
      at += 1;
      continue;
    }

    // Una vertical o cuadrada que se queda sin pareja: sola y centrada, nunca a sangre.
    groups.push({ layout: "single", pieces: [framed(first, a === "portrait" ? "portrait" : "square")] });
    at += 1;
  }

  return groups;
}
