import { NumberRoll } from "../../molecules/NumberRoll/NumberRoll";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { StripHeader } from "../../molecules/StripHeader/StripHeader";
import styles from "./Figures.module.scss";

/**
 * Las cifras del estudio: lo que el trabajo de las filas de arriba ha dado de si.
 *
 * Va entre el trabajo y la oferta a proposito. Quien acaba de ver las piezas se
 * pregunta si funcionan, y un numero contesta eso antes que un parrafo. Despues ya se
 * puede hablar de lo que se contrata.
 *
 * **Cada cifra trae su contexto**, y esa es la regla del bloque: un numero suelto no
 * prueba nada —"120 proyectos" puede ser mucho o poco— y lo que lo convierte en
 * argumento es la linea de debajo, que dice de que y desde cuando. Una cifra sin
 * contexto no entra aqui.
 *
 * El rodado lo pone `NumberRoll`, que ya existia para las propuestas: el valor viaja
 * en el HTML del servidor y los rodillos solo lo sustituyen cuando gsap ha llegado y
 * el movimiento esta permitido, asi que la cifra se lee siempre — sin JS, con
 * reduced-motion y en el instante anterior a que el paquete baje.
 *
 * Server component entero. Lo unico que cruza al navegador es `NumberRoll`, que ya
 * cruzaba.
 *
 * Props serializables: cada cifra es valor, rotulo y contexto, que es 1:1 lo que
 * guardaria un array de un bloque de Payload.
 */
export interface Figure {
  /** El valor tal y como se lee: "120", "8 anos", "14". */
  value: string;
  /** Que cuenta ese numero, en la voz de metadato del sitio. */
  label: string;
  /** La linea que lo convierte en argumento: de que y desde cuando. */
  context: string;
}

export interface FiguresProps {
  title: string;
  /** El trozo del titular que se resalta con el scroll. */
  titleHighlight?: string;
  label: string;
  intro: string;
  figures: Figure[];
  titleId?: string;
}

export function Figures({ title, titleHighlight, label, intro, figures, titleId }: FiguresProps) {
  if (figures.length === 0) return null;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <StripHeader title={title} titleHighlight={titleHighlight} label={label} intro={intro} titleId={titleId} />
      </div>

      {/* `inner` porque el envoltorio del gesto no puede meterse dentro del <ul>: un
          <div> entre la lista y sus items no es HTML valido y la rompe para quien la
          escucha. Las cifras entran juntas y escalonadas, como el resto de rejillas. */}
      <ScrollReveal by="block" inner>
        <ul className={styles.list}>
          {figures.map((figure) => (
            <li className={styles.item} key={figure.label}>
              <p className={styles.value}>
                <NumberRoll value={figure.value} />
              </p>
              <p className={styles.label}>{figure.label}</p>
              <p className={styles.context}>{figure.context}</p>
            </li>
          ))}
        </ul>
      </ScrollReveal>
    </div>
  );
}
