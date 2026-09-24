import type { CollectionConfig } from 'payload';

/**
 * Quien forma el estudio. Hasta ahora eran cinco marcadores escritos en el codigo y en
 * los mensajes: nombres de posicion y piezas del portafolio haciendo de retratos.
 * Esta coleccion permite dar de alta, editar y retirar a una persona sin deploy.
 */

/**
 * Un enlace del pie de la tarjeta acaba en un href de la pagina. Solo https: http
 * plano es un aviso del navegador, y un `javascript:` en un href ejecuta al pulsar.
 */
export function validateHttpsUrl(value: string | null | undefined): true | string {
  if (!value) return 'La direccion es obligatoria.';

  try {
    return new URL(value).protocol === 'https:' ? true : 'Tiene que empezar por https://';
  } catch {
    return 'No es una direccion valida. Tiene que empezar por https://';
  }
}

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',

  labels: { singular: 'Persona del equipo', plural: 'Equipo' },

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'group', '_status'],
  },

  /**
   * Publico solo lo PUBLICADO, como el portfolio. Aqui importa mas: una persona en
   * borrador puede ser alguien que aun no dio permiso para salir en la web.
   */
  access: {
    read: ({ req: { user } }) => (user ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },

  versions: { drafts: true },

  fields: [
    // Sin localizar: un nombre no se traduce.
    { name: 'name', type: 'text', required: true },

    { name: 'role', type: 'text', required: true, localized: true },

    /**
     * Lo que filtran las pastillas de la franja. Lista cerrada: un texto libre abriria
     * una pastilla por cada forma de escribir el mismo grupo.
     */
    {
      name: 'group',
      type: 'select',
      required: true,
      options: [
        { value: 'direccion', label: { es: 'Dirección', en: 'Direction' } },
        { value: 'diseno', label: { es: 'Diseño', en: 'Design' } },
        { value: 'desarrollo', label: { es: 'Desarrollo', en: 'Development' } },
        { value: 'estrategia', label: { es: 'Estrategia', en: 'Strategy' } },
      ],
    },

    // Texto plano por lo mismo que el resumen de un proyecto: el organismo recibe cadenas.
    {
      name: 'bio',
      type: 'textarea',
      localized: true,
      admin: { description: 'Dos o tres lineas. Se lee en el panel que se abre sobre la foto.' },
    },

    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Retrato vertical.' },
    },

    {
      name: 'links',
      type: 'array',
      fields: [
        {
          name: 'network',
          type: 'select',
          required: true,
          // Cerrada: cada red tiene su icono en la tarjeta.
          options: ['linkedin', 'instagram', 'behance', 'x', 'web'],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          validate: (value: string | null | undefined) => validateHttpsUrl(value),
        },
      ],
    },

    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Menor primero. Empata por fecha de creacion.' },
    },
  ],
};
