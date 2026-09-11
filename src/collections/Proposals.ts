import { randomUUID } from 'node:crypto';
import type { CollectionConfig, Field } from 'payload';

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


/**
 * La clave de un criterio, derivada de su etiqueta.
 *
 * El editor escribe "Carga de propiedades" y nunca ve la clave: teclearla a mano es
 * pedirle disciplina de programador a quien esta redactando una cotizacion, y un
 * typo ahi desalinea una columna entera sin dar error.
 */
export function criterionKey(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface CriterionRow {
  key?: string | null;
  label?: string | null;
}

interface ValueRow {
  key?: string | null;
  value?: string | null;
}

interface PackageRow {
  key?: string | null;
  name?: string | null;
  values?: ValueRow[] | null;
}

interface FindingRow {
  key?: string | null;
  title?: string | null;
}

interface AlignableProposal {
  criteria?: CriterionRow[] | null;
  packages?: PackageRow[] | null;
  findings?: FindingRow[] | null;
  recommendedPackage?: string | null;
}

/**
 * Alinea la matriz: cada paquete acaba con EXACTAMENTE una fila por criterio
 * declarado, en el mismo orden, conservando lo ya escrito.
 *
 * Repara en vez de rechazar, y esa es la decision. Un hook que validara y devolviera
 * error obligaria al editor a arreglar a mano una estructura que el no creo — anadir
 * un criterio dejaria las tres rutas invalidas hasta rellenarlas todas. Asi, anadir
 * un criterio hace aparecer su hueco vacio en cada ruta, que es exactamente lo que
 * hay que hacer a continuacion.
 *
 * La garantia es la misma que daria un rechazo: **no existe estado guardado con las
 * columnas desalineadas**. En la propuesta de MoEasy la tercera ruta cambio OPERACION
 * por PERMISOS y nadie lo noto; con esto, PERMISOS aparece en las tres y las dos que
 * no lo definen se quedan en blanco a la vista de quien redacta.
 *
 * Tambien acuna la clave de cada HALLAZGO, que es el mismo problema una capa antes:
 * S9b ata cada entregable al hallazgo que responde, y esa relacion se sostiene sobre
 * una clave que quien redacta no deberia teclear. Se extiende esta funcion en vez de
 * escribir un segundo hook porque el trabajo es identico y ya esta probado.
 *
 * A diferencia de los criterios, una propuesta SIN hallazgos se deja como estaba: la
 * cotizacion simple de S5 no tiene diagnostico, y crearle un array vacio la haria
 * renderizar una seccion de auditoria en blanco.
 *
 * Funcion pura y exportada por su test, como `mintAccessToken`.
 */
export function alignProposal<T extends AlignableProposal>(data: T): T {
  const findings =
    data.findings?.map((f) => ({ ...f, key: f.key || criterionKey(f.title ?? '') })) ??
    data.findings;

  const criterios = (data.criteria ?? []).map((c) => ({
    ...c,
    key: c.key || criterionKey(c.label ?? ''),
  }));

  // La clave de cada ruta se acuna ANTES de la salida temprana: no depende de la
  // matriz, y una propuesta puede declarar sus rutas antes de declarar en que se
  // diferencian.
  const conClave =
    data.packages?.map((p) => ({ ...p, key: p.key || criterionKey(p.name ?? '') })) ??
    data.packages;

  // La recomendada se guarda por CLAVE. Quien redacta sigue escribiendo el nombre
  // —teclear una clave es pedirle disciplina de programador— y aqui se normaliza
  // con la misma funcion que la derivo, asi que casan por construccion. Es
  // idempotente: normalizar una clave devuelve la clave.
  const recommendedPackage = data.recommendedPackage
    ? criterionKey(data.recommendedPackage)
    : data.recommendedPackage;

  if (!criterios.length) {
    return { ...data, findings, criteria: criterios, packages: conClave, recommendedPackage };
  }

  const packages = (conClave ?? []).map((paquete) => {
    const previos = new Map(
      (paquete.values ?? []).map((v) => [v.key ?? '', v.value ?? '']),
    );

    return {
      ...paquete,
      values: criterios.map((c) => ({ key: c.key, value: previos.get(c.key) ?? '' })),
    };
  });

  return { ...data, findings, criteria: criterios, packages, recommendedPackage };
}

/**
 * El bloque de precio, repetido en las rutas y en los modulos.
 *
 * **Vive en este archivo a proposito.** El gate `dinero-en-centavos` lee SOLO
 * `src/collections/Proposals.ts`: sacarlo a `collections/fields/price.ts` —que es lo
 * que pide el instinto— dejaria el gate verde vigilando un archivo donde ya no queda
 * ningun campo `*Cents`. Si algun dia se extrae, el gate tiene que aprender a seguir
 * el import ANTES de mover el codigo.
 */
const precio: Field[] = [
  {
    name: 'priceKind',
    type: 'select',
    required: true,
    defaultValue: 'fijo',
    options: [
      { label: 'Fijo por proyecto', value: 'fijo' },
      { label: 'Mensual', value: 'mensual' },
      { label: 'Rango por unidad', value: 'rango' },
    ],
  },
  {
    name: 'amountCents',
    type: 'number',
    required: true,
    min: 0,
    admin: { description: 'En CENTAVOS enteros. 4800000 son $48,000.00' },
  },
  {
    name: 'amountMaxCents',
    type: 'number',
    min: 0,
    admin: {
      description: 'Extremo alto del rango, en CENTAVOS.',
      condition: (_data, siblingData) => siblingData?.priceKind === 'rango',
    },
  },
  {
    name: 'unit',
    type: 'select',
    required: true,
    defaultValue: 'proyecto',
    options: [
      { label: 'por proyecto', value: 'proyecto' },
      { label: 'al mes', value: 'mes' },
      { label: 'cada uno', value: 'pieza' },
    ],
  },
];

/** Los terminos de siempre. Pre-llenados, no fijos: cada propuesta puede pisarlos. */
const TERMINOS_POR_DEFECTO = [
  { label: 'Forma de pago', value: '60% de anticipo para iniciar / 40% contra entrega y previo a publicacion.' },
  { label: 'Vigencia', value: 'Cotizacion valida por 15 dias naturales.' },
  { label: 'Tiempos', value: 'Los tiempos corren a partir de anticipo, recepcion de accesos, contenidos e informacion necesaria.' },
  { label: 'Contenido', value: 'Textos, fotografias e informacion tecnica deberan ser entregados por el cliente, salvo los servicios adicionales contratados.' },
  { label: 'Alcance', value: 'Cambios estructurales, funcionalidades o integraciones no descritas se cotizan por separado.' },
  { label: 'Impuestos', value: 'Precios expresados en MXN. IVA no incluido.' },
];

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

  hooks: {
    /**
     * Se alinea ANTES de validar, no despues: `beforeChange` correria con la
     * estructura ya validada, y si un paquete llegase sin sus filas la validacion
     * de los campos requeridos habria fallado antes de que nadie pudiera repararlo.
     */
    beforeValidate: [({ data }) => (data ? alignProposal(data) : data)],
  },

  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Cliente',
          description: 'Quien la recibe y en que estado esta.',
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
        },

        {
          label: 'Portada',
          description: 'La primera pagina y el diagnostico.',
          fields: [
            {
              name: 'serviceTitle',
              type: 'text',
              localized: true,
              admin: { description: 'El servicio: "Digital Growth Strategy".' },
            },
            {
              name: 'tagline',
              type: 'textarea',
              localized: true,
              admin: { description: 'Una linea por renglon.' },
            },
            { name: 'coverImage', type: 'upload', relationTo: 'media' },
            {
              name: 'headline',
              type: 'text',
              localized: true,
              admin: { description: 'El titular del diagnostico.' },
            },
            {
              name: 'context',
              type: 'textarea',
              localized: true,
              admin: { description: 'Donde esta el cliente hoy y que proponen las rutas.' },
            },

            /**
             * La auditoria del sitio actual: que esta roto y que cuesta.
             *
             * Sin campo de numero. El "01..04" sale del orden de las filas, porque un
             * numero escrito a mano se desincroniza en cuanto alguien reordena — y a
             * partir de S9b el texto dira "responde al hallazgo 02" senalando a otro.
             */
            {
              name: 'findings',
              type: 'array',
              labels: { singular: 'Hallazgo', plural: 'Hallazgos' },
              admin: {
                initCollapsed: true,
                description:
                  'La auditoria del sitio actual, en orden de lo que cuesta. El numero sale del orden.',
              },
              fields: [
                {
                  name: 'key',
                  type: 'text',
                  admin: {
                    readOnly: true,
                    description: 'Se acuna sola desde el titulo. La usa S9b para atar entregables.',
                  },
                },
                {
                  name: 'area',
                  type: 'text',
                  localized: true,
                  required: true,
                  admin: { description: 'La etiqueta corta: captacion, calificacion, seguimiento.' },
                },
                {
                  name: 'title',
                  type: 'text',
                  localized: true,
                  required: true,
                  admin: { description: 'La afirmacion: "la ficha no capta ningun lead".' },
                },
                {
                  name: 'cost',
                  type: 'textarea',
                  localized: true,
                  required: true,
                  admin: { description: 'Lo que cuesta hoy, en dinero o en tiempo del equipo.' },
                },
              ],
            },

            /**
             * Las cifras que enmarcan la decision.
             *
             * `source` es REQUERIDO y esa es la decision de la seccion: una cifra sin
             * fuente en una propuesta de agencia es un pasivo y no un argumento, y el
             * unico momento en que alguien la tiene a mano es cuando la escribe.
             * Pedirla despues no pasa nunca.
             */
            {
              name: 'figures',
              type: 'array',
              labels: { singular: 'Cifra', plural: 'Cifras' },
              admin: {
                initCollapsed: true,
                description: 'Tres del mercado y una del cliente. Toda cifra va con su fuente.',
              },
              fields: [
                {
                  name: 'value',
                  type: 'text',
                  required: true,
                  admin: { description: 'El numero tal y como se lee: "247,680 USD", "80%", "0".' },
                },
                {
                  name: 'label',
                  type: 'textarea',
                  localized: true,
                  required: true,
                  admin: { description: 'Que es ese numero.' },
                },
                {
                  name: 'source',
                  type: 'text',
                  localized: true,
                  required: true,
                  admin: { description: 'De donde sale. Obligatorio a proposito.' },
                },
              ],
            },
          ],
        },

        {
          label: 'Base comun',
          description: 'Lo que llevan todas las rutas.',
          fields: [
            { name: 'baseTitle', type: 'text', localized: true, defaultValue: 'Lo que incluye' },
            {
              name: 'deliverables',
              type: 'array',
              labels: { singular: 'Entregable', plural: 'Entregables' },
              fields: [
                { name: 'name', type: 'text', localized: true, required: true },
                { name: 'description', type: 'textarea', localized: true, required: true },
              ],
            },
            {
              name: 'includedInAll',
              type: 'textarea',
              localized: true,
              admin: {
                description: 'Una linea por punto. Es una textarea y no una lista de filas: cada punto es UN dato, y seis filas plegables para seis frases es mas trabajo sin mas estructura.',
              },
            },
          ],
        },

        {
          label: 'Rutas',
          description: 'Los paquetes y la matriz que los compara.',
          fields: [
            { name: 'routesEyebrow', type: 'text', localized: true, admin: { description: 'El rotulo comun de las rutas.' } },
            {
              name: 'criteria',
              type: 'array',
              labels: { singular: 'Criterio', plural: 'Criterios' },
              admin: {
                description: 'Se declaran UNA vez. Cada ruta recibe su hueco automaticamente al guardar.',
              },
              fields: [
                { name: 'label', type: 'text', localized: true, required: true },
                {
                  name: 'key',
                  type: 'text',
                  admin: { readOnly: true, description: 'Se deriva de la etiqueta.' },
                },
              ],
            },
            {
              name: 'packages',
              type: 'array',
              labels: { singular: 'Ruta', plural: 'Rutas' },
              fields: [
                { name: 'name', type: 'text', localized: true, required: true },
                {
                  name: 'key',
                  type: 'text',
                  admin: { readOnly: true, description: 'Se deriva del nombre. Es lo que ata la ruta recomendada y las columnas de la comparativa, y NO se traduce.' },
                },
                {
                  name: 'accent',
                  type: 'select',
                  required: true,
                  defaultValue: 'uno',
                  admin: { description: 'El tinte que identifica la ruta. Numerado, no por color.' },
                  options: [
                    { label: 'Acento 1', value: 'uno' },
                    { label: 'Acento 2', value: 'dos' },
                    { label: 'Acento 3', value: 'tres' },
                  ],
                },
                ...precio,
                { name: 'deliveryWeeks', type: 'number', min: 0 },
                { name: 'body', type: 'textarea', localized: true, admin: { description: 'Un parrafo por bloque, separados por linea en blanco.' } },
                {
                  name: 'values',
                  type: 'array',
                  labels: { singular: 'Valor', plural: 'La diferencia' },
                  admin: { description: 'Se rellena solo a partir de los criterios. Solo hay que escribir el valor.' },
                  fields: [
                    { name: 'key', type: 'text', admin: { readOnly: true } },
                    { name: 'value', type: 'textarea', localized: true },
                  ],
                },
              ],
            },
          ],
        },

        {
          label: 'Modulos y recomendacion',
          fields: [
            { name: 'addOnsTitle', type: 'text', localized: true },
            { name: 'addOnsIntro', type: 'textarea', localized: true },
            {
              name: 'addOns',
              type: 'array',
              labels: { singular: 'Modulo', plural: 'Modulos' },
              fields: [
                { name: 'name', type: 'text', localized: true, required: true },
                ...precio,
                { name: 'description', type: 'textarea', localized: true, required: true },
              ],
            },
            {
              name: 'recommendedPackage',
              type: 'text',
              admin: { description: 'El nombre de la ruta recomendada. Al guardar se convierte en su clave, que es lo que casa en los dos idiomas.' },
            },
            { name: 'recHeadline', type: 'text', localized: true },
            { name: 'recBody', type: 'textarea', localized: true },
            { name: 'technicalNote', type: 'textarea', localized: true },
          ],
        },

        {
          label: 'Terminos',
          fields: [
            { name: 'termsTitle', type: 'text', localized: true, defaultValue: 'Siguiente paso' },
            {
              name: 'terms',
              type: 'array',
              labels: { singular: 'Termino', plural: 'Terminos' },
              defaultValue: TERMINOS_POR_DEFECTO,
              fields: [
                { name: 'label', type: 'text', localized: true, required: true },
                { name: 'value', type: 'textarea', localized: true, required: true },
              ],
            },
            { name: 'closing', type: 'textarea', localized: true },
          ],
        },

        {
          label: 'Cotizacion simple',
          description: 'Para una propuesta de una sola ruta. Si hay rutas, esto no se usa.',
          fields: [
    {
      name: 'scopeItems',
      type: 'array',
      fields: [
        { name: 'concept', type: 'text', localized: true, required: true },
        { name: 'detail', type: 'textarea', localized: true },
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
          ],
        },
      ],
    },
  ],
};
