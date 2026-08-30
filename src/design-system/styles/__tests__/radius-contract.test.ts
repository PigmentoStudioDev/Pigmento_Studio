/**
 * Contrato de radios: compila el Sass REAL y afirma sobre el CSS que sale.
 *
 * Existe porque un radio incoherente no rompe nada. No hay error, no hay aviso: la
 * pieza se pinta, y lo unico que pasa es que el conjunto deja de parecer del mismo
 * sistema. Es el fallo mas caro de detectar a ojo y el mas barato de detectar aqui.
 *
 * La escala esta calcada de la referencia de diseno — dieciseisavos, 2/16 a 24/16 —
 * y la leccion que
 * costo una iteracion esta en el segundo test: una pildora no es un escalon. En una
 * caja baja se lee como pildora y en una alta como una esquina blanda enorme, y esa
 * misma declaracion produciendo dos formas distintas es justo lo que se lee como
 * incoherente.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';
import { compile, compileString, type Options } from 'sass';
import { describe, expect, it } from 'vitest';

const DS = join(process.cwd(), 'src/design-system');
const STYLES = join(DS, 'styles');
const SASS: Options<'sync'> = { loadPaths: ['node_modules'], quietDeps: true };

/**
 * La escala se lee del propio Sass. Una lista copiada a mano se desincroniza en
 * cuanto la marca reafine un escalon, que es exactamente lo que va a pasar.
 */
const SCALE_VARS = [
  'radius-00',
  'radius-01',
  'radius-02',
  'radius-03',
  'radius-04',
  'radius-05',
  'radius-06',
  'radius-07',
  'radius-08',
  'radius-full',
  'radius-header',
  'radius-control-m',
  'radius-control-square',
];

const scale = new Set(
  compileString(
    `@use 'brand';
     .probe { ${SCALE_VARS.map((v, i) => `p${i}: brand.$${v};`).join(' ')} }`,
    { ...SASS, loadPaths: [...(SASS.loadPaths ?? []), STYLES] },
  )
    .css.match(/:\s*([^;]+);/g)!
    .map((chunk) => chunk.replace(/^:\s*|;$/g, '').trim()),
);

function sheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sheets(full);
    return entry.name.endsWith('.scss') && !entry.name.startsWith('_') ? [full] : [];
  });
}

interface Radius {
  readonly rel: string;
  readonly selector: string;
  readonly value: string;
}

const RADII: Radius[] = sheets(join(DS, 'components')).flatMap((file) => {
  const rel = file.slice(DS.length + 1);
  const found: Radius[] = [];

  postcss.parse(compile(file, SASS).css).walkDecls('border-radius', (decl) => {
    found.push({ rel, selector: decl.parent?.type === 'rule' ? decl.parent.toString().split('{')[0].trim() : '?', value: decl.value.trim() });
  });

  return found;
});

describe('contrato de radios', () => {
  it('hay componentes con radio: si no, este contrato no estaria midiendo nada', () => {
    expect(RADII.length).toBeGreaterThan(0);
  });

  /**
   * `inherit` es un APLAZAMIENTO, no un valor. El radio lo pone el padre, y ese padre
   * lo tiene vigilado por este mismo contrato, asi que nada se escapa: la forma sigue
   * saliendo de la escala, solo que un nivel mas arriba.
   *
   * Existe porque una lamina decorativa que cubre a su padre — GlassSurface sobre la
   * pildora de la barra — tiene que adaptarse a la forma que la contenga sin
   * conocerla. Declarar un escalon ahi seria PEOR que no declararlo: la lamina
   * asomaria por las esquinas de cualquier caja que no midiera lo que ella supone, y
   * el sintoma es un borde recto asomando bajo una esquina redonda.
   *
   * Y no abre ninguna puerta: heredar sin un padre con radio deja la caja a 0, que
   * tambien es un escalon de la escala.
   */
  const DEFERRED_TO_PARENT = 'inherit';

  it.each(RADII.map((r) => [`${r.rel} · ${r.selector}`, r] as const))(
    '%s usa un escalon de la escala',
    (_label, radius) => {
      expect(radius.value === DEFERRED_TO_PARENT || scale.has(radius.value)).toBe(true);
    },
  );

  /**
   * La pildora es para CONTROLES, cuya altura la decide su contenido y el CSS no
   * conoce. Una superficie con altura conocida deriva su radio de ella
   * ($radius-header) o toma un escalon: dejar que el navegador recorte un valor
   * enorme da una forma distinta segun lo alta que sea la caja, y encima no
   * interpola — la transicion no se ve hasta que el valor declarado baja del
   * recorte, y entonces salta.
   */
  const pill = compileString(`@use 'brand'; .probe { p: brand.$radius-full; }`, {
    ...SASS,
    loadPaths: [...(SASS.loadPaths ?? []), STYLES],
  }).css.match(/:\s*([^;]+);/)![1].trim();

  // Whitelist POR NOMBRE, no un patron abierto: cada control que puede llevar
  // pildora se anade a mano y se ve en el diff. NavToggle es un <button> con su
  // aria-expanded — un control, aunque no sea el atomo Button.
  const CONTROLS = /(Button|Tag|NavToggle)\//;

  it('la pildora solo la usan los controles', () => {
    const misuse = RADII.filter((r) => r.value === pill && !CONTROLS.test(r.rel));

    expect(misuse.map((r) => `${r.rel} · ${r.selector}`)).toEqual([]);
  });
});
