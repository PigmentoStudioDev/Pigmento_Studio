import type { ContactFormFields, ContactTopic } from "@/design-system/components/molecules/ContactForm/ContactForm";
import type { FaqProps } from "@/design-system/components/organisms/Faq/Faq";
import type { ProcessProps } from "@/design-system/components/organisms/Process/Process";
import type { ServiceStatementProps } from "@/design-system/components/organisms/ServiceStatement/ServiceStatement";

/**
 * El contenido de las cuatro paginas de servicio, una por disciplina.
 *
 * Desde la ronda 2 de Pigmento (2026-11-23) el copy es del cliente y llega por
 * secciones con listas largas —seis servicios de branding con diez entradas cada uno,
 * diecisiete preguntas de marketing—, asi que vive en el diccionario como ARRAYS y se
 * lee con `t.raw`. Enumerar cada clave en TS, como antes, era mantener dos veces una
 * lista que el cliente va a seguir cambiando. Lo que se pierde, que una clave que
 * falte salga como texto crudo, lo cubre el test de diccionarios: compara la forma de
 * cada pagina entre es y en.
 *
 * Cada seccion es opcional salvo hero, proceso, preguntas y llamada: motion no trae
 * filosofia, solo marketing trae forma de trabajar y cierre, solo web trae tecnologia.
 */
export const SERVICE_KEYS = ["branding", "motion", "marketing", "web"] as const;
export type ServiceKey = (typeof SERVICE_KEYS)[number];

export const SERVICE_PATHS: Record<ServiceKey, string> = {
  branding: "/servicios/branding",
  motion: "/servicios/motion",
  marketing: "/servicios/marketing",
  web: "/servicios/web-development",
};

interface Section {
  label?: string;
  title?: string;
  paragraphs?: string[];
}

export interface ServicePageContent {
  title: string;
  description: string;
  hero: { eyebrow?: string; title: string };
  intro?: { paragraphs: string[]; cta: string; ctaTarget?: string };
  offer?: Section & {
    listLabel?: string;
    items: { name: string; title?: string; paragraphs: string[]; services?: string[] }[];
    closing?: { title: string; text: string; cta: string };
  };
  philosophy?: Section & { tagline?: string };
  process: Section & {
    resultLabel?: string;
    phases: { name: string; title?: string; paragraphs: string[]; result?: string }[];
    note?: string;
  };
  ways?: Section & { items: { title: string; text: string }[] };
  tech?: Section;
  featured?: Section;
  faq: Section & { items: { question: string; answer: string }[] };
  cta: {
    label?: string;
    title: string;
    titleHighlight?: string;
    paragraphs?: string[];
    topic?: string;
    topics?: string[];
    company?: string;
    website?: string;
    goal?: { label: string; options: string[] };
    hidePhone?: boolean;
    name?: string;
    message?: string;
    submit?: string;
  };
  closing?: Section & { tagline?: string };
}

/** Las anclas de la pagina: la entrada lleva a la oferta y las llamadas al formulario. */
export const SERVICE_ANCHORS = { offer: "servicios", contact: "contacto" } as const;

const joinParagraphs = (paragraphs: string[] = []) => paragraphs.join("\n\n");

export function getServiceContent(raw: (key: string) => unknown, key: ServiceKey): ServicePageContent {
  return raw(key) as ServicePageContent;
}

export function getServiceIntro(content: ServicePageContent): ServiceStatementProps | null {
  if (!content.intro) return null;
  const target = content.intro.ctaTarget ?? SERVICE_ANCHORS.offer;
  return {
    text: joinParagraphs(content.intro.paragraphs),
    cta: { label: content.intro.cta, href: `#${target}` },
  };
}

/** La oferta usa el acordeon de las preguntas: cada servicio abre y deja ver lo que incluye. */
export function getServiceOffer(content: ServicePageContent, fallbackTitle: string): FaqProps | null {
  const offer = content.offer;
  if (!offer) return null;
  return {
    title: offer.title ?? fallbackTitle,
    label: offer.label ?? "",
    intro: joinParagraphs(offer.paragraphs),
    items: offer.items.map((item, index) => ({
      question: `${String(index + 1).padStart(2, "0")} / ${item.name}`,
      lead: item.title,
      answer: joinParagraphs(item.paragraphs),
      ...(item.services ? { list: item.services, listLabel: offer.listLabel } : {}),
    })),
  };
}

export function getServiceStatement(
  section: (Section & { tagline?: string; items?: { title: string; text: string }[] }) | undefined,
): ServiceStatementProps | null {
  if (!section?.title) return null;
  return {
    title: section.title,
    label: section.label,
    text: joinParagraphs(section.paragraphs),
    tagline: section.tagline,
    items: section.items,
  };
}

export function getServiceProcess(content: ServicePageContent): ProcessProps {
  const process = content.process;
  return {
    title: process.title ?? "",
    label: process.label ?? "",
    intro: joinParagraphs(process.paragraphs),
    deliverableLabel: process.resultLabel ?? "",
    note: process.note,
    phases: process.phases.map((phase) => ({
      title: phase.name,
      lead: phase.title,
      text: joinParagraphs(phase.paragraphs),
      deliverable: phase.result,
    })),
  };
}

export function getServiceFaq(content: ServicePageContent): FaqProps {
  const faq = content.faq;
  return {
    title: faq.title ?? "",
    label: faq.label ?? "",
    intro: joinParagraphs(faq.paragraphs),
    items: faq.items,
  };
}

// Identificadores estables entre idiomas: la etiqueta cambia con el idioma y el
// servidor tiene que recibir lo mismo venga de /es o de /en.
const optionId = (prefix: string, index: number) => `${prefix}-${index + 1}`;

export function getServiceForm(
  content: ServicePageContent,
  key: ServiceKey,
): { topics: ContactTopic[]; fields: ContactFormFields } | null {
  const cta = content.cta;
  if (!cta.topics) return null;
  return {
    topics: cta.topics.map((label, index) => ({ value: optionId(key, index), label })),
    fields: {
      ...(cta.hidePhone ? { phone: false } : {}),
      ...(cta.company ? { company: cta.company } : {}),
      ...(cta.website ? { website: cta.website } : {}),
      ...(cta.goal
        ? {
            goal: {
              label: cta.goal.label,
              options: cta.goal.options.map((label, index) => ({ value: optionId("objetivo", index), label })),
            },
          }
        : {}),
    },
  };
}
