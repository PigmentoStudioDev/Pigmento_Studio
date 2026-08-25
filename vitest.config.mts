import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// La guia de Next todavia recomienda el plugin vite-tsconfig-paths, pero Vite ya
// resuelve los paths del tsconfig de forma nativa y avisa en runtime de que el
// plugin sobra. Se usa la opcion nativa.
export default defineConfig({
  plugins: [react()],
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
