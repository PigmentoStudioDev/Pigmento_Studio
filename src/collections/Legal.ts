import type { CollectionConfig } from 'payload';
import { criterionKey } from './Proposals';

/**
 * Los textos legales del sitio: aviso de privacidad, terminos, cookies. Una
 * entrada por documento.
 *
 * El cuerpo NO es un bloque de texto opaco, y esa es la decision que manda sobre
 * el resto del esquema. La pagina lleva un indice al lado —la forma de cualquier
 * documento legal, y la de la plantilla de referencia— y ese indice se DERIVA del
 * cuerpo: necesita un encabezado por seccion, un ancla a la que saltar y un nivel
 * que distinga una subseccion de una seccion. Con un solo campo de texto no habria
 * de donde sacarlos.
 *
 * Sin rich text, como el resto del repo: la estructura la da el array y los
 * parrafos se separan por linea en blanco, igual que en las propuestas. Meter un
 * editor arrastraria @payloadcms/richtext-lexical por un texto que es una lista
 * de encabezados y parrafos.
 */

/**
 * Las dos formas que el hook toca, exportadas porque su test las necesita para
 * escribir un documento de entrada: sin ellas, el generico estrecha el literal y
 * `anchor` —el campo que esta funcion ANADE— deja de existir en el tipo de salida.
 */
export interface LegalSectionRow {
  id?: string | null;
  heading?: string | null;
  anchor?: string | null;
}

export interface AnchorableLegal {
  sections?: LegalSectionRow[] | null;
}

/**
 * Acuna el ancla de cada seccion desde su encabezado, y desempata las repetidas.
 *
 * Quien redacta escribe "Datos que recabamos" y nunca ve `datos-que-recabamos`:
 * teclearla a mano es pedirle disciplina de programador a quien esta redactando
 * un aviso de privacidad, y un typo ahi rompe un enlace del indice sin dar error.
 *
 * Un ancla YA acunada no se recalcula. Es el destino de un enlace que puede estar
 * pegado en un correo o citado en un contrato; corregir una errata del titulo no
 * puede romperlo. Es la misma regla que `mintAccessToken` aplica al token de una
 * propuesta, por el mismo motivo.
 *
 * Esa regla tiene DOS caminos porque hay dos clientes distintos:
 *
 * - El panel manda el `id` de cada fila, asi que el ancla se recupera de
 *   `originalDoc` aunque quien edita no la mande — y no depende de que la mande.
 * - Un cliente MCP NO puede: el esquema que el plugin genera rechaza `id` dentro
 *   de una fila ("Unrecognized key(s) in object: 'id' at sections[0]"), asi que
 *   sus filas siempre llegan sin identidad. Ahi el unico canal es el `anchor` que
 *   el propio cliente devuelva, y por eso la guia del MCP pide devolverlo tal cual
 *   se leyo. Lo que devuelva se sanea igual: no se le cree, se le usa de entrada.
 *
 * Dos pasadas y no una: lo guardado se RESERVA antes de acunar lo nuevo. Con una
 * sola, una fila nueva colocada antes en el orden se lleva el nombre limpio y
 * empuja a la guardada a `-2`, que es justo el enlace que no puede moverse.
 *
 * "No se recalcula" no es "se copia sin mirar": lo guardado tambien se sanea y
 * tambien se desempata. Un ancla duplicada o con basura ya estaba rota, y
 * devolverla intacta solo mantiene rota la pagina.
 *
 * Funcion pura y exportada por su test, como `criterionKey` y `alignProposal`.
 */
export function anchorSections<T extends AnchorableLegal>(
  data: T,
  originalDoc?: AnchorableLegal | null,
): T {
  if (!data.sections) return data;

  const guardadas = new Map<string, string>();
  for (const fila of originalDoc?.sections ?? []) {
    // Saneada tambien la guardada: un documento escrito antes de esta regla pudo
    // haber almacenado cualquier cosa, y de ahi sale un `id` del DOM.
    if (fila.id && fila.anchor) guardadas.set(String(fila.id), criterionKey(fila.anchor) || 'seccion');
  }

  const usadas = new Set<string>();

  // Pasada 1: resolver lo guardado y reservar su nombre.
  const recuperadas = data.sections.map((section) => {
    const guardada = section.id ? guardadas.get(String(section.id)) : undefined;
    if (!guardada) return undefined;

    // Tambien lo recuperado se desempata. Dos filas guardadas con la misma ancla
    // ya estaban rotas —el segundo enlace del indice llevaba al primero—, y
    // devolverlas tal cual perpetuaba la duplicidad. Pasa con datos anteriores a
    // este hook o con una peticion que repite un id.
    let anchor = guardada;
    for (let n = 2; usadas.has(anchor); n += 1) anchor = `${guardada}-${n}`;
    usadas.add(anchor);
    return anchor;
  });

  // Pasada 2: acunar solo lo que no tenia ancla guardada.
  const sections = data.sections.map((section, i) => {
    const guardada = recuperadas[i];
    if (guardada) return { ...section, anchor: guardada };

    /**
     * TODO ancla pasa por `criterionKey`, tambien la que LLEGA en la peticion.
     *
     * `admin.readOnly` es una pista de la interfaz y no un permiso: por REST o
     * por MCP cualquiera puede mandar un `anchor` en el cuerpo, y este campo
     * acaba siendo un `id` del DOM y el destino de un enlace en una pagina
     * publica. Sin esta linea, un `javascript:alert(1)` se guardaba tal cual y
     * se servia a cualquier visitante.
     *
     * Sanear NO rompe la regla de conservarla: `criterionKey` es idempotente
     * sobre un ancla legitima, que ya esta en su alfabeto.
     */
    const base = criterionKey(section.anchor || section.heading || '') || 'seccion';

    // Dos encabezados iguales darian dos anclas iguales, y entonces el segundo
    // enlace del indice lleva al primero. El sufijo empieza en 2 porque el
    // primero se queda con el nombre limpio.
    let anchor = base;
    for (let n = 2; usadas.has(anchor); n += 1) anchor = `${base}-${n}`;
    usadas.add(anchor);

    return { ...section, anchor };
  });

  return { ...data, sections };
}

export const Legal: CollectionConfig = {
  slug: 'legal',

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'effectiveDate', '_status'],
  },

  /**
   * Publico solo lo PUBLICADO. Un aviso de privacidad que exige sesion no cumple
   * su funcion, pero `read: () => true` con borradores activados los sirve
   * tambien: comprobado contra `/api/legal` sin sesion, que devolvia el borrador
   * entero. Devolver una QUERY y no un booleano es lo unico que lo impide — la
   * misma forma que ya usa Projects, y por el mismo motivo.
   */
  access: {
    read: ({ req: { user } }) => (user ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },

  /**
   * Con borradores. Un texto legal publicado es el que alguien pudo haber
   * aceptado: la version nueva se prepara y se revisa antes de sustituirlo.
   */
  versions: { drafts: true },

  hooks: {
    // Antes de validar, como en Proposals: asi el ancla existe cuando Payload
    // comprueba los campos, y no despues.
    beforeValidate: [({ data, originalDoc }) => (data ? anchorSections(data, originalDoc) : data)],
  },

  fields: [
    { name: 'title', type: 'text', required: true, localized: true },

    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      // NO localizado: una direccion es una direccion. Misma decision que en
      // Projects y en navigation.ts.
      admin: { description: 'La direccion del documento: aviso-de-privacidad. No se traduce.' },
    },

    {
      name: 'effectiveDate',
      type: 'date',
      admin: {
        description: 'Desde cuando rige esta version. Va arriba del documento, antes del indice.',
      },
    },

    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      admin: { description: 'Opcional. El parrafo de entrada, antes del indice.' },
    },

    {
      name: 'tocTitle',
      type: 'text',
      localized: true,
      defaultValue: 'Contenido',
      admin: { description: 'El rotulo del indice lateral.' },
    },

    {
      name: 'sections',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Seccion', plural: 'Secciones' },
      admin: { description: 'El cuerpo. El indice de la pagina sale de aqui, en este orden.' },
      fields: [
        { name: 'heading', type: 'text', required: true, localized: true },

        {
          name: 'anchor',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'El ancla del indice. La acuna el servidor desde el encabezado.',
          },
        },

        {
          name: 'level',
          type: 'select',
          required: true,
          defaultValue: '2',
          options: ['2', '3'],
          admin: {
            description: '2 es una seccion; 3 una subseccion, que el indice sangra. No hay mas.',
          },
        },

        {
          name: 'body',
          type: 'textarea',
          localized: true,
          admin: { description: 'Un parrafo por bloque, separados por linea en blanco.' },
        },

        {
          name: 'items',
          type: 'array',
          labels: { singular: 'Punto', plural: 'Puntos' },
          admin: { description: 'Opcional: la lista que sigue al cuerpo. Un punto por renglon.' },
          fields: [{ name: 'text', type: 'text', required: true, localized: true }],
        },
      ],
    },
  ],
};
