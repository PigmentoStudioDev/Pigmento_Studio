import type { FeaturedCase } from "@/cms/projects";
import type { FeaturedCaseProps } from "@/design-system/components/organisms/FeaturedCase/FeaturedCase";

/**
 * El caso que se para a mitad del argumento.
 *
 * El slug vive aqui, en `app/`, por lo mismo que el nombre del archivo de la banda:
 * es contenido del sitio y se busca por slug para que en el diff se lea cual es.
 *
 * TODO(contenido): hoy el elegido es el que mas piezas tiene en el CMS, y eso no es
 * un criterio editorial. Pigmento decide cual quiere parar aqui: cambiar la constante
 * es todo. Solo sirven los que tengan galeria — sin ella el bloque no se pinta, que es
 * lo correcto, porque con la portada sola seria el strip otra vez.
 */
export const FEATURED_CASE_SLUG = "senora-galleta";

/**
 * Cuantas piezas entran. Cuatro: dos filas de dos, que es lo que cabe al lado del
 * texto sin que el bloque se convierta en una pagina de caso. Señora Galleta tiene
 * trece en el CMS y las trece aqui serian el portafolio, no una prueba.
 */
export const FEATURED_CASE_PIECES = 4;

type Translate = (key: string) => string;

export function getFeaturedCase(t: Translate, tWork: Translate, caso: FeaturedCase): FeaturedCaseProps {
  return {
    client: caso.client,
    // La disciplina se traduce con el diccionario del strip, que ya la tiene: dos
    // listas de las mismas cuatro palabras se separan en cuanto alguien edita una.
    ...(caso.discipline ? { discipline: tWork(`disciplines.${caso.discipline}`) } : {}),
    summary: caso.summary,
    label: t("label"),
    pieces: caso.pieces.map((piece) => ({
      src: piece.src,
      width: piece.width,
      height: piece.height,
    })),
  };
}
