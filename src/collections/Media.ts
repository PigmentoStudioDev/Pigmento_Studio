import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload';
import { mp4Dimensions } from './mp4-dimensions';
import { revalidateAfterChange, revalidateAfterDelete } from './revalidate';

/** Con faststart la cabecera `moov` va al principio; un mega la cubre de sobra. */
const HEADER_BYTES = 1024 * 1024;

/**
 * Payload no mide videos: sin esto un mp4 llega con `width`/`height` en null y la
 * galeria lo descarta. En la subida se leen los bytes que llegan; al editar uno ya
 * subido (sin archivo en la peticion) se piden los primeros bytes al bucket publico,
 * asi que guardar el documento basta para completar uno antiguo.
 */
export const measureVideo: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const mimeType = data.mimeType ?? originalDoc?.mimeType;
  if (mimeType !== 'video/mp4' || (data.width ?? originalDoc?.width)) return data;

  const bytes = req.file?.data ?? (await headerFromBucket(originalDoc?.prefix, originalDoc?.filename, req.payload.logger));
  const size = bytes ? mp4Dimensions(new Uint8Array(bytes)) : null;
  return size ? { ...data, ...size } : data;
};

async function headerFromBucket(
  prefix: unknown,
  filename: unknown,
  logger: { warn: (obj: object, msg: string) => void },
): Promise<ArrayBuffer | null> {
  const base = process.env.R2_PUBLIC_URL;
  if (!base || typeof filename !== 'string') return null;
  const path = [typeof prefix === 'string' && prefix ? prefix : null, filename].filter(Boolean).join('/');
  try {
    const res = await fetch(`${base}/${encodeURI(path)}`, { headers: { Range: `bytes=0-${HEADER_BYTES - 1}` } });
    return res.ok ? await res.arrayBuffer() : null;
  } catch (error) {
    // Sin medidas el video sigue guardado; solo no sale en la galeria hasta el siguiente guardado.
    logger.warn({ err: error, filename }, 'media: no se pudo leer la cabecera del video');
    return null;
  }
}

/**
 * Los archivos del sitio. Payload guarda ancho y alto de cada uno, y de ahi los
 * saca el adaptador de `cms/`: son los que `next/image` necesita para reservar
 * el hueco antes de descargar. Escribirlos a mano fue el bug original — catorce
 * medidas repetidas en tres archivos.
 */
export const Media: CollectionConfig = {
  slug: 'media',

  /**
   * Lectura publica: estas imagenes las pinta el sitio. Lo demas exige sesion.
   * Se declara aunque `read` publico sea lo unico que cambia respecto al default,
   * porque un `access` a medias se lee como un descuido y el siguiente que pase
   * no sabe si falta algo.
   */
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },

  upload: true,

  hooks: {
    beforeChange: [measureVideo],
    afterChange: [revalidateAfterChange()],
    afterDelete: [revalidateAfterDelete()],
  },

  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description:
          'Que se ve, para quien no la ve. Si la imagen es decorativa y no aporta nada, una cadena vacia no vale: mejor no subirla a una coleccion que el sitio pinta.',
      },
    },
  ],
};
