import type { CollectionConfig } from 'payload';

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
