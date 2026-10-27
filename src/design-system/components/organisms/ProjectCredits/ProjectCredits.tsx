import { Button } from "../../atoms/Button/Button";
import { Heading } from "../../atoms/Heading/Heading";
import styles from "./ProjectCredits.module.scss";

/**
 * Quien hizo el caso, los reconocimientos y el enlace al sitio en vivo. Es el cierre
 * de las referencias antes del siguiente proyecto: la lista rol y persona dice que
 * detras hay un equipo, y el enlace deja comprobar el trabajo fuera de esta pagina.
 */
export interface ProjectCredit {
  role: string;
  name: string;
}

export interface ProjectCreditsProps {
  titleId?: string;
  title: string;
  credits: ProjectCredit[];
  awardsTitle: string;
  awards: string[];
  live?: { label: string; href: string };
}

export function ProjectCredits({ titleId, title, credits, awardsTitle, awards, live }: ProjectCreditsProps) {
  return (
    <div className={styles.root}>
      <div className={styles.column}>
        <Heading id={titleId} level={2} size="lead">
          {title}
        </Heading>
        <dl className={styles.list}>
          {credits.map((credit, index) => (
            // Dos personas pueden compartir rol y dos roles una persona: la clave lleva la posicion.
            <div className={styles.row} key={`${credit.role}-${index}`}>
              <dt className={styles.role}>{credit.role}</dt>
              <dd className={styles.name}>{credit.name}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className={styles.column}>
        {awards.length > 0 ? (
          <>
            <Heading level={2} size="lead">
              {awardsTitle}
            </Heading>
            <ul className={styles.list}>
              {awards.map((award) => (
                <li className={styles.row} key={award}>
                  <span className={styles.name}>{award}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {live ? (
          <div className={styles.live}>
            <Button href={live.href} emphasis="primary" icon="arrow">
              {live.label}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
