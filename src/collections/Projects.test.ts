import { describe, expect, it } from 'vitest';
import { Projects } from './Projects';

/**
 * Contrato de la coleccion: lo que el sitio y el MCP dan por hecho de un proyecto.
 */

const field = (name: string) =>
  Projects.fields.find((f) => 'name' in f && f.name === name) as Record<string, unknown> | undefined;

const values = (name: string) =>
  (field(name)?.options as Array<string | { value: string }>).map((o) => (typeof o === 'string' ? o : o.value));

describe('Projects', () => {
  /**
   * La disciplina es UNA: es la etiqueta que pinta cada fila del strip de trabajo.
   * Las categorias no la sustituyen, la acompanan.
   */
  it('la disciplina sigue siendo un solo valor de cuatro', () => {
    expect(field('discipline')?.hasMany).toBeUndefined();
    expect(values('discipline')).toEqual(['branding', 'web', 'motion', 'marketing']);
  });

  /**
   * Las categorias salen de los tags del sitio anterior, fusionando los que eran
   * dos nombres para un mismo servicio (Motion Branding y Motion Graphics, diseno y
   * desarrollo de e-commerce). La lista es cerrada: un tag libre vuelve a abrir la
   * puerta a los duplicados que se fusionaron.
   */
  it('las categorias son varias, de una lista cerrada de ocho', () => {
    const categories = field('categories');

    expect(categories?.type).toBe('select');
    expect(categories?.hasMany).toBe(true);
    expect(values('categories')).toEqual([
      'branding',
      'packaging',
      'motion',
      'web',
      'ecommerce',
      'producto',
      'marketing',
      'redes',
    ]);
  });

  /** El valor es una clave, no un texto: se traduce la etiqueta, no lo guardado. */
  it('las categorias no se localizan, sus etiquetas si', () => {
    const categories = field('categories');
    const options = categories?.options as Array<{ label: Record<string, string> }>;

    expect(categories?.localized).toBeUndefined();
    for (const option of options) {
      expect(Object.keys(option.label).sort()).toEqual(['en', 'es']);
    }
  });
});
