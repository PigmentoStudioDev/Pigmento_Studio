import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getWorkProjects } from "@/cms/projects";
import { alternatesFor } from "@/app/seo";
import { Section } from "@/design-system/components/layout/Section/Section";
import { DomeGrid, type DomeGridItem } from "@/design-system/components/organisms/DomeGrid/DomeGrid";
import { routing } from "@/i18n/routing";

/**
 * Trabajo: el portafolio publicado en una cupula arrastrable. Indexable: es contenido
 * real, no una pagina de cortesia.
 *
 * El titulo es el de la barra de navegacion, para que la pagina se nombre igual que el
 * enlace que la lleva.
 */
const TITLE_ID = "trabajo-titulo";

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

  const [t, tWork, projects] = await Promise.all([
    getTranslations("nav.estudio"),
    getTranslations("home.work"),
    getWorkProjects(locale),
  ]);

  // La disciplina llega como clave del CMS; el año y la disciplina forman la linea de
  // la tarjeta, y una tarjeta sin ninguno de los dos no lleva linea.
  const items: DomeGridItem[] = projects.map((project) => {
    const meta = [project.discipline ? tWork(`disciplines.${project.discipline}`) : null, project.year ? String(project.year) : null]
      .filter(Boolean)
      .join(", ");

    return {
      slug: project.slug,
      title: project.title,
      ...(meta ? { meta } : {}),
      image: project.image,
    };
  });

  return (
    <main id="main">
      <Section width="full" spacing="none" surface="solid" theme={{ light: "dark", dark: "dark" }} labelledBy={TITLE_ID}>
        <DomeGrid
          items={items}
          title={t("trabajo")}
          titleId={TITLE_ID}
          labels={{ stage: tWork("stage"), drag: tWork("drag") }}
        />
      </Section>
    </main>
  );
}
