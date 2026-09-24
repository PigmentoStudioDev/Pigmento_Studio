/**
 * Contrato de lineas: compila el Sass REAL y afirma sobre el CSS que sale.
 *
 * Una linea es un trazo de 1px, sea un borde o una caja de 1px pintada de fondo, y
 * tiene DOS funciones con un token cada una:
 *
 * - `border-subtle` separa: filas, cabeceras de bloque, el canto de la barra.
 * - `border-strong` senala: la cabecera de una tabla, un indicador apagado.
 *
 * Habia cuatro tokens para lo mismo. Los numerados (`-01`) no son de este nivel: son
 * los que el contextual resuelve segun la capa, y escritos a mano salen con el
 * respaldo literal del tema blanco (`var(--cds-border-subtle-01, #c6c6c6)`), que no
 * re-tematiza.
 *
 * Fuera quedan los bordes de CONTROL (`button-tertiary`, `currentcolor`): son el
 * cuerpo del boton, no una linea, y los vigila su propio atomo.
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

// Solo las dos familias de linea. `border-interactive` es el acento del sitio (el
// punto del SectionChip), no un trazo.
const LINE_TOKEN = /var\(--cds-border-(subtle|strong)[^)]*\)/;
const ALLOWED = /^var\(--cds-border-(subtle|strong)\)$/;

const LINES = sheets(join(DS, 'components')).flatMap((file) => {
  const rel = file.slice(DS.length + 1);
  const found: string[] = [];

  postcss.parse(compile(file, SASS).css).walkDecls(/^(border|background-color)/, (decl) => {
    const token = decl.value.match(LINE_TOKEN)?.[0];
    if (token) found.push(`${rel} · ${decl.prop} · ${token}`);
  });

  return found;
});

describe('contrato de lineas', () => {
  it('hay lineas: si no, este contrato no estaria midiendo nada', () => {
    expect(LINES.length).toBeGreaterThan(0);
  });

  it('toda linea usa border-subtle o border-strong, sin numero de capa', () => {
    expect(LINES.filter((line) => !ALLOWED.test(line.split(' · ')[2]))).toEqual([]);
  });
});
