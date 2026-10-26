import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getFeaturedCases as readFeaturedCases } from "@/cms/projects";
import { getSiteImage } from "@/cms/media";
import { Section } from "@/design-system/components/layout/Section/Section";
import { Faq } from "@/design-system/components/organisms/Faq/Faq";
import { FeaturedCases } from "@/design-system/components/organisms/FeaturedCases/FeaturedCases";
import { FinalCta } from "@/design-system/components/organisms/FinalCta/FinalCta";
import { HeroVideo } from "@/design-system/components/organisms/HeroVideo/HeroVideo";
import { Process } from "@/design-system/components/organisms/Process/Process";
import { routing } from "@/i18n/routing";
import { BAND_IMAGE_FILENAME } from "./band";
import { sendContact } from "./contact-action";
import { getFinalCta } from "./cta";
import { faqJsonLd } from "./faq";
import { FEATURED_CASE_PIECES, FEATURED_CASES_MAX, getFeaturedCases } from "./featuredCases";
import { alternatesFor } from "./seo";
import { getServiceFaq, getServiceProcess, type ServiceKey } from "./service-pages";

/**
 * TODO(contenido): placeholder CC0 de MDN enlazado desde su servidor, y el poster es la
 * foto de la banda, que tampoco es del estudio (ver `band.ts`). Antes de publicar: un
 * video por servicio subido a media (mp4, maximo 15 MB) con su poster.
 */
export const PLACEHOLDER_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const PROCESS_TITLE_ID = "proceso";
const CASE_TITLE_ID = "casos";
const FAQ_TITLE_ID = "faq";
const CTA_TITLE_ID = "contacto";

/** Las rutas de las cuatro paginas, que no siempre coinciden con la clave (web-development). */
const SERVICE_PATHS: Record<ServiceKey, string> = {
  branding: "/servicios/branding",
  motion: "/servicios/motion",
  marketing: "/servicios/marketing",
  web: "/servicios/web-development",
};

/**
 * Sin indexar mientras el copy sea borrador: cuatro paginas con texto sin aprobar en los
 * resultados del estudio son peor que ninguna. Se quita cuando Karen apruebe el copy.
 */
export async function serviceMetadata({ locale }: { locale: string }, key: ServiceKey): Promise<Metadata> {
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: `servicePages.${key}` });

  return {
    title: t("title"),
    description: t("description"),
    alternates: alternatesFor(SERVICE_PATHS[key], locale),
    robots: { index: false, follow: true },
  };
}

/**
 * Las cuatro paginas de servicio, compuestas en un solo sitio para que no se separen: el
 * orden de los bloques es el mismo en las cuatro y lo que cambia es el diccionario.
 */
export async function ServicePage({ locale, service }: { locale: string; service: ServiceKey }) {
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, tCta, tFeaturedCase, tWork, poster, cases] = await Promise.all([
    getTranslations("servicePages"),
    getTranslations("home.cta"),
    getTranslations("home.featuredCase"),
    getTranslations("home.work"),
    getSiteImage(BAND_IMAGE_FILENAME, locale),
    readFeaturedCases(locale, FEATURED_CASE_PIECES, FEATURED_CASES_MAX, service),
  ]);

  const faq = getServiceFaq(t, service);

  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd(faq.items) }} />

      {/* Oscura en los dos modos: el titular va sobre video, y el video no re-tematiza.
          Sin poster no hay hero, porque es lo que ve reduced-motion. */}
      {poster ? (
        <Section width="full" spacing="none" theme={{ light: "dark", dark: "dark" }}>
          <HeroVideo title={t(`${service}.title`)} videoSrc={PLACEHOLDER_VIDEO} videoPoster={poster.src} />
        </Section>
      ) : null}

      <Section width="strip" spacing="loose" labelledBy={PROCESS_TITLE_ID}>
        <Process {...getServiceProcess(t, service)} titleId={PROCESS_TITLE_ID} highlightFamily="cyan" />
      </Section>

      {/* Solo los casos de esta disciplina. Sin ninguno, el bloque no se pinta: un
          carrusel vacio dice justo lo contrario de lo que tendria que demostrar. */}
      {cases.length > 0 ? (
        <Section width="strip" spacing="default" labelledBy={CASE_TITLE_ID}>
          <FeaturedCases {...getFeaturedCases(tFeaturedCase, tWork, cases)} titleId={CASE_TITLE_ID} />
        </Section>
      ) : null}

      <Section width="strip" spacing="loose" labelledBy={FAQ_TITLE_ID}>
        <Faq {...faq} titleId={FAQ_TITLE_ID} highlightFamily="periwinkle" />
      </Section>

      <Section width="strip" spacing="loose" labelledBy={CTA_TITLE_ID}>
        <FinalCta
          {...getFinalCta(tCta, locale)}
          title={t(`${service}.cta.title`)}
          titleHighlight={t(`${service}.cta.titleHighlight`)}
          titleId={CTA_TITLE_ID}
          onSubmit={sendContact}
        />
      </Section>
    </main>
  );
}
