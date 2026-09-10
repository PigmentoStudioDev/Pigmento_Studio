import config from '@payload-config';
import { getPayload } from 'payload';
import type { Proposal } from '@/payload-types';

/**
 * El adaptador de las propuestas. Es la frontera entre una coleccion PRIVADA y
 * una pagina publica, asi que aqui la disciplina no es de estilo.
 */

export type ProposalStatus = 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'vencida';

export interface ProposalItem {
  concept: string;
  detail: string;
  amountCents: number;
}

/**
 * Lo que el cliente puede ver. NO lleva `notes` ni `accessToken`, y por eso se
 * arma campo a campo: un `...doc` filtraria cualquier campo interno que se anada
 * despues, sin que nadie tome esa decision.
 */
export interface ProposalView {
  client: string;
  status: ProposalStatus;
  items: ProposalItem[];
  totalCents: number;
  currency: 'MXN' | 'USD';
  validUntil: string | null;
  expired: boolean;
}

/**
 * El total se CALCULA al leer, no se guarda. Un total almacenado puede acabar
 * contradiciendo a sus renglones —basta con editar uno y que falle el hook— y
 * entonces la cotizacion dice dos cosas a la vez.
 */
export function toView(doc: Proposal, now = new Date()): ProposalView {
  const items: ProposalItem[] = (doc.scopeItems ?? []).map((item) => ({
    concept: item.concept,
    detail: item.detail ?? '',
    amountCents: item.amountCents,
  }));

  return {
    client: doc.client,
    status: doc.status as ProposalStatus,
    items,
    totalCents: items.reduce((sum, item) => sum + item.amountCents, 0),
    currency: doc.currency as 'MXN' | 'USD',
    validUntil: doc.validUntil ?? null,
    expired: Boolean(doc.validUntil && new Date(doc.validUntil) < now),
  };
}

/**
 * Una propuesta por su token.
 *
 * AQUI NO VA `overrideAccess: false`, y el motivo hay que leerlo entero porque
 * la intuicion dice lo contrario.
 *
 * `access.read` de la coleccion exige sesion. Eso es lo que mantiene cerrado el
 * REST: `GET /api/proposals` sin sesion responde 403 y no filtra ni un campo.
 * Pero significa que con `overrideAccess: false` un visitante anonimo no puede
 * leer NADA — ni siquiera su propia propuesta con el token bueno.
 *
 * La salida tentadora es abrir `read` a anonimos. Es peor: abrirlo en la
 * coleccion abre TAMBIEN el endpoint REST, y entonces cualquiera lista todas las
 * cotizaciones sin token. El control de acceso de Payload no puede exigir "solo
 * si la consulta trae el token", porque no ve la consulta.
 *
 * Asi que la seguridad de esta lectura descansa en tres cosas, y las tres las
 * vigila el gate `lectura-de-proposals`:
 *
 *   1. el `where` SIEMPRE filtra por `accessToken` — sin token no hay documento
 *   2. `limit: 1` — no hay forma de enumerar
 *   3. el mapeo es campo a campo en `toView` — `notes` no cruza
 *
 * `depth: 0` de propina: sin relaciones pobladas no hay nada de otra coleccion
 * que se pueda arrastrar por accidente.
 */
export async function getProposalByToken(token: string): Promise<ProposalView | null> {
  // Frontera de confianza: se comprueba el TIPO y no solo la verdad. Hoy el
  // segmento `[token]` de Next siempre da un string —seria `[...token]` quien
  // diera un array— pero esta funcion esta exportada y no puede depender de que
  // quien la llame sea de fiar. Un token vacio, ademas, casaria con `equals`
  // contra los documentos sin token.
  if (typeof token !== 'string' || !token) return null;

  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'proposals',
    where: { accessToken: { equals: token } },
    depth: 0,
    limit: 1,
  });

  const doc = docs[0];
  return doc ? toView(doc) : null;
}
