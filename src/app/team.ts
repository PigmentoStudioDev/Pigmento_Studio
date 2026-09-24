import type {
  TeamGroup,
  TeamMember,
  TeamNetwork,
  TeamProps,
} from "@/design-system/components/organisms/Team/Team";

/**
 * El equipo. Vive en app/ y no en el design system por lo mismo que el resto del
 * contenido del sitio: el contrato de modularidad exige que el DS pueda salir de este
 * repo sin arrastrarlo.
 *
 * Las personas vienen del CMS; aqui solo se ponen los textos del bloque. Sin nadie
 * publicado no hay seccion: un nombre inventado en la pagina de un estudio es de las
 * pocas cosas que no se pueden "arreglar despues".
 */
type Translate = (key: string, values?: Record<string, string>) => string;

const GROUPS: TeamGroup[] = ["direccion", "diseno", "desarrollo", "estrategia"];
const NETWORKS: TeamNetwork[] = ["linkedin", "instagram", "behance", "x", "web"];

export function getTeam(t: Translate, members: TeamMember[]): TeamProps | null {
  if (members.length === 0) return null;

  return {
    title: t("title"),
    titleHighlight: t("titleHighlight"),
    label: t("label"),
    intro: t("intro"),
    members,
    labels: {
      groups: {
        all: t("groups.all"),
        ...Object.fromEntries(GROUPS.map((group) => [group, t(`groups.${group}`)])),
      } as Record<TeamGroup | "all", string>,
      filter: t("filter"),
      previous: t("previous"),
      next: t("next"),
      // El hueco se devuelve tal cual para que lo rellene cada tarjeta con su nombre:
      // resolverlo aqui dejaria una sola frase para todas.
      open: t("open", { name: "{name}" }),
      close: t("close"),
      link: t("link", { name: "{name}", network: "{network}" }),
      networks: Object.fromEntries(NETWORKS.map((network) => [network, t(`networks.${network}`)])) as Record<
        TeamNetwork,
        string
      >,
      roster: t("roster"),
      drag: t("drag"),
    },
  };
}
