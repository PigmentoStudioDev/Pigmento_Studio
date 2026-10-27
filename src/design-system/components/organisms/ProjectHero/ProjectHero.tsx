import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { CycledCandyFamily } from "../../../theme/candy";
import { Heading } from "../../atoms/Heading/Heading";
import type { CasePiece } from "../../molecules/CaseMedia/CaseMedia";
import styles from "./ProjectHero.module.scss";

/**
 * La entrada de un caso: el rotulo, sus disciplinas con el color de cada servicio, el
 * cliente en grande, la ficha, una frase y la portada a sangre.
 *
 * El orden es el de las referencias de portfolio: primero QUE es (rotulo y nombre),
 * luego los datos que lo situan, y la imagen al final, que es lo que se queda.
 *
 * **La portada es la LCP.** Va con `preload` y fuera de cualquier gesto de entrada: el
 * titular y la portada se pintan en el primer fotograma.
 */
export interface ProjectHeroDiscipline {
  label: string;
  family: CycledCandyFamily;
}

export interface ProjectHeroFact {
  term: string;
  value: string;
}

export interface ProjectHeroProps {
  titleId?: string;
  title: string;
  /** "Caso de estudio": dice que esto es un caso antes que el nombre. */
  overline: string;
  disciplines: ProjectHeroDiscipline[];
  facts: ProjectHeroFact[];
  tagline?: string;
  cover: CasePiece;
  back: { label: string; href: string };
}

const SWATCH: Record<CycledCandyFamily, string> = {
  pink: styles.swatchPink,
  periwinkle: styles.swatchPeriwinkle,
  tangerine: styles.swatchTangerine,
  lime: styles.swatchLime,
};

export function ProjectHero({ titleId, title, overline, disciplines, facts, tagline, cover, back }: ProjectHeroProps) {
  return (
    <header className={styles.root}>
      <div className={styles.top}>
        <Link href={back.href} className={styles.back}>
          {back.label}
        </Link>
        <p className={styles.overline}>{overline}</p>
        {disciplines.length > 0 ? (
          <ul className={styles.disciplines}>
            {disciplines.map((discipline) => (
              <li className={styles.discipline} key={discipline.label}>
                <span className={`${styles.swatch} ${SWATCH[discipline.family]}`} aria-hidden="true" />
                {discipline.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Heading id={titleId} level={1} size="display">
        {title}
      </Heading>

      <div className={styles.lede}>
        {facts.length > 0 ? (
          <dl className={styles.facts}>
            {facts.map((fact) => (
              <div className={styles.fact} key={fact.term}>
                <dt className={styles.term}>{fact.term}</dt>
                <dd className={styles.value}>{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {tagline ? <p className={styles.tagline}>{tagline}</p> : null}
      </div>

      <div className={styles.cover}>
        <Image
          preload
          className={styles.image}
          src={cover.src}
          alt={cover.alt}
          width={cover.width}
          height={cover.height}
          sizes="100vw"
        />
      </div>
    </header>
  );
}
