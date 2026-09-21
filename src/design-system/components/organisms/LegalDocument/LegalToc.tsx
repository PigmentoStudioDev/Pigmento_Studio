"use client";

import { useEffect, useState } from "react";
import styles from "./LegalToc.module.scss";

/**
 * El indice del documento. Es lo UNICO de esta pagina que cruza al navegador, y
 * cruza por una sola razon: decir por donde va la lectura.
 *
 * Un indice pegajoso que no marca donde estas es un menu, no un indice. Se
 * resuelve con `IntersectionObserver`, que es plataforma y no libreria, y marca
 * la entrada con `aria-current`: quien no ve el resaltado lo oye igual.
 *
 * El observador vive aqui y no en `motion/` porque no es movimiento ni se reusa:
 * sacarlo seria un archivo mas para un solo sitio de llamada.
 *
 * `<details>` en vez de un acordeon: en la plantilla de referencia el indice se
 * pliega en movil, y plegar es exactamente lo que este elemento hace sin JS y sin
 * dependencias. Nace abierto, asi que sin JS el indice se ve entero.
 */
export interface LegalTocItem {
  anchor: string;
  heading: string;
  /** 2 es seccion y 3 subseccion. Es lo que sangra la entrada. */
  level: 2 | 3;
}

export interface LegalTocProps {
  /** El rotulo visible, del CMS. */
  title: string;
  /** El nombre accesible del <nav>. Dos navegaciones sin nombre son indistinguibles. */
  label: string;
  items: LegalTocItem[];
}

export function LegalToc({ title, label, items }: LegalTocProps) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    // En el servidor y en jsdom no existe. Sin esta guarda, la pagina revienta
    // donde justamente no hay nada que observar.
    if (typeof IntersectionObserver === "undefined") return;

    const targets = items
      .map((item) => document.getElementById(item.anchor))
      .filter((node): node is HTMLElement => node !== null);

    if (targets.length === 0) return;

    const visibles = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibles.add(entry.target.id);
          else visibles.delete(entry.target.id);
        }

        // La PRIMERA en orden de documento, no la ultima que notifico: con varias
        // secciones a la vista, donde estas es la de mas arriba.
        const primera = items.find((item) => visibles.has(item.anchor));
        if (primera) setActive(primera.anchor);
      },
      {
        /**
         * Solo cuenta el tercio superior de la ventana. Sin recortar por abajo,
         * la ultima seccion corta de un documento nunca llega a estar "a la
         * vista" antes que la anterior y el indice se queda clavado.
         */
        rootMargin: "0px 0px -66% 0px",
      },
    );

    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className={styles.toc} aria-label={label}>
      <details open>
        <summary className={styles.tocTitle}>{title}</summary>

        <ul className={styles.tocList}>
          {items.map((item) => (
            <li key={item.anchor}>
              <a
                className={styles.tocLink}
                href={`#${item.anchor}`}
                data-level={item.level}
                aria-current={active === item.anchor ? "true" : undefined}
              >
                {item.heading}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}
