import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    // Carbon hace `@forward '@carbon/styles'` desde dentro de @carbon/react.
    // Sass no resuelve paquetes por node_modules por su cuenta, hay que darle la raiz.
    loadPaths: [path.join(process.cwd(), "node_modules")],
    // Carbon aun emite Sass con la API antigua: sin esto el build escupe miles de
    // avisos de deprecacion que tapan los errores propios.
    quietDeps: true,
  },
};

export default nextConfig;
