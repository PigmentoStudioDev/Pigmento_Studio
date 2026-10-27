"use client";

import { useEffect, useRef, type RefObject } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loadMotion, type Motion } from "./gsap";
import { REDUCED_MOTION } from "./breakpoints";
import { FINE_POINTER } from "./useCustomCursor";
import { pauseSmoothScroll, resumeSmoothScroll, scrollToTop } from "./useSmoothScroll";
import { pigmentFor, transitionTarget, type PageTransitionPigment } from "./pageTransition";
import { duration, EXIT_EASE, REVEAL_EASE } from "./tokens";

/**
 * La cortina entre paginas: la coreografia de referencia (dos paneles que suben en
 * secuencia), replicada con gsap y el router de Next en vez de Barba, que tiene su
 * propio DOM.
 *
 * Dos paneles suben en secuencia y tapan la pantalla: el carbon y, encima, el del
 * destino —su pigmento si es la pagina de un servicio—. Mientras suben, la pagina se
 * hunde por debajo con parallax y se apaga, como en la cortina de referencia: la
 * cortina se lleva la pagina en vez de taparla quieta. Cubierta, la ruta cambia; el
 * carbon se va de golpe, el del destino sigue subiendo y la pagina nueva sube con el.
 *
 * Los paneles viven en el DOM del componente y se leen por `data-transition-panel`:
 * en el orden 1 y 2, como en el original.
 *
 * **Donde hay View Transitions, la cortina no sale**: la pagina misma se encoge a placa
 * y vuela mientras la nueva sube (la coreografia esta en `_app.scss`). La transicion
 * arranca en el clic sin esperar la ruta: la ruta se monta mientras la vieja se encoge,
 * y si no llego cuando las placas van a volar, la animacion se detiene ahi hasta que
 * llegue. La cortina queda para el navegador que no la tiene.
 */

/** El atributo del <html> que enciende la coreografia nativa, con la familia del destino. */
const VIEW_ATTRIBUTE = "pageTransition";
/** Mientras la ruta nueva no esta montada: la pagina vieja no asoma en la placa nueva. */
const STAGE_ATTRIBUTE = "pageStage";
const PENDING = "pending";
const VIEW_PSEUDO = "::view-transition";
/** Sin pigmento en el destino, el fondo de la marca. */
const NEUTRAL_COVER = "cover";

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

/** La intencion se juzga como un clic simple: la misma regla dice que enlaces cuentan. */
const INTENT = {
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  defaultPrevented: false,
} as const;

/**
 * Cuanto se hunde la pagina que se va y cuanto sube la que llega, en fraccion de la
 * ventana. Menos que el panel: es parallax, la pagina va mas lenta que lo que la tapa.
 * La que se va ademas se apaga hasta `EXIT_OPACITY`, para que el panel no deje ver un
 * corte nitido por debajo.
 */
const EXIT_SHIFT = -0.25;
const ENTER_SHIFT = 0.12;
const EXIT_OPACITY = 0.4;

type Timeline = ReturnType<Motion["gsap"]["timeline"]>;

interface Run {
  readonly destination: string;
  readonly href: string;
  /** Con View Transitions: avisa de que la ruta nueva ya esta montada. */
  swap: (() => void) | undefined;
  /** Con View Transitions: la transicion en curso, para cortarla al desmontar. */
  view: ViewTransition | undefined;
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
export function usePageTransition(
  root: RefObject<HTMLElement | null>,
  pigments: readonly PageTransitionPigment[] = [],
): void {
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

    // Un <main> no es enfocable por defecto: sin tabindex el foco se quedaria en el
    // cuerpo y el lector de pantalla no anunciaria que la pagina cambio.
    const focusMain = () => {
      const main = document.querySelector<HTMLElement>(MAIN);
      if (!main) return;
      if (!main.hasAttribute("tabindex")) main.tabIndex = -1;
      main.focus({ preventScroll: true });
    };

    const hidePanels = () => {
      // Sin gsap, la cortina se oculta quitando el transform que gsap pudo dejar: el
      // CSS la deja fuera de pantalla bajo el borde.
      panels().forEach((panel) => panel.style.removeProperty("transform"));
    };

    const finish = (run: Run, els: HTMLElement[], gsap: Motion["gsap"], ScrollTrigger: Motion["ScrollTrigger"]) => {
      if (current !== run) return;
      gsap.set(els, { yPercent: 0 });
      const page = document.querySelector<HTMLElement>(MAIN);
      if (page) gsap.set(page, { clearProps: "transform,opacity" });
      resumeSmoothScroll();
      ScrollTrigger.refresh();
      focusMain();
      current = null;
    };

    const reveal = (run: Run) => {
      if (run.revealed || current !== run) return;
      run.revealed = true;
      clearTimeout(run.timer);

      // La nueva arriba ANTES de mostrarla: la placa que sube es la pagina en vivo.
      if (run.swap) {
        scrollToTop();
        run.swap();
        return;
      }

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
          const page = document.querySelector<HTMLElement>(MAIN);
          if (page) {
            enter.fromTo(
              page,
              { y: window.innerHeight * ENTER_SHIFT, opacity: 1 },
              { y: 0, duration: duration("base"), ease: REVEAL_EASE },
              hold,
            );
          }
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
      // Con View Transitions no se esperan fotogramas: la placa nueva es la pagina en
      // vivo y se pinta sola en cuanto la ruta esta en el DOM.
      if (run.swap) {
        reveal(run);
        return;
      }
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

    const clearView = () => {
      const html = document.documentElement;
      delete html.dataset[VIEW_ATTRIBUTE];
      delete html.dataset[STAGE_ATTRIBUTE];
    };

    // Las animaciones de las fotos son CSS de pseudo-elementos del <html>: el documento
    // las devuelve como cualquier otra, con su pseudo-elemento.
    const viewAnimations = (): Animation[] =>
      document.getAnimations().filter((animation) => {
        const effect = animation.effect;
        return effect instanceof KeyframeEffect && (effect.pseudoElement ?? "").startsWith(VIEW_PSEUDO);
      });

    const startView = (run: Run, url: URL) => {
      const html = document.documentElement;
      html.dataset[VIEW_ATTRIBUTE] = pigmentFor(url.pathname, pigments) ?? NEUTRAL_COVER;
      pauseSmoothScroll();

      // El cambio es sincrono a proposito: el navegador congela la pantalla mientras
      // corre, y con la ruta dentro ese congelado era la espera entera (0.13 s en
      // produccion, 1 s en desarrollo). La ruta se pide cuando la animacion ya corre.
      const transition = document.startViewTransition(() => {
        html.dataset[STAGE_ATTRIBUTE] = PENDING;
      });
      run.view = transition;

      let landed = false;
      let held: Animation[] = [];
      run.swap = () => {
        landed = true;
        delete html.dataset[STAGE_ATTRIBUTE];
        held.forEach((animation) => animation.play());
        held = [];
      };

      void transition.updateCallbackDone.catch(() => undefined).then(() => navigate(run));

      // Las placas vuelan al paso base. Si la ruta no llego, se detiene todo ahi: la
      // vieja queda encogida esperando, en vez de que suba una placa vacia.
      void transition.ready
        .then(() => {
          setTimeout(() => {
            if (landed || current !== run) return;
            held = viewAnimations();
            held.forEach((animation) => animation.pause());
          }, duration("base") * 1000);
        })
        .catch(() => undefined);

      void transition.finished
        .catch(() => undefined)
        .then(() => loadMotion())
        .then(({ ScrollTrigger }) => {
          clearView();
          if (current !== run) return;
          resumeSmoothScroll();
          ScrollTrigger.refresh();
          focusMain();
          current = null;
        })
        .catch(() => {
          clearView();
          resumeSmoothScroll();
          current = null;
        });
    };

    const start = (url: URL) => {
      const run: Run = {
        destination: url.pathname,
        href: url.pathname + url.search + url.hash,
        swap: undefined,
        view: undefined,
        arrived: false,
        revealed: false,
        timer: undefined,
        timeline: undefined,
      };
      current = run;

      if (typeof document.startViewTransition === "function") {
        startView(run, url);
        return;
      }

      pauseSmoothScroll();

      loadMotion()
        .then(({ gsap }) => {
          if (current !== run) return;

          const els = panels();
          if (els.length < 2) {
            navigate(run);
            return;
          }

          const family = pigmentFor(url.pathname, pigments);
          if (family) els[1].dataset.family = family;
          else delete els[1].dataset.family;

          // Panel 1 sube; el 2 sale un cuarto despues, asi que nunca se ven las dos quietas.
          run.timeline = gsap.timeline({ onComplete: () => navigate(run) });
          const page = document.querySelector<HTMLElement>(MAIN);
          if (page) {
            run.timeline.to(
              page,
              { y: window.innerHeight * EXIT_SHIFT, opacity: EXIT_OPACITY, duration: duration("base"), ease: EXIT_EASE },
              0,
            );
          }
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

    // Precarga por intencion: Next solo precarga los enlaces que estan a la vista, y el
    // menu y el pie casi nunca lo estan al hacer clic. Sin la ruta en cache la foto de la
    // pagina se quedaba congelada ~0.2 s esperandola (medido en produccion). El puntero
    // encima o el foco llegan antes que el clic, y eso basta para tenerla.
    const prefetched = new Set<string>();
    const onIntent = (event: Event) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link) return;
      const url = transitionTarget(INTENT, link, new URL(window.location.href));
      if (!url || prefetched.has(url.pathname)) return;
      prefetched.add(url.pathname);
      router.prefetch(url.pathname + url.search);
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerover", onIntent, { passive: true });
    document.addEventListener("focusin", onIntent);

    // Gsap se descarga en el primer clic si nadie lo pidio antes. Solo en puntero fino y
    // sin reduced-motion, que son los casos en los que habra una cortina que pintar.
    if (window.matchMedia(FINE_POINTER).matches && !window.matchMedia(REDUCED_MOTION).matches) {
      void loadMotion();
    }

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerover", onIntent);
      document.removeEventListener("focusin", onIntent);
      landed.current = null;
      if (current) {
        current.view?.skipTransition();
        clearView();
        clearTimeout(current.timer);
        current.timeline?.kill();
        current = null;
        resumeSmoothScroll();
        hidePanels();
      }
    };
  }, [root, router, pigments]);
}
