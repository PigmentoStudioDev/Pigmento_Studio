import type { WorkPiece, WorkRowsProps } from "@/design-system/components/organisms/WorkRows/WorkRows";

/**
 * El strip de trabajo destacado. Vive en app/ por lo mismo que el resto del contenido.
 *
 * TODO(cms): piezas fijas porque el CMS tiene hoy un solo proyecto y las filas
 * necesitan unas veinticinco. Con 14 imagenes se repiten; cuando haya portafolio real se
 * mapea desde cms/projects.ts. Los CLIENTES son marcadores, igual que los nombres del
 * equipo: un cliente inventado en la pagina de un estudio no se puede arreglar despues.
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

function piece(t: Translate, imageIndex: number): WorkPiece {
  const index = imageIndex % IMAGES.length;

  return {
    client: `${t("placeholderClient")} ${String(index + 1).padStart(2, "0")}`,
    discipline: t(`disciplines.${DISCIPLINES[index % DISCIPLINES.length]}`),
    href: "/trabajo",
    image: IMAGES[index],
  };
}

export function getWork(t: Translate): WorkRowsProps {
  // Cada fila empieza a media coleccion de la anterior. Seguidas, la segunda volvia a
  // la imagen 01 y las dos filas arrancaban con las mismas piezas una encima de otra.
  const starts = ROW_LENGTHS.map((_, row) => row * Math.floor(IMAGES.length / 2));

  return {
    title: t("title"),
    titleHighlight: t("titleHighlight"),
    label: t("label"),
    intro: t("intro"),
    ctaLabel: t("cta"),
    cursorLabel: t("cursor"),
    // TODO(rutas): /trabajo todavia no existe.
    ctaHref: "/trabajo",
    rows: ROW_LENGTHS.map((length, row) => Array.from({ length }, (_, i) => piece(t, starts[row] + i))),
  };
}
