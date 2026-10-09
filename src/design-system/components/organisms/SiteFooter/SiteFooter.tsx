import { Icon } from "../../atoms/Icon/Icon";
import { ScrollReveal } from "../../layout/ScrollReveal/ScrollReveal";
import { FooterDirectory, type FooterDirectoryProps } from "../../molecules/FooterDirectory/FooterDirectory";
import { NavLinkList, type NavLinkItem } from "../../molecules/NavLinkList/NavLinkList";
import styles from "./SiteFooter.module.scss";

/**
 * El pie del sitio, en dos partes y en este orden: el DIRECTORIO —mapa del sitio,
 * firma y vuelta arriba, que es lo que cualquier pie tiene que hacer— y encima de el
 * la DECLARACION: una sola linea a sangre, la flecha y el nombre al que apunta, entre
 * dos filas de metadatos.
 *
 * El directorio va primero en el documento y el nombre al final porque el nombre es el
 * cierre de la pagina: cualquier cosa despues de un cierre se lee como un apendice.
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
  /** El mapa del sitio, la firma y la vuelta arriba. Encima de todo lo demas. */
  directory: FooterDirectoryProps;
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
  directory,
  meta,
  metaLabel,
  handle,
  links,
  linksLabel,
}: SiteFooterProps) {
  return (
    <footer className={styles.root}>
      {/* El directorio entra por bloque y no por lineas por lo mismo que las filas:
          sus columnas son listas de enlaces que ya parten su texto para rodarlo. */}
      <ScrollReveal by="block">
        <FooterDirectory {...directory} />
      </ScrollReveal>

      {/* Las dos filas llegan como CAJA y no partidas por lineas: son listas de
          enlaces que ya parten su texto en caracteres para rodarlo, y dos
          particiones sobre los mismos nodos se pelean. */}
      <ScrollReveal by="block">
        <div className={styles.row}>
          <NavLinkList direction="row" size="small" label={metaLabel} items={meta} />
        </div>
      </ScrollReveal>

      {/* La linea grande entra SIN gesto, a proposito. Es lo mas alto del pie y lo
          ultimo de la pagina: moverla la convierte en el remate de una entrada en
          vez de en el cierre, y compite con el marquee que lleva al lado. Las dos
          filas de enlaces si entran — son secundarias y el movimiento las ordena. */}
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

      <ScrollReveal by="block">
        <div className={`${styles.row} ${styles.bottom}`}>
          <NavLinkList direction="row" size="small" label={linksLabel} items={links} />
        </div>
      </ScrollReveal>
    </footer>
  );
}
