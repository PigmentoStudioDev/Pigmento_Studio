import { describe, expect, it } from 'vitest';
import { instructions } from './instructions';
import { MCP_COLLECTIONS, apiKeyFromUrl } from './plugin';

/**
 * Contrato de la superficie del MCP, no del plugin. Se afirma sobre el objeto
 * que construye la configuracion porque es lo que este repo controla.
 */
describe('MCP_COLLECTIONS', () => {
  /**
   * Las colecciones de contenido, con las cuatro operaciones. Enumeradas una a
   * una: `enabled: true` a secas abriria lo que el plugin decida en la siguiente
   * version. El equipo se borra por aqui a proposito: retirar a quien deja el
   * estudio es la operacion mas comun de esa coleccion.
   */
  it('expone media, projects, proposals, team-members y legal', () => {
    expect(Object.keys(MCP_COLLECTIONS).sort()).toEqual(['legal', 'media', 'projects', 'proposals', 'team-members']);
    for (const slug of ['media', 'projects', 'proposals', 'team-members'] as const) {
      expect(MCP_COLLECTIONS[slug].enabled).toEqual({
        find: true,
        create: true,
        update: true,
        delete: true,
      });
    }
  });

  /**
   * Borrar un legal es un 404 en una URL indexada, y puede ser el texto que un
   * cliente acepto. Se escribe y se edita por MCP; se borra en el panel.
   */
  it('legal no se puede borrar por MCP', () => {
    expect(MCP_COLLECTIONS.legal.enabled).toEqual({
      find: true,
      create: true,
      update: true,
      delete: false,
    });
  });

  /**
   * Dar de alta gente es del panel: un MCP con createUsers es una puerta que
   * nadie pidio. Y una key que crea keys es escalada sin diff.
   */
  it('no expone users ni la coleccion de API keys', () => {
    const slugs = Object.keys(MCP_COLLECTIONS);
    expect(slugs).not.toContain('users');
    expect(slugs).not.toContain('payload-mcp-api-keys');
  });

  /** La descripcion es lo unico que el modelo lee antes de decidir; vacia no sirve. */
  it('cada coleccion lleva descripcion de producto', () => {
    for (const cfg of Object.values(MCP_COLLECTIONS)) {
      expect(cfg.description.length).toBeGreaterThan(80);
    }
  });
});

describe('instructions', () => {
  /**
   * Las tools cambian con cada coleccion y cada version del plugin; las reglas
   * no. Un nombre de tool en las instrucciones es una regla que caduca sin aviso.
   */
  it('no nombra tools por su nombre', () => {
    expect(instructions).not.toMatch(/\b(find|create|update|delete)(Media|Projects|Proposals)\b/);
  });

  it('manda leer la guia y crear en borrador', () => {
    expect(instructions).toContain('pigmento://cms/guia');
    expect(instructions).toContain('pigmento://cms/media');
    expect(instructions).toMatch(/borrador/);
  });
});

describe('apiKeyFromUrl', () => {
  /**
   * Claude web solo acepta una URL para un conector: ni headers ni bearer. La
   * key viaja en la query, y solo se usa si viene; sin ella, el plugin sigue
   * leyendo el header Authorization como siempre.
   */
  it('saca la key de ?key=', () => {
    expect(apiKeyFromUrl('https://x.test/api/mcp?key=abc-123')).toBe('abc-123');
  });

  it.each([
    ['https://x.test/api/mcp', 'sin query'],
    ['https://x.test/api/mcp?key=', 'vacia'],
    ['https://x.test/api/mcp?otra=1', 'otro parametro'],
    ['no-es-url', 'no es URL'],
  ])('devuelve undefined con %s (%s)', (url) => {
    expect(apiKeyFromUrl(url)).toBeUndefined();
  });
});
