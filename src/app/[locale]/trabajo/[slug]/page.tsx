import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Section } from "@/design-system/components/layout/Section/Section";
import { ProjectDetail } from "@/design-system/components/organisms/ProjectDetail/ProjectDetail";
import { getProjectBySlug, getProjectSlugs } from "@/cms/projects";
import { routing } from "@/i18n/routing";
import { alternatesFor } from "@/app/seo";

/**
 * Un caso del portfolio en profundidad. Son contenido real del CMS, no borradores, asi
 * que se prerenderizan e indexan: un caso que el buscador no ve no sirve de prueba.
 *
 * `dynamicParams = false` igual que los legales: cualquier slug que no este publicado
 * en el build es un 404 estatico. Un proyecto nuevo aparece en el siguiente despliegue.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/trabajo/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const project = await getProjectBySlug(slug, locale);
  if (!project) return {};

  const { cover } = project;
  return {
    title: project.title,
    // Sin resumen no se inventa una descripcion: el buscador usa su propio extracto.
    ...(project.summary ? { description: project.summary } : {}),
    alternates: alternatesFor(`/trabajo/${slug}`, locale),
    openGraph: {
      images: [{ url: cover.src, width: cover.width, height: cover.height, alt: cover.alt }],
    },
  };
}

export default async function ProjectPage({ params }: PageProps<"/[locale]/trabajo/[slug]">) {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const project = await getProjectBySlug(slug, locale);
  // Un borrador no llega aqui (overrideAccess: false): sale por este 404, igual que un slug
  // que no existe.
  if (!project) notFound();

  const t = await getTranslations("project");
  // Las disciplinas ya estan traducidas para el strip de la home; no se duplican.
  const tWork = await getTranslations("home.work");

  return (
    <main id="main">
      <Section width="wide" labelledBy="proyecto">
        <ProjectDetail
          titleId="proyecto"
          title={project.title}
          client={project.client}
          disciplineLabel={project.discipline ? tWork(`disciplines.${project.discipline}`) : undefined}
          year={project.year}
          summary={project.summary}
          cover={project.cover}
          gallery={project.gallery}
          labels={{
            back: t("back"),
            client: t("client"),
            discipline: t("discipline"),
            year: t("year"),
            gallery: t("gallery"),
          }}
        />
      </Section>
    </main>
  );
}
