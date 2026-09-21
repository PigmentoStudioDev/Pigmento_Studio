import { describe, expect, it } from 'vitest';
import { instructions } from './instructions';
import { MCP_COLLECTIONS } from './plugin';

/**
 * Contrato de la superficie del MCP, no del plugin. Se afirma sobre el objeto
 * que construye la configuracion porque es lo que este repo controla.
 */
describe('MCP_COLLECTIONS', () => {
  /**
   * Las tres colecciones de contenido, con las cuatro operaciones. Enumeradas
   * una a una: `enabled: true` a secas abriria lo que el plugin decida en la
   * siguiente version.
   */
  it('expone media, projects y proposals con CRUD completo', () => {
    expect(Object.keys(MCP_COLLECTIONS).sort()).toEqual(['media', 'projects', 'proposals']);
    for (const cfg of Object.values(MCP_COLLECTIONS)) {
      expect(cfg.enabled).toEqual({ find: true, create: true, update: true, delete: true });
    }
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
