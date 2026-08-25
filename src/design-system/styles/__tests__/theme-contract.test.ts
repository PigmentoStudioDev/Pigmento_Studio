/**
 * Contrato del tema: compila el Sass REAL y afirma sobre el CSS que sale.
 *
 * Cada assert corresponde a un bug que ya ocurrio. Un gate que no falla contra su
 * bug conocido no es un gate, asi que cada uno se escribio primero contra el
 * codigo roto y se verifico en rojo.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import postcss, { type Rule } from 'postcss';
import { compile } from 'sass';
import { describe, expect, it } from 'vitest';

const STYLES = join(process.cwd(), 'src/design-system/styles');
const PREVIEW = join(process.cwd(), 'src/design-system/preview');

function css(entry: string): string {
  return compile(entry, { loadPaths: ['node_modules'], quietDeps: true }).css;
}

/**
 * Aplana la cascada de un selector: recorre sus bloques en orden y el ultimo gana.
 *
 * Usa un parser de CSS de verdad y no una regex porque hay que EXCLUIR las reglas
 * anidadas en at-rules: Carbon emite un `:root` dentro de `@media (forced-colors)`
 * con valores de sistema (`Highlight`, `LinkText`) que solo aplican en alto
 * contraste. Una regex los leia como si fueran el tema y el gate mentia.
 */
function cascade(source: string, selector: string): Map<string, string> {
  const final = new Map<string, string>();

  postcss.parse(source).walkRules((rule: Rule) => {
    if (rule.parent?.type !== 'root') return;
    const selectors = rule.selector.split(',').map((s) => s.trim());
    if (!selectors.includes(selector)) return;

    rule.walkDecls(/^--cds-/, (decl) => {
      final.set(decl.prop.replace('--cds-', ''), decl.value.trim());
    });
  });

  return final;
}

const COMPONENT_TOKEN = /^(notification|tag|button|status|content-switcher)-/;

describe('tema emitido por index.scss', () => {
  const source = css(join(STYLES, 'index.scss'));
  const root = cascade(source, ':root');
  const g100 = cascade(source, '.cds--g100');
  const light = cascade(source, "[data-theme=light]");

  it('emite el tema base g100', () => {
    expect(root.get('background')).toBe('#161616');
    expect(root.get('text-primary')).toBe('#f4f4f4');
  });

  it('aplica los overrides de marca sobre la base', () => {
    expect(root.get('focus')).toBe('#78a9ff');
    expect(root.get('link-primary')).toBe('#78a9ff');
  });

  /**
   * El bug: Carbon resuelve sus tokens de componente con matches(), que exige
   * igualdad EXACTA contra un tema de fabrica. Pasarle el tema ya mezclado con los
   * overrides hace fallar el match y los 76 caen al fallback del tema white:
   * fondos claros con texto claro. Un solo override basta para tirarlos todos.
   */
  it('los tokens de componente no se desvian de g100', () => {
    const tokens = [...g100.keys()].filter((k) => COMPONENT_TOKEN.test(k));
    expect(tokens.length).toBeGreaterThan(70);
    expect(tokens.filter((k) => root.get(k) !== g100.get(k))).toEqual([]);
  });

  it('deja las notificaciones sobre fondo oscuro', () => {
    for (const kind of ['info', 'success', 'warning', 'error']) {
      expect(root.get(`notification-background-${kind}`)).toBe('#262626');
    }
  });

  it('el tema claro emite el white de fabrica', () => {
    expect(light.get('background')).toBe('#ffffff');
    expect(light.size).toBeGreaterThan(500);
  });
});

/**
 * El bug: cada .scss que Next compila es una unidad independiente, asi que la
 * configuracion de index.scss no aplica a los demas entries. Un entry que no cargue
 * _carbon-config.scss emite el literal 'IBM Plex Sans', que next/font no registra
 * bajo ese nombre: la tipografia se pierde sin ningun error de build.
 *
 * Los entries se ENUMERAN del directorio, no se listan a mano: un .scss nuevo que
 * olvide el partial se cae solo.
 */
describe('todos los entries de Sass heredan la configuracion de fuentes', () => {
  const entries = [
    join(STYLES, 'index.scss'),
    ...readdirSync(PREVIEW)
      .filter((f) => f.endsWith('.scss') && !f.startsWith('_'))
      .map((f) => join(PREVIEW, f)),
  ];

  it.each(entries)('%s no emite familias literales', (entry) => {
    const literals: string[] = [];

    postcss.parse(css(entry)).walkDecls('font-family', (decl) => {
      const value = decl.value.trim();
      if (!value.includes('var(--font-plex') && value !== 'inherit') {
        literals.push(value);
      }
    });

    expect(literals).toEqual([]);
  });
});
