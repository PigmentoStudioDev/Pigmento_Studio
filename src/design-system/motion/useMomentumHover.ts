"use client";

import { useEffect, useRef } from "react";
import { REDUCED_MOTION } from "./breakpoints";
import { loadInertia, loadMotion } from "./gsap";

/**
 * El puntero EMPUJA lo que toca, y lo empujado vuelve a su sitio con inercia.
 *
 * No es un hover que escala ni una tarjeta que se inclina siguiendo al raton: es un
 * golpe. Se mide la velocidad del puntero mientras cruza el bloque y, al entrar en una
 * pieza, esa velocidad se convierte en la velocidad INICIAL de un tiro — desplazamiento
 * y giro— que se frena solo. Pasar despacio casi no la mueve; cruzar rapido la manda
 * lejos y la deja volviendo.
 *
 * El giro sale de un TORQUE de verdad y no de la posicion del cursor: es el producto
 * cruzado entre el brazo —del centro de la pieza al puntero— y el vector velocidad. Por
 * eso entrar por una esquina la hace girar y entrar por el centro no, igual que
 * empujar una mesa.
 *
 * **Aqui el movimiento SI vive en JS, y es la excepcion honesta al reparto de la casa.**
 * Lo que decide este gesto es una fisica —masa, velocidad, resistencia— y una
 * transicion de CSS no puede tomar una velocidad de entrada. Lo que se mantiene es lo
 * de siempre: gsap entra por su unica puerta y la preferencia de movimiento reducido se
 * consulta antes de crear nada.
 */
export interface MomentumHoverOptions {
  /** Cuanto multiplica la velocidad del puntero al desplazamiento. */
  strength?: number;
  /** Cuanto multiplica el torque al giro. */
  spin?: number;
  /** Cuanto frena. Mas alto, antes se para. */
  resistance?: number;
}

/**
 * La marca de lo que se mueve. La pone el componente en la pieza que ha de volar, que
 * NO es la que escucha: quien escucha es su envoltorio, que se queda quieto — si el
 * que se mueve fuera el mismo que escucha, salir de el por haberse movido dispararia
 * otra entrada, y la pieza se quedaria rebotando sola.
 */
export const MOMENTUM_TARGET = "data-momentum-target";

const DEFAULTS = {
  strength: 30,
  spin: 20,
  resistance: 200,
} as const;

/**
 * Techos del tiro, en px/s y grados/s. No son gusto: sin ellos, un raton gaming a
 * mitad de pantalla manda la tarjeta a tres pantallas de distancia y la deja volviendo
 * durante segundos.
 */
const MAX_SPEED = 1080;
const MAX_SPIN = 60;

export function useMomentumHover<T extends HTMLElement>({
  strength = DEFAULTS.strength,
  spin = DEFAULTS.spin,
  resistance = DEFAULTS.resistance,
}: MomentumHoverOptions = {}) {
  const rootRef = useRef<T>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    /**
     * Sin puntero fino no hay gesto que traducir: un dedo no tiene velocidad de
     * entrada, tiene un toque. Y con movimiento reducido, una tarjeta que sale
     * disparada es exactamente lo que la preferencia pide evitar.
     */
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia(REDUCED_MOTION).matches) return;

    let cancelled = false;
    let detach: (() => void) | undefined;

    void Promise.all([loadMotion(), loadInertia()]).then(([{ gsap }]) => {
      if (cancelled) return;

      const clampSpeed = gsap.utils.clamp(-MAX_SPEED, MAX_SPEED);
      const clampSpin = gsap.utils.clamp(-MAX_SPIN, MAX_SPIN);

      // La velocidad del puntero se mide UNA vez por fotograma. Sin esta rejilla, un
      // raton de 1000Hz hace la cuenta mil veces por segundo para alimentar una
      // animacion que se dibuja sesenta.
      let lastX = 0;
      let lastY = 0;
      let speedX = 0;
      let speedY = 0;
      let frame = 0;

      const track = (event: MouseEvent) => {
        if (frame) return;

        frame = requestAnimationFrame(() => {
          speedX = event.clientX - lastX;
          speedY = event.clientY - lastY;
          lastX = event.clientX;
          lastY = event.clientY;
          frame = 0;
        });
      };

      const throwPiece = (event: MouseEvent, target: HTMLElement) => {
        const box = target.getBoundingClientRect();

        // El brazo: del centro de la pieza al punto por donde entro el puntero.
        const armX = event.clientX - (box.left + box.width / 2);
        const armY = event.clientY - (box.top + box.height / 2);

        // Producto cruzado de brazo y velocidad. Normalizado por la longitud del
        // brazo, para que el giro dependa de la VELOCIDAD y no de por donde se entro:
        // sin dividir, rozar una esquina lejana giraria mas que un golpe fuerte.
        const torque = armX * speedY - armY * speedX;
        const arm = Math.hypot(armX, armY) || 1;

        gsap.to(target, {
          inertia: {
            x: { velocity: clampSpeed(speedX * strength), end: 0 },
            y: { velocity: clampSpeed(speedY * strength), end: 0 },
            rotation: { velocity: clampSpin((torque / arm) * spin), end: 0 },
            resistance,
          },
        });
      };

      const pieces = [...root.querySelectorAll<HTMLElement>(`[${MOMENTUM_TARGET}]`)];
      const enter = new Map<HTMLElement, (event: MouseEvent) => void>();

      pieces.forEach((piece) => {
        // Escucha el PADRE y se mueve el hijo. Ver la nota de MOMENTUM_TARGET: si
        // escuchara el que se mueve, apartarse contaria como salir y volver a entrar.
        const listener = (event: MouseEvent) => throwPiece(event, piece);
        const host = piece.parentElement ?? piece;

        host.addEventListener("mouseenter", listener);
        enter.set(host, listener);
      });

      root.addEventListener("mousemove", track);

      detach = () => {
        root.removeEventListener("mousemove", track);
        enter.forEach((listener, host) => host.removeEventListener("mouseenter", listener));
        cancelAnimationFrame(frame);
        gsap.killTweensOf(pieces);
        // Las piezas vuelven a su sitio: un tween muerto a mitad de vuelo deja la
        // tarjeta torcida, y el siguiente montaje la hereda asi.
        gsap.set(pieces, { x: 0, y: 0, rotation: 0 });
      };
    });

    return () => {
      cancelled = true;
      detach?.();
    };
  }, [strength, spin, resistance]);

  return rootRef;
}
