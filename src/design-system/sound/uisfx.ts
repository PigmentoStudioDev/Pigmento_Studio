"use client";

import { getSoundEnabled } from "./mode";

/**
 * La unica puerta de uisfx al proyecto, igual que `motion/gsap.ts` lo es de gsap.
 *
 * Se carga bajo demanda y solo cuando alguien enciende el sonido: quien nunca toque el
 * interruptor no descarga ni un byte de la libreria. Son 12kb comprimidos, pero el
 * argumento no es el peso — es que un sitio silencioso no tiene por que traerse un
 * motor de audio.
 *
 * **Los sonidos se SINTETIZAN, no se descargan.** uisfx los genera con Web Audio desde
 * recetas deterministas, asi que no hay archivos que servir ni una peticion que pueda
 * fallar a mitad de un clic. El paquete trae ademas 936 mp3/ogg para quien los
 * necesite; nosotros no los tocamos.
 *
 * El enlace con el DOM es DECLARATIVO: `bindUISFX` escucha en el documento y cada
 * elemento dice que suena con un atributo. Eso es lo que permite que un boton
 * renderizado en el servidor tenga sonido sin cruzar al navegador — el atributo viaja
 * en el HTML, y el unico que cruza es el instalador.
 */
export type SoundCue = "press" | "select" | "open" | "close" | "expand" | "collapse" | "toggle-on";

/**
 * El pack, que es la personalidad sonora. Los doce implementan las mismas senales, asi
 * que cambiarlo aqui cambia el sitio entero sin tocar un solo atributo.
 *
 * TODO(brand): `minimal` es el mas neutro de los doce y por eso es el punto de partida,
 * igual que los azules de Carbon lo son del color. Hay once mas que auditar.
 */
const PACK = "minimal";

/** Volumen maestro. Un sonido de interfaz acompana; si se nota, molesta. */
const VOLUME = 0.4;

type Binding = Awaited<ReturnType<typeof bind>>;

async function bind() {
  const { bindUISFX } = await import("uisfx");

  return bindUISFX(document, {
    pack: PACK,
    volume: VOLUME,
    // La preferencia la lleva `sound/mode.ts` y no la libreria: el conmutador tiene que
    // poder pintar su estado antes de que nada se cargue, y para eso el store tiene que
    // ser nuestro y sincrono.
    enabled: getSoundEnabled(),
  });
}

let binding: Binding | null = null;
let pending: Promise<Binding> | null = null;

/**
 * Cuantas veces se ha soltado el enlace. Es lo que distingue una carga que todavia
 * sirve de una que llego tarde.
 *
 * Hace falta porque cargar es asincrono y desmontar no: en desarrollo React monta,
 * desmonta y vuelve a montar cada efecto para destapar justo esta clase de fallo, y
 * sin esta cuenta el enlace que resolvia mientras tanto se guardaba DESPUES de haberlo
 * soltado — dejando un AudioContext vivo que nadie cierra y otro que se cierra dos
 * veces. El sintoma es un `InvalidStateError: Cannot close a closed AudioContext`.
 */
let generation = 0;

/**
 * Enciende o apaga el sonido de la interfaz. La primera vez que se enciende carga la
 * libreria y desbloquea el audio con el gesto que la llamo.
 *
 * `unlock()` necesita un gesto de confianza — un clic o una tecla de verdad — y por eso
 * esta funcion se llama DESDE el manejador del conmutador y no desde un efecto: un
 * efecto no es un gesto, y el navegador lo rechaza en silencio.
 */
export async function setInterfaceSound(enabled: boolean): Promise<void> {
  if (!enabled) {
    binding?.player.setEnabled(false);
    binding?.player.stopAll();
    return;
  }

  const mine = generation;

  pending ??= bind();
  const ready = await pending;

  // Se solto mientras cargaba: este enlace ya no es de nadie, y hay que cerrarlo aqui
  // porque quien solto no llego a verlo.
  if (mine !== generation) {
    ready.unbind();
    await ready.player.destroy();
    return;
  }

  binding = ready;
  binding.player.setEnabled(true);
  await binding.player.unlock();
}

/** Suelta el enlace con el documento. Lo llama el instalador al desmontarse. */
export async function releaseInterfaceSound(): Promise<void> {
  generation += 1;

  // Se toma y se borra ANTES de esperar. Cerrar es asincrono, y con dos soltadas
  // seguidas —lo normal en desarrollo— las dos verian el mismo enlace y las dos
  // llamarian a destroy sobre un contexto que la primera ya cerro.
  const current = binding;
  binding = null;
  pending = null;

  if (!current) return;

  current.unbind();
  await current.player.destroy();
}
