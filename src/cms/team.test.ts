import { describe, expect, it } from 'vitest';
import type { Media, TeamMember as TeamMemberDoc } from '@/payload-types';
import { toTeamMember } from './team';

/**
 * Contrato del mapeo. Los documentos se arman con un `as` por lo mismo que en
 * projects.test: lo que se prueba es lo que la funcion lee, no los quince campos que
 * genera Payload.
 */
const photo = { id: 3, url: '/p.jpg', width: 800, height: 1000 } as Media;

const doc = (fields: Partial<TeamMemberDoc>) =>
  ({ id: 1, name: 'Ana Ruiz', role: 'Directora de arte', group: 'diseno', photo, ...fields }) as TeamMemberDoc;

describe('toTeamMember', () => {
  it('da nombre, oficio, grupo, bio, retrato con medidas y enlaces', () => {
    expect(
      toTeamMember(
        doc({ bio: 'Dirige la marca.', links: [{ id: 'a', network: 'linkedin', url: 'https://linkedin.com/in/ana' }] }),
      ),
    ).toEqual({
      name: 'Ana Ruiz',
      role: 'Directora de arte',
      group: 'diseno',
      bio: 'Dirige la marca.',
      photo: { src: '/p.jpg', width: 800, height: 1000 },
      links: [{ network: 'linkedin', url: 'https://linkedin.com/in/ana' }],
    });
  });

  /** Sin bio no se inventa un parrafo vacio que el panel pintaria como hueco. */
  it('sin bio no lleva la clave, y sin enlaces lleva una lista vacia', () => {
    const member = toTeamMember(doc({ bio: null, links: null }));

    expect(member).not.toHaveProperty('bio');
    expect(member?.links).toEqual([]);
  });

  /**
   * Un enlace guardado antes de la validacion, o escrito por la API sin ella, no llega
   * a un href: la tarjeta lo pinta tal cual.
   */
  it('descarta los enlaces que no son https', () => {
    const member = toTeamMember(
      doc({
        links: [
          { id: 'a', network: 'web', url: 'javascript:alert(1)' },
          { id: 'b', network: 'x', url: 'https://x.com/ana' },
        ],
      }),
    );

    expect(member?.links).toEqual([{ network: 'x', url: 'https://x.com/ana' }]);
  });

  /** Una tarjeta del equipo sin retrato no es una tarjeta: se descarta, como un proyecto sin portada. */
  it('descarta a quien no tiene el retrato poblado', () => {
    expect(toTeamMember(doc({ photo: 3 }))).toBeNull();
  });
});
