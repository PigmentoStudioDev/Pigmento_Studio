import { describe, expect, it } from 'vitest';
import { Legal, anchorSections, type AnchorableLegal } from './Legal';

/**
 * Contrato de la coleccion, no de Payload. Se afirma sobre el config y sobre la
 * funcion pura porque es lo que este repo controla: que la pieza siga
 * declarando lo que la pagina de legales dara por hecho al pintarla.
 */

const field = (name: string) => Legal.fields.find((f) => 'name' in f && f.name === name);

/** El array de secciones y sus campos, que es donde vive el cuerpo. */
const sections = field('sections') as { fields: Array<{ name?: string; [k: string]: unknown }> };
const sectionField = (name: string) => sections.fields.find((f) => f.name === name);

describe('Legal', () => {
  /**
   * Una direccion es una direccion: el slug no se traduce y no se repite. Es la
   * misma decision que ya esta escrita en Projects y en navigation.ts.
   */
  it('el slug es unico, indexado y NO localizado', () => {
    const slug = field('slug') as Record<string, unknown>;
    expect(slug.unique).toBe(true);
    expect(slug.index).toBe(true);
    expect(slug.localized).toBeUndefined();
  });

  /** Lo que se lee cambia de idioma; la fecha de vigencia y el slug no. */
  it('localiza los textos y no la fecha', () => {
    for (const name of ['title', 'intro', 'tocTitle']) {
      expect((field(name) as Record<string, unknown>).localized).toBe(true);
    }
    expect((field('effectiveDate') as Record<string, unknown>).localized).toBeUndefined();
  });

  /**
   * Lectura publica pero SOLO de lo publicado, y las tres escrituras con sesion.
   *
   * El booleano es lo que fallo: con `read: () => true` y borradores activados,
   * `GET /api/legal` sin sesion devolvia el borrador entero. Se afirma la forma
   * de la consulta, no que "devuelve algo": un `true` tambien es truthy.
   */
  it('lee en publico solo lo publicado', () => {
    expect(Legal.access?.read?.({ req: { user: null } } as never)).toEqual({
      _status: { equals: 'published' },
    });
    expect(Legal.access?.read?.({ req: { user: { id: 1 } } } as never)).toBe(true);
  });

  it('cierra la escritura sin sesion', () => {
    for (const op of ['create', 'update', 'delete'] as const) {
      expect(Legal.access?.[op]?.({ req: { user: null } } as never)).toBe(false);
    }
  });

  /**
   * Con borradores: un cambio en un texto legal se prepara y se revisa antes de
   * sustituir al que esta publicado, que es el que alguien podria haber aceptado.
   */
  it('tiene borradores', () => {
    expect(Legal.versions).toMatchObject({ drafts: true });
  });

  /**
   * El indice de la pagina se deriva del cuerpo, asi que cada seccion necesita
   * encabezado, ancla y nivel. Sin `level` no hay sangria que distinga una
   * subseccion de una seccion.
   */
  it('cada seccion lleva encabezado, ancla, nivel, cuerpo y lista', () => {
    expect(sectionField('heading')).toMatchObject({ localized: true, required: true });
    expect(sectionField('anchor')).toMatchObject({ admin: { readOnly: true } });
    expect(sectionField('level')).toMatchObject({ type: 'select', defaultValue: '2' });
    expect(sectionField('body')).toMatchObject({ type: 'textarea', localized: true });
    expect(sectionField('items')).toMatchObject({ type: 'array' });
  });

  /** Dos niveles y no seis: mas anidacion no la lee nadie en un texto legal. */
  it('el nivel solo admite 2 y 3', () => {
    expect((sectionField('level') as { options: string[] }).options).toEqual(['2', '3']);
  });
});

describe('anchorSections', () => {
  /**
   * Quien redacta escribe el encabezado y nunca ve el ancla. Teclearla a mano es
   * pedirle disciplina de programador a quien esta redactando un aviso de
   * privacidad, y un typo ahi rompe un enlace del indice sin dar error.
   */
  it('acuna el ancla desde el encabezado', () => {
    const out = anchorSections<AnchorableLegal>({ sections: [{ heading: 'Datos que recabamos' }] });
    expect(out.sections?.[0].anchor).toBe('datos-que-recabamos');
  });

  it('quita acentos y signos', () => {
    const out = anchorSections<AnchorableLegal>({ sections: [{ heading: '¿Cómo ejercer tus derechos ARCO?' }] });
    expect(out.sections?.[0].anchor).toBe('como-ejercer-tus-derechos-arco');
  });

  /**
   * Un ancla ya acuñada NO se recalcula: es el destino de un enlace que puede
   * estar pegado en un correo. Corregir una errata del titulo no puede romperlo.
   */
  it('conserva un ancla existente aunque cambie el encabezado', () => {
    const out = anchorSections<AnchorableLegal>({
      sections: [{ heading: 'Datos que recabamos de ti', anchor: 'datos-que-recabamos' }],
    });
    expect(out.sections?.[0].anchor).toBe('datos-que-recabamos');
  });

  /**
   * El ancla que LLEGA no se cree: se sanea igual que la que se acuña.
   *
   * `admin.readOnly` es una pista de la interfaz, no un permiso: por REST o por
   * MCP cualquiera puede mandar un `anchor` en el cuerpo. Y este campo acaba en
   * un `id` del DOM y en el destino de un enlace de una pagina publica, asi que
   * lo que se guarde ahi se sirve a cualquier visitante.
   *
   * Pasar por `criterionKey` es idempotente para un ancla legitima —ya esta en
   * ese alfabeto— asi que sanear no rompe la regla de conservarla.
   */
  it.each([
    ['javascript:alert(1)', 'javascript-alert-1'],
    ['../../admin', 'admin'],
    ['https://evil.example/x', 'https-evil-example-x'],
    ['" onmouseover="x', 'onmouseover-x'],
  ])('sanea un ancla que llega de fuera: %s', (sucia, limpia) => {
    const out = anchorSections<AnchorableLegal>({
      sections: [{ heading: 'Vigencia', anchor: sucia }],
    });
    expect(out.sections?.[0].anchor).toBe(limpia);
  });

  /**
   * El panel SI manda el id de cada fila, asi que ahi el ancla se recupera del
   * documento guardado aunque quien edita no la mande. Es la misma solucion que
   * `mintAccessToken` usa para el token de una propuesta.
   */
  it('recupera el ancla guardada por id cuando no llega en la peticion', () => {
    const out = anchorSections<AnchorableLegal>(
      { sections: [{ id: 'fila-1', heading: 'Vigencia de este aviso' }] },
      { sections: [{ id: 'fila-1', heading: 'Vigencia', anchor: 'vigencia' }] },
    );
    expect(out.sections?.[0].anchor).toBe('vigencia');
  });

  /** Lo guardado manda sobre lo que llegue: es una invariante, no una preferencia. */
  it('lo guardado gana a un ancla distinta que llegue en la peticion', () => {
    const out = anchorSections<AnchorableLegal>(
      { sections: [{ id: 'fila-1', heading: 'Vigencia', anchor: 'otra-cosa' }] },
      { sections: [{ id: 'fila-1', heading: 'Vigencia', anchor: 'vigencia' }] },
    );
    expect(out.sections?.[0].anchor).toBe('vigencia');
  });

  /** Una fila nueva en un documento que ya existia se acuña como cualquier otra. */
  it('acuña una fila cuyo id no esta en el documento guardado', () => {
    const out = anchorSections<AnchorableLegal>(
      { sections: [{ id: 'fila-9', heading: 'Contacto' }] },
      { sections: [{ id: 'fila-1', heading: 'Vigencia', anchor: 'vigencia' }] },
    );
    expect(out.sections?.[0].anchor).toBe('contacto');
  });

  /**
   * Una fila guardada no pierde su ancla porque otra, nueva y ANTES en el orden,
   * derive el mismo nombre. Sin reservar primero lo guardado, la nueva se lleva
   * `vigencia` y la vieja pasa a `vigencia-2`: el enlace que estaba en un correo
   * deja de llevar a donde llevaba.
   */
  it('lo guardado se reserva antes de acuñar lo nuevo', () => {
    const out = anchorSections<AnchorableLegal>(
      {
        sections: [
          { heading: 'Vigencia' },
          { id: 'fila-1', heading: 'Vigencia' },
        ],
      },
      { sections: [{ id: 'fila-1', heading: 'Vigencia', anchor: 'vigencia' }] },
    );
    expect(out.sections?.map((x) => x.anchor)).toEqual(['vigencia-2', 'vigencia']);
  });

  /**
   * Dos filas guardadas con la MISMA ancla ya estaban rotas: el segundo enlace del
   * indice llevaba al primero. Recuperarlas tal cual perpetuaba la duplicidad, asi
   * que se desempatan igual que las acuñadas. Pasa con datos anteriores a este
   * hook o con una peticion que repite un id.
   */
  it('desempata dos anclas guardadas iguales', () => {
    const out = anchorSections<AnchorableLegal>(
      {
        sections: [
          { id: 'fila-1', heading: 'Vigencia' },
          { id: 'fila-2', heading: 'Vigencia' },
        ],
      },
      {
        sections: [
          { id: 'fila-1', heading: 'Vigencia', anchor: 'vigencia' },
          { id: 'fila-2', heading: 'Vigencia', anchor: 'vigencia' },
        ],
      },
    );
    expect(out.sections?.map((x) => x.anchor)).toEqual(['vigencia', 'vigencia-2']);
  });

  /**
   * Dos encabezados iguales darian dos anclas iguales, y entonces el segundo
   * enlace del indice lleva al primero. Se desempata con un sufijo.
   */
  it('desempata anclas repetidas', () => {
    const out = anchorSections<AnchorableLegal>({
      sections: [{ heading: 'Vigencia' }, { heading: 'Vigencia' }, { heading: 'Vigencia' }],
    });
    expect(out.sections?.map((s) => s.anchor)).toEqual(['vigencia', 'vigencia-2', 'vigencia-3']);
  });

  /** Un encabezado sin letras ni numeros no produce un ancla vacia. */
  it('nunca deja un ancla vacia', () => {
    const out = anchorSections<AnchorableLegal>({ sections: [{ heading: '———' }] });
    expect(out.sections?.[0].anchor).toBe('seccion');
  });

  /**
   * No muta lo que recibe: la regla de inmutabilidad de la casa, y ademas el
   * hook recibe el `data` que Payload sigue usando despues.
   */
  it('devuelve una copia y no toca el original', () => {
    const data: AnchorableLegal = { sections: [{ heading: 'Vigencia' }] };
    const out = anchorSections(data);
    expect(out).not.toBe(data);
    expect(data.sections?.[0]).not.toHaveProperty('anchor');
  });

  /** Un documento sin secciones se deja como estaba, no se le inventa un array. */
  it('deja pasar un documento sin secciones', () => {
    const sinSecciones: AnchorableLegal & { title: string } = { title: 'Aviso' };
    expect(anchorSections(sinSecciones)).toEqual({ title: 'Aviso' });
  });
});
