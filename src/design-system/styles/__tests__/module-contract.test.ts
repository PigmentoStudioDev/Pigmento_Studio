/**
 * Contrato de los CSS Modules: cada `styles.x` del TSX existe en su hoja.
 *
 * Existe porque el fallo es mudo por partida doble. `styles.claseQueNoExiste` es
 * `undefined`, y `[a, undefined, b].join(' ')` no escribe "undefined": escribe una
 * cadena vacia. La clase no sale rota en el DOM, sale AUSENTE — el elemento se
 * pinta, nada avisa, y lo unico que pasa es que un estado deja de tener estilo.
 *
 * Paso de verdad: SiteHeader referenciaba `styles.isClosed`, que nunca llego a
 * declararse. El estado cerrado del navbar se quedo sin su clase durante toda una
 * tarde de trabajo sobre ese mismo componente.
 *
 * Es estatico a proposito: comprueba TODOS los modulos de una vez, incluidos los
 * que no tienen test de componente propio, y no depende de que alguien se acuerde
 * de renderizar la combinacion de estados que destapa el hueco.
 */
import { readdirSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile, type Options } from 'sass';
import { describe, expect, it } from 'vitest';

const DS = join(process.cwd(), 'src/design-system');
const SASS: Options<'sync'> = { loadPaths: ['node_modules'], quietDeps: true };

function modules(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : modules(full);
    return entry.name.endsWith('.module.scss') ? [full] : [];
  });
}

interface Pair {
  readonly rel: string;
  readonly declared: Set<string>;
  readonly used: Set<string>;
}

/**
 * `:global(.x)` marca una clase que el modulo no escribe — llega de fuera, asi que
 * no se puede pedir con `styles.x`. Hoy solo `pg-char`, que pone SplitText en
 * runtime. Sin quitarlas, el gate las cuenta como declaradas y falla.
 */
function withoutGlobals(css: string): string {
  return css.replace(/:global\([^)]*\)/g, '');
}

/**
 * Un `url(...)` no declara ninguna clase. Sin quitarlos, el dominio que lleva dentro
 * un data URI de SVG —`www.w3.org`, obligatorio en el namespace— se lee como `.w3` y
 * `.org`, y el gate exige que alguien use dos clases que no existen. Lo destapo la
 * textura de grano de los fondos.
 */
function withoutUrls(css: string): string {
  return css.replace(/url\((?:'[^']*'|"[^"]*"|[^)]*)\)/g, '');
}

const PAIRS: Pair[] = modules(DS).map((sheet) => {
  const tsx = sheet.replace('.module.scss', '.tsx');

  return {
    rel: sheet.slice(DS.length + 1),
    declared: new Set(
      [...withoutGlobals(withoutUrls(compile(sheet, SASS).css)).matchAll(/\.([a-zA-Z][\w]*)/g)].map(
        ([, name]) => name,
      ),
    ),
    used: new Set(
      [...readFileSync(tsx, 'utf8').matchAll(/styles\.([a-zA-Z][\w]*)/g)].map(([, name]) => name),
    ),
  };
});

describe('contrato de los CSS Modules', () => {
  it('hay modulos que revisar', () => {
    expect(PAIRS.length).toBeGreaterThan(0);
  });

  it.each(PAIRS.map((pair) => [pair.rel, pair] as const))(
    '%s: toda clase que pide el TSX existe en la hoja',
    (_rel, pair) => {
      expect([...pair.used].filter((cls) => !pair.declared.has(cls)).sort()).toEqual([]);
    },
  );

  /**
   * Al reves tambien: una clase declarada que nadie pide es CSS que viaja al
   * navegador sin pintar nada. No falla el build ni se ve — solo pesa.
   */
  it.each(PAIRS.map((pair) => [pair.rel, pair] as const))(
    '%s: toda clase de la hoja la usa alguien',
    (_rel, pair) => {
      expect([...pair.declared].filter((cls) => !pair.used.has(cls)).sort()).toEqual([]);
    },
  );
});
