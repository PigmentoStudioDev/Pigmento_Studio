import type { CollectionConfig } from 'payload';

/**
 * Quien entra al panel. Es la coleccion de auth y por eso no lleva `access`
 * abierto a nadie: el default de Payload es `Boolean(user)`, que aqui es
 * exactamente lo que se quiere.
 *
 * Nadie se registra solo. El estudio son cinco personas y el alta la hace quien
 * ya esta dentro; un registro publico en el panel de un CMS es una puerta que no
 * pidio nadie.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    // Sin esto la lista sale ordenada por id y no dice nada de un vistazo.
    defaultColumns: ['name', 'email'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
};
