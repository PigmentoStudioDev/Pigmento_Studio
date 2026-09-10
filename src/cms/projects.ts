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
