/**
 * La preferencia de sonido: un store externo, igual que el modo de tema y por las
 * mismas razones — se lee antes de que React exista, sobrevive a la recarga, y la
 * consultan piezas que no comparten ancestro (el conmutador del menu y el instalador
 * del layout estan en ramas distintas).
 *
 * **Arranca APAGADO, y no es timidez.** Un sitio que empieza a sonar sin que nadie lo
 * haya pedido es de las pocas cosas que un visitante no puede deshacer a tiempo: para
 * cuando encuentra el interruptor, ya ha sonado. Ademas ningun navegador deja arrancar
 * audio sin un gesto, asi que la alternativa real no es "suena desde el principio",
 * es "suena de golpe en el primer clic que des".
 *
 * De ahi sale una propiedad util: el clic que enciende el sonido ES el gesto de
 * confianza que Web Audio necesita para desbloquearse. No hay que buscar otro.
 */
export const SOUND_STORAGE_KEY = "pigmento-sound";

const listeners = new Set<() => void>();

let current: boolean | null = null;

function stored(): boolean | null {
  try {
    const value = localStorage.getItem(SOUND_STORAGE_KEY);
    return value === "on" ? true : value === "off" ? false : null;
  } catch {
    // Modo privado de Safari y navegadores con el almacenamiento bloqueado: tirar
    // aqui dejaria el sitio sin sonido Y sin poder encenderlo.
    return null;
  }
}

export function getSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  current ??= stored() ?? false;
  return current;
}

/** El servidor no tiene preferencia que leer, y el default es el mismo: apagado. */
export function getServerSoundEnabled(): boolean {
  return false;
}

export function setSoundEnabled(enabled: boolean) {
  current = enabled;

  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Sin persistencia el sonido sigue como este en esta pestana. Se pierde al
    // recargar, y esa es toda la consecuencia.
  }

  listeners.forEach((listener) => listener());
}

export function subscribeSoundEnabled(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
