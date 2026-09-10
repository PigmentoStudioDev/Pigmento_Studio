import path from "node:path";
import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import createNextIntlPlugin from "next-intl/plugin";

// Le dice a next-intl donde vive la configuracion por peticion. Sin esto el plugin
// busca en su ruta por defecto y los diccionarios no llegan a ningun sitio.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * El host desde el que se sirve la media del CMS.
 *
 * Se deriva de R2_PUBLIC_URL en vez de escribirse: son la misma direccion, y dos
 * copias de una URL se separan el dia que cambie el dominio del bucket. Sin esta
 * entrada, `next/image` rechaza toda imagen del CMS con un error que habla de
 * hosts y no de configuracion — y el sitio entero pinta con next/image.
 *
 * Sin la variable no hay patron: el plugin de R2 tambien esta apagado en ese
 * caso, asi que Payload sirve desde disco local y no hay host remoto que
 * autorizar.
 */
const mediaRemotePattern = (): RemotePattern[] => {
  if (!process.env.R2_PUBLIC_URL) return [];
  const { protocol, hostname, port } = new URL(process.env.R2_PUBLIC_URL);

  // `protocol` de URL viene con los dos puntos ("https:") y RemotePattern quiere
  // la union sin ellos. Se estrecha comprobando, no afirmando: una R2_PUBLIC_URL
  // con otro esquema tiene que quedarse fuera, no colarse por un cast.
  const scheme = protocol.replace(':', '');
  if (scheme !== 'http' && scheme !== 'https') return [];

  return [{ protocol: scheme, hostname, port, pathname: '/**' }];
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: mediaRemotePattern(),
  },

  sassOptions: {
    // Carbon hace `@forward '@carbon/styles'` desde dentro de @carbon/react.
    // Sass no resuelve paquetes por node_modules por su cuenta, hay que darle la raiz.
    loadPaths: [path.join(process.cwd(), "node_modules")],
    // Carbon aun emite Sass con la API antigua: sin esto el build escupe miles de
    // avisos de deprecacion que tapan los errores propios.
    quietDeps: true,
  },
};

/**
 * Los dos envoltorios, y el orden importa: `withNextIntl` por dentro y
 * `withPayload` por fuera. next-intl inyecta su plugin y su alias de config;
 * Payload tiene que ver la config YA transformada para no pisarlos.
 *
 * `devBundleServerPackages: false` es lo que trae el template oficial del tag
 * v3.88.0: deja que Next externalice los paquetes de servidor en dev en vez de
 * meterlos al bundle, que es lo que rompe el adaptador de base de datos.
 */
export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false });
