import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

/**
 * jsdom no implementa matchMedia. No es un hueco del codigo sino del entorno: la
 * API esta en todos los navegadores desde hace una decada, asi que guardarla en
 * produccion seria pagar una rama muerta para siempre por una carencia del runner
 * de tests.
 *
 * Devuelve `matches: false`, que en las dos consultas que usa el sitio es la
 * respuesta conservadora: modo claro por defecto y motion permitido. Un test que
 * necesite la otra rama sobrescribe esto para su caso.
 */
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
