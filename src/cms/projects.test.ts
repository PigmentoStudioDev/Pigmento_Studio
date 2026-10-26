import { describe, expect, it } from 'vitest';
import type { Media, Project } from '@/payload-types';
import { toFeaturedCase, toPiece, toProjectDetail, toWorkProject } from './projects';

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
    expect(toPiece(media({ url: '/a.png', alt: 'Empaque', width: 522, height: 715 }))).toEqual({
      src: '/a.png',
      alt: 'Empaque',
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
      slug: 'calderoni',
      title: 'Calderoni',
      client: 'Timbal de Azúcar',
      discipline: 'branding',
      image: { src: '/c.jpg', alt: '', width: 2560, height: 1486 },
    });
  });

  /** La pagina del caso enlaza con el slug y el titulo que el strip ya tiene a mano. */
  it('lleva slug, titulo, ano y resumen cuando el CMS los trae', () => {
    expect(toWorkProject(project({ cover, year: 2025, summary: 'Un reto.' }))).toMatchObject({
      slug: 'calderoni',
      title: 'Calderoni',
      year: 2025,
      summary: 'Un reto.',
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

describe('toFeaturedCase', () => {
  const pieza = (url: string) => ({ image: media({ url, width: 800, height: 1000 }) });
  const caso = (fields: Partial<Project>) =>
    project({ summary: 'El reto fue sostener catalogo y tienda sin dos plantillas.', ...fields });

  it('da el cliente, el texto del CMS y las piezas de la galeria', () => {
    expect(toFeaturedCase(caso({ client: 'Señora Galleta', discipline: 'branding', gallery: [pieza('/1.jpg')] }), 4)).toEqual({
      client: 'Señora Galleta',
      discipline: 'branding',
      summary: 'El reto fue sostener catalogo y tienda sin dos plantillas.',
      pieces: [{ src: '/1.jpg', alt: '', width: 800, height: 1000 }],
    });
  });

  /**
   * Sin galeria el bloque seria el strip de portadas otra vez, y la pagina ya tiene
   * uno; sin texto es una tarjeta con nombre y fotos, que no argumenta nada. Las dos
   * son la razon de existir del bloque, asi que faltando una el caso no entra.
   */
  it('descarta el caso sin galeria y el caso sin texto', () => {
    expect(toFeaturedCase(caso({ gallery: [] }), 4)).toBeNull();
    expect(toFeaturedCase(project({ gallery: [pieza('/1.jpg')] }), 4)).toBeNull();
  });

  /**
   * El fallo silencioso: una fila de galeria cuya imagen no llego poblada no cuenta
   * como pieza. Sin esto un caso entraria con huecos vacios en la rejilla.
   */
  it('una galeria entera sin poblar cuenta como ninguna pieza', () => {
    expect(toFeaturedCase(caso({ gallery: [{ image: 9 }] }), 4)).toBeNull();
  });

  /** El tope es del bloque, no del CMS: hay casos con trece piezas publicadas. */
  it('recorta al tope de piezas', () => {
    const galeria = [pieza('/1.jpg'), pieza('/2.jpg'), pieza('/3.jpg')];
    expect(toFeaturedCase(caso({ gallery: galeria }), 2)?.pieces).toHaveLength(2);
  });

  /** El cliente es opcional en el CMS; la tarjeta no puede quedarse sin titular. */
  it('sin cliente usa el titulo', () => {
    expect(toFeaturedCase(caso({ gallery: [pieza('/1.jpg')] }), 4)?.client).toBe('Calderoni');
  });
});

/**
 * La pagina del proyecto. Lo que se prueba es la regla que falla en silencio: una
 * portada sin medidas no puede salir como pagina, y una pieza de galeria sin poblar
 * no puede entrar con huecos.
 */
describe('toProjectDetail', () => {
  const cover = media({ url: '/c.jpg', alt: 'Portada', width: 2560, height: 1486 });
  const pieza = (url: string) => ({ image: media({ url, width: 800, height: 1000 }) });

  it('da titulo, cliente, ano, resumen, portada y galeria completa', () => {
    expect(
      toProjectDetail(
        project({
          title: 'Calderoni',
          client: 'Timbal de Azúcar',
          discipline: 'web',
          year: 2024,
          summary: 'El reto fue sostener catalogo y tienda.',
          cover,
          gallery: [pieza('/1.jpg'), pieza('/2.jpg')],
        }),
      ),
    ).toEqual({
      slug: 'calderoni',
      title: 'Calderoni',
      client: 'Timbal de Azúcar',
      discipline: 'web',
      year: 2024,
      summary: 'El reto fue sostener catalogo y tienda.',
      cover: { src: '/c.jpg', alt: 'Portada', width: 2560, height: 1486 },
      gallery: [
        { src: '/1.jpg', alt: '', width: 800, height: 1000 },
        { src: '/2.jpg', alt: '', width: 800, height: 1000 },
      ],
    });
  });

  it('sin portada poblada no hay pagina', () => {
    expect(toProjectDetail(project({ cover: 4, gallery: [] }))).toBeNull();
  });

  /** Una fila de galeria sin imagen poblada se descarta; no deja un hueco en la pagina. */
  it('descarta las piezas de galeria sin poblar', () => {
    const detalle = toProjectDetail(project({ cover, gallery: [{ image: 9 }, pieza('/1.jpg')] }));
    expect(detalle?.gallery).toHaveLength(1);
    expect(detalle?.gallery[0].src).toBe('/1.jpg');
  });

  it('sin cliente usa el titulo y sin ano o resumen no los inventa', () => {
    const detalle = toProjectDetail(project({ cover, gallery: [] }));
    expect(detalle?.client).toBe('Calderoni');
    expect(detalle?.year).toBeUndefined();
    expect(detalle?.summary).toBeUndefined();
  });
});
