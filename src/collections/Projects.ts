import type { CollectionConfig } from 'payload';

/**
 * El portfolio. Hasta ahora eran catorce PNG sueltos con sus medidas escritas a
 * mano en TRES archivos distintos; no habia entidad de proyecto — ni titulo, ni
 * cliente, ni ano, ni slug. Esta coleccion la crea.
 */
export const Projects: CollectionConfig = {
  slug: 'projects',

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', 'discipline', 'categories', '_status'],
  },

  /**
   * Publico solo lo PUBLICADO. Devolver una query y no un booleano es lo que hace
   * que un borrador no se escape: con `true` se verian todos, y con `false` el
   * sitio no podria leer su propio portfolio.
   */
  access: {
    read: ({ req: { user } }) => (user ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },

  versions: { drafts: true },

  fields: [
    { name: 'title', type: 'text', required: true, localized: true },

    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      // NO localizado: una direccion es una direccion. Es la misma decision que
      // ya estaba escrita en navigation.ts para las rutas del menu.
      admin: { description: 'La direccion de la pieza. No se traduce.' },
    },

    { name: 'client', type: 'text' },
    { name: 'year', type: 'number' },

    {
      name: 'discipline',
      type: 'select',
      options: ['branding', 'web', 'motion', 'marketing'],
    },

    /**
     * Todo lo que se hizo en la pieza; la disciplina es solo la etiqueta principal.
     * Salen de los tags del sitio anterior con dos fusiones: Motion Branding y
     * Motion Graphics eran un mismo servicio con dos nombres, igual que el diseno y
     * el desarrollo de e-commerce. Lista cerrada para que no vuelvan a separarse.
     */
    {
      name: 'categories',
      type: 'select',
      hasMany: true,
      options: [
        { value: 'branding', label: { es: 'Branding', en: 'Branding' } },
        { value: 'packaging', label: { es: 'Packaging', en: 'Packaging' } },
        { value: 'motion', label: { es: 'Motion', en: 'Motion' } },
        { value: 'web', label: { es: 'Diseño web', en: 'Web design' } },
        { value: 'ecommerce', label: { es: 'E-commerce', en: 'E-commerce' } },
        { value: 'producto', label: { es: 'Producto digital (UX/UI)', en: 'Digital product (UX/UI)' } },
        { value: 'marketing', label: { es: 'Marketing digital', en: 'Digital marketing' } },
        { value: 'redes', label: { es: 'Redes sociales', en: 'Social media' } },
      ],
      admin: { description: 'Todo lo que se hizo en la pieza. La disciplina es la principal.' },
    },

    // Sin rich text: los organismos reciben cadenas planas y ese contrato es lo
    // que permite alimentarlos 1:1 desde el CMS.
    { name: 'summary', type: 'textarea', localized: true },

    { name: 'cover', type: 'upload', relationTo: 'media', required: true },
    { name: 'gallery', type: 'array', fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }] },

    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Aparece en el escaparate del menu y en el manifiesto.' },
    },

    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      // Sin esto el orden lo decide la fecha, y entonces no lo decide nadie.
      admin: { description: 'Menor primero. Empata por fecha de creacion.' },
    },
  ],
};
