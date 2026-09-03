"use client";

import { useSmoothScroll } from "../../../motion/useSmoothScroll";
// La hoja de Lenis son cinco reglas —el alto del documento, el recorte cuando el
// scroll esta parado y el aislamiento de las zonas que lo previenen— y se importa del
// paquete en vez de copiarse aqui: copiada, se queda apuntando a la version que habia
// el dia que se copio.
import "lenis/dist/lenis.css";

/**
 * Instala el scroll suavizado de la pagina. No pinta nada.
 *
 * Vive en layout/ porque es una primitiva de COMPOSICION en el sentido mas literal:
 * no aporta contenido ni forma, aporta un comportamiento a la pagina entera. Y es un
 * componente y no una llamada suelta en el layout porque el layout es server
 * component — alguien tiene que cruzar la frontera, y que ese alguien sea un archivo
 * de cuatro lineas es justo lo que mantiene el resto en el servidor.
 */
export function SmoothScroll() {
  useSmoothScroll();

  return null;
}
