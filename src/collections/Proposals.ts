import { randomUUID } from 'node:crypto';
import type { CollectionConfig } from 'payload';

/**
 * Las cotizaciones que se le mandan a un cliente. Es la unica coleccion de este
 * repo cuyo contenido no es publico, y por eso lleva mas reglas escritas que
 * campos.
 *
 * Todo el acceso se declara explicito aunque coincida con el default de Payload
 * (`Boolean(user)`): un `access` a medias se lee como un descuido, y en una
 * coleccion con precios de clientes nadie deberia tener que ir a la doc para
 * saber si falta algo.
 */
/**
 * El token de acceso, acunado por el SERVIDOR y nunca por quien escribe.
 *
 * Se IGNORA el valor entrante a proposito. La version anterior era
 * `({ value }) => value || randomUUID()`, que conserva cualquier valor truthy:
 * bastaba una peticion con sesion para fijar un token adivinable —"pigmento2026"—
 * y a partir de ahi la propuesta de un cliente la abre cualquiera. El campo lleva
 * ademas `access.create/update` en false, pero eso solo cubre lo que pasa por el
 * control de acceso y la Local API se lo salta por defecto: quien cierra las dos
 * puertas es esta funcion.
 *
 * Exportada por su test, como `toPiece` en S4: es una funcion pura y es donde vive
 * la regla que puede fallar en silencio.
 */
export function mintAccessToken({
  operation,
  originalDoc,
}: {
  operation?: string;
  value?: unknown;
  originalDoc?: { accessToken?: string | null };
}): string {
  if (operation === 'create') return randomUUID();

  // Un documento sin token no puede quedarse sin el: su URL dejaria de existir, y
  // el indice UNIQUE de SQLite admite varios NULL asi que tampoco lo impide la base.
  return originalDoc?.accessToken || randomUUID();
}

export const Proposals: CollectionConfig = {
  slug: 'proposals',

  admin: {
    useAsTitle: 'client',
    defaultColumns: ['client', 'status', 'currency', 'validUntil'],
  },

  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },

  fields: [
    { name: 'client', type: 'text', required: true },
    { name: 'contactEmail', type: 'email' },

    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'borrador',
      options: ['borrador', 'enviada', 'aceptada', 'rechazada', 'vencida'],
    },

    {
      name: 'scopeItems',
      type: 'array',
      fields: [
        { name: 'concept', type: 'text', required: true },
        { name: 'detail', type: 'textarea' },
        {
          name: 'amountCents',
          type: 'number',
          required: true,
          min: 0,
          /**
           * En CENTAVOS y entero. SQLite no tiene decimal: un precio en coma
           * flotante hace que sumar renglones deje de dar el total exacto, y en
           * una cotizacion eso lo ve el cliente. El nombre del campo es lo unico
           * que impide que alguien reintroduzca un `price` suelto sin pensarlo.
           */
          admin: { description: 'En CENTAVOS. 1500 son $15.00' },
        },
      ],
    },

    { name: 'currency', type: 'select', required: true, defaultValue: 'MXN', options: ['MXN', 'USD'] },
    { name: 'validUntil', type: 'date' },

    {
      name: 'accessToken',
      type: 'text',
      unique: true,
      index: true,

      /**
       * `admin.readOnly` NO es control de acceso: es una propiedad del PANEL y
       * vive bajo el tipo `AdminClient`, no bajo `access` del campo. Con
       * `access.update` de la coleccion en `Boolean(user)`, sin estas dos lineas
       * cualquiera con sesion podia mandar
       * `PATCH /api/proposals/1 { "accessToken": "pigmento2026" }`.
       *
       * Con `create`/`update` en false, Payload DESCARTA el valor que venga (doc
       * de acceso a nivel de campo, v3.88.0: "If false is returned, any passed
       * values will be discarded"). Es la primera barrera y solo cubre las
       * peticiones que respetan el control de acceso — la Local API lo salta por
       * defecto. La que cubre las dos puertas es el hook.
       */
      access: {
        create: () => false,
        update: () => false,
      },

      admin: {
        readOnly: true,
        description: 'Se genera solo. La URL privada de esta propuesta cuelga de el.',
      },

      hooks: {
        beforeChange: [mintAccessToken],
      },
    },

    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Interno. NUNCA sale al cliente — el adaptador de cms/ no lo mapea.' },
    },
  ],
};
