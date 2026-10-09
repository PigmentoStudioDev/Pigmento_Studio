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
 * HACK: con el dedo no hay ni hover ni foco, asi que en tactil el bucle no se puede
 * parar. Cubrirlo entero pide un control visible —o un conmutador de movimiento en la
 * barra, junto a los de tema y sonido—, y eso es una pieza de interfaz que decide
 * Pigmento. Subirlo cuando una tira lleve texto que haya que LEER: hoy son logos y un
 * mensaje de paso que se repite, y el coste de no poder pararlos es bajo.
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
  const pause = () => animations().forEach((animation) => animation.pause());
  const resume = () => animations().forEach((animation) => animation.resume());

  root.addEventListener("pointerenter", pause);
  root.addEventListener("pointerleave", resume);
  root.addEventListener("focusin", pause);
  root.addEventListener("focusout", resume);

  return () => {
    root.removeEventListener("pointerenter", pause);
    root.removeEventListener("pointerleave", resume);
    root.removeEventListener("focusin", pause);
    root.removeEventListener("focusout", resume);
    // Sin esto, desmontar con el puntero encima deja el bucle pausado para siempre si
    // el consumidor reusa la animacion.
    resume();
  };
}
