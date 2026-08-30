"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type TransitionEvent,
} from "react";
import styles from "./RadialGallery.module.scss";

/**
 * Una corona de miniaturas que avanza sola y que se puede girar arrastrando.
 *
 * Las miniaturas se reparten sobre una rueda mucho mas grande que su caja, asi que
 * solo asoma el arco de arriba: el resto queda por debajo del recorte y entra en
 * cuadro girando. Es un escaparate, no un carrusel — no hay controles ni destino
 * por miniatura, y por eso la pieza entera es decorativa.
 *
 * **El movimiento no esta aqui.** El JS solo lleva dos numeros: cuantos pasos ha
 * avanzado la corona y cuantos grados la ha desviado el arrastre. El giro, el
 * empuje y la onda son transiciones de la hoja. Es lo que mantiene la duracion y la
 * curva dentro de la escala de la marca — donde el gate de motion las lee, sobre el
 * CSS compilado — y lo que hace que `prefers-reduced-motion` se resuelva en una
 * `@media` y no en una rama de JS que ningun test recorre.
 *
 * El arrastre no es una excepcion a eso: mientras el dedo esta abajo no hay
 * duracion ninguna, la rueda va 1:1 con el puntero y la hoja apaga la transicion.
 * La unica animacion del gesto es el enganche al soltar, y esa la escribe la misma
 * transicion de siempre.
 *
 * Props serializables: la lista es la forma que tendra el media de Payload, asi que
 * el dia que entre el CMS alimenta este componente 1:1 sin adaptador.
 */
export interface RadialGalleryImage {
  src: string;
  width: number;
  height: number;
}

export interface RadialGalleryProps {
  images: RadialGalleryImage[];
  /**
   * Cuanto dura cada miniatura en lo alto de la corona. Es ritmo de CONTENIDO —
   * cuanto tiempo se lee una pieza — y no motion: las duraciones del gesto viven
   * todas en la hoja.
   */
  intervalMs?: number;
}

const DEFAULT_INTERVAL_MS = 1500;

/** Con una sola miniatura no hay corona que girar, y con ninguna no hay nada. */
const MIN_IMAGES = 2;

/**
 * Cuanto mide la rueda en anchos de la galeria. Es el mismo 300cqw que declara la
 * hoja, y esta repetido a proposito con esta nota: el radio en pixeles hace falta
 * en JS para convertir el arrastre en grados, y leerlo del CSS obligaria a un
 * getComputedStyle por cada movimiento del puntero.
 */
const WHEEL_DIAMETER_RATIO = 3;

/** Pixeles que hay que recorrer antes de que un toque cuente como arrastre. */
const DRAG_THRESHOLD_PX = 4;

const DEGREES_PER_RADIAN = 180 / Math.PI;

export function RadialGallery({ images, intervalMs = DEFAULT_INTERVAL_MS }: RadialGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [lifted, setLifted] = useState(false);
  const [dragDegrees, setDragDegrees] = useState(0);
  const [dragging, setDragging] = useState(false);

  const count = images.length;
  const enabled = count >= MIN_IMAGES;

  /**
   * El gesto en curso. En una ref y no en estado porque cambia en cada
   * pointermove: pasarlo por el render pintaria la corona una vez por pixel para
   * decidir lo mismo que decide una comparacion.
   *
   * `moved` es lo que distingue un arrastre de un clic, y hace falta porque esta
   * galeria vive DENTRO de un enlace: sin el, soltar despues de girar la rueda
   * navegaria a la tarjeta.
   */
  const gesture = useRef({ id: -1, startX: 0, radius: 0, moved: false });

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled || dragging) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    let frame = 0;

    function tick() {
      setStep((current) => current + 1);

      /**
       * El empuje se BAJA y se vuelve a subir al frame siguiente, en vez de
       * subirse y esperar a que el giro lo devuelva al reposo.
       *
       * Sin esto, el intervalo rapido rompia la onda entera: con intervalMs por
       * debajo de lo que dura el giro, la transicion se interrumpe antes de
       * terminar, `transitionend` no llega nunca y las miniaturas se quedan
       * empujadas hacia fuera para siempre. Pasaba tambien al volver de una
       * pestana en segundo plano.
       *
       * Un frame y no un temporizador: reiniciar una transicion pide que el valor
       * pase por el reposo en un fotograma distinto, y eso es exactamente lo que
       * hace requestAnimationFrame. Un setTimeout con un numero seria una duracion
       * de motion viviendo en JS, fuera de la escala y fuera del gate.
       */
      setLifted(false);
      frame = requestAnimationFrame(() => setLifted(true));
    }

    function start() {
      if (timer !== undefined) return;
      timer = setInterval(tick, intervalMs);
    }

    function stop() {
      clearInterval(timer);
      timer = undefined;
      cancelAnimationFrame(frame);
    }

    // El panel del menu colapsa a `0fr` con `overflow: hidden`, asi que con el menu
    // cerrado esta caja mide cero y el observador la da por no visible. Sin esto el
    // intervalo correria durante toda la vida de la pagina girando una corona que
    // nadie esta mirando.
    if (typeof IntersectionObserver === "undefined") {
      start();
      return stop;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) start();
      else stop();
    });
    observer.observe(root);

    return () => {
      observer.disconnect();
      stop();
    };
  }, [enabled, intervalMs, dragging]);

  /**
   * El regreso al reposo no tiene duracion propia: termina cuando termina el giro.
   * Un temporizador aqui seria un tercer numero de motion viviendo en JS, fuera de
   * la escala y fuera del gate que la vigila.
   *
   * Con `prefers-reduced-motion` no hay transicion y este evento no llega nunca, asi
   * que el estado se queda en alto — la hoja anula el empuje en esa misma `@media`
   * justo por eso.
   */
  function handleTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== "transform") return;
    setLifted(false);
  }

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const root = rootRef.current;
      if (!enabled || !root) return;

      // El radio de la orbita en pixeles. Arrastrar el borde de una rueda de radio r
      // una distancia d la gira d/r radianes: es la conversion fisica, y por eso el
      // gesto se siente igual con la galeria ancha que estrecha.
      gesture.current = {
        id: event.pointerId,
        startX: event.clientX,
        radius: (root.getBoundingClientRect().width * WHEEL_DIAMETER_RATIO) / 2,
        moved: false,
      };

      // Con captura, el gesto sigue vivo aunque el puntero salga de la galeria —
      // que con una rueda que gira pasa todo el rato.
      root.setPointerCapture(event.pointerId);
      setDragging(true);
    },
    [enabled],
  );

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const drag = gesture.current;
    if (drag.id !== event.pointerId || drag.radius === 0) return;

    const dx = event.clientX - drag.startX;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX) drag.moved = true;

    setDragDegrees((dx / drag.radius) * DEGREES_PER_RADIAN);
  }, []);

  const endDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = gesture.current;
      if (drag.id !== event.pointerId) return;

      rootRef.current?.releasePointerCapture(event.pointerId);
      drag.id = -1;

      /**
       * Al soltar, el desvio en grados se convierte en pasos enteros y se pliega
       * dentro de `step`. La corona no se queda donde la dejo el dedo: engancha a
       * la miniatura mas cercana, y ese enganche lo anima la transicion de siempre
       * porque el desvio vuelve a cero en el mismo render.
       *
       * El signo va invertido porque la hoja gira -360/count por paso: un grado
       * positivo de arrastre es un paso negativo.
       */
      setStep((current) => current - Math.round((dragDegrees * count) / 360));
      setDragDegrees(0);
      setDragging(false);
    },
    [count, dragDegrees],
  );

  /**
   * El clic que sigue a un arrastre no navega.
   *
   * Esta galeria es hija de un <a>, asi que al soltar el puntero el navegador
   * emite un `click` que sube hasta el enlace y se lleva la pagina por delante.
   * Girar la rueda y acabar en otra ruta es el fallo mas desconcertante que puede
   * tener esta pieza.
   *
   * En captura y con las dos llamadas: preventDefault cancela la navegacion del
   * enlace y stopPropagation impide que corra su onClick, que es quien cierra el
   * menu.
   */
  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!gesture.current.moved) return;
    gesture.current.moved = false;
    event.preventDefault();
    event.stopPropagation();
  }

  if (count === 0) return null;

  // Fuera del JSX: dentro, el gate de literales en estilo inline no distingue un
  // valor calculado de un color escrito a mano. Son numeros puros y la hoja les
  // pone la unidad, igual que ya hacia con el paso y el total.
  const rootStyle = { "--radial-gallery-count": count } as CSSProperties;
  const trackStyle = {
    "--radial-gallery-step": step,
    "--radial-gallery-drag": dragDegrees,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-lifted={lifted ? "true" : undefined}
      data-dragging={dragging ? "true" : undefined}
      style={rootStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={handleClickCapture}
    >
      <div className={styles.track} style={trackStyle} onTransitionEnd={handleTransitionEnd}>
        {images.map((image, index) => (
          <div
            // El indice entra en la clave porque la corona se llena REPITIENDO la
            // lista: el efecto de referencia pone sus catorce medios dos veces para
            // cerrar el circulo. Con la ruta sola, esa segunda vuelta son claves
            // duplicadas y React deja de saber que nodo es cual.
            key={`${image.src}-${index}`}
            className={styles.item}
            style={{ "--radial-gallery-index": index } as CSSProperties}
          >
            {/*
              alt vacio, y no es un descuido. La corona entera es decoracion: no
              nombra un destino ni aporta nada que el titulo de la tarjeta no diga
              ya. Con texto alternativo, catorce miniaturas se sumarian al nombre
              accesible del enlace que las envuelve y lo dejarian ilegible.

              draggable={false} porque el navegador trae su propio arrastre de
              imagenes: sin esto, bajar el puntero sobre una miniatura arranca el
              fantasma nativo y se lleva el gesto antes de que llegue a la rueda.
            */}
            <Image
              src={image.src}
              alt=""
              width={image.width}
              height={image.height}
              draggable={false}
              className={styles.thumb}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
