import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Section } from "@/design-system/components/layout/Section/Section";
import { LegalDocument } from "@/design-system/components/organisms/LegalDocument/LegalDocument";
import { getLegalBySlug, getLegalSlugs } from "@/cms/legal";
import { routing } from "@/i18n/routing";

/**
 * Un texto legal: aviso de privacidad, terminos, cookies.
 *
 * Al reves que la cotizacion, que es privada por token, esta pagina EXISTE para
 * ser encontrada: se indexa y se prerenderiza. Un aviso de privacidad al que solo
 * se llega con sesion no cumple su funcion.
 *
 * `dynamicParams = false` es la decision de fondo. Con los slugs prerenderizados
 * y esta linea, cualquier direccion inventada es un 404 estatico servido por la
 * CDN: no llega a la funcion, no toca la base de datos y no hay superficie que
 * sondear con un diccionario de slugs. El precio es que un legal nuevo necesita
 * un despliegue para aparecer, que para un texto que se aprueba a mano es el
 * ritmo correcto.
 */
export const dynamicParams = false;

/** La vigencia se escribe en el idioma de la pagina, no en ISO: la lee una persona. */
const FECHA: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

/**
 * Los dos idiomas por cada documento publicado. El slug NO se localiza —una
 * direccion es una direccion— asi que la lista de slugs es una sola.
 */
export async function generateStaticParams() {
  const slugs = await getLegalSlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/legales/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const doc = await getLegalBySlug(slug, locale);
  if (!doc) return {};

  return {
    title: doc.title,
    // El primer parrafo del intro, que es lo que el documento dice de si mismo.
    // Sin intro no se inventa una: mejor sin descripcion que con una generica.
    description: doc.intro[0],
  };
}

export default async function LegalPage({ params }: PageProps<"/[locale]/legales/[slug]">) {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const doc = await getLegalBySlug(slug, locale);

  // El adaptador consulta con `overrideAccess: false`, asi que un borrador no
  // llega hasta aqui: sale por este 404, igual que un slug que no existe.
  if (!doc) notFound();

  const t = await getTranslations("legal");

  const effectiveDateLabel = doc.effectiveDate
    ? t("effectiveSince", {
        date: new Intl.DateTimeFormat(`${locale}-MX`, FECHA).format(new Date(doc.effectiveDate)),
      })
    : null;

  return (
    <Section width="wide" labelledBy="legal">
      <LegalDocument
        titleId="legal"
        title={doc.title}
        effectiveDateLabel={effectiveDateLabel}
        intro={doc.intro}
        tocTitle={doc.tocTitle}
        tocLabel={t("tocLabel")}
        sections={doc.sections}
      />
    </Section>
  );
}
