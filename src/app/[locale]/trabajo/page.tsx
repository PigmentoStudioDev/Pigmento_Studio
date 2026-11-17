import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getWorkProjects } from "@/cms/projects";
import { alternatesFor } from "@/app/seo";
import { Section } from "@/design-system/components/layout/Section/Section";
import { WorkIndex, type WorkIndexItem } from "@/design-system/components/organisms/WorkIndex/WorkIndex";
import { FinalCta } from "@/design-system/components/organisms/FinalCta/FinalCta";
import { routing } from "@/i18n/routing";
import { sendContact } from "../../contact-action";
import { getFinalCta } from "../../cta";

/**
 * Trabajo: el portafolio publicado en filas de tres columnas (ritmo de la referencia). Indexable: es contenido
 * real, no una pagina de cortesia.
 *
 * El titulo es el de la barra de navegacion, para que la pagina se nombre igual que el
 * enlace que la lleva.
 */
const TITLE_ID = "trabajo-titulo";
const CTA_TITLE_ID = "contacto";

export async function generateMetadata({ params }: PageProps<"/[locale]/trabajo">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "nav.estudio" });

  return { title: t("trabajo"), alternates: alternatesFor("/trabajo", locale) };
}

export default async function Trabajo({ params }: PageProps<"/[locale]/trabajo">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, tWork, tCta, projects] = await Promise.all([
    getTranslations("nav.estudio"),
    getTranslations("home.work"),
    getTranslations("home.cta"),
    getWorkProjects(locale),
  ]);

  const items: WorkIndexItem[] = projects.map((project) => ({
    slug: project.slug,
    title: project.title,
    image: project.image,
    ...(project.gallery ? { gallery: project.gallery } : {}),
  }));

  return (
    <main id="main">
      <Section width="full" spacing="none" surface="solid" labelledBy={TITLE_ID}>
        <WorkIndex
          items={items}
          title={t("trabajo")}
          titleId={TITLE_ID}
          labels={{
            viewCase: tWork("viewCase"),
            viewGrid: tWork("viewGrid"),
            viewList: tWork("viewList"),
            viewSwitch: tWork("viewSwitch"),
          }}
        />
      </Section>

      {/* La misma strip negra en los dos modos que la de la home (decision de Karen,
          2026-10-26); la placa de dentro no se toca. */}
      <Section width="strip" spacing="loose" theme={{ light: "dark", dark: "dark" }} labelledBy={CTA_TITLE_ID}>
        <FinalCta {...getFinalCta(tCta, locale)} titleId={CTA_TITLE_ID} highlightFamily="tangerine" onSubmit={sendContact} />
      </Section>
    </main>
  );
}
