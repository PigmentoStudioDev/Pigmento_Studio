import { Icon } from "../../atoms/Icon/Icon";
import styles from "./CheckList.module.scss";

export interface CheckListItem {
  text: string;
  /** Por defecto va incluido. En false pinta la raya de ausencia. */
  included?: boolean;
}

export interface CheckListProps {
  items: CheckListItem[];
  /** Nombre accesible de la lista: "En los tres paquetes". */
  title?: string;
  titleId?: string;
  /** Se lee en lugar del icono. "incluido" / "no incluido" en el idioma de la pagina. */
  includedLabel: string;
  excludedLabel: string;
}

/**
 * La lista de lo que entra, con su marca por renglon.
 *
 * El icono va `aria-hidden` —lo es por dentro— y **el significado viaja en un texto
 * de verdad** que solo ve el lector de pantalla. La alternativa comun es colgar un
 * `aria-label` de la fila, y tiene un fallo silencioso: un `aria-label` SUSTITUYE al
 * contenido, asi que la fila pasaria a anunciarse "incluido" y el texto del renglon
 * desapareceria. Aqui se suman en vez de reemplazarse.
 *
 * La marca nunca es solo color. Una palomita verde y una cruz roja dejan la unica
 * senal en el tono, y quien no distingue esos dos ve dos renglones identicos: son
 * dos DIBUJOS distintos, y ademas el texto oculto lo dice con palabras.
 */
export function CheckList({
  items,
  title,
  titleId,
  includedLabel,
  excludedLabel,
}: CheckListProps) {
  return (
    <div className={styles.root}>
      {title ? (
        <p className={styles.title} id={titleId}>
          {title}
        </p>
      ) : null}

      <ul className={styles.list} aria-labelledby={title ? titleId : undefined}>
        {items.map((item) => {
          const incluido = item.included ?? true;

          return (
            <li className={styles.item} key={item.text}>
              <span className={incluido ? styles.markIncluded : styles.markExcluded}>
                <Icon name={incluido ? "check" : "dash"} />
              </span>

              <span className={styles.srOnly}>
                {incluido ? includedLabel : excludedLabel}
              </span>

              <span className={styles.text}>{item.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
