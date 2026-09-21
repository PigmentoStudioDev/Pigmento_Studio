import { describe, expect, it } from 'vitest';
import type { Legal } from '@/payload-types';
import { toLegalView } from './legal';

/**
 * El adaptador de un legal. Se prueba la funcion pura porque es donde vive la
 * unica regla que puede fallar en silencio: una entrada del indice sin destino
 * es un enlace roto y no da error en ninguna parte.
 */

const doc = (over: Partial<Legal> = {}): Legal =>
  ({
    id: 1,
    slug: 'aviso-de-privacidad',
    title: 'Aviso de privacidad',
    updatedAt: '2026-09-21T00:00:00.000Z',
    createdAt: '2026-09-21T00:00:00.000Z',
    ...over,
  }) as Legal;

describe('toLegalView', () => {
  it('parte el cuerpo en parrafos por linea en blanco', () => {
    const view = toLegalView(
      doc({
        sections: [
          {
            heading: 'Responsable',
            anchor: 'responsable',
            level: '2',
            body: 'Primero.\n\nSegundo.',
          },
        ],
      }),
    );
    expect(view.sections[0].body).toEqual(['Primero.', 'Segundo.']);
  });

  it('parte el intro en parrafos', () => {
    const view = toLegalView(doc({ intro: 'Uno.\n\nDos.' }));
    expect(view.intro).toEqual(['Uno.', 'Dos.']);
  });

  it('el nivel llega como numero, no como la cadena del select', () => {
    const view = toLegalView(
      doc({ sections: [{ heading: 'Sub', anchor: 'sub', level: '3' }] }),
    );
    expect(view.sections[0].level).toBe(3);
  });

  it('pasa los puntos de la lista y tira los vacios', () => {
    const view = toLegalView(
      doc({
        sections: [
          {
            heading: 'Datos',
            anchor: 'datos',
            level: '2',
            items: [{ text: 'Nombre' }, { text: '   ' }, { text: 'Correo' }],
          },
        ],
      }),
    );
    expect(view.sections[0].items).toEqual(['Nombre', 'Correo']);
  });

  /**
   * Una seccion SIN ancla conserva su texto y se queda sin destino.
   *
   * Descartarla entera era la primera version y es peor: lo que desaparece no es
   * un enlace del indice, es una clausula de un aviso de privacidad, y sin que
   * nada lo diga. En la practica no pasa —el ancla la acuña el servidor en
   * `beforeValidate`— pero una importacion o una restauracion que se salte el
   * hook no puede borrar texto legal en silencio.
   */
  it('conserva el texto de una seccion sin ancla, y la deja sin destino', () => {
    const view = toLegalView(
      doc({
        sections: [
          { heading: 'Sin destino', level: '2', body: 'Una clausula que importa.' },
          { heading: 'Con destino', anchor: 'con-destino', level: '2' },
        ],
      }),
    );
    expect(view.sections.map((s) => s.heading)).toEqual(['Sin destino', 'Con destino']);
    expect(view.sections[0].anchor).toBeNull();
    expect(view.sections[0].body).toEqual(['Una clausula que importa.']);
  });

  it('un documento sin secciones no revienta', () => {
    const view = toLegalView(doc());
    expect(view.sections).toEqual([]);
    expect(view.intro).toEqual([]);
  });

  /** El rotulo del indice tiene default en el CMS, pero un documento viejo puede no traerlo. */
  it('el indice siempre tiene rotulo', () => {
    expect(toLegalView(doc({ tocTitle: null })).tocTitle).toBe('Contenido');
    expect(toLegalView(doc({ tocTitle: 'Indice' })).tocTitle).toBe('Indice');
  });

  it('pasa slug, titulo y fecha de vigencia', () => {
    const view = toLegalView(doc({ effectiveDate: '2026-01-31T00:00:00.000Z' }));
    expect(view.slug).toBe('aviso-de-privacidad');
    expect(view.title).toBe('Aviso de privacidad');
    expect(view.effectiveDate).toBe('2026-01-31T00:00:00.000Z');
  });

  it('la fecha de vigencia es opcional', () => {
    expect(toLegalView(doc()).effectiveDate).toBeNull();
  });
});
