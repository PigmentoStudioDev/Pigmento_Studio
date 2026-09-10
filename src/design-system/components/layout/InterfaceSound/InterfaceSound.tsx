"use client";

import { useEffect } from "react";
import { getSoundEnabled, subscribeSoundEnabled } from "../../../sound/mode";
import { releaseInterfaceSound, setInterfaceSound } from "../../../sound/uisfx";

/**
 * Instala el sonido de la interfaz. No pinta nada.
 *
 * Vive en layout/ por lo mismo que SmoothScroll: no aporta contenido ni forma, aporta
 * un comportamiento a la pagina entera. Y es un componente y no una llamada suelta en
 * el layout porque el layout es server component — alguien tiene que cruzar la
 * frontera, y que ese alguien sea un archivo que devuelve `null` es justo lo que
 * mantiene el resto en el servidor.
 *
 * Escucha la preferencia y no la impone: quien enciende es el conmutador del menu.
 * Mientras este apagada —que es como arranca— aqui no se carga nada.
 */
export function InterfaceSound() {
  useEffect(() => {
    let cancelled = false;

    const apply = () => {
      if (cancelled) return;
      void setInterfaceSound(getSoundEnabled());
    };

    apply();
    const unsubscribe = subscribeSoundEnabled(apply);

    return () => {
      cancelled = true;
      unsubscribe();
      void releaseInterfaceSound();
    };
  }, []);

  return null;
}
