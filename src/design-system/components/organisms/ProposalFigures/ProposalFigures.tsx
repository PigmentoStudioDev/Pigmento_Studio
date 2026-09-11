import { Heading } from "../../atoms/Heading/Heading";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { NumberRoll } from "../../molecules/NumberRoll/NumberRoll";
import styles from "./ProposalFigures.module.scss";

export interface ProposalFigure {
  /** El numero tal y como se lee: "247,680 USD", "80%", "0". */
  value: string;
  label: string;
  /**
   * De donde sale. No es opcional en ningun sitio de la cadena — ni aqui, ni en el
   * campo del CMS: una cifra sin fuente en una propuesta de agencia es un pasivo y
   * no un argumento.
   */
  source: string;
}

export interface ProposalFiguresProps {
  title: string;
  titleId?: string;
  sourceLabel: string;
  figures: ProposalFigure[];
}

/**
 * Las cifras que enmarcan la decision, cada una con su fuente.
 *
 * El numero se dimensiona con el estilo 'figure', que se mide contra SU CONTENEDOR y
 * no contra la ventana. Por eso `.item` declara `container-type` en la hoja: sin esa
 * linea cqi no falla, cae a la ventana pequena y el numero vuelve a calcularse contra
 * la pantalla sin que nada avise.
 */
export function ProposalFigures({
  title,
  titleId,
  sourceLabel,
  figures,
}: ProposalFiguresProps) {
  return (
    <div className={styles.root}>
      <ScrollReveal>
        <Heading level={2} id={titleId}>
          {title}
        </Heading>
      </ScrollReveal>

      {/* Las cifras entran como caja y el numero rueda por dentro: son dos gestos
          sobre nodos distintos, asi que no se pelean por partir el mismo texto. */}
      <ScrollReveal by="block" inner>
        <ul className={styles.list}>
        {figures.map((figure) => (
          <li className={styles.item} key={`${figure.value}-${figure.label}`}>
            <p className={styles.value}>
              <NumberRoll value={figure.value} />
            </p>
            <p className={styles.label}>{figure.label}</p>
            {/* Un solo nodo de texto: interpolar dos deja marcas de comentario de React entre medias. */}
            <p className={styles.source}>{`${sourceLabel} ${figure.source}`}</p>
          </li>
          ))}
        </ul>
      </ScrollReveal>
    </div>
  );
}
