"use client";

import { useTopBar } from "../../../motion/useTopBar";
import styles from "./TopBar.module.scss";

/**
 * Barra fina fija arriba para promos y mensajes del estudio. Es un aviso y no un
 * enlace: la misma invitacion a contactar ya vive en la cabecera, el hero y el cierre,
 * y una cuarta repetida en un blanco de 32px que se mueve solo restaba.
 *
 * Hasta dos mensajes, una fila cada uno; el segundo entra al bajar. El texto que ve
 * quien mira va repetido y en movimiento, asi que se oculta al lector de pantalla y
 * el nombre de la nota lleva los mensajes una sola vez.
 *
 * Publica `data-topbar`, que es lo que lee `_app.scss` para bajar la cabecera y el
 * hero lo que mide la barra. Sin ella montada, ese hueco es cero.
 */
export interface TopBarProps {
  messages: string[];
}

/** Mas de dos filas no se llegan a leer en el scroll de un hero. */
const MAX_ROWS = 2;

export function TopBar({ messages }: TopBarProps) {
  const rows = messages.filter(Boolean).slice(0, MAX_ROWS);
  const { rootRef, copies } = useTopBar<HTMLDivElement>();

  if (rows.length === 0) return null;

  return (
    <div ref={rootRef} className={styles.root} role="note" aria-label={rows.join(". ")} data-topbar="">
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
    </div>
  );
}
