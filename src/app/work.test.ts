import { describe, expect, it } from 'vitest';
import type { WorkProject } from '@/cms/projects';
import { getWork } from './work';

const t = (key: string) => key;

const project = (n: number): WorkProject => ({
  client: `Cliente real ${n}`,
  discipline: n % 2 ? 'motion' : undefined,
  image: { src: `/p${n}.jpg`, width: 100, height: 100 + n },
});

describe('getWork', () => {
  it('con proyectos del CMS, las filas muestran esos proyectos y no marcadores', () => {
    const { rows } = getWork(t, [project(1), project(2), project(3)]);
    const pieces = rows.flat();

    expect(pieces.every((p) => p.client.startsWith('Cliente real'))).toBe(true);
    expect(pieces[0]).toMatchObject({ client: 'Cliente real 1', discipline: 'disciplines.motion', image: { src: '/p1.jpg' } });
    expect(pieces[1].discipline).toBeUndefined();
  });

  /** Las filas necesitan mas piezas que proyectos hay: se repiten en orden. */
  it('rellena las filas repitiendo los proyectos en su orden', () => {
    const { rows } = getWork(t, [project(1), project(2)]);

    expect(rows[0].map((p) => p.image.src).slice(0, 4)).toEqual(['/p1.jpg', '/p2.jpg', '/p1.jpg', '/p2.jpg']);
  });

  /** Cada fila empieza a media coleccion de la anterior, para que no arranquen iguales. */
  it('la segunda fila no empieza con la misma pieza que la primera', () => {
    const { rows } = getWork(t, [1, 2, 3, 4].map(project));

    expect(rows[1][0].image.src).not.toBe(rows[0][0].image.src);
  });

  /** Una base vacia (el SQLite de desarrollo) no deja la seccion sin filas. */
  it('sin proyectos vuelve a los marcadores', () => {
    const { rows } = getWork(t, []);

    expect(rows.flat().length).toBeGreaterThan(0);
    expect(rows[0][0].client).toBe('placeholderClient 01');
  });
});
