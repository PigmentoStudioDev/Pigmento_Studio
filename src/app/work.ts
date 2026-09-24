import type { WorkProject } from "@/cms/projects";
import type { WorkPiece, WorkRowsProps } from "@/design-system/components/organisms/WorkRows/WorkRows";

/**
 * El strip de trabajo destacado. Vive en app/ por lo mismo que el resto del contenido.
 *
 * Las piezas salen del portfolio publicado en el CMS. Las filas necesitan mas piezas
 * que proyectos hay, asi que se repiten en su orden.
 *
 * Los marcadores se quedan como respaldo para una base vacia —la de desarrollo—, no
 * para rellenar: con un solo proyecto publicado se repite ese, no se inventa otro. Sus
 * CLIENTES son marcadores a proposito, igual que los nombres del equipo: un cliente
 * inventado en la pagina de un estudio no se puede arreglar despues.
 */
type Translate = (key: string) => string;

const DISCIPLINES = ["branding", "web", "motion", "marketing"] as const;

const IMAGES = [
  { width: 522, height: 522 },
  { width: 522, height: 715 },
  { width: 521, height: 737 },
  { width: 521, height: 690 },
  { width: 516, height: 775 },
  { width: 520, height: 601 },
  { width: 521, height: 715 },
  { width: 521, height: 477 },
  { width: 523, height: 605 },
  { width: 523, height: 753 },
  { width: 521, height: 631 },
  { width: 509, height: 718 },
  { width: 520, height: 796 },
  { width: 518, height: 688 },
].map((size, index) => ({ ...size, src: `/portfolio/${String(index + 1).padStart(2, "0")}.png` }));

/**
 * Largos distintos a proposito: las filas acaban a la vez, asi que la diferencia de
 * largo es la diferencia de velocidad. Con dos iguales se moverian en bloque.
 */
const ROW_LENGTHS = [14, 10];

function placeholder(t: Translate, imageIndex: number): WorkPiece {
  const index = imageIndex % IMAGES.length;

  return {
    client: `${t("placeholderClient")} ${String(index + 1).padStart(2, "0")}`,
    discipline: t(`disciplines.${DISCIPLINES[index % DISCIPLINES.length]}`),
    href: "/trabajo",
    image: IMAGES[index],
  };
}

function fromProject(t: Translate, project: WorkProject): WorkPiece {
  return {
    client: project.client,
    ...(project.discipline ? { discipline: t(`disciplines.${project.discipline}`) } : {}),
    // TODO(rutas): la pagina de cada caso todavia no existe.
    href: "/trabajo",
    image: project.image,
  };
}

export function getWork(t: Translate, projects: WorkProject[]): WorkRowsProps {
  const count = projects.length || IMAGES.length;
  const piece = (index: number): WorkPiece =>
    projects.length ? fromProject(t, projects[index % count]) : placeholder(t, index);

  // Cada fila empieza a media coleccion de la anterior. Seguidas, la segunda volvia a
  // la primera pieza y las dos filas arrancaban con las mismas una encima de otra.
  const starts = ROW_LENGTHS.map((_, row) => row * Math.floor(count / 2));

  return {
    title: t("title"),
    titleHighlight: t("titleHighlight"),
    label: t("label"),
    intro: t("intro"),
    ctaLabel: t("cta"),
    cursorLabel: t("cursor"),
    // TODO(rutas): /trabajo todavia no existe.
    ctaHref: "/trabajo",
    rows: ROW_LENGTHS.map((length, row) => Array.from({ length }, (_, i) => piece(starts[row] + i))),
  };
}
