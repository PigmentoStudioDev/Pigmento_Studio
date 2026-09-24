import config from '@payload-config';
import { getPayload } from 'payload';
import type { TeamMember as TeamMemberDoc } from '@/payload-types';
import type { Locale } from '@/i18n/routing';
import { validateHttpsUrl } from '@/collections/TeamMembers';
import { toPiece, type ProjectPiece } from './projects';

/**
 * El adaptador del equipo. Devuelve la forma que pide el organismo Team sin importarlo:
 * el design system tiene que poder salir de este repo, y el adaptador no debe atarlo
 * a Payload ni al reves. TypeScript compara las dos formas en la ruta que las junta.
 */
export interface TeamMemberData {
  name: string;
  role: string;
  group: TeamMemberDoc['group'];
  bio?: string;
  photo: ProjectPiece;
  links: { network: NonNullable<TeamMemberDoc['links']>[number]['network']; url: string }[];
}

/** Exportada por su test. Sin retrato poblado no hay tarjeta. */
export function toTeamMember(doc: TeamMemberDoc): TeamMemberData | null {
  const photo = toPiece(doc.photo);
  if (!photo) return null;

  return {
    name: doc.name,
    role: doc.role,
    group: doc.group,
    ...(doc.bio ? { bio: doc.bio } : {}),
    photo,
    // La coleccion ya valida al guardar; esto cubre lo guardado antes de la regla. Un
    // enlace acaba en un href, y ahi un esquema que ejecuta no puede llegar nunca.
    links: (doc.links ?? [])
      .filter((link) => validateHttpsUrl(link.url) === true)
      .map(({ network, url }) => ({ network, url })),
  };
}

/** Todo el equipo publicado, en el orden que marca el CMS. */
export async function getTeamMembers(locale: Locale): Promise<TeamMemberData[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'team-members',
    locale,
    overrideAccess: false,
    sort: 'order',
    // 2 para que `photo` llegue poblado; con 1 vendria como id y no habria medidas.
    depth: 2,
    limit: 100,
  });

  return docs.map(toTeamMember).filter((m): m is TeamMemberData => m !== null);
}
