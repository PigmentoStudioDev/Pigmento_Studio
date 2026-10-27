import { getMotionPaused, subscribeMotionPaused } from "./motionPause";

/**
 * El interruptor de un bucle infinito: se para cuando alguien se acerca a el.
 *
 * **Es un requisito, no un detalle.** WCAG 2.2.2 (nivel A) pide que todo lo que se
 * mueve solo, dura mas de cinco segundos y convive con otro contenido se pueda
 * detener. Una marquesina y una barra de promos caen de lleno ahi: arrancan sin que
 * nadie las pida y no paran nunca. `prefers-reduced-motion` no cubre esto — apaga el
 * movimiento para quien declaro la preferencia en su sistema, y el criterio habla de
 * quien no la tiene puesta y aun asi necesita leer algo quieto.
 *
 * El mecanismo es acercarse: el puntero encima o el foco dentro. Las dos cosas a la
 * vez porque son dos maneras distintas de llegar — `pointerenter` no existe para
 * quien navega con teclado, y `focusin` no se dispara al pasar el raton.
 *
 * Se para y se REANUDA donde estaba, nunca se reinicia: una tira que vuelve a su
 * origen al quitar el raton se lee como un fallo de pintado.
 *
 * Y para siempre que el conmutador global de movimiento (motionPause.ts) este en
 * pausa: acercarse no basta para WCAG 2.2.2 —W3C no lo cuenta como mecanismo, y en
 * tactil no existe—, y el conmutador es el control visible que el criterio pide.
 *
 * Las tres razones se llevan por separado y el bucle solo se reanuda cuando no queda
 * ninguna. Con una sola señal, mover el foco entre dos hijos (focusout + focusin)
 * reanudaba y paraba en un parpadeo, y sacar el puntero con el foco dentro lo
 * arrancaba aunque el foco siguiera ahi.
 */

/** Lo minimo que se le pide a un tween o una timeline. Estructural para no importar gsap: su unica puerta es `motion/gsap.ts`. */
export interface Pausable {
  pause(): void;
  resume(): void;
}

/**
 * Engancha el interruptor y devuelve su limpieza.
 *
 * `animations` se lee en cada evento y no se copia: un consumidor puede anadir piezas
 * al bucle despues de enganchar esto, y una copia dejaria fuera las nuevas.
 */
export function pauseOnIntent(root: HTMLElement, animations: () => Pausable[]): () => void {
  let hovered = false;
  let focused = false;
  let paused = false;

  const sync = () => {
    const next = hovered || focused || getMotionPaused();
    if (next === paused) return;
    paused = next;
    animations().forEach((animation) => (paused ? animation.pause() : animation.resume()));
  };

  const onEnter = () => {
    hovered = true;
    sync();
  };
  const onLeave = () => {
    hovered = false;
    sync();
  };
  const onFocusIn = () => {
    focused = true;
    sync();
  };
  // El foco que solo pasa de un hijo a otro no ha salido.
  const onFocusOut = (event: FocusEvent) => {
    if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return;
    focused = false;
    sync();
  };

  root.addEventListener("pointerenter", onEnter);
  root.addEventListener("pointerleave", onLeave);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);
  const unsubscribe = subscribeMotionPaused(sync);
  sync();

  return () => {
    root.removeEventListener("pointerenter", onEnter);
    root.removeEventListener("pointerleave", onLeave);
    root.removeEventListener("focusin", onFocusIn);
    root.removeEventListener("focusout", onFocusOut);
    unsubscribe();
    // Sin esto, desmontar con el puntero encima deja el bucle pausado para siempre si
    // el consumidor reusa la animacion.
    if (paused) animations().forEach((animation) => animation.resume());
  };
}
