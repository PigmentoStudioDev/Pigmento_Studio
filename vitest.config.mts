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
  },
});
