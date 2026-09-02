import { Icon } from "../../atoms/Icon/Icon";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { NavLinkList, type NavLinkItem } from "../../molecules/NavLinkList/NavLinkList";
import styles from "./SiteFooter.module.scss";

/**
 * El pie del sitio: una pantalla entera con una sola linea a sangre — la flecha y el
 * nombre al que apunta — entre dos filas de metadatos.
 *
 * Las dos filas son la MISMA lista de enlaces que el menu, en su tamano pequeno y en
 * horizontal: un pie y un menu son el mismo tipo de navegacion, y con dos
 * componentes distintos las dos dejan de moverse igual en cuanto alguien toque uno.
 *
 * Va montado por el layout y NO dentro de un Section, al contrario que los demas
 * organismos. Un <footer> dentro de <section> deja de ser el landmark contentinfo:
 * la regla de HTML es que solo lo es cuando no esta anidado en section, article,
 * aside ni nav. Es chrome de pagina, como la cabecera, y no un bloque que el CMS
 * vaya a colocar entre otros.
 *
 * Es server component entero. Lo unico que cruza al navegador es NavLinkList, que
 * ya cruzaba por el rodado de su texto.
 *
 * Props serializables: un bloque de Payload lo alimenta 1:1.
 */
export interface SiteFooterProps {
  /** Fila superior: nombre del estudio y atajos. */
  meta: NavLinkItem[];
  /** Nombre accesible de esa lista. */
  metaLabel: string;
  /** La linea grande: la flecha y el destino al que apunta. */
  handle: NavLinkItem;
  /** Fila inferior: redes, contacto, sitio. */
  links: NavLinkItem[];
  /** Nombre accesible de esa lista. */
  linksLabel: string;
}

export function SiteFooter({
  meta,
  metaLabel,
  handle,
  links,
  linksLabel,
}: SiteFooterProps) {
  return (
    <footer className={styles.root}>
      {/* Las tres piezas del pie llegan como CAJA y no partidas por lineas: las dos
          filas son listas de enlaces que ya parten su texto en caracteres para
          rodarlo — dos particiones sobre los mismos nodos se pelean — y la linea
          grande es una fila flex que un envoltorio de bloque desharia. */}
      <ScrollReveal by="block">
        <div className={styles.row}>
          <NavLinkList direction="row" size="small" label={metaLabel} items={meta} />
        </div>
      </ScrollReveal>

      <ScrollReveal by="block">
        <p className={styles.line}>
          <span className={styles.icon}>
            <Icon name="arrow" />
          </span>
          <a
            className={styles.word}
            href={handle.href}
            aria-label={handle.name}
            target={handle.external ? "_blank" : undefined}
            // noreferrer va con noopener y no en su lugar: el segundo cierra el
            // acceso a window.opener y el primero ademas no filtra de donde viene la
            // visita.
            rel={handle.external ? "noopener noreferrer" : undefined}
          >
            {handle.label}
          </a>
        </p>
      </ScrollReveal>

      <ScrollReveal by="block">
        <div className={`${styles.row} ${styles.bottom}`}>
          <NavLinkList direction="row" size="small" label={linksLabel} items={links} />
        </div>
      </ScrollReveal>
    </footer>
  );
}
