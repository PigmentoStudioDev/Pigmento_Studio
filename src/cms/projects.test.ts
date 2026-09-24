import { describe, expect, it } from 'vitest';
import type { Media, Project } from '@/payload-types';
import { toPiece, toWorkProject } from './projects';

/**
 * Contrato del mapeo, que es lo que este repo controla: si Payload devuelve o no
 * un documento es asunto de Payload.
 *
 * Los documentos se arman con un `as Media` y no campo a campo porque lo que se
 * prueba es que la funcion lea `url`/`width`/`height`, no que el tipo generado
 * tenga quince campos mas.
 */
const media = (fields: Partial<Media>) => ({ id: 1, ...fields }) as Media;

describe('toPiece', () => {
  it('saca las medidas del documento de media, no de una constante', () => {
    expect(toPiece(media({ url: '/a.png', width: 522, height: 715 }))).toEqual({
      src: '/a.png',
      width: 522,
      height: 715,
    });
  });

  /**
   * Sin medidas no hay pieza. El bug que evita es silencioso: `next/image` sin
   * width/height no falla — reserva mal el hueco y la pagina salta al cargar cada
   * imagen. Mejor no pintarla que pintarla saltando.
   */
  it('descarta lo que no trae medidas o url', () => {
    expect(toPiece(media({ url: '/a.png' }))).toBeNull();
    expect(toPiece(media({ width: 10, height: 10 }))).toBeNull();
  });

  /**
   * Con `depth` insuficiente Payload devuelve el id en vez del documento.
   * Devolver null es lo correcto: lo contrario seria inventar una medida.
   */
  it('descarta una relacion sin poblar', () => {
    expect(toPiece(7)).toBeNull();
    expect(toPiece(null)).toBeNull();
    expect(toPiece(undefined)).toBeNull();
  });
});

const project = (fields: Partial<Project>) => ({ id: 1, title: 'Calderoni', slug: 'calderoni', ...fields }) as Project;

describe('toWorkProject', () => {
  const cover = media({ url: '/c.jpg', width: 2560, height: 1486 });

  it('da el cliente, la disciplina y la portada con sus medidas', () => {
    expect(toWorkProject(project({ client: 'Timbal de Azúcar', discipline: 'branding', cover }))).toEqual({
      client: 'Timbal de Azúcar',
      discipline: 'branding',
      image: { src: '/c.jpg', width: 2560, height: 1486 },
    });
  });

  /** El cliente es opcional en el CMS; la fila no puede quedarse sin nombre. */
  it('sin cliente usa el titulo', () => {
    expect(toWorkProject(project({ cover }))?.client).toBe('Calderoni');
  });

  it('sin disciplina no la inventa', () => {
    expect(toWorkProject(project({ cover }))?.discipline).toBeUndefined();
  });

  /** Una fila de fotos sin foto no es una pieza: se descarta, igual que en toPiece. */
  it('descarta el proyecto cuya portada no llego poblada', () => {
    expect(toWorkProject(project({ cover: 4 }))).toBeNull();
  });
});
