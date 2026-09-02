"use client";

import Link from "next/link";
import { useCharRoll } from "../../../motion/useCharRoll";
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
  /**
   * Texto que NO es un enlace y que tampoco promete serlo: el nombre del estudio,
   * la ciudad.
   *
   * Sin esta bandera, la unica forma de poner texto en una lista de enlaces era
   * dejarlo sin `href`, y eso significa otra cosa — lo marca como deshabilitado:
   * gris, cursor de prohibido y anunciado como no disponible. De una ciudad eso no
   * es cierto.
   */
  plain?: boolean;
  /**
   * Sale del sitio. Abre en otra pestana, y por eso `name` deja de ser opcional en
   * la practica: cambiar de ventana sin avisar desorienta a quien no ve que la
   * ventana cambio.
   */
  external?: boolean;
  /**
   * Nombre accesible cuando la etiqueta visible no lo dice entero — "Instagram" en
   * pantalla, "Pigmento Studio en Instagram, abre en una pestana nueva" para quien
   * lo escucha.
   */
  name?: string;
}

export interface NavLinkListProps {
  items: NavLinkItem[];
  /** Escala tipografica. La columna principal usa 'large'. */
  size?: "large" | "small";
  /**
   * Como se apilan las entradas. En columna cada una ocupa su fila y las separa una
   * linea; en fila se reparten a los lados y esa linea desaparece, porque entre dos
   * celdas de una misma fila un filete vertical se lee como una tabla.
   */
  direction?: "column" | "row";
  /** Nombre accesible de la lista cuando no la precede un encabezado. */
  label?: string;
  /** La cabecera lo usa para cerrarse al navegar. */
  onNavigate?: () => void;
}

const SIZE: Record<NonNullable<NavLinkListProps["size"]>, string> = {
  large: styles.sizeLarge,
  small: styles.sizeSmall,
};

const DIRECTION: Record<NonNullable<NavLinkListProps["direction"]>, string> = {
  column: styles.directionColumn,
  row: styles.directionRow,
};

/** Componente propio porque cada texto que rueda necesita su ref, y un hook no se
 *  puede llamar dentro de un map(). */
function NavLink({ item, onNavigate }: { item: NavLinkItem; onNavigate?: () => void }) {
  // En una constante para que el early return la estreche a string y el enlace no
  // necesite una asercion. Sin destino no rueda, asi que tampoco se parte.
  const href = item.href;
  const textRef = useCharRoll<HTMLSpanElement>(item.label, href !== undefined);

  // Texto y punto: ni enlace, ni promesa de enlace. Va antes que la rama de
  // deshabilitado porque las dos se reconocen por no tener destino y solo esta
  // bandera las distingue.
  if (item.plain) {
    return (
      <li className={styles.item}>
        <span className={styles.link}>
          <span className={styles.text}>{item.label}</span>
        </span>
      </li>
    );
  }

  if (href === undefined) {
    return (
      <li className={styles.item}>
        {/* Sin destino no hay enlace. Un <a> sin href no es alcanzable con teclado
            ni se anuncia como enlace: aparentaria serlo solo con raton. */}
        <span aria-disabled="true" className={[styles.link, styles.isDisabled].join(" ")}>
          <span className={styles.text}>{item.label}</span>
          {item.tag ? <Tag tone="progress">{item.tag}</Tag> : null}
        </span>
      </li>
    );
  }

  // Fuera del sitio no entra el router de Next: `Link` prefetch y navega en cliente,
  // y las dos cosas sobran —y la primera falla— contra un dominio ajeno.
  const Anchor = item.external ? "a" : Link;

  return (
    <li className={styles.item}>
      {/* El nombre no puede salir del contenido, que esta partido. Lleva el
          distintivo dentro porque con aria-label el <Tag> deja de contar. */}
      <Anchor
        href={href}
        aria-label={item.name ?? (item.tag ? `${item.label}, ${item.tag}` : item.label)}
        onClick={onNavigate}
        className={styles.link}
        target={item.external ? "_blank" : undefined}
        // noreferrer va con noopener y no en su lugar: el segundo cierra el acceso a
        // window.opener y el primero ademas no filtra de donde viene la visita.
        rel={item.external ? "noopener noreferrer" : undefined}
      >
        <span aria-hidden="true" ref={textRef} className={styles.text}>
          {item.label}
        </span>
        {item.tag ? <Tag tone="progress">{item.tag}</Tag> : null}
      </Anchor>
    </li>
  );
}

export function NavLinkList({
  items,
  size = "large",
  direction = "column",
  label,
  onNavigate,
}: NavLinkListProps) {
  return (
    <ul aria-label={label} className={[styles.root, SIZE[size], DIRECTION[direction]].join(" ")}>
      {items.map((item) => (
        <NavLink key={item.label} item={item} onNavigate={onNavigate} />
      ))}
    </ul>
  );
}
