import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getSiteImage } from "@/cms/media";
import { getTeamMembers } from "@/cms/team";
import { Section } from "@/design-system/components/layout/Section/Section";
import { Figures } from "@/design-system/components/organisms/Figures/Figures";
import { HeroVideo } from "@/design-system/components/organisms/HeroVideo/HeroVideo";
import { Team } from "@/design-system/components/organisms/Team/Team";
import { routing } from "@/i18n/routing";
import { BAND_IMAGE_FILENAME } from "@/app/band";
import { getFigures } from "@/app/figures";
import { PLACEHOLDER_VIDEO } from "@/app/service-page";
import { alternatesFor } from "@/app/seo";
import { getTeam } from "@/app/team";

const TEAM_TITLE_ID = "equipo";

/**
 * Sin indexar mientras las cifras sean placeholder (ver `figures.ts`): una cifra
 * inventada en los resultados del estudio es una afirmacion, no relleno.
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

/**
 * Nosotros: el equipo y las cifras, que salieron de la home en la reunion con Pigmento
 * (2026-10-22) porque hablan del estudio y no de lo que se contrata. Abre con el mismo
 * hero que las paginas de servicio para que el sitio tenga una sola forma de entrar.
 */
export default async function Nosotros({ params }: PageProps<"/[locale]/nosotros">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, tFigures, tTeam, poster, members] = await Promise.all([
    getTranslations("about"),
    getTranslations("home.figures"),
    getTranslations("home.team"),
    getSiteImage(BAND_IMAGE_FILENAME, locale),
    getTeamMembers(locale),
  ]);
  const team = getTeam(tTeam, members);

  return (
    <main id="main">
      {poster ? (
        <Section width="full" spacing="none" theme={{ light: "dark", dark: "dark" }}>
          <HeroVideo title={t("title")} videoSrc={PLACEHOLDER_VIDEO} videoPoster={poster.src} />
        </Section>
      ) : null}

      <Section width="wide" spacing="loose">
        <Figures {...getFigures(tFigures)} />
      </Section>

      {team ? (
        <Section width="strip" spacing="default" spacingEnd="loose" labelledBy={TEAM_TITLE_ID}>
          <Team {...team} titleId={TEAM_TITLE_ID} highlightFamily="lime" />
        </Section>
      ) : null}
    </main>
  );
}
