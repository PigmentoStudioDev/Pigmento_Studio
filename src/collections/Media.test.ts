import { describe, expect, it } from 'vitest';
import { Media } from './Media';

/**
 * Contrato de la coleccion, no de Payload. Se afirma sobre el config porque es
 * lo que este repo controla: que la pieza siga declarando lo que el sitio da por
 * hecho al pintarla.
 */
describe('Media', () => {
  const alt = Media.fields.find((field) => 'name' in field && field.name === 'alt');

  /**
   * El sitio entero corre jest-axe en cada componente y pinta estas imagenes con
   * next/image. Un `alt` opcional convierte una decision de accesibilidad en algo
   * que se olvida al subir con prisa, y el fallo no sale en ningun gate: sale en
   * el lector de pantalla de alguien.
   */
  it('exige alt', () => {
    expect(alt).toBeDefined();
    expect(alt && 'required' in alt && alt.required).toBe(true);
  });

  /** Lo que se lee cambia de idioma; el archivo no. */
  it('localiza alt', () => {
    expect(alt && 'localized' in alt && alt.localized).toBe(true);
  });

  /**
   * Lectura publica: el portfolio lo pinta el sitio sin sesion. Las tres
   * escrituras siguen exigiendo usuario — un `access` a medias se lee como
   * descuido y el siguiente no sabe si falta algo.
   */
  it('abre la lectura y cierra la escritura', () => {
    expect(Media.access?.read?.({} as never)).toBe(true);
    for (const op of ['create', 'update', 'delete'] as const) {
      expect(Media.access?.[op]?.({ req: { user: null } } as never)).toBe(false);
    }
  });
});
