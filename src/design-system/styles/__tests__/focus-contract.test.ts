/**
 * Contrato de foco: un solo anillo en todo el sitio, compilado y comprobado.
 *
 * El anillo es un trazo de 2px en el token de foco. Hay dos formas de dibujarlo y
 * dos colocaciones, y cada una tiene su motivo:
 *
 * - `outline`, hacia DENTRO (-2px) en filas y superficies a sangre, donde un anillo
 *   por fuera lo cortaria el borde de la ventana o la fila vecina.
 * - `outline`, hacia FUERA (2px) en los controles con borde propio, que si no el
 *   anillo se montaria sobre ese borde.
 * - `box-shadow` en Button e IconButton, cuyo anillo vive en un ::after que escala
 *   con el gesto del control.
 * - `focus-inverse` solo sobre superficies invertidas (la barra de promos).
 *
 * El gate no deja que aparezca una quinta variante: otro grosor, otro color u otro
 * desplazamiento.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';
import { compile, type Options } from 'sass';
import { describe, expect, it } from 'vitest';

const DS = join(process.cwd(), 'src/design-system');
const SASS: Options<'sync'> = { loadPaths: ['node_modules'], quietDeps: true };

function sheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sheets(full);
    return entry.name.endsWith('.scss') && !entry.name.startsWith('_') ? [full] : [];
  });
}

const RING = /var\(--cds-focus(-inverse)?[,)]/;

const RULES: Record<string, (value: string) => boolean> = {
  outline: (value) => value === 'none' || (value.startsWith('2px solid ') && RING.test(value)),
  'outline-offset': (value) => value === '2px' || value === '-2px',
  'box-shadow': (value) => value.startsWith('0 0 0 2px ') && RING.test(value),
};

const FOCUS = sheets(join(DS, 'components')).flatMap((file) => {
  const rel = file.slice(DS.length + 1);
  const found: { at: string; ok: boolean }[] = [];

  postcss.parse(compile(file, SASS).css).walkRules(/:focus/, (rule) => {
    rule.walkDecls((decl) => {
      const check = RULES[decl.prop];
      if (check) found.push({ at: `${rel} · ${rule.selector} · ${decl.prop}: ${decl.value}`, ok: check(decl.value) });
    });
  });

  return found;
});

describe('contrato de foco', () => {
  it('hay anillos: si no, este contrato no estaria midiendo nada', () => {
    expect(FOCUS.length).toBeGreaterThan(0);
  });

  it('todo anillo es de 2px, en el token de foco y a 2px dentro o fuera', () => {
    expect(FOCUS.filter(({ ok }) => !ok).map(({ at }) => at)).toEqual([]);
  });
});
