/**
 * Contrato del tema: compila el Sass REAL y afirma sobre el CSS que sale.
 *
 * Existe para proteger a Carbon del flujo de overrides: la marca se va a ir
 * construyendo token a token sobre _theme.scss, y estos gates dicen si alguna de
 * esas ediciones rompio algo que Carbon daba por sentado.
 *
 * Cada assert corresponde a un bug que ya ocurrio, y cada uno se verifico en ROJO
 * reintroduciendo su bug: un gate que no falla contra su bug conocido no es un gate.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import postcss, { type Rule } from 'postcss';
import { compile, compileString, type Options } from 'sass';
import { describe, expect, it } from 'vitest';

const STYLES = join(process.cwd(), 'src/design-system/styles');
const DS = join(process.cwd(), 'src/design-system');
const SASS: Options<'sync'> = { loadPaths: ['node_modules'], quietDeps: true };

/**
 * Aplana la cascada de un selector: recorre sus bloques en orden, el ultimo gana.
 *
 * Usa un parser de CSS y no una regex porque hay que EXCLUIR las reglas anidadas
 * en at-rules: Carbon emite un `:root` dentro de `@media (forced-colors: active)`
 * con valores de sistema (`Highlight`, `LinkText`) que solo aplican en alto
 * contraste. Una regex los leia como si fueran el tema y el gate mentia.
 */
function cascade(source: string, selector: string): Map<string, string> {
  const final = new Map<string, string>();

  postcss.parse(source).walkRules((rule: Rule) => {
    if (rule.parent?.type !== 'root') return;
    if (!rule.selector.split(',').some((s) => s.trim() === selector)) return;

    rule.walkDecls(/^--cds-/, (decl) => {
      final.set(decl.prop.replace('--cds-', ''), decl.value.trim());
    });
  });

  return final;
}

/**
 * Referencia INDEPENDIENTE: Carbon puro, sin nuestra capa de marca.
 *
 * No se puede usar la clase .cds--g100 de nuestro propio CSS como referencia
 * porque tambien la re-emitimos con marca encima. Compilando Carbon aparte
 * tenemos con que comparar aunque la marca crezca.
 */
const stockCache = new Map<string, Map<string, string>>();

function stockTheme(name: 'white' | 'g10' | 'g90' | 'g100'): Map<string, string> {
  const cached = stockCache.get(name);
  if (cached) return cached;

  // Hay que cargar @carbon/react ENTERO: los 76 tokens de componente solo quedan
  // registrados cuando los modulos de componente llaman a add-component-tokens.
  // Con solo scss/theme la referencia sale vacia. Se cachea porque compilar
  // Carbon completo por tema cuesta ~1s.
  // Lleva NUESTRA _carbon-config (fuentes) pero NINGUN override de marca: asi la
  // unica diferencia contra index.scss es la marca, que es lo que se mide.
  const source = compileString(
    `@use 'carbon-config';
     @use '@carbon/react/scss/themes';
     @use '@carbon/react/scss/theme';
     @use '@carbon/react';
     :root { @include theme.theme(themes.$${name}); }`,
    { ...SASS, loadPaths: [...(SASS.loadPaths ?? []), STYLES] },
  ).css;

  const parsed = cascade(source, ':root');
  stockCache.set(name, parsed);
  return parsed;
}

const COMPONENT_TOKEN = /^(notification|tag|button|status|content-switcher)-/;

/**
 * Las dos familias que la referencia trae y nosotros ya NO emitimos, a proposito.
 *
 * No salen del mapa de tema: las declaran sueltas las utilidades de grid y layout
 * de Carbon, que viajan pegadas al CSS de sus componentes. Desde que index.scss
 * dejo de emitir ese CSS — Carbon es plantilla de tokens, los atomos son nuestros —
 * estas quince custom properties no existen. Compararlas mediria una decision que
 * ya esta tomada, no un fallo.
 */
const STANDALONE_TOKEN = /^(grid|layout)-/;

const ZONES = [
  { selector: ':root', theme: 'g100', brand: 'dark' },
  { selector: '.cds--g100', theme: 'g100', brand: 'dark' },
  { selector: '.cds--g90', theme: 'g90', brand: 'dark' },
  { selector: '.cds--g10', theme: 'g10', brand: 'light' },
  { selector: '.cds--white', theme: 'white', brand: 'light' },
] as const;

describe('index.scss emite las cuatro zonas de Carbon con la marca encima', () => {
  const source = compile(join(STYLES, 'index.scss'), SASS).css;

  it.each(ZONES)('$selector parte del tema $theme de fabrica', ({ selector, theme }) => {
    const emitted = cascade(source, selector);
    const stock = stockTheme(theme);

    expect(emitted.get('background')).toBe(stock.get('background'));
    expect(emitted.get('text-primary')).toBe(stock.get('text-primary'));
  });

  /**
   * El bug: Carbon resuelve sus tokens de componente con matches(), que exige
   * igualdad EXACTA contra un tema de fabrica. Pasarle a theme() el tema ya
   * mezclado con la marca hace fallar el match y los 76 caen al fallback del tema
   * white: fondos claros con texto claro. UN SOLO override basta para tirarlos.
   *
   * Este es el gate que protege el flujo de overrides: da igual cuantos tokens
   * añada la marca, los de componente tienen que seguir siendo los de su tema.
   */
  it.each(ZONES)('$selector no desvia ningun token de componente', ({ selector, theme }) => {
    const emitted = cascade(source, selector);
    const stock = stockTheme(theme);
    const tokens = [...stock.keys()].filter((k) => COMPONENT_TOKEN.test(k));

    expect(tokens.length).toBeGreaterThan(70);
    expect(tokens.filter((k) => emitted.get(k) !== stock.get(k))).toEqual([]);
  });

  /**
   * Lee los tokens que declara _theme.scss desde el propio Sass, para que el gate
   * no dependa de una lista copiada a mano que se desincroniza al primer override.
   */
  function declaredOverrides(group: 'dark' | 'light'): string[] {
    const probe = compileString(
      // meta.inspect y no interpolacion directa: Sass no sabe serializar una lista
      // vacia, y $overrides-light lo esta hasta que exista la paleta de Pigmento.
      `@use 'sass:map';
       @use 'sass:meta';
       @use 'theme' as pigmento;
       .probe { --keys: '#{meta.inspect(map.keys(pigmento.$overrides-${group}))}'; }`,
      { ...SASS, loadPaths: [...(SASS.loadPaths ?? []), STYLES] },
    ).css;
    const raw = /--keys:\s*'([^']*)'/.exec(probe)?.[1] ?? '()';
    return raw
      .replace(/^\(|\)$/g, '')
      .split(',')
      .map((k) => k.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }

  /**
   * Que la plantilla siga entera. Es el gate de la migracion a emision delgada:
   * los tokens de componente los registra ahora index.scss a mano con
   * add-component-tokens(), y olvidar una de esas cinco llamadas no rompe el
   * build — deja setenta y siete custom properties sin emitir y los atomos que
   * las consumen caen a su valor de respaldo, en silencio.
   */
  it('emitimos todos los tokens de tema que trae la plantilla', () => {
    const emitted = cascade(source, ':root');
    const stock = stockTheme('g100');

    const expected = [...stock.keys()].filter((k) => !STANDALONE_TOKEN.test(k));

    expect(expected.length).toBeGreaterThan(300);
    expect(expected.filter((k) => !emitted.has(k))).toEqual([]);
  });

  /**
   * La marca no puede tener efectos colaterales: si cambia un token que no declaro,
   * es que algo se colo. Al reves si vale — declarar un token cuyo valor coincide
   * con el de fabrica es intencion explicita, no un fallo.
   *
   * Se compara solo sobre lo que EMITIMOS, y quien vigila que no falte nada es el
   * test de arriba. Aqui la pregunta es otra: de lo que sale, cuanto lo cambio la
   * marca sin decirlo.
   */
  it('la marca no cambia ningun token que no haya declarado', () => {
    const declared = declaredOverrides('dark');
    const emitted = cascade(source, ':root');
    const stock = stockTheme('g100');

    const changed = [...stock.keys()].filter(
      (k) =>
        emitted.has(k) &&
        !stock.get(k)!.startsWith('var(') &&
        emitted.get(k) !== stock.get(k),
    );

    expect(changed.filter((k) => !declared.includes(k))).toEqual([]);
  });

  /**
   * Un token mal escrito en _theme.scss no rompe el build: Carbon lo emite como
   * custom property huerfana que ningun componente lee, y el override simplemente
   * no hace nada. Este gate lo convierte en un fallo.
   */
  it.each(['dark', 'light'] as const)(
    'todo token declarado en $overrides-%s existe en el contrato de Carbon',
    (group) => {
      const known = stockTheme('g100');
      const unknown = declaredOverrides(group).filter((k) => !known.has(k));

      expect(unknown).toEqual([]);
    },
  );

  it('no queda rastro del atributo data-theme que no es de Carbon', () => {
    expect(source).not.toContain('data-theme');
  });
});

/**
 * El bug: cada .scss que Next compila es una unidad independiente, asi que la
 * configuracion de index.scss no aplica a los demas entries. Un entry que no cargue
 * _carbon-config.scss emite el literal 'IBM Plex Sans', que next/font no registra
 * bajo ese nombre: la tipografia se pierde sin ningun error de build.
 *
 * Los entries se ENUMERAN del directorio: un .scss nuevo que olvide el partial se
 * cae solo, sin que nadie tenga que acordarse de anadirlo aqui.
 */
describe('todos los entries de Sass heredan la configuracion de fuentes', () => {
  /**
   * Recorre design-system/ ENTERO, no una lista de directorios. Los .module.scss
   * de los componentes son entries igual que index.scss — cada uno es su propia
   * unidad de compilacion — y hasta que este walk existio quedaban fuera del gate:
   * un Section.module.scss sin el partial se perdia la tipografia en silencio.
   */
  function sassEntries(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return sassEntries(full);
      // Los partials (_x.scss) no son entries: los configura quien los carga.
      return entry.name.endsWith('.scss') && !entry.name.startsWith('_') ? [full] : [];
    });
  }

  const entries = sassEntries(DS);

  it.each(entries)('%s no emite familias literales', (entry) => {
    const literals: string[] = [];

    postcss.parse(compile(entry, SASS).css).walkDecls('font-family', (decl) => {
      const value = decl.value.trim();
      if (!value.includes('var(--font-plex') && value !== 'inherit') literals.push(value);
    });

    expect(literals).toEqual([]);
  });
});
