"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "../../atoms/Icon/Icon";
import { getServerThemeMode, getThemeMode, setThemeMode, subscribeThemeMode } from "../../../theme/mode";
import styles from "./ThemeToggle.module.scss";

/**
 * El conmutador de modo: un sol y una luna en una tira vertical que se desliza y
 * gira un cuarto de vuelta al cambiar.
 *
 * **No lee el modo desde React, y esa es la decision que sostiene todo lo demas.**
 * El estado visual lo pinta el CSS desde `--pg-mode-dark`, la bandera que index.scss
 * declara en la raiz. Con estado de React harian falta las tres cosas que esto
 * evita: un `useSyncExternalStore`, un `suppressHydrationWarning` — el servidor no
 * puede saber la preferencia, asi que su marca nunca coincidiria — y un fotograma
 * con el icono equivocado antes de hidratar.
 *
 * De React solo queda el clic, y por eso el componente es de cliente. Lo que cruza
 * la frontera son unas pocas lineas de manejador, no el dibujo.
 *
 * El nombre accesible NO dice el estado ("cambiar a oscuro"), dice la accion. Un
 * nombre que depende del modo volveria a traer la marca distinta en servidor y
 * cliente por la puerta de atras, y ademas obliga a mantener dos cadenas para un
 * control que hace una sola cosa.
 */
export interface ThemeToggleProps {
  label: string;
}

export function ThemeToggle({ label }: ThemeToggleProps) {
  // El modo se lee en el momento del clic y no en el render: fuera del manejador no
  // hace falta saberlo, y pedirlo en el render seria pedir que el servidor lo sepa.
  const mode = useSyncExternalStore(subscribeThemeMode, getThemeMode, getServerThemeMode);
  const toggle = () => setThemeMode(mode === "dark" ? "light" : "dark");

  // Patron de interruptor: el nombre dice QUE es ("modo oscuro") y aria-pressed si
  // esta puesto. Sin el estado, un lector de pantalla oia el mismo boton en los dos
  // modos y no habia forma de saber cual estaba activo. El nombre sigue fijo, que es
  // lo que evita el desajuste entre servidor y cliente.
  return (
    <button type="button" aria-label={label} aria-pressed={mode === "dark"} onClick={toggle} className={styles.root}>
      <span aria-hidden="true" className={styles.track}>
        <span className={styles.face}>
          <Icon name="sun" />
        </span>
        <span className={styles.face}>
          <Icon name="moon" />
        </span>
      </span>
    </button>
  );
}
