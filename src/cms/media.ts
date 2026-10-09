import config from '@payload-config';
import { getPayload } from 'payload';
import type { Media } from '@/payload-types';
import type { Locale } from '@/i18n/routing';

/**
 * Lectura de un archivo suelto de la biblioteca, por nombre.
 *
 * El resto de adaptadores llegan a la media a traves de su documento —un proyecto
 * trae su portada, una persona su retrato—. Una imagen que es del SITIO y no de
 * ningun contenido no tiene ese camino: la banda que separa dos actos de la home no
 * es de un proyecto, es de la pagina.
 *
 * **Por nombre de archivo y no por id.** Un id es un numero magico: en el diff no se
 * ve que imagen es, y en otra base de datos —una copia local, un entorno nuevo—
 * apunta a otra cosa o a nada. El nombre se lee, y es el mismo en todas.
 *
 * Sin ella la pagina sigue: quien la llama decide, y la home se limita a no pintar la
 * banda. Un respiro que falta no rompe nada; un hueco vacio del alto de media
 * pantalla, si.
 */
export interface SiteImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** Exportada por su test: es la funcion pura y es donde puede fallar en silencio. */
export function toSiteImage(media: Media | undefined): SiteImage | null {
  if (!media?.url || !media.width || !media.height) return null;

  // El `?? ''` cubre lo que el tipo no modela: `alt` es obligatorio, pero lo es en el
  // idioma en que se guardo, y pedido en otro vuelve vacio o sin definir. Vacio =
  // decorativa, que para una banda de fondo es lo correcto; inventar la descripcion de
  // una imagen que nadie miro, no.
  return { src: media.url, alt: media.alt ?? '', width: media.width, height: media.height };
}

export async function getSiteImage(filename: string, locale: Locale): Promise<SiteImage | null> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: 'media',
    locale,
    // La Local API se salta el control de acceso por defecto. Sin esta linea devuelve
    // tambien lo que el panel no mostraria, y sin error ninguno.
    overrideAccess: false,
    where: { filename: { equals: filename } },
    limit: 1,
  });

  return toSiteImage(docs[0]);
}
