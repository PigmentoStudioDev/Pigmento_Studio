import type { ParallaxOptions } from "./useParallax";

/**
 * La geometria de un fondo con parallax, compartida por los dos que hay: el de
 * video y el de imagen.
 *
 * Vive en la capa de motion y no dentro de uno de los dos componentes porque no es
 * de ninguno: es la relacion entre el recorte y lo que se mueve dentro. Cuando
 * estaba dentro de `VideoBackdrop`, el de imagen solo podia copiarla — y dos copias
 * de un numero que TIENE que coincidir con una hoja de estilos es exactamente el
 * fallo mudo que su test existe para evitar.
 */

/**
 * Alto del objetivo respecto a la mascara, en %. **Espeja `$target-overflow` de
 * `styles/_backdrop.scss`**, y el test de cada fondo comprueba que los dos numeros
 * siguen siendo el mismo: si se separan, el recorrido deja de cuadrar con el
 * sobrante y aparece una franja vacia en el borde.
 */
export const TARGET_OVERFLOW = 120;

/**
 * Recorrido maximo sin descubrir hueco, en % del alto del OBJETIVO.
 *
 * El sobrante es `overflow - 100` puntos de la mascara, pero yPercent mide sobre el
 * propio objetivo, que es mas alto — de ahi la division. Con 120% son 16.67%, no 20:
 * pasarse de aqui saca el borde por arriba.
 */
export const MAX_TRAVEL = ((TARGET_OVERFLOW - 100) / TARGET_OVERFLOW) * 100;

/**
 * Empieza pegado arriba y baja el recorrido entero mientras el hero cruza la
 * pantalla. `top top` porque un hero arranca ya en el borde superior: con el
 * `top bottom` por defecto la animacion habria terminado antes de empezar a bajar.
 */
export const DEFAULT_BACKDROP_PARALLAX: ParallaxOptions = {
  start: 0,
  end: MAX_TRAVEL,
  scrollStart: "top top",
};
