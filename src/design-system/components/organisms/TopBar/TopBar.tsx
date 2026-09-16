"use client";

import { useTopBar } from "../../../motion/useTopBar";
import styles from "./TopBar.module.scss";

/**
 * Barra fina fija arriba para promos y mensajes del estudio. Toda la barra es UN
 * enlace: en algo tan fino, un destino por mensaje seria un blanco de clic de 32px
 * que cambia de sitio mientras se mueve.
 *
 * Hasta dos mensajes, una fila cada uno; el segundo entra al bajar. El texto que ve
 * quien mira va repetido y en movimiento, asi que se oculta al lector de pantalla y
 * el nombre del enlace lleva los mensajes una sola vez.
 *
 * Publica `data-topbar`, que es lo que lee `_app.scss` para bajar la cabecera y el
 * hero lo que mide la barra. Sin ella montada, ese hueco es cero.
 */
export interface TopBarProps {
  messages: string[];
  href: string;
}

/** Mas de dos filas no se llegan a leer en el scroll de un hero. */
const MAX_ROWS = 2;

export function TopBar({ messages, href }: TopBarProps) {
  const rows = messages.filter(Boolean).slice(0, MAX_ROWS);
  const { rootRef, copies } = useTopBar<HTMLAnchorElement>();

  if (rows.length === 0) return null;

  return (
    <a ref={rootRef} className={styles.root} href={href} aria-label={rows.join(". ")} data-topbar="">
      <span className={styles.rows} aria-hidden="true">
        {rows.map((message, rowIndex) => (
          <span key={`${message}-${rowIndex}`} className={styles.row} data-topbar-row="">
            {Array.from({ length: copies }, (_, copy) => (
              <span key={copy} className={styles.collection} data-topbar-collection="">
                <span className={styles.item}>
                  <span className={styles.dot} />
                  <span className={styles.text}>{message}</span>
                </span>
              </span>
            ))}
          </span>
        ))}
      </span>
    </a>
  );
}
