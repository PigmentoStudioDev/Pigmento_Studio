"use client";

import { useEffect, useRef } from "react";
import { MOTION_BREAKPOINTS, REDUCED_MOTION } from "./breakpoints";
import { loadMotion, type MatchMedia } from "./gsap";

/**
 * Odometro: los digitos de una cifra ruedan hasta su valor al entrar en pantalla.
 *
 * Portado del que ya existe en Portfolio2026, con tres cambios de casa:
 *
 * - **Props y no atributos.** El original se configura con `data-odometer-*` y barre
 *   el documento buscando elementos. Eso existe donde el markup se edita en un panel;
 *   aqui hay props, y un barrido que corre una vez al cargar se queda ciego ante lo
 *   que monte despues. Mismo argumento escrito en `useParallax`.
 * - **gsap por su unica puerta.** El original lo importa estatico y registra
 *   ScrollTrigger en el scope del modulo. Aqui entra por `loadMotion()`, que lo trae
 *   bajo demanda — con import estatico serian 47.7kb gzip en el bundle compartido de
 *   TODAS las rutas.
 * - **Una cifra, no un grupo.** El original ordena y escalona varios numeros con
 *   `left | right | random`. Quien lo usa hoy le pasa siempre uno solo, asi que el
 *   escalonado entre cifras no se porta: la reticula que las coloca ya es de quien
 *   las agrupa. Lo que si se porta es el escalonado ENTRE DIGITOS, que es lo que hace
 *   que la cifra se lea como un contador y no como un texto que aparece.
 *
 * Lo que tampoco se porta es el crecimiento desde un valor inicial con menos digitos
 * —el `start`, los ceros ocultos y su revelado—. Son unas 60 lineas y ningun uso
 * real las pide: la llamada de Portfolio2026 no pasa `start`, asi que ese camino ya
 * estaba muerto alli. Vuelve el dia que haga falta contar desde otro numero.
 */

/** Cuantas vueltas completas da un digito antes de aterrizar. */
const CICLOS = 2;

/** Retardo entre digitos, en segundos. Corren de derecha a izquierda. */
const RETARDO_DIGITO = 0.04;

const DURACION = 1;

/**
 * El atributo que separa lo que es de React de lo que es del hook.
 *
 * React posee el texto plano y el hook la pista de rodillos, y ninguno escribe en el
 * nodo del otro. La version anterior reemplazaba los hijos del elemento que React
 * habia pintado, y eso obligaba a restaurarlos al limpiar — con el valor equivocado
 * en cuanto la cifra cambiaba, porque la limpieza corre DESPUES del re-render. Lo
 * casa el test de PriceBand que vuelve a pintar con otro importe.
 */
export const PART = "data-roll-part";

export interface NumberRollOptions {
  /** El valor final, tal y como se lee: "247,680 USD", "80%", "0". */
  value: string;
  /** Posicion de scroll donde arranca, en sintaxis de ScrollTrigger. */
  scrollStart?: string;
  duration?: number;
}

type Segmento = { digito: boolean; char: string };

/** Un caracter es rodable si es un digito; lo demas viaja fijo. */
export function segmentar(texto: string): Segmento[] {
  return [...texto].map((char) => ({ digito: /\d/.test(char), char }));
}

/**
 * El alto de una celda, en multiplos del cuerpo. Sale del interlineado REAL del
 * elemento: el rodillo se mueve en `em`, asi que si el paso no es el interlineado
 * los digitos aterrizan descuadrados respecto a la linea de texto.
 */
export function pasoDe(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  if (cs.lineHeight === "normal") return 1.2;
  return parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
}

export function useNumberRoll<T extends HTMLElement>({
  value,
  scrollStart = "top 85%",
  duration = DURACION,
}: NumberRollOptions) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const plano = root.querySelector<HTMLElement>(`[${PART}="plain"]`);
    const pista = root.querySelector<HTMLElement>(`[${PART}="rollers"]`);
    if (!plano || !pista) return;

    let mm: MatchMedia | undefined;
    let cancelled = false;

    /** Devuelve la escena a React: la pista se vacia y el texto plano reaparece. */
    const soltar = () => {
      pista.replaceChildren();
      delete root.dataset.rolling;
    };

    void loadMotion().then(({ gsap }) => {
      if (cancelled) return;

      mm = gsap.matchMedia();

      mm.add({ ...MOTION_BREAKPOINTS, isReduced: REDUCED_MOTION }, (context) => {
        // Decorativo puro: la cifra ya esta escrita en el HTML del servidor, asi que
        // con esta preferencia no se toca nada y se lee igual.
        if (context.conditions?.isReduced) return;

        const paso = pasoDe(plano);
        const rodillos: { rodillo: HTMLElement; destino: number }[] = [];

        for (const seg of segmentar(value)) {
          if (!seg.digito) {
            const fijo = document.createElement("span");
            fijo.dataset.rollPart = "static";
            fijo.style.blockSize = `${paso}em`;
            fijo.style.lineHeight = String(paso);
            fijo.textContent = seg.char;
            pista.append(fijo);
            continue;
          }

          const mascara = document.createElement("span");
          mascara.dataset.rollPart = "mask";
          mascara.style.blockSize = `${paso}em`;
          mascara.style.lineHeight = String(paso);

          const rodillo = document.createElement("span");
          rodillo.dataset.rollPart = "roller";
          rodillo.style.lineHeight = String(paso);
          // Dos vueltas de 0-9 apiladas: el destino cae en la segunda, que es lo que
          // da la sensacion de giro en vez de un salto al valor.
          rodillo.textContent = Array.from({ length: 10 * CICLOS }, (_, i) => i % 10).join("\n");

          mascara.append(rodillo);
          pista.append(mascara);

          gsap.set(rodillo, { y: 0 });
          rodillos.push({ rodillo, destino: 10 + Number(seg.char) });
        }

        if (!rodillos.length) {
          soltar();
          return;
        }

        root.dataset.rolling = "true";

        const tl = gsap.timeline({
          scrollTrigger: { trigger: root, start: scrollStart, once: true },
          onComplete: soltar,
        });

        rodillos.forEach(({ rodillo, destino }, i) => {
          // De derecha a izquierda: las unidades aterrizan primero, como un contador
          // mecanico. Al reves se lee como si el numero se escribiera solo.
          const desdeLaDerecha = rodillos.length - 1 - i;

          tl.to(
            rodillo,
            {
              y: `${-destino * paso}em`,
              duration,
              // conformance-exempt: motion-literal — la curva de un odometro es la de una rueda que frena, no una de las de marca; 'power3.out' es esa fisica y no una segunda curva conviviendo con la del sistema.
              ease: "power3.out",
              force3D: true,
            },
            desdeLaDerecha * RETARDO_DIGITO,
          );
        });
      });
    });

    return () => {
      cancelled = true;
      mm?.revert();
      soltar();
    };
  }, [value, scrollStart, duration]);

  return ref;
}
