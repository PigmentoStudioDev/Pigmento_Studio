import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getTeamMembers } from "@/cms/team";
import { AboutSection } from "@/design-system/components/layout/AboutSection/AboutSection";
import { Section } from "@/design-system/components/layout/Section/Section";
import { AboutIntro } from "@/design-system/components/organisms/AboutIntro/AboutIntro";
import { AboutNumbers } from "@/design-system/components/organisms/AboutNumbers/AboutNumbers";
import { ImageBand } from "@/design-system/components/organisms/ImageBand/ImageBand";
import { Faq } from "@/design-system/components/organisms/Faq/Faq";
import { FinalCta } from "@/design-system/components/organisms/FinalCta/FinalCta";
import { Process } from "@/design-system/components/organisms/Process/Process";
import { ServicesList } from "@/design-system/components/organisms/ServicesList/ServicesList";
import { Team } from "@/design-system/components/organisms/Team/Team";
import { Testimonials } from "@/design-system/components/organisms/Testimonials/Testimonials";
import { routing } from "@/i18n/routing";
import { getServicesList } from "@/app/about";
import { sendContact } from "@/app/contact-action";
import { getFinalCta } from "@/app/cta";
import { BAND_IMAGE_FILENAME } from "@/app/band";
import { getSiteImage } from "@/cms/media";
import { getFaq } from "@/app/faq";
import { getFigures } from "@/app/figures";
import { getProcess } from "@/app/process";
import { alternatesFor } from "@/app/seo";
import { getTeam } from "@/app/team";
import { getTestimonials } from "@/app/testimonials";

const INTRO_TITLE_ID = "nosotros-titulo";
const PROCESS_TITLE_ID = "proceso";
const SERVICES_ID = "servicios";
const NUMBERS_ID = "numeros";
const TEAM_TITLE_ID = "equipo";
const FAQ_TITLE_ID = "faq";
const CTA_TITLE_ID = "contacto";

/**
 * Nosotros. Parte de la estructura de la pagina About de la referencia (byhuman.mx/about)
 * y la completa con lo que Pigmento ya tiene escrito: el proceso, la comparacion con una
 * agencia o un freelance, los testimonios y las preguntas frecuentes.
 *
 * Orden (ronda 2 de Pigmento, 2026-11-23): apertura, foto del equipo, numeros,
 * proceso, servicios, equipo, testimonios, preguntas y contacto. La comparacion con
 * agencia y freelance salio: el cliente no la incluyo en el orden nuevo.
 *
 * Sigue fuera de la referencia, a proposito: Press (no hay blog) y Clients (sin logos en el
 * CMS, y su titular gigante no es de esta pagina).
 */
export async function generateMetadata({ params }: PageProps<"/[locale]/nosotros">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: alternatesFor("/nosotros", locale),
    robots: { index: false, follow: true },
  };
}

export default async function Nosotros({ params }: PageProps<"/[locale]/nosotros">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, tServices, tFigures, tTeam, tProcess, tTestimonials, tFaq, tCta, members, bandImage] =
    await Promise.all([
      getTranslations("about"),
      getTranslations("home.services"),
      getTranslations("home.figures"),
      getTranslations("home.team"),
      getTranslations("home.process"),
      getTranslations("home.testimonials"),
      getTranslations("home.faq"),
      getTranslations("home.cta"),
      getTeamMembers(locale),
      getSiteImage(BAND_IMAGE_FILENAME, locale),
    ]);
  const team = getTeam(tTeam, members);
  const testimonials = getTestimonials(tTestimonials);

  return (
    <main id="main">
      <Section width="strip" spacing="none" labelledBy={INTRO_TITLE_ID}>
        <AboutIntro
          title={t("intro.title")}
          subtitle={t("intro.subtitle")}
          paragraphs={[t("intro.p1"), t("intro.p2"), t("intro.p3"), t("intro.p4")]}
          titleId={INTRO_TITLE_ID}
        />
      </Section>

      {/* La foto del equipo que estaba en la home. HACK: falta la de la oficina nueva,
          que el cliente pidio junto a esta; entra como segunda banda cuando llegue. */}
      {bandImage ? (
        <Section width="full" spacing="none">
          <ImageBand {...bandImage} alt={t("band.alt")} title={t("band.title")} />
        </Section>
      ) : null}

      <Section width="strip" spacing="none">
        <AboutSection label={t("sections.numbers")} labelId={NUMBERS_ID}>
          <AboutNumbers figures={getFigures(tFigures).figures} />
        </AboutSection>
      </Section>

      <Section width="strip" spacing="loose" labelledBy={PROCESS_TITLE_ID}>
        <Process {...getProcess(tProcess)} titleId={PROCESS_TITLE_ID} quietHeader />
      </Section>

      <Section width="strip" spacing="none">
        <AboutSection label={t("sections.services")} labelId={SERVICES_ID}>
          <ServicesList items={getServicesList(tServices)} />
        </AboutSection>
      </Section>

      {team ? (
        <Section width="strip" spacing="loose" labelledBy={TEAM_TITLE_ID}>
          <Team {...team} titleId={TEAM_TITLE_ID} quietHeader />
        </Section>
      ) : null}

      {testimonials.testimonials.length > 0 ? (
        <Section width="full" spacing="loose">
          <Testimonials {...testimonials} />
        </Section>
      ) : null}

      <Section width="strip" spacing="loose" labelledBy={FAQ_TITLE_ID}>
        <Faq {...getFaq(tFaq)} titleId={FAQ_TITLE_ID} quietHeader />
      </Section>

      <Section width="strip" spacing="loose" theme={{ light: "dark", dark: "dark" }} labelledBy={CTA_TITLE_ID}>
        <FinalCta {...getFinalCta(tCta, locale)} titleId={CTA_TITLE_ID} highlightFamily="tangerine" onSubmit={sendContact} />
      </Section>
    </main>
  );
}
