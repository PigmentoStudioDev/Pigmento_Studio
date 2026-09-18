"use client";

import { useEffect, useRef } from "react";
import { getThemeMode } from "../theme/mode";
import { readThemeAssignment, resolveZone, themeZoneClass, THEMED_SELECTOR, type ThemeZone } from "../theme/zone";
import { REDUCED_MOTION } from "./breakpoints";
import {
  CURSOR_INTERACTIVE,
  CURSOR_PRESSED_ATTRIBUTE,
  cursorState,
  readCursorTarget,
  rotationFromDelta,
} from "./cursor";
import { loadMotion, loadScrambleText } from "./gsap";
import { whenPageReady } from "./pageReady";

/**
 * El cursor propio: la flecha del portfolio de Karen y, encima, las variantes que
 * pide cada bloque por atributo.
 *
 * Los dos gestos son los de sus referencias, con gsap: la flecha sigue con un
 * `quickTo` y gira hacia donde se mueve con un lerp en el ticker; la pastilla sigue
 * con el suyo y cambia de texto con ScrambleText.
 *
 * **Toma el tema de lo que tiene debajo.** En el portfolio la flecha cambiaba de color
 * leyendo su propio atributo de seccion; aqui lee el mismo contrato que la cabecera
 * —los atributos de tema de cada seccion— y se pone la zona de Carbon que toca, asi
 * que sus colores son tokens y cambian solos. Sin seccion con tema, la del sitio.
 *
 * Solo con un puntero fino que pase por encima y sin reduced-motion. En cualquier otro
 * caso no se instala nada y queda el cursor del sistema.
 */

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/** Lo que marca la raiz del documento mientras el cursor propio esta a la vista. */
export const CUSTOM_CURSOR_ATTRIBUTE = "data-custom-cursor";

const SCRAMBLE_CHARS = "XYZxy#&@0$€£";

/** Cuanto del giro pendiente recorre la flecha en cada fotograma. */
const ROTATION_LERP = 0.1;

/** Movimiento minimo, en pixeles, para recalcular hacia donde apunta. */
const ROTATION_THRESHOLD_PX = 1;

export function useCustomCursor<T extends HTMLElement>() {
  const rootRef = useRef<T>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!window.matchMedia(FINE_POINTER).matches || window.matchMedia(REDUCED_MOTION).matches) return;

    const pointer = root.querySelector<HTMLElement>("[data-cursor-pointer]");
    const follower = root.querySelector<HTMLElement>("[data-cursor-follower]");
    // Un texto por capa que lo lleve, y se escriben todos: la que no se ve no cuesta
    // nada, y asi el hook no tiene que saber cual es de quien.
    const texts = [...root.querySelectorAll<HTMLElement>("[data-cursor-text-target]")];
    if (!pointer || !follower || texts.length === 0) return;

    let cancelled = false;
    let cleanup = () => {};

    /**
     * Donde esta el puntero, apuntado desde el mount.
     *
     * Tapar el cursor del sistema y pintar el nuestro son el MISMO instante: no se
     * puede esconder el de fuera sin poder dibujar el de dentro, y para dibujarlo
     * hace falta una posicion, que solo llega en un evento. Sin esta libreta, la
     * posicion se conocia por primera vez en el primer movimiento POSTERIOR a que
     * cargara gsap — y hasta entonces el del sistema estaba a la vista; si nadie
     * movia el raton, indefinidamente.
     *
     * La rueda tambien cuenta: trae coordenadas aunque el puntero no se mueva, y
     * hacer scroll es lo primero que pasa en muchas visitas.
     */
    let mouseX = 0;
    let mouseY = 0;
    let placed = false;

    const remember = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      placed = true;
    };

    window.addEventListener("mousemove", remember, { passive: true });
    window.addEventListener("wheel", remember, { passive: true });

    void whenPageReady()
      .then(() => Promise.all([loadMotion(), loadScrambleText()]))
      .then(([{ gsap }]) => {
        if (cancelled) return;

        const html = document.documentElement;

        const pointerX = gsap.quickTo(pointer, "x", {
          duration: 0.35,
          // conformance-exempt: motion-literal — la del portfolio. La flecha llega un pelo tarde y frena, que es lo que la hace sentirse objeto y no puntero.
          ease: "power3",
        });
        const pointerY = gsap.quickTo(pointer, "y", {
          duration: 0.35,
          // conformance-exempt: motion-literal — la misma que el eje X.
          ease: "power3",
        });
        const followerX = gsap.quickTo(follower, "x", {
          duration: 0.4,
          // conformance-exempt: motion-literal — la de la referencia del cursor con texto: la pastilla va un paso por detras de la flecha.
          ease: "power3.out",
        });
        const followerY = gsap.quickTo(follower, "y", {
          duration: 0.4,
          // conformance-exempt: motion-literal — la misma que el eje X.
          ease: "power3.out",
        });

        // La libreta temprana ya no hace falta: los manejadores de abajo apuntan la
        // posicion ellos mismos y ademas mueven las capas.
        window.removeEventListener("mousemove", remember);
        window.removeEventListener("wheel", remember);

        let lastX = 0;
        let lastY = 0;
        let visible = false;
        let frame = 0;
        let rotation = 0;
        let targetRotation = 0;
        let interactive = false;
        let zone: ThemeZone | null = null;
        let activeElement: Element | null = null;

        const setZone = (next: ThemeZone) => {
          if (next === zone) return;
          if (zone) root.classList.remove(themeZoneClass(zone));
          root.classList.add(themeZoneClass(next));
          zone = next;
        };

        const update = () => {
          frame = 0;
          const under = document.elementFromPoint(mouseX, mouseY);

          const themed = under?.closest(THEMED_SELECTOR);
          setZone(resolveZone(getThemeMode(), themed ? readThemeAssignment(themed) : undefined));

          const nextInteractive = Boolean(under?.closest(CURSOR_INTERACTIVE));
          if (nextInteractive !== interactive) {
            interactive = nextInteractive;
            gsap.to(pointer, {
              scale: interactive ? 1.4 : 1,
              duration: 0.25,
              // conformance-exempt: motion-literal — la del portfolio para el crecimiento sobre algo pulsable.
              ease: "power2.out",
            });
          }

          const target = readCursorTarget(under);
          const overflows = follower.getBoundingClientRect().right >= window.innerWidth;
          root.setAttribute("data-cursor-variant", target.variant);
          follower.setAttribute("data-cursor-state", cursorState(target.variant, overflows));

          if (target.element !== activeElement) {
            activeElement = target.element;
            gsap.to(texts, {
              duration: 0.6,
              overwrite: "auto",
              scrambleText: { text: target.text, chars: SCRAMBLE_CHARS, speed: 1.2 },
            });
          }
        };

        const schedule = () => {
          if (!frame) frame = requestAnimationFrame(update);
        };

        const reveal = () => {
          if (visible) return;
          visible = true;
          html.setAttribute(CUSTOM_CURSOR_ATTRIBUTE, "");
          // Aparece donde esta el puntero, no deslizandose desde la esquina.
          gsap.set([pointer, follower], { x: mouseX, y: mouseY });
          lastX = mouseX;
          lastY = mouseY;
        };

        const onMove = (event: MouseEvent) => {
          remember(event);
          reveal();

          pointerX(mouseX);
          pointerY(mouseY);
          followerX(mouseX);
          followerY(mouseY);

          const dx = mouseX - lastX;
          const dy = mouseY - lastY;
          if (Math.abs(dx) > ROTATION_THRESHOLD_PX || Math.abs(dy) > ROTATION_THRESHOLD_PX) {
            targetRotation = rotationFromDelta(dx, dy);
          }
          lastX = mouseX;
          lastY = mouseY;

          schedule();
        };

        const onScroll = () => {
          if (visible) schedule();
        };

        // El aprieto del disco mientras se arrastra. Va en la raiz y lo pinta la hoja:
        // es un cambio de forma, no una animacion que haya que conducir desde aqui.
        const onPress = () => html.setAttribute(CURSOR_PRESSED_ATTRIBUTE, "");
        const onRelease = () => html.removeAttribute(CURSOR_PRESSED_ATTRIBUTE);

        const onLeave = () => {
          visible = false;
          html.removeAttribute(CUSTOM_CURSOR_ATTRIBUTE);
          onRelease();
        };

        const tick = () => {
          rotation += (targetRotation - rotation) * ROTATION_LERP;
          gsap.set(pointer, { rotation });
        };

        gsap.ticker.add(tick);
        window.addEventListener("mousemove", onMove);
        // WheelEvent ES un MouseEvent: mismo camino, y asi un scroll sin mover el
        // raton tambien descubre el cursor propio.
        window.addEventListener("wheel", onMove, { passive: true });
        window.addEventListener("pointerdown", onPress);
        window.addEventListener("pointerup", onRelease);
        window.addEventListener("pointercancel", onRelease);
        window.addEventListener("scroll", onScroll, { passive: true });
        html.addEventListener("mouseleave", onLeave);

        // Si el puntero ya se movio mientras cargaba, no hay que esperar otro gesto.
        if (placed) {
          reveal();
          schedule();
        }

        cleanup = () => {
          gsap.ticker.remove(tick);
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("wheel", onMove);
          window.removeEventListener("pointerdown", onPress);
          window.removeEventListener("pointerup", onRelease);
          window.removeEventListener("pointercancel", onRelease);
          window.removeEventListener("scroll", onScroll);
          html.removeEventListener("mouseleave", onLeave);
          cancelAnimationFrame(frame);
          gsap.killTweensOf([pointer, follower, ...texts]);
          html.removeAttribute(CUSTOM_CURSOR_ATTRIBUTE);
          html.removeAttribute(CURSOR_PRESSED_ATTRIBUTE);
          root.removeAttribute("data-cursor-variant");
          if (zone) root.classList.remove(themeZoneClass(zone));
        };
      });

    return () => {
      cancelled = true;
      window.removeEventListener("mousemove", remember);
      window.removeEventListener("wheel", remember);
      cleanup();
    };
  }, []);

  return rootRef;
}
