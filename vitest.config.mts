import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';

/**
 * Los imports estaticos de imagen, como los resuelve Next.
 *
 * Next los convierte en `{ src, width, height }` y por eso <Image> no necesita que
 * nadie repita las medidas. Vite los resuelve a una URL a secas, asi que sin este
 * plugin <Image> revienta en los tests con "missing required width" — y el fallo no
 * seria del componente sino del entorno, que es la peor clase de test rojo.
 *
 * Las medidas se LEEN del archivo. Escribirlas a mano aqui haria pasar los tests
 * contra una imagen que no es la que se sirve, que es justo lo que un test no puede
 * permitirse.
 */
function nextStaticImages(): Plugin {
  return {
    name: 'next-static-images',
    enforce: 'pre',
    load(id) {
      const file = id.split('?')[0];
      if (!/\.(webp|png)$/.test(file)) return null;

      const bytes = readFileSync(file);
      let width: number;
      let height: number;

      if (file.endsWith('.png')) {
        // IHDR va siempre en el mismo sitio: 8 de firma + 8 de cabecera de chunk.
        width = bytes.readUInt32BE(16);
        height = bytes.readUInt32BE(20);
      } else if (bytes.subarray(12, 16).toString() === 'VP8X') {
        // VP8X guarda ancho y alto menos uno, en 24 bits little-endian.
        width = bytes.readUIntLE(24, 3) + 1;
        height = bytes.readUIntLE(27, 3) + 1;
      } else {
        throw new Error(
          `${basename(file)}: webp sin cabecera VP8X. El shim solo lee VP8X y PNG; ` +
            'si entra otro formato, hay que ensancharlo aqui en vez de inventar medidas.',
        );
      }

      return `export default ${JSON.stringify({ src: `/${basename(file)}`, width, height })};`;
    },
  };
}

// La guia de Next todavia recomienda el plugin vite-tsconfig-paths, pero Vite ya
// resuelve los paths del tsconfig de forma nativa y avisa en runtime de que el
// plugin sobra. Se usa la opcion nativa.
export default defineConfig({
  plugins: [nextStaticImages(), react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    // Por defecto Vitest NO procesa CSS y devuelve un proxy que responde a
    // cualquier clave: `styles.claseQueNoExiste` sale como si existiera, y un test
    // de componente no puede distinguir un mapa correcto de uno con un typo. Se
    // procesa solo los .module.scss (el resto sigue sin coste) y con los nombres
    // sin hashear, para que el DOM del test lleve los nombres del Sass de origen y
    // una clase inexistente salga como `undefined`.
    css: {
      include: [/\.module\.scss$/],
      modules: { classNameStrategy: 'non-scoped' },
    },
  },
});
