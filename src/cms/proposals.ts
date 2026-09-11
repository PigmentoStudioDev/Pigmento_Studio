import config from '@payload-config';
import { getPayload } from 'payload';
import type { Media, Proposal } from '@/payload-types';
import type { Locale } from '@/i18n/routing';

/**
 * El adaptador de las propuestas. Es la frontera entre una coleccion PRIVADA y
 * una pagina publica, asi que aqui la disciplina no es de estilo.
 */

export type ProposalStatus = 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'vencida';
export type PriceKind = 'fijo' | 'mensual' | 'rango';
export type PriceUnit = 'proyecto' | 'mes' | 'pieza';
export type PriceAccent = 'uno' | 'dos' | 'tres';

export interface ProposalItem {
  concept: string;
  detail: string;
  amountCents: number;
}

export interface ProposalPrice {
  kind: PriceKind;
  amountCents: number;
  amountMaxCents: number | null;
  unit: PriceUnit;
}

export interface ProposalImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface ProposalDeliverable {
  name: string;
  description: string;
}

export interface ProposalCriterion {
  key: string;
  label: string;
}

export interface ProposalFinding {
  key: string;
  area: string;
  title: string;
  cost: string;
}

export interface ProposalFigure {
  value: string;
  label: string;
  source: string;
}

export interface ProposalPackage {
  key: string;
  name: string;
  accent: PriceAccent;
  price: ProposalPrice;
  deliveryWeeks: number | null;
  body: string[];
  values: { key: string; value: string }[];
  recommended: boolean;
}

export interface ProposalAddOn {
  name: string;
  description: string;
  price: ProposalPrice;
}

export interface ProposalTerm {
  label: string;
  value: string;
}

/**
 * Lo que el cliente puede ver. NO lleva `notes`, `contactEmail` ni `accessToken`, y
 * por eso se arma campo a campo: un `...doc` filtraria cualquier campo interno que se
 * anada despues, sin que nadie tome esa decision.
 */
export interface ProposalView {
  client: string;
  status: ProposalStatus;
  currency: 'MXN' | 'USD';
  validUntil: string | null;
  expired: boolean;

  /** La cotizacion simple de una sola ruta. Vacia cuando hay paquetes. */
  items: ProposalItem[];
  totalCents: number;

  serviceTitle: string | null;
  tagline: string[];
  cover: ProposalImage | null;
  headline: string | null;
  context: string | null;
  findings: ProposalFinding[];
  figures: ProposalFigure[];

  baseTitle: string | null;
  deliverables: ProposalDeliverable[];
  includedInAll: string[];

  routesEyebrow: string | null;
  criteria: ProposalCriterion[];
  packages: ProposalPackage[];

  addOnsTitle: string | null;
  addOnsIntro: string | null;
  addOns: ProposalAddOn[];

  recHeadline: string | null;
  recBody: string | null;
  technicalNote: string | null;

  termsTitle: string | null;
  terms: ProposalTerm[];
  closing: string | null;
}

/** Una linea por renglon, sin las vacias. Es como se captura una lista en una textarea. */
function lines(value?: string | null): string[] {
  return (value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Los parrafos van separados por linea en blanco, que es como se escribe prosa. */
function paragraphs(value?: string | null): string[] {
  return (value ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function toPrice(row: {
  priceKind: PriceKind;
  amountCents: number;
  amountMaxCents?: number | null;
  unit: PriceUnit;
}): ProposalPrice {
  return {
    kind: row.priceKind,
    amountCents: row.amountCents,
    amountMaxCents: row.amountMaxCents ?? null,
    unit: row.unit,
  };
}

/**
 * La imagen, campo a campo y nunca entera.
 *
 * Un `Media` de Payload trae `filename`, `filesize`, `createdAt` y el resto del
 * documento; solo cuatro de esos campos pintan algo. Ancho y alto son obligatorios
 * porque sin ellos `next/image` no reserva el hueco y la pagina salta al cargar.
 */
function toImage(media?: (number | null) | Media): ProposalImage | null {
  if (!media || typeof media === 'number') return null;
  if (!media.url || !media.width || !media.height) return null;

  return { url: media.url, alt: media.alt ?? '', width: media.width, height: media.height };
}

/**
 * El total se CALCULA al leer, no se guarda. Un total almacenado puede acabar
 * contradiciendo a sus renglones —basta con editar uno y que falle el hook— y
 * entonces la cotizacion dice dos cosas a la vez.
 *
 * Con paquetes no hay total del documento: hay un precio por ruta. Nada que sumar.
 */
export function toView(doc: Proposal, now = new Date()): ProposalView {
  const items: ProposalItem[] = (doc.scopeItems ?? []).map((item) => ({
    concept: item.concept,
    detail: item.detail ?? '',
    amountCents: item.amountCents,
  }));

  const criteria: ProposalCriterion[] = (doc.criteria ?? [])
    .filter((c) => Boolean(c.key))
    .map((c) => ({ key: c.key as string, label: c.label }));

  return {
    client: doc.client,
    status: doc.status as ProposalStatus,
    currency: doc.currency as 'MXN' | 'USD',
    validUntil: doc.validUntil ?? null,
    expired: Boolean(doc.validUntil && new Date(doc.validUntil) < now),

    items,
    totalCents: items.reduce((sum, item) => sum + item.amountCents, 0),

    serviceTitle: doc.serviceTitle ?? null,
    tagline: lines(doc.tagline),
    cover: toImage(doc.coverImage),
    headline: doc.headline ?? null,
    context: doc.context ?? null,
    // La clave la acuna el hook al guardar, asi que un hallazgo sin ella solo puede
    // venir de una fila escrita antes de S9a. Se descarta en vez de renderizarse con
    // clave vacia: a partir de S9b esa clave es lo que ata el entregable a su hallazgo.
    findings: (doc.findings ?? [])
      .filter((f) => Boolean(f.key))
      .map((f) => ({ key: f.key as string, area: f.area, title: f.title, cost: f.cost })),
    figures: (doc.figures ?? []).map((f) => ({
      value: f.value,
      label: f.label,
      source: f.source,
    })),

    baseTitle: doc.baseTitle ?? null,
    deliverables: (doc.deliverables ?? []).map((d) => ({
      name: d.name,
      description: d.description,
    })),
    includedInAll: lines(doc.includedInAll),

    routesEyebrow: doc.routesEyebrow ?? null,
    criteria,
    packages: (doc.packages ?? []).map((p) => ({
      key: p.key ?? '',
      name: p.name,
      accent: p.accent,
      price: toPrice(p),
      deliveryWeeks: p.deliveryWeeks ?? null,
      body: paragraphs(p.body),
      // Se recorren los CRITERIOS y no los valores guardados: asi el orden de las
      // celdas es siempre el de la matriz, y un valor huerfano de un criterio ya
      // borrado no se cuela en una columna.
      values: criteria.map((c) => ({
        key: c.key,
        value: (p.values ?? []).find((v) => v.key === c.key)?.value ?? '',
      })),
      // Por CLAVE y no por nombre. El nombre se traduce y la clave no: comparando
      // nombres, la insignia se apagaba en ingles sin dar error ni dejar hueco.
      recommended: Boolean(doc.recommendedPackage && doc.recommendedPackage === p.key),
    })),

    addOnsTitle: doc.addOnsTitle ?? null,
    addOnsIntro: doc.addOnsIntro ?? null,
    addOns: (doc.addOns ?? []).map((a) => ({
      name: a.name,
      description: a.description,
      price: toPrice(a),
    })),

    recHeadline: doc.recHeadline ?? null,
    recBody: doc.recBody ?? null,
    technicalNote: doc.technicalNote ?? null,

    termsTitle: doc.termsTitle ?? null,
    terms: (doc.terms ?? []).map((t) => ({ label: t.label, value: t.value })),
    closing: doc.closing ?? null,
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
 * `depth: 1` y no 0: la portada es una relacion a `media` y sin poblarla no hay
 * imagen que pintar. Un nivel y no mas — `media` es contenido publico y `toImage`
 * se queda con cuatro campos de el, asi que nada de otra coleccion viaja por
 * accidente.
 *
 * `locale` es OBLIGATORIO y no tiene valor por defecto. Ponerle uno seria repetir
 * el fallo que arreglo: la propuesta se escribe en dos idiomas, y una lectura que
 * no dice cual quiere recibe el de por defecto — con `fallback` encendido, sin
 * error y sin hueco. El sintoma era una pagina en ingles con el texto en espanol.
 * Exigirlo en la firma hace que el compilador pregunte por el idioma en cada
 * llamada nueva, que es donde se decide.
 */
export async function getProposalByToken(
  token: string,
  locale: Locale,
): Promise<ProposalView | null> {
  // Frontera de confianza: se comprueba el TIPO y no solo la verdad. Hoy el
  // segmento `[token]` de Next siempre da un string —seria `[...token]` quien
  // diera un array— pero esta funcion esta exportada y no puede depender de que
  // quien la llame sea de fiar. Un token vacio, ademas, casaria con `equals`
  // contra los documentos sin token.
  if (typeof token !== 'string' || !token) return null;

  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'proposals',
    locale,
    where: { accessToken: { equals: token } },
    depth: 1,
    limit: 1,
  });

  const doc = docs[0];
  return doc ? toView(doc) : null;
}
