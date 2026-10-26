import type { ClientsProps } from "@/design-system/components/organisms/Clients/Clients";
import type { WorkProject } from "@/cms/projects";

/**
 * "Marcas con las que trabajamos". Sale del portafolio del CMS y no de una lista
 * escrita: una marca entra cuando se publica su primer proyecto.
 *
 * Un cliente con varios proyectos sale una vez, con el primero en el orden del CMS,
 * que es al que lleva su fila.
 */
type Translate = (key: string) => string;

export function getClients(t: Translate, tServices: Translate, projects: WorkProject[]): ClientsProps {
  const seen = new Set<string>();
  const firsts = projects.filter((project) => {
    if (!project.client || seen.has(project.client)) return false;
    seen.add(project.client);
    return true;
  });

  return {
    title: t("title"),
    description: t("description"),
    clients: firsts.map((project) => ({
      name: project.client,
      ...(project.discipline ? { discipline: tServices(`items.${project.discipline}.name`) } : {}),
      href: `/trabajo/${project.slug}`,
    })),
  };
}
