/**
 * Contrato de la superficie del rodado: la caja que recorta la copia mide 1em.
 *
 * El gesto esconde una copia de cada letra 1.3em por debajo y recorta la caja para
 * que no asome. Esa cuenta da por supuesto que la caja mide 1em, y por eso
 * `roll.surface()` declara `line-height: 1`. Si otra regla mas especifica trae el
 * interlineado de un estilo de tipo, la caja crece, el recorte baja con ella y la
 * copia aparece en reposo debajo del texto.
 *
 * Paso de verdad, y en produccion: en NavLinkList el include estaba escrito como
 * `.text` a secas y perdia contra `.sizeSmall .text` — un punto de especificidad —
 * que trae el interlineado 1.5 del cuerpo. Toda lista pequena con enlaces mostraba
 * su copia debajo. En el menu no se vio porque la unica lista pequena que hay tiene
 * una sola entrada sin destino, y sin destino el texto no se parte en caracteres.
 *
 * El comentario del mixin ya avisaba de este fallo exacto. Un aviso no es un gate.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import postcss, { type Rule } from 'postcss';
import { compile, type Options } from 'sass';
import { describe, expect, it } from 'vitest';

const DS = join(process.cwd(), 'src/design-system');
const SASS: Options<'sync'> = { loadPaths: ['node_modules'], quietDeps: true };

/** La marca que deja `roll.surface()`: quien la declara ES una superficie. */
const SURFACE = '--pg-char-shine';

function sheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sheets(full);
    return entry.name.endsWith('.scss') && !entry.name.startsWith('_') ? [full] : [];
  });
}

/**
 * Las clases del SUJETO del selector — el ultimo compuesto, que es el elemento al
 * que la regla pinta. En `.sizeSmall .text` el sujeto es `.text`: eso es lo que
 * hace que las dos reglas compitan por el mismo elemento.
 */
function subject(selector: string): Set<string> {
  const last = selector.trim().split(/[\s>+~]+/).filter(Boolean).pop() ?? '';
  return new Set([...last.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(([, name]) => name));
}

/** Especificidad, en el orden de siempre: ids, clases, elementos. */
function specificity(selector: string): number {
  const ids = selector.match(/#[\w-]+/g)?.length ?? 0;
  const classes = selector.match(/[.:[][\w-]+/g)?.length ?? 0;
  const elements = selector.match(/(?:^|[\s>+~])[a-zA-Z][\w-]*/g)?.length ?? 0;

  return ids * 10000 + classes * 100 + elements;
}

interface Candidate {
  readonly selector: string;
  readonly value: string;
  readonly weight: number;
  readonly order: number;
}

interface Surface {
  readonly rel: string;
  readonly selector: string;
  /** La que gana la cascada, que es la unica que cuenta. */
  readonly winner: Candidate | undefined;
}

const SURFACES: Surface[] = sheets(join(DS, 'components')).flatMap((file) => {
  const rel = file.slice(DS.length + 1);
  const root = postcss.parse(compile(file, SASS).css);

  const rules: Rule[] = [];
  // Con cuerpo: `push` devuelve un numero y el recorrido de postcss entiende un
  // valor devuelto como la orden de PARARSE.
  root.walkRules((rule) => {
    rules.push(rule);
  });

  const marked = rules.filter((rule) => rule.some((node) => 'prop' in node && node.prop === SURFACE));

  return marked.flatMap((rule) =>
    rule.selectors.map((selector) => {
      const classes = subject(selector);

      const candidates: Candidate[] = rules.flatMap((candidate, order) =>
        candidate.selectors.flatMap((other) => {
          if (![...subject(other)].some((cls) => classes.has(cls))) return [];

          const decl = candidate.nodes.findLast(
            (node) => 'prop' in node && node.prop === 'line-height',
          );

          if (!decl || !('value' in decl)) return [];

          return [{ selector: other, value: decl.value.trim(), weight: specificity(other), order }];
        }),
      );

      // La ultima de las mas pesadas: asi se resuelve la cascada cuando empatan.
      const winner = candidates.reduce<Candidate | undefined>(
        (best, current) =>
          !best || current.weight > best.weight || (current.weight === best.weight && current.order >= best.order)
            ? current
            : best,
        undefined,
      );

      return { rel, selector, winner };
    }),
  );
});

describe('contrato del rodado', () => {
  it('hay superficies que revisar: si no, este contrato no estaria midiendo nada', () => {
    expect(SURFACES.length).toBeGreaterThan(0);
  });

  it.each(SURFACES.map((s) => [`${s.rel} · ${s.selector}`, s] as const))(
    '%s: la caja que recorta mide 1em',
    (_label, surface) => {
      expect(surface.winner?.value).toBe('1');
    },
  );
});
