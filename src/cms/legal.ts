import config from '@payload-config';
import { getPayload } from 'payload';
import type { Legal } from '@/payload-types';
import type { Locale } from '@/i18n/routing';
import { lines, paragraphs } from './text';

/**
 * El adaptador de los textos legales. Como el del portfolio, es de los pocos
 * modulos que conocen `payload-types`: el contrato de modularidad exige que el
 * design system pueda salir de este repo, y un organismo que importe los tipos
 * del CMS se lo lleva consigo.
 *
 * La forma que devuelve es la que el organismo pide: parrafos ya partidos y
 * niveles ya numericos. Convertir en la pagina significaria convertir otra vez en
 * la siguiente que lo use.
 */

/** Una seccion del documento, y a la vez una entrada del indice. */
export interface LegalSection {
  /**
   * El destino del enlace del indice. Lo acuña el servidor, aqui solo se pasa.
   * `null` si esa seccion no tiene: se lee igual, pero no se enlaza.
   */
  anchor: string | null;
  heading: string;
  /** 2 es seccion y 3 subseccion: el indice lo usa para sangrar. */
  level: 2 | 3;
  body: string[];
  items: string[];
}

export interface LegalDocumentView {
  slug: string;
  title: string;
  /** ISO, o null. Quien pinta decide el formato, que depende del idioma. */
  effectiveDate: string | null;
  intro: string[];
  tocTitle: string;
  sections: LegalSection[];
}

/**
 * Exportada por su test: es pura y es donde vive la unica regla que falla en
 * silencio.
 *
 * Una seccion SIN ancla conserva su texto y se queda sin destino. Descartarla
 * entera fue la primera version y es peor: lo que desaparece entonces no es una
 * entrada del indice, es una clausula de un aviso de privacidad, y sin que nada lo
 * diga. En la practica no ocurre —el ancla la acuña `beforeValidate`— pero una
 * importacion o una restauracion que se salte el hook no puede borrar texto legal
 * en silencio. El indice la omite; la pagina la lee.
 */
export function toLegalView(doc: Legal): LegalDocumentView {
  return {
    slug: doc.slug,
    title: doc.title,
    effectiveDate: doc.effectiveDate ?? null,
    intro: paragraphs(doc.intro),
    // El default vive en el CMS, pero un documento anterior al campo no lo trae.
    tocTitle: doc.tocTitle?.trim() || 'Contenido',
    sections: (doc.sections ?? []).map((s) => ({
      anchor: s.anchor?.trim() || null,
      heading: s.heading,
      level: s.level === '3' ? 3 : 2,
      body: paragraphs(s.body),
      items: lines((s.items ?? []).map((i) => i.text).join('\n')),
    })),
  };
}

/**
 * Un documento por su direccion.
 *
 * `overrideAccess: false` NO es opcional: la Local API se salta el control de
 * acceso por defecto, asi que sin esta linea un `find` devuelve tambien los
 * borradores — sin error y sin que ningun tipo se queje. Esta coleccion tiene
 * borradores activados, asi que aqui eso significa publicar un texto legal que
 * nadie aprobo todavia.
 */
export async function getLegalBySlug(
  slug: string,
  locale: Locale,
): Promise<LegalDocumentView | null> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'legal',
    locale,
    overrideAccess: false,
    where: { slug: { equals: slug } },
    // 0: este documento no referencia a ningun otro, asi que poblar no traeria nada.
    depth: 0,
    limit: 1,
  });

  const doc = docs[0];
  return doc ? toLegalView(doc) : null;
}

/**
 * Las direcciones de todos los legales publicados, para prerenderizar la ruta.
 *
 * El slug NO se localiza —una direccion es una direccion— asi que esta lista es
 * la misma en los dos idiomas y no lleva `locale`.
 */
export async function getLegalSlugs(): Promise<string[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'legal',
    overrideAccess: false,
    depth: 0,
    limit: 100,
    select: { slug: true },
  });

  return docs.map((doc) => doc.slug);
}

/** Un legal en una lista de enlaces: su direccion y como se llama en este idioma. */
export interface LegalLink {
  slug: string;
  title: string;
}

/**
 * Los legales publicados, para el pie.
 *
 * Es una consulta y no una constante a proposito: con los slugs escritos a mano,
 * el pie enlaza a un 404 mientras el documento no exista, y en cuanto alguien
 * renombre uno el enlace se queda apuntando al aire sin que nada avise. Si la
 * coleccion esta vacia llega `[]` y el pie no pinta la fila: no hay enlace roto
 * posible.
 */
export async function getLegalLinks(locale: Locale): Promise<LegalLink[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'legal',
    locale,
    overrideAccess: false,
    depth: 0,
    limit: 100,
    sort: 'title',
    select: { slug: true, title: true },
  });

  return docs.map((doc) => ({ slug: doc.slug, title: doc.title }));
}
