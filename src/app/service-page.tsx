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
import { ServiceStatement } from "@/design-system/components/organisms/ServiceStatement/ServiceStatement";
import { routing } from "@/i18n/routing";
import { BAND_IMAGE_FILENAME } from "./band";
import { sendContact } from "./contact-action";
import { getFinalCta } from "./cta";
import { SERVICE_FAMILY } from "./pigment";
import { faqJsonLd } from "./faq";
import { FEATURED_CASE_PIECES, FEATURED_CASES_MAX, getFeaturedCases } from "./featuredCases";
import { alternatesFor } from "./seo";
import {
  getServiceContent,
  getServiceFaq,
  getServiceForm,
  getServiceIntro,
  getServiceOffer,
  getServiceProcess,
  getServiceStatement,
  SERVICE_ANCHORS,
  SERVICE_PATHS,
  type ServiceKey,
} from "./service-pages";

/**
 * TODO(contenido): placeholder CC0 de MDN enlazado desde su servidor, y el poster es la
 * foto de la banda. Lo usan branding, marketing y web hasta que Pigmento mande su video
 * (el cliente pidio cambiar "el de la flor" sin decir por cual).
 */
export const PLACEHOLDER_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

/**
 * El reel de motion (ronda 2): el MASTER sin audio a 720p y CRF 27, 5.7 MB para 68 s.
 * Va en public/ y no en el CMS porque es el fondo de la pagina, no un asset que el
 * cliente gestione pieza a pieza.
 */
const SERVICE_VIDEO: Partial<Record<ServiceKey, { src: string; poster: string }>> = {
  motion: { src: "/videos/motion-hero.mp4", poster: "/videos/motion-poster.jpg" },
};

const PROCESS_TITLE_ID = "proceso";
const PHILOSOPHY_TITLE_ID = "filosofia";
const WAYS_TITLE_ID = "forma-de-trabajar";
const TECH_TITLE_ID = "tecnologia";
const CASE_TITLE_ID = "casos";
const FAQ_TITLE_ID = "faq";
const CLOSING_TITLE_ID = "cierre";
const OFFER_TITLE_ID = SERVICE_ANCHORS.offer;
const CTA_TITLE_ID = SERVICE_ANCHORS.contact;

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
 * El orden de las secciones es el del cliente (ronda 2 de Pigmento, 2026-11-23): video,
 * entrada, lo que hacemos, filosofia, proceso, forma de trabajar, proyectos, preguntas,
 * contacto y cierre. Cada pagina trae solo las que escribio; la que falta no se pinta.
 */
export async function ServicePage({ locale, service }: { locale: string; service: ServiceKey }) {
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, tCta, tFeaturedCase, tWork, bandImage, cases] = await Promise.all([
    getTranslations("servicePages"),
    getTranslations("home.cta"),
    getTranslations("home.featuredCase"),
    getTranslations("home.work"),
    getSiteImage(BAND_IMAGE_FILENAME, locale),
    readFeaturedCases(locale, FEATURED_CASE_PIECES, FEATURED_CASES_MAX, service),
  ]);

  const content = getServiceContent(t.raw, service);
  const family = SERVICE_FAMILY[service];
  const video = SERVICE_VIDEO[service] ?? (bandImage ? { src: PLACEHOLDER_VIDEO, poster: bandImage.src } : null);
  const intro = getServiceIntro(content);
  const offer = getServiceOffer(content, content.title);
  const philosophy = getServiceStatement(content.philosophy);
  const ways = getServiceStatement(content.ways);
  const tech = getServiceStatement(content.tech);
  const closing = getServiceStatement(content.closing);
  const featuredHeader = getServiceStatement(content.featured);
  const faq = getServiceFaq(content);
  const form = getServiceForm(content, service);
  const baseCta = getFinalCta(tCta, locale);
  const cta = content.cta;

  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd(faq.items) }} />

      {/* Oscura en los dos modos: el titular va sobre video, y el video no re-tematiza.
          Sin poster no hay hero, porque es lo que ve reduced-motion. */}
      {video ? (
        <Section width="full" spacing="none" theme={{ light: "dark", dark: "dark" }}>
          <HeroVideo
            title={content.hero.title}
            eyebrow={content.hero.eyebrow}
            videoSrc={video.src}
            videoPoster={video.poster}
          />
        </Section>
      ) : null}

      {intro ? (
        <Section width="strip" spacing="loose">
          <ServiceStatement {...intro} />
        </Section>
      ) : null}

      {offer ? (
        <Section width="strip" spacing="loose" labelledBy={OFFER_TITLE_ID}>
          <Faq {...offer} multiple titleId={OFFER_TITLE_ID} highlightFamily={family} />
        </Section>
      ) : null}

      {content.offer?.closing ? (
        <Section width="strip" spacing="default">
          <ServiceStatement
            title={content.offer.closing.title}
            text={content.offer.closing.text}
            cta={{ label: content.offer.closing.cta, href: `#${CTA_TITLE_ID}` }}
          />
        </Section>
      ) : null}

      {philosophy ? (
        <Section width="strip" spacing="loose" labelledBy={PHILOSOPHY_TITLE_ID}>
          <ServiceStatement {...philosophy} titleId={PHILOSOPHY_TITLE_ID} highlightFamily={family} />
        </Section>
      ) : null}

      <Section width="strip" spacing="loose" labelledBy={PROCESS_TITLE_ID}>
        <Process {...getServiceProcess(content)} titleId={PROCESS_TITLE_ID} highlightFamily={family} />
      </Section>

      {ways ? (
        <Section width="strip" spacing="loose" labelledBy={WAYS_TITLE_ID}>
          <ServiceStatement {...ways} titleId={WAYS_TITLE_ID} highlightFamily={family} />
        </Section>
      ) : null}

      {tech ? (
        <Section width="strip" spacing="loose" labelledBy={TECH_TITLE_ID}>
          <ServiceStatement {...tech} titleId={TECH_TITLE_ID} highlightFamily={family} />
        </Section>
      ) : null}

      {/* Solo los casos de esta disciplina marcados como destacados en el CMS. Sin
          ninguno, el bloque no se pinta: un carrusel vacio dice justo lo contrario de
          lo que tendria que demostrar. */}
      {cases.length > 0 ? (
        <Section width="strip" spacing="default" labelledBy={CASE_TITLE_ID}>
          {featuredHeader ? <ServiceStatement {...featuredHeader} highlightFamily={family} /> : null}
          <FeaturedCases
            {...getFeaturedCases(tFeaturedCase, tWork, cases)}
            {...(content.featured?.label && !featuredHeader ? { label: content.featured.label } : {})}
            titleId={CASE_TITLE_ID}
          />
        </Section>
      ) : null}

      <Section width="strip" spacing="loose" labelledBy={FAQ_TITLE_ID}>
        <Faq {...faq} titleId={FAQ_TITLE_ID} highlightFamily={family} />
      </Section>

      <Section width="strip" spacing="loose" labelledBy={CTA_TITLE_ID}>
        <FinalCta
          {...baseCta}
          label={cta.label ?? baseCta.label}
          intro={cta.paragraphs ? cta.paragraphs.join("\n\n") : baseCta.intro}
          title={cta.title}
          titleHighlight={cta.titleHighlight}
          form={{
            ...baseCta.form,
            ...(form ?? {}),
            copy: {
              ...baseCta.form.copy,
              ...(cta.topic ? { topic: cta.topic } : {}),
              ...(cta.name ? { name: cta.name } : {}),
              ...(cta.message ? { message: cta.message } : {}),
              ...(cta.submit ? { submit: cta.submit } : {}),
            },
          }}
          titleId={CTA_TITLE_ID}
          family={family}
          onSubmit={sendContact}
        />
      </Section>

      {closing ? (
        <Section width="strip" spacing="loose" labelledBy={CLOSING_TITLE_ID}>
          <ServiceStatement {...closing} titleId={CLOSING_TITLE_ID} highlightFamily={family} />
        </Section>
      ) : null}
    </main>
  );
}
