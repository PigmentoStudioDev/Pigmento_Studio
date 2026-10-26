import { revalidatePath } from 'next/cache';
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';

/**
 * El sitio se prerenderiza, asi que una edicion en el CMS no llega a nadie hasta el
 * siguiente despliegue salvo que se invalide aqui. Se invalida el layout del segmento
 * de idioma: toda pagina cuelga de el y el menu y el pie leen estas mismas colecciones.
 *
 * `revalidatePath` solo existe dentro de una peticion de Next. Los scripts de seed,
 * migrate y el build corren Payload sin ese contexto y la llamada lanza: guardar el
 * documento no puede fallar por eso, asi que se registra y se sigue.
 */
export function revalidateSite(extraPaths: string[] = []): void {
  try {
    revalidatePath('/[locale]', 'layout');
    extraPaths.forEach((path) => revalidatePath(path));
  } catch (error) {
    console.warn('[cms] revalidatePath omitido (sin contexto de Next):', error instanceof Error ? error.message : error);
  }
}

export function revalidateAfterChange(extraPaths: string[] = []): CollectionAfterChangeHook {
  return ({ doc }) => {
    revalidateSite(extraPaths);
    return doc;
  };
}

export function revalidateAfterDelete(extraPaths: string[] = []): CollectionAfterDeleteHook {
  return ({ doc }) => {
    revalidateSite(extraPaths);
    return doc;
  };
}
