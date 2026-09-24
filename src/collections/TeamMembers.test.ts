import { describe, expect, it } from 'vitest';
import { TeamMembers, validateHttpsUrl } from './TeamMembers';

/**
 * Contrato de la coleccion: lo que la franja del equipo y el MCP dan por hecho de una
 * persona.
 */

type Field = Record<string, unknown>;

const field = (name: string, fields = TeamMembers.fields) =>
  fields.find((f) => 'name' in f && f.name === name) as Field | undefined;

const values = (f: Field | undefined) =>
  (f?.options as Array<string | { value: string }>).map((o) => (typeof o === 'string' ? o : o.value));

describe('TeamMembers', () => {
  it('el slug produce las tools findTeamMembers, createTeamMembers...', () => {
    expect(TeamMembers.slug).toBe('team-members');
  });

  /** Un nombre es un nombre: no se traduce. Lo que se lee de la persona, si. */
  it('localiza el oficio y la bio, no el nombre', () => {
    expect(field('name')?.localized).toBeUndefined();
    expect(field('name')?.required).toBe(true);
    expect(field('role')?.localized).toBe(true);
    expect(field('bio')?.localized).toBe(true);
  });

  /** El grupo es lo que filtran las pastillas: lista cerrada, o aparecen pastillas sueltas. */
  it('el grupo es obligatorio y de una lista cerrada', () => {
    expect(field('group')?.required).toBe(true);
    expect(values(field('group'))).toEqual(['direccion', 'diseno', 'desarrollo', 'estrategia']);
  });

  it('el retrato es obligatorio y sale de media', () => {
    expect(field('photo')).toMatchObject({ type: 'upload', relationTo: 'media', required: true });
  });

  it('los enlaces son de redes conocidas: cada una tiene su icono', () => {
    const links = field('links') as { fields: Field[] };
    expect(values(field('network', links.fields as typeof TeamMembers.fields))).toEqual([
      'linkedin',
      'instagram',
      'behance',
      'x',
      'web',
    ]);
  });

  /**
   * Lectura publica solo de lo publicado, igual que projects: con `read: () => true` y
   * borradores activados, una persona que aun no dio su permiso para salir en la web
   * ya se veria por la API.
   */
  it('el publico solo lee lo publicado y escribir pide sesion', () => {
    const access = TeamMembers.access as Record<string, (args: unknown) => unknown>;
    const anonymous = { req: { user: null } };
    const signedIn = { req: { user: { id: 1 } } };

    expect(access.read(anonymous)).toEqual({ _status: { equals: 'published' } });
    expect(access.read(signedIn)).toBe(true);
    for (const op of ['create', 'update', 'delete']) {
      expect(access[op](anonymous)).toBe(false);
      expect(access[op](signedIn)).toBe(true);
    }
    expect(TeamMembers.versions).toMatchObject({ drafts: true });
  });
});

describe('validateHttpsUrl', () => {
  it('acepta una direccion https', () => {
    expect(validateHttpsUrl('https://www.linkedin.com/in/alguien')).toBe(true);
  });

  /** Un enlace del pie es un href en la pagina: ni http plano ni esquemas que ejecutan. */
  it('rechaza lo que no es https', () => {
    for (const bad of ['http://ejemplo.com', 'javascript:alert(1)', 'ejemplo.com', '', undefined, null]) {
      expect(validateHttpsUrl(bad)).not.toBe(true);
    }
  });
});
