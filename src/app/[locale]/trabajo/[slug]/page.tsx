import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Section } from "@/design-system/components/layout/Section/Section";
import { CaseGallery, CaseStrip } from "@/design-system/components/molecules/CaseMedia/CaseMedia";
import { Figures } from "@/design-system/components/organisms/Figures/Figures";
import { ProjectChapter } from "@/design-system/components/organisms/ProjectChapter/ProjectChapter";
import { ProjectCredits } from "@/design-system/components/organisms/ProjectCredits/ProjectCredits";
import { ProjectHero } from "@/design-system/components/organisms/ProjectHero/ProjectHero";
import { ProjectNext } from "@/design-system/components/organisms/ProjectNext/ProjectNext";
import { ProjectQuote } from "@/design-system/components/organisms/ProjectQuote/ProjectQuote";
import { getProjectBySlug, getProjectSlugs, getWorkProjects } from "@/cms/projects";
import { routing } from "@/i18n/routing";
import { alternatesFor } from "@/app/seo";
import { SERVICE_FAMILY } from "@/app/pigment";
import { buildProjectCase, nextProject } from "@/app/project-case";
import { mockCaseExtras } from "@/app/project-case.mock";

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
  const projectCase = buildProjectCase(project.gallery, mockCaseExtras(locale));
  const next = nextProject(await getWorkProjects(locale), slug);

  const facts = [
    { term: t("client"), value: project.client },
    ...(project.year !== undefined ? [{ term: t("year"), value: String(project.year) }] : []),
    ...(projectCase.sector ? [{ term: t("sector"), value: projectCase.sector }] : []),
    ...(projectCase.location ? [{ term: t("location"), value: projectCase.location }] : []),
  ];
  const disciplines = project.discipline
    ? [{ label: tWork(`disciplines.${project.discipline}`), family: SERVICE_FAMILY[project.discipline] }]
    : [];
  const hasCredits = projectCase.credits.length > 0 || projectCase.awards.length > 0 || projectCase.liveUrl;

  return (
    <main id="main">
      <Section width="wide" spacingStart="none" labelledBy="proyecto">
        <ProjectHero
          titleId="proyecto"
          title={project.title}
          overline={t("overline")}
          disciplines={disciplines}
          facts={facts}
          tagline={projectCase.tagline ?? project.summary}
          cover={project.cover}
          back={{ label: t("back"), href: "/trabajo" }}
        />
      </Section>

      {projectCase.chapters.map((chapter, index) => (
        <Section key={chapter.key} id={chapter.key} width="wide" labelledBy={`capitulo-${chapter.key}`}>
          <ProjectChapter
            titleId={`capitulo-${chapter.key}`}
            index={String(index + 1).padStart(2, "0")}
            title={chapter.title}
            paragraphs={chapter.paragraphs}
            points={chapter.points}
            media={chapter.media}
          />
        </Section>
      ))}

      {projectCase.results.length > 0 ? (
        <Section width="wide" labelledBy="resultados">
          <Figures titleId="resultados" title={t("results")} figures={projectCase.results} />
        </Section>
      ) : null}

      {projectCase.quote ? (
        <Section width="wide">
          <ProjectQuote {...projectCase.quote} />
        </Section>
      ) : null}

      {projectCase.gallery.length > 0 ? (
        <Section width="wide">
          <CaseGallery groups={projectCase.gallery} label={t("gallery")} />
        </Section>
      ) : null}

      {projectCase.strip.length > 0 ? (
        <Section width="full" spacingStart="none">
          <CaseStrip pieces={projectCase.strip} label={t("gallery")} />
        </Section>
      ) : null}

      {hasCredits ? (
        <Section width="wide" labelledBy="creditos">
          <ProjectCredits
            titleId="creditos"
            title={t("credits")}
            credits={projectCase.credits}
            awardsTitle={t("awards")}
            awards={projectCase.awards}
            {...(projectCase.liveUrl ? { live: { label: t("live"), href: projectCase.liveUrl } } : {})}
          />
        </Section>
      ) : null}

      {next ? (
        <Section width="wide">
          <ProjectNext
            overline={t("next")}
            title={next.title}
            meta={next.discipline ? tWork(`disciplines.${next.discipline}`) : undefined}
            href={`/trabajo/${next.slug}`}
            image={next.image}
          />
        </Section>
      ) : null}
    </main>
  );
}
