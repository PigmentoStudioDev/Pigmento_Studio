"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "../../atoms/Icon/Icon";
import {
  getServerSoundEnabled,
  getSoundEnabled,
  setSoundEnabled,
  subscribeSoundEnabled,
} from "../../../sound/mode";
import styles from "./SoundToggle.module.scss";

/**
 * El interruptor del sonido de la interfaz.
 *
 * **Si lee el estado desde React**, al reves que el conmutador de tema. Alli el estado
 * lo pinta el CSS desde una bandera que index.scss declara en la raiz, asi que React no
 * tiene que enterarse; aqui no hay tal bandera —el sonido no tiene representacion en la
 * hoja— y el icono tiene que decir si esta encendido o apagado.
 *
 * El precio es el conocido: el servidor no conoce la preferencia, asi que su marca es
 * siempre "apagado" y quien lo tenga encendido ve un fotograma con el icono cruzado
 * antes de hidratar. Se acepta porque el default ES apagado: ese fotograma solo lo ve
 * quien ya lo encendio alguna vez, y dice la verdad hasta que el store contesta.
 *
 * `aria-pressed` y no dos etiquetas distintas: es un interruptor, y el estado se
 * anuncia por su atributo en vez de escribirlo en el nombre.
 */
export interface SoundToggleProps {
  label: string;
}

export function SoundToggle({ label }: SoundToggleProps) {
  const enabled = useSyncExternalStore(
    subscribeSoundEnabled,
    getSoundEnabled,
    getServerSoundEnabled,
  );

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={enabled}
      onClick={() => setSoundEnabled(!enabled)}
      className={styles.root}
    >
      <Icon name={enabled ? "sound" : "mute"} />
    </button>
  );
}
