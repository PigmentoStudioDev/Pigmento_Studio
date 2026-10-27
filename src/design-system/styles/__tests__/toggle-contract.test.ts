/**
 * Los conmutadores de la fila de utilidades — tema, sonido, idioma — son HERMANOS:
 * viven juntos en la cabecera y se leen como una sola familia de controles.
 *
 * Divergieron sin que nada lo dijera: el de sonido no tenia borde, su icono media
 * 1.25rem frente a 1.5rem, y su hover ponia la placa oscura sin cambiar el color del
 * icono — en claro, un icono oscuro sobre un fondo oscuro. Este contrato compara
 * los tres sobre el CSS compilado: mismo cuerpo, mismo hover.
 */
import { join } from 'node:path';
import postcss from 'postcss';
import { compile, type Options } from 'sass';
import { describe, expect, it } from 'vitest';

const MOLECULES = join(process.cwd(), 'src/design-system/components/molecules');
const SASS: Options<'sync'> = { loadPaths: ['node_modules'], quietDeps: true };

const TOGGLES = ['ThemeToggle', 'LanguageToggle', 'MotionToggle'] as const;

/**
 * El hover vive dentro de esta consulta: en tactil :hover se queda pegado tras el
 * toque y el conmutador parecia activo.
 */
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

/**
 * Las declaraciones de un selector de primer nivel o, con `media`, de dentro de esa
 * consulta. Las de cualquier otra @media no cuentan.
 */
function declarations(
  name: string,
  selector: string,
  props: readonly string[],
  media?: string,
): Record<string, string> {
  const css = compile(join(MOLECULES, name, `${name}.module.scss`), SASS).css;
  const found: Record<string, string> = {};

  postcss.parse(css).walkRules((rule) => {
    const parent = rule.parent;
    const inPlace = media
      ? parent?.type === 'atrule' && (parent as postcss.AtRule).params === media
      : parent?.type === 'root';
    if (!inPlace || rule.selector !== selector) return;
    rule.walkDecls((decl) => {
      if (props.includes(decl.prop)) found[decl.prop] = decl.value;
    });
  });

  return found;
}

describe('contrato de conmutadores', () => {
  const BODY = ['border', 'border-radius', 'color', 'inline-size', 'block-size'] as const;
  const HOVER = ['background-color', 'color'] as const;

  it.each(TOGGLES)('%s tiene el cuerpo de la familia', (name) => {
    expect(declarations(name, '.root', BODY)).toEqual(declarations('ThemeToggle', '.root', BODY));
  });

  it.each(TOGGLES)('%s invierte placa E icono al pasar por encima', (name) => {
    const hover = declarations(name, '.root:hover', HOVER, FINE_POINTER);

    expect(Object.keys(hover).sort()).toEqual([...HOVER].sort());
    expect(hover).toEqual(declarations('ThemeToggle', '.root:hover', HOVER, FINE_POINTER));
  });
});
