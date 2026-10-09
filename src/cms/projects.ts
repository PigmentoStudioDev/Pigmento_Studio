import config from '@payload-config';
import { getPayload } from 'payload';
import type { Media, Project } from '@/payload-types';
import type { Locale } from '@/i18n/routing';

/**
 * El adaptador del portfolio. Es el UNICO modulo que conoce `payload-types`: el
 * contrato de modularidad exige que el design system pueda salir de este repo, y
 * un organismo que importe los tipos del CMS se lo lleva consigo.
 *
 * La forma que devuelve es la que los componentes YA piden. El adaptador se
 * adapta al design system y no al reves — si un dia hiciera falta cambiarla, es
 * un cambio de organismo con su test, no un efecto colateral del modelado.
 */

/** Una pieza del escaparate: exactamente lo que consumen NavBanner y Manifesto. */
export interface ProjectPiece {
  src: string;
  width: number;
  height: number;
}

/**
 * Exportada por su test: es una funcion pura y es donde vive la unica regla que
 * puede fallar en silencio.
 *
 * Las medidas salen del documento de media, nunca se escriben a mano. Ese fue el
 * bug original: catorce medidas copiadas en tres archivos. `next/image` las
 * necesita para reservar el hueco antes de descargar, y una medida inventada
 * hace saltar el layout al llegar cada archivo.
 */
export function toPiece(media: Media | number | null | undefined): ProjectPiece | null {
  if (!media || typeof media === 'number') return null;
  if (!media.url || !media.width || !media.height) return null;
  return { src: media.url, width: media.width, height: media.height };
}

/**
 * Las piezas destacadas, para el escaparate del menu y la rafaga del manifiesto.
 *
 * `overrideAccess: false` NO es opcional: la Local API se salta el control de
 * acceso por defecto, asi que sin esta linea un `find` devuelve tambien los
 * borradores — sin error y sin que ningun tipo se queje.
 */
export async function getFeaturedPieces(locale: Locale): Promise<ProjectPiece[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'projects',
    locale,
    overrideAccess: false,
    where: { featured: { equals: true } },
    sort: 'order',
    // 2 para que `cover` llegue poblado; con 1 vendria como id y no habria medidas.
    depth: 2,
    limit: 50,
  });

  return docs.map((doc: Project) => toPiece(doc.cover)).filter((p): p is ProjectPiece => p !== null);
}

/** Una fila del strip de trabajo: la disciplina viaja como clave, la traduce la pagina. */
export interface WorkProject {
  client: string;
  discipline?: NonNullable<Project['discipline']>;
  image: ProjectPiece;
}

/** Exportada por su test. Sin portada poblada no hay pieza que pintar. */
export function toWorkProject(doc: Project): WorkProject | null {
  const image = toPiece(doc.cover);
  if (!image) return null;

  return {
    client: doc.client || doc.title,
    ...(doc.discipline ? { discipline: doc.discipline } : {}),
    image,
  };
}

/** Todo el portfolio publicado, en el orden que marca el CMS. */
export async function getWorkProjects(locale: Locale): Promise<WorkProject[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'projects',
    locale,
    overrideAccess: false,
    sort: 'order',
    depth: 2,
    limit: 100,
  });

  return docs.map(toWorkProject).filter((p): p is WorkProject => p !== null);
}

/**
 * Los casos en profundidad, con su galeria y el texto que el CMS ya tiene escrito.
 *
 * Es lo contrario del strip: alli pasan dieciocho portadas y no se detiene ninguna.
 * El estudio tiene ademas, sin usar, galerias de varias piezas por proyecto y un
 * `summary` redactado de verdad en cada uno — material que no se ve en ningun sitio
 * del sitio y que es exactamente lo que falta donde la pagina solo argumenta.
 *
 * `depth: 2` para que la galeria llegue poblada: con 1 cada entrada viene como id y
 * no hay medidas que pasarle a `next/image`.
 */
export interface FeaturedCase {
  client: string;
  discipline?: NonNullable<Project['discipline']>;
  /** El texto del propio CMS. Nunca se reescribe aqui: es la voz del caso. */
  summary: string;
  pieces: ProjectPiece[];
}

/**
 * Exportada por su test. Un caso sin galeria NO entra: con la portada sola este
 * bloque es el strip otra vez, y la pagina ya tiene uno. Sin `summary` tampoco: el
 * argumento del bloque ES ese parrafo, y una tarjeta con nombre y fotos no argumenta.
 */
export function toFeaturedCase(doc: Project, maxPieces: number): FeaturedCase | null {
  if (!doc.summary) return null;

  const pieces = (doc.gallery ?? [])
    .map((entry) => toPiece(entry.image))
    .filter((p): p is ProjectPiece => p !== null)
    .slice(0, maxPieces);

  if (pieces.length === 0) return null;

  return {
    client: doc.client || doc.title,
    ...(doc.discipline ? { discipline: doc.discipline } : {}),
    summary: doc.summary,
    pieces,
  };
}

/**
 * Los que tengan galeria y texto, en el orden del CMS y hasta `maxCases`.
 *
 * El filtro NO va en el `where`: Payload no sabe consultar "tiene al menos una
 * entrada de galeria con imagen poblada", y pedirselo por `exists` dejaria pasar
 * galerias con filas vacias. Se trae el portfolio y lo decide `toFeaturedCase`, que es
 * donde esa regla ya vive y tiene test. Son dieciocho documentos: el coste de
 * descartar en memoria es menor que el de una regla duplicada en dos sitios.
 *
 * Por eso el `limit` es el del portfolio entero y el recorte a `maxCases` viene
 * DESPUES de filtrar — al contrario, un proyecto sin galeria en las primeras
 * posiciones se comeria un hueco del carrusel y lo dejaria mas corto.
 */
export async function getFeaturedCases(
  locale: Locale,
  maxPieces: number,
  maxCases: number,
): Promise<FeaturedCase[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'projects',
    locale,
    overrideAccess: false,
    sort: 'order',
    depth: 2,
    limit: 100,
  });

  return docs
    .map((doc: Project) => toFeaturedCase(doc, maxPieces))
    .filter((c): c is FeaturedCase => c !== null)
    .slice(0, maxCases);
}
