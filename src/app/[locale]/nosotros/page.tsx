import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getTeamMembers } from "@/cms/team";
import { AboutSection } from "@/design-system/components/layout/AboutSection/AboutSection";
import { Section } from "@/design-system/components/layout/Section/Section";
import { AboutIntro } from "@/design-system/components/organisms/AboutIntro/AboutIntro";
import { AboutNumbers } from "@/design-system/components/organisms/AboutNumbers/AboutNumbers";
import { Difference } from "@/design-system/components/organisms/Difference/Difference";
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
import { getDifference } from "@/app/difference";
import { getFaq } from "@/app/faq";
import { getFigures } from "@/app/figures";
import { getProcess } from "@/app/process";
import { alternatesFor } from "@/app/seo";
import { getTeam } from "@/app/team";
import { getTestimonials } from "@/app/testimonials";

const INTRO_TITLE_ID = "nosotros-titulo";
const PROCESS_TITLE_ID = "proceso";
const DIFFERENCE_TITLE_ID = "diferencia";
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
 * Orden: apertura, como trabajamos (proceso), por que un estudio (diferencia), servicios,
 * numeros, marcas y testimonios, equipo, preguntas y contacto.
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

  const [t, tValues, tServices, tFigures, tTeam, tProcess, tDifference, tTestimonials, tFaq, tCta, members] =
    await Promise.all([
      getTranslations("about"),
      getTranslations("home.values"),
      getTranslations("home.services"),
      getTranslations("home.figures"),
      getTranslations("home.team"),
      getTranslations("home.process"),
      getTranslations("home.difference"),
      getTranslations("home.testimonials"),
      getTranslations("home.faq"),
      getTranslations("home.cta"),
      getTeamMembers(locale),
    ]);
  const team = getTeam(tTeam, members);
  const testimonials = getTestimonials(tTestimonials);

  return (
    <main id="main">
      <Section width="strip" spacing="none" labelledBy={INTRO_TITLE_ID}>
        <AboutIntro
          title={t("title")}
          subtitle={t("subtitle")}
          // TODO(historia): el primer parrafo debe contar por que existe el estudio y quien lo fundo;
          // ambos textos son del sitio reusados mientras llega el copy.
          paragraphs={[tTeam("intro"), tValues("intro")]}
          titleId={INTRO_TITLE_ID}
        />
      </Section>

      <Section width="strip" spacing="loose" labelledBy={PROCESS_TITLE_ID}>
        <Process {...getProcess(tProcess)} titleId={PROCESS_TITLE_ID} quietHeader />
      </Section>

      <Section width="strip" spacing="loose" labelledBy={DIFFERENCE_TITLE_ID}>
        <Difference {...getDifference(tDifference)} titleId={DIFFERENCE_TITLE_ID} quietHeader />
      </Section>

      <Section width="strip" spacing="none">
        <AboutSection label={t("sections.services")} labelId={SERVICES_ID}>
          <ServicesList items={getServicesList(tServices)} />
        </AboutSection>

        <AboutSection label={t("sections.numbers")} labelId={NUMBERS_ID}>
          <AboutNumbers figures={getFigures(tFigures).figures} />
        </AboutSection>
      </Section>

      {testimonials.testimonials.length > 0 ? (
        <Section width="full" spacing="loose" spacingStart="none">
          <Testimonials {...testimonials} />
        </Section>
      ) : null}

      {team ? (
        <Section width="strip" spacing="default" spacingEnd="loose" labelledBy={TEAM_TITLE_ID}>
          <Team {...team} titleId={TEAM_TITLE_ID} quietHeader />
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
