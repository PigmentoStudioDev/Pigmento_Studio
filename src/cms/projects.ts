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
  /** Lo que Media exige escribir: sin el, las portadas llegaban mudas al lector de pantalla. */
  alt: string;
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
  // El `?? ''` cubre lo que el tipo no modela: `alt` es obligatorio, pero un documento
  // anterior a esa regla puede traerlo vacio, y eso nunca debe tumbar la pagina.
  return { src: media.url, alt: media.alt ?? '', width: media.width, height: media.height };
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

  const find = (featuredOnly: boolean) =>
    payload.find({
      collection: 'projects',
      locale,
      overrideAccess: false,
      ...(featuredOnly ? { where: { featured: { equals: true } } } : {}),
      sort: 'order',
      // 2 para que `cover` llegue poblado; con 1 vendria como id y no habria medidas.
      depth: 2,
      limit: featuredOnly ? 50 : FALLBACK_PIECES,
    });

  // Sin ninguno marcado, los primeros del portfolio en el orden del CMS: con `featured`
  // en falso en todos, el menu y el manifiesto se quedaban sin una sola pieza (medido
  // en prod, 2026-10-22). Marcar alguno en el panel vuelve a mandar la seleccion.
  const featured = await find(true);
  const { docs } = featured.docs.length > 0 ? featured : await find(false);

  return docs.map((doc: Project) => toPiece(doc.cover)).filter((p): p is ProjectPiece => p !== null);
}

/** Cuantas piezas toma el respaldo: las que caben en la corona del menu sin repetirse. */
const FALLBACK_PIECES = 14;

/**
 * Una fila del strip de trabajo: la disciplina viaja como clave, la traduce la pagina.
 * `slug`, `title`, `year` y `summary` son lo que la pagina de proyecto necesita para
 * enlazar al caso sin volver a consultar el CMS.
 */
export interface WorkProject {
  slug: string;
  title: string;
  client: string;
  discipline?: NonNullable<Project['discipline']>;
  year?: number;
  summary?: string;
  image: ProjectPiece;
}

/** Exportada por su test. Sin portada poblada no hay pieza que pintar. */
export function toWorkProject(doc: Project): WorkProject | null {
  const image = toPiece(doc.cover);
  if (!image) return null;

  return {
    slug: doc.slug,
    title: doc.title,
    client: doc.client || doc.title,
    ...(doc.discipline ? { discipline: doc.discipline } : {}),
    ...(typeof doc.year === 'number' ? { year: doc.year } : {}),
    ...(doc.summary ? { summary: doc.summary } : {}),
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
  discipline?: FeaturedCase['discipline'],
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
    // La pagina de una disciplina ensena solo sus casos: uno de motion en la de
    // branding argumenta la disciplina equivocada.
    .filter((c) => !discipline || c.discipline === discipline)
    .slice(0, maxCases);
}

/**
 * Un proyecto completo para su pagina. Mismos campos que `WorkProject` mas la galeria
 * entera, sin tope: la pagina del caso es el lugar donde se ve todo.
 */
export interface ProjectDetail {
  slug: string;
  title: string;
  client: string;
  discipline?: NonNullable<Project['discipline']>;
  year?: number;
  summary?: string;
  cover: ProjectPiece;
  gallery: ProjectPiece[];
}

/**
 * Exportada por su test. Sin portada poblada no hay pagina: la misma regla que el
 * strip, para que un proyecto no salga en el listado y responda 404 al abrirse.
 * Las piezas de galeria sin poblar se descartan, no se pintan con medidas inventadas.
 */
export function toProjectDetail(doc: Project): ProjectDetail | null {
  const cover = toPiece(doc.cover);
  if (!cover) return null;

  const gallery = (doc.gallery ?? [])
    .map((entry) => toPiece(entry.image))
    .filter((p): p is ProjectPiece => p !== null);

  return {
    slug: doc.slug,
    title: doc.title,
    client: doc.client || doc.title,
    ...(doc.discipline ? { discipline: doc.discipline } : {}),
    ...(typeof doc.year === 'number' ? { year: doc.year } : {}),
    ...(doc.summary ? { summary: doc.summary } : {}),
    cover,
    gallery,
  };
}

/**
 * Un proyecto publicado por su direccion, en el idioma pedido.
 *
 * `overrideAccess: false` es lo que impide que un borrador tenga pagina: sin el, la
 * Local API devolveria el documento sin error. `depth: 2` para que `cover` y cada
 * imagen de la galeria lleguen con sus medidas.
 */
export async function getProjectBySlug(slug: string, locale: Locale): Promise<ProjectDetail | null> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'projects',
    locale,
    overrideAccess: false,
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  });

  const doc = docs[0];
  return doc ? toProjectDetail(doc) : null;
}

/**
 * Las direcciones de los proyectos publicados, para prerenderizar la ruta. El slug no
 * se localiza, asi que la lista sirve para los dos idiomas.
 */
export async function getProjectSlugs(): Promise<string[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'projects',
    overrideAccess: false,
    depth: 0,
    limit: 100,
    select: { slug: true },
  });

  return docs.map((doc) => doc.slug);
}

/** Un proyecto para el sitemap: su direccion y cuando cambio por ultima vez. */
export interface ProjectSitemapEntry {
  slug: string;
  updatedAt: string;
}

export async function getProjectSitemapEntries(): Promise<ProjectSitemapEntry[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'projects',
    overrideAccess: false,
    depth: 0,
    limit: 100,
    select: { slug: true, updatedAt: true },
  });

  return docs.map((doc) => ({ slug: doc.slug, updatedAt: doc.updatedAt }));
}
