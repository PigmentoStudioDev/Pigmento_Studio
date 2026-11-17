"use client";

import { useState } from "react";
import styles from "./ServicesList.module.scss";

/**
 * La lista de servicios como acordeon: numero gris, nombre y un `+` por fila, y un
 * filete de lado a lado entre filas. Se abre una fila a la vez; el parrafo se despliega
 * con la altura animada (0fr a 1fr), sin medirla.
 */
export interface ServicesListItem {
  name: string;
  text: string;
}

export interface ServicesListProps {
  items: ServicesListItem[];
}

export function ServicesList({ items }: ServicesListProps) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <ul className={styles.list}>
      {items.map((item, index) => {
        const expanded = open === index;
        const panelId = `service-panel-${index}`;

        return (
          <li key={item.name} className={styles.row} data-open={expanded || undefined}>
            <h3 className={styles.heading}>
              <button
                type="button"
                className={styles.trigger}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : index)}
              >
                <span className={styles.number} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.name}>{item.name}</span>
                <span className={styles.plus} aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} role="region" aria-label={item.name} className={styles.panel}>
              <div className={styles.inner}>
                <p className={styles.text}>{item.text}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
