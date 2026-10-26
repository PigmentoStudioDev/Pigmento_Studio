"use client";

import type { CSSProperties } from "react";
import { Link } from "@/i18n/navigation";
import {
  SHOWCASE_FADE,
  SHOWCASE_LIST,
  SHOWCASE_PASS,
  SHOWCASE_ROW,
  SHOWCASE_SHUFFLE,
  useShowcase,
} from "../../../motion/useShowcase";
import styles from "./Clients.module.scss";

/**
 * Las marcas con las que trabaja el estudio, con la anatomia del Showcase de
 * locomotive (scroll.locomotive.ca, section#showcase).
 *
 * Arriba, una palabra que no cabe en la ventana y la cruza mientras su bloque esta
 * fijado, con una frase al lado que se entinta con el scroll. Debajo, una lista en las
 * tres ultimas columnas de cuatro: el cliente, la disciplina y la flecha. Los gestos
 * viven en useShowcase.
 *
 * Cada fila lleva al caso del cliente. El nombre del enlace es fijo y no el texto que
 * se ve: al pasar el puntero el texto se baraja, y un lector no tiene por que oir el
 * revoltijo.
 */
export interface ClientRow {
  name: string;
  /** Ya traducida: "Branding". */
  discipline?: string;
  href: string;
}

export interface ClientsProps {
  /** La palabra que cruza la ventana: "Marcas". */
  title: string;
  /** La frase de al lado. */
  description: string;
  clients: ClientRow[];
  titleId?: string;
}

export function Clients({ title, description, clients, titleId }: ClientsProps) {
  const rootRef = useShowcase<HTMLDivElement>();

  if (clients.length === 0) return null;

  return (
    <div ref={rootRef} className={styles.root}>
      <div className={styles.pass} {...{ [SHOWCASE_PASS]: "" }}>
        <div className={styles.passInner}>
          <div>
            <p className={styles.description} {...{ [SHOWCASE_FADE]: "" }}>
              {description}
            </p>
            <h2 className={styles.title} id={titleId}>
              {title}
            </h2>
          </div>
        </div>
      </div>

      <div className={styles.listWrap}>
        <div className={styles.list} {...{ [SHOWCASE_LIST]: "" }}>
          <ul className={styles.items}>
            {clients.map((client, i) => (
              <li key={client.name} style={{ "--index": i } as CSSProperties}>
                <Link
                  className={styles.row}
                  href={client.href}
                  aria-label={client.discipline ? `${client.name}, ${client.discipline}` : client.name}
                  {...{ [SHOWCASE_ROW]: "" }}
                >
                  <span className={styles.name} {...{ [SHOWCASE_SHUFFLE]: client.name }}>
                    {client.name}
                  </span>
                  {client.discipline ? (
                    <span className={styles.discipline} {...{ [SHOWCASE_SHUFFLE]: client.discipline }}>
                      {client.discipline}
                    </span>
                  ) : (
                    <span className={styles.discipline} />
                  )}
                  <span className={styles.anchor} aria-hidden="true">
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
