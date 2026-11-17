import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getWorkProjects } from "@/cms/projects";
import { getTeamMembers } from "@/cms/team";
import { AboutSection } from "@/design-system/components/layout/AboutSection/AboutSection";
import { Section } from "@/design-system/components/layout/Section/Section";
import { AboutApproach } from "@/design-system/components/organisms/AboutApproach/AboutApproach";
import { AboutIntro } from "@/design-system/components/organisms/AboutIntro/AboutIntro";
import { AboutNumbers } from "@/design-system/components/organisms/AboutNumbers/AboutNumbers";
import { FinalCta } from "@/design-system/components/organisms/FinalCta/FinalCta";
import { ServicesList } from "@/design-system/components/organisms/ServicesList/ServicesList";
import { Team } from "@/design-system/components/organisms/Team/Team";
import { routing } from "@/i18n/routing";
import { getApproach, getServicesList } from "@/app/about";
import { sendContact } from "@/app/contact-action";
import { getFinalCta } from "@/app/cta";
import { getFigures } from "@/app/figures";
import { alternatesFor } from "@/app/seo";
import { getTeam } from "@/app/team";

const INTRO_TITLE_ID = "nosotros-titulo";
const APPROACH_ID = "enfoque";
const SERVICES_ID = "servicios";
const NUMBERS_ID = "numeros";
const TEAM_TITLE_ID = "equipo";
const CTA_TITLE_ID = "contacto";

/**
 * Nosotros, con la estructura de la pagina About de la referencia (byhuman.mx/about):
 * apertura en dos tonos, enfoque, servicios en acordeon, numeros, equipo y contacto.
 *
 * Falta de la referencia, a proposito: Clients (el CMS no guarda logos) y Press (no hay
 * blog). Los parrafos de la apertura reusan textos del sitio y estan por reescribir.
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

  const [t, tValues, tServices, tFigures, tTeam, tCta, projects, members] = await Promise.all([
    getTranslations("about"),
    getTranslations("home.values"),
    getTranslations("home.services"),
    getTranslations("home.figures"),
    getTranslations("home.team"),
    getTranslations("home.cta"),
    getWorkProjects(locale),
    getTeamMembers(locale),
  ]);
  const team = getTeam(tTeam, members);

  return (
    <main id="main">
      <Section width="wide" spacing="none" labelledBy={INTRO_TITLE_ID}>
        <AboutIntro
          title={t("title")}
          subtitle={t("subtitle")}
          // TODO(copy): textos del sitio reusados; la pagina de la referencia lleva dos parrafos propios.
          paragraphs={[tTeam("intro"), tValues("intro")]}
          titleId={INTRO_TITLE_ID}
        />
      </Section>

      <Section width="wide" spacing="none">
        <AboutSection label={t("sections.approach")} labelId={APPROACH_ID}>
          <AboutApproach items={getApproach(tValues, projects)} />
        </AboutSection>

        <AboutSection label={t("sections.services")} labelId={SERVICES_ID}>
          <ServicesList items={getServicesList(tServices)} />
        </AboutSection>

        <AboutSection label={t("sections.numbers")} labelId={NUMBERS_ID}>
          <AboutNumbers figures={getFigures(tFigures).figures} />
        </AboutSection>
      </Section>

      {team ? (
        <Section width="strip" spacing="default" spacingEnd="loose" labelledBy={TEAM_TITLE_ID}>
          <Team {...team} titleId={TEAM_TITLE_ID} highlightFamily="lime" />
        </Section>
      ) : null}

      <Section width="strip" spacing="loose" theme={{ light: "dark", dark: "dark" }} labelledBy={CTA_TITLE_ID}>
        <FinalCta {...getFinalCta(tCta, locale)} titleId={CTA_TITLE_ID} highlightFamily="tangerine" onSubmit={sendContact} />
      </Section>
    </main>
  );
}
