import { Heading } from "../../atoms/Heading/Heading";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import styles from "./Process.module.scss";

/**
 * Como trabaja el estudio, fase a fase.
 *
 * Es lo que faltaba entre "que hacemos" y "quienes somos": un estudio no se contrata
 * por su lista de servicios sino por como lleva un proyecto, y esa pregunta —cuanto
 * tarda, cuando opino yo, que recibo al final— no la contestaba ningun bloque.
 *
 * **Las fases van numeradas y la numeracion es del CONTENIDO, no del CSS.** Un
 * contador de la hoja pinta el numero como decoracion, y aqui el numero es dato: dice
 * el orden, y quien escucha la pagina tiene que oirlo. Sale del indice de la lista
 * ordenada, que ademas es lo que hace que quitar una fase renumere el resto solo.
 *
 * **Y es una `<ol>`, no una rejilla de tarjetas.** El orden es la informacion del
 * bloque; una lista sin orden lo dice en el dibujo y no en el documento.
 *
 * Cada fase trae ademas lo que PRODUCE, que es la parte que un cliente busca: una
 * fase sin entregable es una reunion.
 *
 * Server component entero: lo que cruza al navegador es el envoltorio del gesto.
 *
 * Props serializables: cada fase es titulo, texto y entregable.
 */
export interface ProcessPhase {
  title: string;
  text: string;
  /** Lo que la fase deja en las manos del cliente. Sin esto, es una reunion. */
  deliverable: string;
}

export interface ProcessProps {
  title: string;
  /** El trozo del titular que se resalta con el scroll. */
  titleHighlight?: string;
  label: string;
  intro: string;
  /** Rotulo de lo que produce cada fase, en la voz de metadato: "Entregable". */
  deliverableLabel: string;
  phases: ProcessPhase[];
  titleId?: string;
}

/** Dos cifras: "01" y no "1". Es la misma voz que el indice de las tarjetas de valores. */
function ordinal(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function Process({
  title,
  titleHighlight,
  label,
  intro,
  deliverableLabel,
  phases,
  titleId,
}: ProcessProps) {
  if (phases.length === 0) return null;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <StripHeader title={title} titleHighlight={titleHighlight} label={label} intro={intro} titleId={titleId} />
      </div>

      {/* `inner` por lo mismo que en el resto de listas: el envoltorio del gesto no
          puede meterse entre la <ol> y sus <li>. */}
      <ScrollReveal by="block" inner>
        <ol className={styles.list}>
          {phases.map((phase, index) => (
            <li className={styles.phase} key={phase.title}>
              <p className={styles.ordinal}>{ordinal(index)}</p>

              <div className={styles.body}>
                <Heading level={3} size="title">
                  {phase.title}
                </Heading>
                <p className={styles.text}>{phase.text}</p>
              </div>

              <p className={styles.deliverable}>
                <span className={styles.deliverableLabel}>{deliverableLabel}</span>
                <span className={styles.deliverableValue}>{phase.deliverable}</span>
              </p>
            </li>
          ))}
        </ol>
      </ScrollReveal>
    </div>
  );
}
