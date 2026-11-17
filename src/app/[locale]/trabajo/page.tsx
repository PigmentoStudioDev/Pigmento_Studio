import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getWorkProjects } from "@/cms/projects";
import { alternatesFor } from "@/app/seo";
import { Section } from "@/design-system/components/layout/Section/Section";
import { ProjectGrid, type ProjectGridItem } from "@/design-system/components/organisms/ProjectGrid/ProjectGrid";
import { buildWorkGridRows } from "@/app/work-grid";
import { routing } from "@/i18n/routing";

/**
 * Trabajo: el portafolio publicado en filas de tres columnas (ritmo de la referencia). Indexable: es contenido
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

  const items: ProjectGridItem[] = projects.map((project) => ({
    slug: project.slug,
    title: project.title,
    image: project.image,
  }));

  return (
    // Sin pie (decision de Karen, 2026-10-26): el indice del trabajo acaba en el
    // trabajo. El pie vive en el layout, asi que la pagina solo lo pide por atributo.
    <main id="main" data-footer="off">
      <Section width="full" spacing="none" surface="solid" theme={{ light: "dark", dark: "dark" }} labelledBy={TITLE_ID}>
        <ProjectGrid
          rows={buildWorkGridRows(items)}
          title={t("trabajo")}
          titleId={TITLE_ID}
          labels={{ viewCase: tWork("viewCase") }}
        />
      </Section>
    </main>
  );
}
