"use client";

import { useEffect, useRef, type RefObject } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loadMotion, type Motion } from "./gsap";
import { REDUCED_MOTION } from "./breakpoints";
import { FINE_POINTER } from "./useCustomCursor";
import { pauseSmoothScroll, resumeSmoothScroll, scrollToTop } from "./useSmoothScroll";
import { transitionTarget } from "./pageTransition";
import { duration, EXIT_EASE, REVEAL_EASE } from "./tokens";

/**
 * La cortina entre paginas: la coreografia de referencia (dos paneles que suben en
 * secuencia), replicada con gsap y el router de Next en vez de Barba, que tiene su
 * propio DOM.
 *
 * Dos paneles suben en secuencia y tapan la pantalla. Cubierta, la pagina cambia por
 * debajo; el primer panel se va de golpe y el segundo sigue subiendo hasta salir.
 *
 * Los paneles viven en el DOM del componente y se leen por `data-transition-panel`:
 * en el orden 1 y 2, como en el original.
 */

/** Los paneles se leen por atributo y no por clase: el orden es parte del contrato. */
const PANEL = "[data-transition-panel]";
const TITLE = "[data-transition-title]";
const MAIN = "main";

/**
 * Red de seguridad: si la ruta no llega en este tiempo, la cortina se levanta igual.
 * Sin ella, una navegacion fallida dejaria la pantalla tapada para siempre. Es un
 * tiempo de rescate y no de animacion, por eso va como constante con nombre y no como
 * duracion de la escala.
 */
const SAFETY_MS = 2500;

type Timeline = ReturnType<Motion["gsap"]["timeline"]>;

interface Run {
  readonly destination: string;
  readonly href: string;
  arrived: boolean;
  revealed: boolean;
  timer: ReturnType<typeof setTimeout> | undefined;
  timeline: Timeline | undefined;
}

/**
 * Pide la pagina con la cortina. El clic se cancela solo si el enlace va a cruzarla:
 * con reduced-motion, o en cualquier clic que el navegador deba resolver solo, no se
 * toca nada.
 */
export function usePageTransition(root: RefObject<HTMLElement | null>): void {
  const pathname = usePathname();
  const router = useRouter();
  const landed = useRef<((path: string) => void) | null>(null);

  useEffect(() => {
    landed.current?.(pathname);
  }, [pathname]);

  useEffect(() => {
    let current: Run | null = null;

    const panels = (): HTMLElement[] =>
      Array.from(root.current?.querySelectorAll<HTMLElement>(PANEL) ?? []);

    const hidePanels = () => {
      // Sin gsap, la cortina se oculta quitando el transform que gsap pudo dejar: el
      // CSS la deja fuera de pantalla bajo el borde.
      panels().forEach((panel) => panel.style.removeProperty("transform"));
    };

    const finish = (run: Run, els: HTMLElement[], gsap: Motion["gsap"], ScrollTrigger: Motion["ScrollTrigger"]) => {
      if (current !== run) return;
      gsap.set(els, { yPercent: 0 });
      resumeSmoothScroll();
      ScrollTrigger.refresh();
      // Un <main> no es enfocable por defecto: sin tabindex el foco se quedaria en el
      // cuerpo y el lector de pantalla no anunciaria que la pagina cambio.
      const main = document.querySelector<HTMLElement>(MAIN);
      if (main) {
        if (!main.hasAttribute("tabindex")) main.tabIndex = -1;
        main.focus({ preventScroll: true });
      }
      current = null;
    };

    const reveal = (run: Run) => {
      if (run.revealed || current !== run) return;
      run.revealed = true;
      clearTimeout(run.timer);

      loadMotion()
        .then(({ gsap, ScrollTrigger }) => {
          if (current !== run) return;

          // La pagina nueva empieza arriba, aunque el navegador ya lo haya intentado:
          // Lenis conserva su propia posicion y lo pisaria sin esto.
          scrollToTop();

          const els = panels();
          const title = document.querySelector<HTMLElement>(TITLE);
          // Sin espera extra: en el original `startEnter` (0.9s) coincide con el final
          // del barrido de salida, y aqui la navegacion ya arranca cuando cubrio. Sumar
          // otra espera dejaba la pantalla tapada ~3s.
          const hold = 0;

          const enter = gsap.timeline({ onComplete: () => finish(run, els, gsap, ScrollTrigger) });
          enter.set(els[0], { yPercent: -200 }, hold);
          enter.to(els[1], { yPercent: -200, duration: duration("base"), ease: REVEAL_EASE }, hold);
          if (title) {
            enter.fromTo(
              title,
              { yPercent: 100 },
              { yPercent: 0, duration: duration("base"), ease: REVEAL_EASE },
              hold,
            );
          }
        })
        .catch(() => {
          // Sin gsap no hay cortina que levantar: se quita lo que hubiera y se libera el
          // scroll para que la pagina quede usable.
          hidePanels();
          resumeSmoothScroll();
          current = null;
        });
    };

    // Dos fotogramas: el primero deja que React confirme la ruta, y el segundo que el
    // navegador pinte la pagina nueva antes de levantar la cortina.
    const arrive = (run: Run) => {
      if (run.arrived || run.revealed) return;
      run.arrived = true;
      requestAnimationFrame(() => requestAnimationFrame(() => reveal(run)));
    };

    landed.current = (path) => {
      if (!current || path !== current.destination) return;
      arrive(current);
    };

    const navigate = (run: Run) => {
      router.push(run.href);
      run.timer = setTimeout(() => reveal(run), SAFETY_MS);
    };

    const start = (url: URL) => {
      const run: Run = {
        destination: url.pathname,
        href: url.pathname + url.search + url.hash,
        arrived: false,
        revealed: false,
        timer: undefined,
        timeline: undefined,
      };
      current = run;
      pauseSmoothScroll();

      loadMotion()
        .then(({ gsap }) => {
          if (current !== run) return;

          const els = panels();
          if (els.length < 2) {
            navigate(run);
            return;
          }

          // Panel 1 sube; el 2 sale un cuarto despues, asi que nunca se ven las dos quietas.
          run.timeline = gsap.timeline({ onComplete: () => navigate(run) });
          run.timeline.to(els[0], { yPercent: -100, duration: duration("base"), ease: EXIT_EASE });
          run.timeline.to(
            els[1],
            { yPercent: -100, duration: duration("base"), ease: EXIT_EASE },
            // Un cuarto y no media: con media el segundo panel cubria a los 0.9s y el
            // click se sentia lejos de la respuesta. Asi cubre a los 0.75s.
            duration("quarter"),
          );
        })
        .catch(() => {
          // Sin gsap no hay cortina: se navega directo y la pagina no queda tapada.
          if (current !== run) return;
          navigate(run);
        });
    };

    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link) return;

      const url = transitionTarget(event, link, new URL(window.location.href));
      if (!url) return;
      if (window.matchMedia(REDUCED_MOTION).matches) return;

      event.preventDefault();
      if (current) return;

      start(url);
    };

    document.addEventListener("click", onClick, true);

    // Gsap se descarga en el primer clic si nadie lo pidio antes. Solo en puntero fino y
    // sin reduced-motion, que son los casos en los que habra una cortina que pintar.
    if (window.matchMedia(FINE_POINTER).matches && !window.matchMedia(REDUCED_MOTION).matches) {
      void loadMotion();
    }

    return () => {
      document.removeEventListener("click", onClick, true);
      landed.current = null;
      if (current) {
        clearTimeout(current.timer);
        current.timeline?.kill();
        current = null;
        resumeSmoothScroll();
        hidePanels();
      }
    };
  }, [root, router]);
}
