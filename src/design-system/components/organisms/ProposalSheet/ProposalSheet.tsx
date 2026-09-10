import { Heading } from "@/design-system/components/atoms/Heading/Heading";
import styles from "./ProposalSheet.module.scss";

export interface ProposalSheetItem {
  concept: string;
  detail: string;
  amountCents: number;
}

export interface ProposalSheetProps {
  /** Nombre de a quien va dirigida. */
  client: string;
  title: string;
  /** Los renglones del alcance, en el orden en que se cotizaron. */
  items: ProposalSheetItem[];
  /** La suma, ya calculada. El organismo no suma: pinta. */
  totalCents: number;
  currency: string;
  /** BCP-47 con el que se formatean los importes. Lo decide la pagina, no el organismo. */
  locale: string;
  totalLabel: string;
  conceptLabel: string;
  amountLabel: string;
  /** Fecha limite ya formateada, o null si no la tiene. */
  validUntil: string | null;
  validUntilLabel: string;
  /** Aviso cuando la propuesta paso de fecha. */
  expiredLabel: string | null;
  titleId?: string;
}

/**
 * El dinero se formatea AQUI y no en el adaptador: `Intl` necesita saber el
 * idioma, y el idioma es cosa de la pagina — por eso llega como prop y no como
 * literal. Divide entre 100 porque los importes viajan en centavos enteros: una
 * cotizacion en coma flotante deja de cuadrar al sumar, y eso lo ve el cliente.
 */
function money(cents: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}

export function ProposalSheet({
  client,
  title,
  items,
  totalCents,
  currency,
  locale,
  totalLabel,
  conceptLabel,
  amountLabel,
  validUntil,
  validUntilLabel,
  expiredLabel,
  titleId,
}: ProposalSheetProps) {
  return (
    <article className={styles.root}>
      <header className={styles.header}>
        <p className={styles.client}>{client}</p>
        <Heading level={1} id={titleId}>
          {title}
        </Heading>
      </header>

      {/* Una TABLA y no una lista de divs: son conceptos con importes, y quien la
          recorra con lector de pantalla necesita que cada cifra diga de que fila
          es. `scope` en las cabeceras es lo que lo hace posible. */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{conceptLabel}</th>
            <th scope="col" className={styles.amountColumn}>
              {amountLabel}
            </th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.concept}>
              <th scope="row" className={styles.concept}>
                {item.concept}
                {item.detail ? <span className={styles.detail}>{item.detail}</span> : null}
              </th>
              <td className={styles.amount}>{money(item.amountCents, currency, locale)}</td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr>
            <th scope="row">{totalLabel}</th>
            <td className={styles.total}>{money(totalCents, currency, locale)}</td>
          </tr>
        </tfoot>
      </table>

      <footer className={styles.footer}>
        {validUntil ? (
          <p className={styles.validity}>
            {validUntilLabel} {validUntil}
          </p>
        ) : null}

        {/* `role="status"` y no un parrafo suelto: que la propuesta este vencida
            cambia lo que el cliente puede hacer con ella, y eso hay que anunciarlo
            y no solo pintarlo. */}
        {expiredLabel ? (
          <p role="status" className={styles.expired}>
            {expiredLabel}
          </p>
        ) : null}
      </footer>
    </article>
  );
}
