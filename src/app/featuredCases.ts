import type { FeaturedCase } from "@/cms/projects";
import type {
  FeaturedCaseItem,
  FeaturedCasesProps,
} from "@/design-system/components/organisms/FeaturedCases/FeaturedCases";

/**
 * Los casos que se paran a mitad del argumento.
 *
 * No hay lista de slugs elegidos: entran los que el CMS puede sostener —galeria y
 * `summary`— en el orden del portfolio. Una constante con nombres propios obliga a
 * editar codigo cada vez que el estudio publica un caso mejor, y el criterio de "este
 * si y este no" es de Pigmento, no del repo: lo expresa ordenando sus proyectos.
 */

/**
 * Cuantas piezas entran por caso. Cuatro: dos filas de dos, que es lo que cabe al lado
 * del texto sin que la tarjeta se convierta en una pagina de caso. Señora Galleta
 * tiene trece en el CMS y las trece aqui serian el portafolio, no una prueba.
 */
export const FEATURED_CASE_PIECES = 4;

/**
 * Cuantos casos entran. Cinco es techo, no objetivo: hoy el CMS solo tiene galeria en
 * cuatro proyectos y el carrusel pinta los que haya. El tope existe para que publicar
 * galerias en los dieciocho no convierta este bloque en el portfolio entero.
 */
export const FEATURED_CASES_MAX = 5;

type Translate = (key: string) => string;

function toItem(caso: FeaturedCase, tWork: Translate): FeaturedCaseItem {
  return {
    client: caso.client,
    // La disciplina se traduce con el diccionario del strip, que ya la tiene: dos
    // listas de las mismas cuatro palabras se separan en cuanto alguien edita una.
    ...(caso.discipline ? { discipline: tWork(`disciplines.${caso.discipline}`) } : {}),
    summary: caso.summary,
    pieces: caso.pieces.map((piece) => ({
      src: piece.src,
      width: piece.width,
      height: piece.height,
    })),
  };
}

export function getFeaturedCases(
  t: Translate,
  tWork: Translate,
  casos: FeaturedCase[],
): FeaturedCasesProps {
  return {
    label: t("label"),
    cases: casos.map((caso) => toItem(caso, tWork)),
    labels: {
      previous: t("previous"),
      next: t("next"),
      slider: t("slider"),
      drag: t("drag"),
    },
  };
}
