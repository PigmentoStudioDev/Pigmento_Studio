import type { ProjectPiece, WorkProject } from "@/cms/projects";
import type { Figure } from "@/design-system/components/organisms/Figures/Figures";
import type { CaseFramedPiece, CaseMediaGroup } from "@/design-system/components/molecules/CaseMedia/CaseMedia";
import { compose, STACK_CAP, stripFrame } from "./case-composition";

/**
 * El caso entero, en el orden de lectura que repiten las referencias de portfolio:
 * hero con ficha, capitulos (problema, estrategia, decisiones, resultados), cifras,
 * la voz del cliente, galeria con ritmo, creditos y el siguiente proyecto.
 *
 * Todo lo que no es hero ni siguiente es opcional: un caso que solo tiene portada y
 * galeria —como los de hoy en el CMS— se lee completo, y uno con capitulos se lee
 * como un estudio de caso. Un bloque sin datos no se pinta.
 */

export interface CasePoint {
  title: string;
  text: string;
}

export interface CaseChapter {
  /** Ancla del capitulo: el indice de la ficha salta a el. */
  key: string;
  title: string;
  paragraphs: string[];
  /** Las decisiones de un capitulo: cada una con su subtitulo. */
  points: CasePoint[];
  media: CaseMediaGroup[];
}

export interface CaseQuote {
  quote: string;
  author: string;
  role: string;
}

export interface CaseCredit {
  role: string;
  name: string;
}

/**
 * Lo que el CMS todavia no modela. Las piezas de un capitulo se piden por su posicion
 * en la galeria del proyecto, no se duplican: una pieza usada en un capitulo ya no
 * vuelve a salir en la galeria del final.
 */
export interface ProjectCaseExtras {
  tagline?: string;
  sector?: string;
  location?: string;
  liveUrl?: string;
  awards?: string[];
  chapters?: Array<{
    key: string;
    title: string;
    paragraphs: string[];
    points?: CasePoint[];
    /** Posiciones en la galeria del proyecto; la composicion la decide la orientacion. */
    media?: number[];
  }>;
  results?: Figure[];
  quote?: CaseQuote;
  credits?: CaseCredit[];
}

export interface ProjectCase {
  tagline: string | undefined;
  sector: string | undefined;
  location: string | undefined;
  liveUrl: string | undefined;
  awards: string[];
  chapters: CaseChapter[];
  results: Figure[];
  quote: CaseQuote | undefined;
  credits: CaseCredit[];
  /** Lo que sobra tras los capitulos, compuesto, hasta el tope de piezas apiladas. */
  gallery: CaseMediaGroup[];
  /** Lo que pasa del tope: va a la tira horizontal. */
  strip: CaseFramedPiece[];
}

const pieceCount = (groups: CaseMediaGroup[]) => groups.reduce((n, group) => n + group.pieces.length, 0);

export function buildProjectCase(gallery: ProjectPiece[], extras: ProjectCaseExtras = {}): ProjectCase {
  const used = new Set<number>();

  const requested = (extras.chapters ?? []).map((chapter) => {
    const from = [...new Set(chapter.media ?? [])].filter((at) => at >= 0 && at < gallery.length && !used.has(at));
    from.forEach((at) => used.add(at));
    return compose(from.map((at) => gallery[at]));
  });

  // Lo que ningun capitulo pidio se reparte antes de llegar a la galeria: un capitulo sin
  // piezas recibe la siguiente composicion. En las referencias rara vez van mas de dos o
  // tres piezas seguidas sin una linea de texto entre medias.
  const rest = compose(gallery.filter((_, at) => !used.has(at)));
  let next = 0;
  const chapters = (extras.chapters ?? []).map((chapter, index): CaseChapter => {
    const own = requested[index];
    return {
      key: chapter.key,
      title: chapter.title,
      paragraphs: chapter.paragraphs,
      points: chapter.points ?? [],
      media: own.length > 0 ? own : rest.slice(next, ++next),
    };
  });

  const left = rest.slice(next);
  let cut = 0;
  while (cut < left.length && pieceCount(left.slice(0, cut + 1)) <= STACK_CAP) cut += 1;
  const stacked = left.slice(0, cut);
  const strip = left
    .slice(cut)
    .flatMap((group) => group.pieces)
    .map((piece) => ({ ...piece, frame: stripFrame(piece) }));

  return {
    tagline: extras.tagline,
    sector: extras.sector,
    location: extras.location,
    liveUrl: extras.liveUrl,
    awards: extras.awards ?? [],
    chapters,
    results: extras.results ?? [],
    quote: extras.quote,
    credits: extras.credits ?? [],
    gallery: stacked,
    strip,
  };
}

/**
 * El que sigue en el orden del portfolio, y tras el ultimo vuelve al primero: cada caso
 * termina empujando a otro en vez de en un callejon.
 */
export function nextProject(projects: WorkProject[], slug: string): WorkProject | undefined {
  const at = projects.findIndex((project) => project.slug === slug);
  if (projects.length < 2) return undefined;
  return projects[(at + 1) % projects.length];
}
