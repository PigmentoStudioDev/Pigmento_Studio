/**
 * Contrato de tipografia: compila el Sass REAL y afirma sobre el CSS que sale.
 *
 * Existe por un fallo que estuvo delante todo el dia sin que nada lo dijera. Los
 * tokens de tipo de Carbon llevan tamano, peso e interlineado pero NO familia; la
 * familia la ponia su reset, y al dejar de emitir su CSS dejo de ponerla nadie. El
 * sitio entero salio en la serif por defecto del navegador — sin literal, sin
 * error, sin aviso. Solo una pagina que parece de otro proyecto.
 *
 * De ahi las dos afirmaciones: que el tamano salga de una de las DOS escalas — la
 * de Carbon para UI, la de marca para lo editorial — y que ninguna hoja de
 * componente invente un cuerpo o un tracking por su cuenta.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import postcss, { type Declaration } from 'postcss';
import { compile, compileString, type Options } from 'sass';
import { describe, expect, it } from 'vitest';

const DS = join(process.cwd(), 'src/design-system');
const STYLES = join(DS, 'styles');
const SASS: Options<'sync'> = { loadPaths: ['node_modules'], quietDeps: true };

const probe = (body: string): string[] =>
  compileString(`@use 'carbon-config';\n${body}`, {
    ...SASS,
    loadPaths: [...(SASS.loadPaths ?? []), STYLES],
  })
    .css.match(/:\s*([^;]+);/g)!
    .map((chunk) => chunk.replace(/^:\s*|;$/g, '').trim());

/**
 * Las dos escalas, leidas de su propio Sass. Una lista copiada a mano se
 * desincroniza en cuanto la marca reafine un escalon — que es exactamente lo que va
 * a pasar cuando se sustituyan los placeholders.
 */
const SIZES = new Set([
  ...probe(`@use 'type' as brandtype; .p { s: brandtype.sizes(); }`)[0]
    .split(',')
    .map((v) => v.trim()),
  // Los de Carbon se recorren token a token: su mapa anida mapas y meterlo entero
  // en una interpolacion revienta el serializador de Sass.
  ...probe(`@use 'sass:map';
    @use '@carbon/react/scss/type';
    @each $name, $t in type.$tokens {
      .p-#{$name} { s: map.get($t, 'font-size'); }
    }`).filter((v) => /^[\d.]+rem$/.test(v)),
]);

const TRACKINGS = new Set([
  '0',
  'normal',
  ...probe(`@use 'type' as brandtype; .p { t: brandtype.trackings(); }`)[0]
    .split(',')
    .map((v) => v.trim()),
]);

function sheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sheets(full);
    return entry.name.endsWith('.scss') && !entry.name.startsWith('_') ? [full] : [];
  });
}

interface Found {
  readonly rel: string;
  readonly prop: string;
  readonly value: string;
}

const DECLS: Found[] = sheets(join(DS, 'components')).flatMap((file) => {
  const rel = file.slice(DS.length + 1);
  const out: Found[] = [];

  postcss.parse(compile(file, SASS).css).walkDecls(/^(font-size|letter-spacing)$/, (decl: Declaration) => {
    out.push({ rel, prop: decl.prop, value: decl.value.trim() });
  });

  return out;
});

describe('contrato de tipografia', () => {
  it('hay componentes con tipo: si no, este contrato no estaria midiendo nada', () => {
    expect(DECLS.length).toBeGreaterThan(0);
  });

  const sizes = DECLS.filter((d) => d.prop === 'font-size');

  it.each(sizes.map((d) => [`${d.rel} · ${d.value}`, d] as const))(
    '%s: el cuerpo sale de una de las dos escalas',
    (_label, decl) => {
      expect(SIZES.has(decl.value)).toBe(true);
    },
  );

  /**
   * El tracking es lo que mas distingue las dos escalas: Carbon lo deja a cero en
   * todo, la marca lo aprieta segun crece el cuerpo. Un valor suelto rompe esa
   * curva sin romper nada visible.
   */
  const trackings = DECLS.filter((d) => d.prop === 'letter-spacing');

  it.each(trackings.map((d) => [`${d.rel} · ${d.value}`, d] as const))(
    '%s: el tracking sale de la escala',
    (_label, decl) => {
      expect(TRACKINGS.has(decl.value)).toBe(true);
    },
  );
});
