import Link from "next/link";
import { Tag } from "../../atoms/Tag/Tag";
import styles from "./NavLinkList.module.scss";

/**
 * Una columna de enlaces de navegacion, con etiqueta opcional por enlace y
 * soporte para entradas anunciadas pero todavia no navegables.
 *
 * Props enteramente serializables: esta lista es candidata directa a salir de una
 * global de navegacion de Payload sin tocar el componente.
 *
 * Nota del port: el markup de origen colgaba <div> directamente de <ul>, que no es
 * HTML valido — un <ul> solo admite <li>. Aqui cada entrada es un <li> de verdad,
 * porque el arbol de accesibilidad cuenta los items de la lista y con <div> por
 * medio anuncia una lista vacia.
 */
export interface NavLinkItem {
  label: string;
  /** Sin href la entrada se anuncia pero no navega (todavia no existe). */
  href?: string;
  /** Distintivo corto junto al enlace: "Pronto", "Beta". */
  tag?: string;
}

export interface NavLinkListProps {
  items: NavLinkItem[];
  /** Escala tipografica. La columna principal usa 'large'. */
  size?: "large" | "small";
  /** Nombre accesible de la lista cuando no la precede un encabezado. */
  label?: string;
  /** La cabecera lo usa para cerrarse al navegar. */
  onNavigate?: () => void;
}

const SIZE: Record<NonNullable<NavLinkListProps["size"]>, string> = {
  large: styles.sizeLarge,
  small: styles.sizeSmall,
};

export function NavLinkList({ items, size = "large", label, onNavigate }: NavLinkListProps) {
  return (
    <ul aria-label={label} className={[styles.root, SIZE[size]].join(" ")}>
      {items.map((item) => (
        <li key={item.label} className={styles.item}>
          {item.href ? (
            <Link href={item.href} onClick={onNavigate} className={styles.link}>
              <span className={styles.text}>{item.label}</span>
              {item.tag ? <Tag tone="progress">{item.tag}</Tag> : null}
            </Link>
          ) : (
            // Sin destino no hay enlace. Un <a> sin href no es alcanzable con
            // teclado ni se anuncia como enlace: aparentaria serlo solo con raton.
            <span aria-disabled="true" className={[styles.link, styles.isDisabled].join(" ")}>
              <span className={styles.text}>{item.label}</span>
              {item.tag ? <Tag tone="progress">{item.tag}</Tag> : null}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
