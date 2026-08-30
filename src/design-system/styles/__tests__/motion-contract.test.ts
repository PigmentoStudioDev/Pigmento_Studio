/**
 * Contrato de motion: compila el Sass REAL y afirma sobre el CSS que sale.
 *
 * Los literales de duracion y de curva ya los vigila el gate `style` del contrato
 * (easing-literal, duration-literal). Lo que ese gate NO puede ver son las dos
 * cosas de aqui, porque las dos se comprueban sobre el CSS emitido y no sobre el
 * texto del .scss:
 *
 *   1. que toda hoja que anima apague su motion bajo prefers-reduced-motion
 *   2. que las duraciones que salgan sean las de la escala de marca
 *
 * La primera es accesibilidad y la segunda es identidad. Ninguna rompe el build al
 * fallar — una hoja sin reduced-motion se ve perfecta hasta que la usa alguien a
 * quien el movimiento le sienta mal, y una duracion fuera de escala solo se nota
 * cuando dos gestos que deberian ir juntos van desacompasados.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import postcss, { type AtRule, type Declaration } from 'postcss';
import { compile, compileString, type Options } from 'sass';
import { describe, expect, it } from 'vitest';

const DS = join(process.cwd(), 'src/design-system');
const STYLES = join(DS, 'styles');
const SASS: Options<'sync'> = { loadPaths: ['node_modules'], quietDeps: true };

const ANIMATES = /^(transition|animation)/;
/**
 * Solo el bloque que APAGA. Antes bastaba con nombrar la consulta, y eso dejaba
 * fuera del recuento todo lo que vive dentro de `prefers-reduced-motion:
 * no-preference` — que es donde esta casi todo el hover del sitio. El gate decia
 * medir las duraciones de cada hoja y en la practica se saltaba las del gesto
 * principal de dos atomos.
 */
const REDUCED_MOTION = /prefers-reduced-motion:\s*reduce/;

/**
 * Hojas que la pagina de preview carga por su cuenta, exentas de la regla de
 * reduced-motion con motivo escrito. Es la unica valvula y esta aqui a la vista.
 */
const EXEMPT: Record<string, string> = {
  'preview/preview.scss':
    'es la demo de los tokens de motion de Carbon: la pagina existe para VER el ' +
    'movimiento, y apagarlo bajo reduced-motion dejaria un cuadro quieto que no ' +
    'explica nada. /ds es herramienta de desarrollo, no una pagina del sitio.',
};

function sheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sheets(full);
    return entry.name.endsWith('.scss') && !entry.name.startsWith('_') ? [full] : [];
  });
}

interface Sheet {
  readonly rel: string;
  readonly css: string;
}

const ALL: Sheet[] = sheets(DS).map((file) => ({
  rel: file.slice(DS.length + 1),
  css: compile(file, SASS).css,
}));

/**
 * Declaraciones de transition/animation, con las de un bloque `reduce` descontadas.
 *
 * Se marcan primero las que viven dentro del bloque y luego se descuentan, en vez
 * de subir por los padres de cada declaracion: el tipo de `parent` en postcss es
 * una union que incluye Document, y recorrerla a mano obliga a castear justo donde
 * el compilador estaba siendo util.
 *
 * `guarded` hace lo mismo con las que viven bajo `no-preference`. Las dos preguntas
 * de este contrato necesitan recuentos distintos y por eso van separadas:
 *
 *   la de DURACIONES las quiere todas — un gesto de hover esta casi siempre dentro
 *   de un no-preference, y saltarselas dejaba fuera el gesto principal del sitio
 *
 *   la de APAGADO solo quiere las que pueden llegar a correr con reduced-motion
 *   activo, y una declaracion bajo no-preference no puede por construccion
 */
const NO_PREFERENCE = /prefers-reduced-motion:\s*no-preference/;

function animatingDecls(css: string): Declaration[] {
  const root = postcss.parse(css);
  const reduced = new Set<string>();

  root.walkAtRules('media', (rule: AtRule) => {
    if (!REDUCED_MOTION.test(rule.params)) return;
    rule.walkDecls((decl) => {
      reduced.add(`${decl.prop}:${decl.value}@${decl.source?.start?.offset}`);
    });
  });

  const found: Declaration[] = [];
  root.walkDecls((decl) => {
    const id = `${decl.prop}:${decl.value}@${decl.source?.start?.offset}`;
    if (ANIMATES.test(decl.prop) && !reduced.has(id)) found.push(decl);
  });

  return found;
}

/** Las que de verdad pueden correr con reduced-motion activo. */
function unguardedDecls(css: string): Declaration[] {
  const root = postcss.parse(css);
  const skip = new Set<string>();

  root.walkAtRules('media', (rule: AtRule) => {
    if (!REDUCED_MOTION.test(rule.params) && !NO_PREFERENCE.test(rule.params)) return;
    rule.walkDecls((decl) => {
      skip.add(`${decl.prop}:${decl.value}@${decl.source?.start?.offset}`);
    });
  });

  const found: Declaration[] = [];
  root.walkDecls((decl) => {
    const id = `${decl.prop}:${decl.value}@${decl.source?.start?.offset}`;
    if (ANIMATES.test(decl.prop) && !skip.has(id)) found.push(decl);
  });

  return found;
}

const ANIMATING = ALL.filter((sheet) => animatingDecls(sheet.css).length > 0);

/**
 * Una hoja cuyo motion vive ENTERO bajo `no-preference` no necesita bloque de
 * apagado: la consulta ya es el interruptor. Exigirselo pedia un `@media` que no
 * puede apagar nada porque nada llega hasta el.
 */
const NEEDS_OFF_SWITCH = new Set(
  ALL.filter((sheet) => unguardedDecls(sheet.css).length > 0).map((sheet) => sheet.rel),
);

describe('contrato de motion', () => {
  it('hay hojas que animan: si no, este contrato no estaria midiendo nada', () => {
    expect(ANIMATING.length).toBeGreaterThan(0);
  });

  /**
   * Se enumera del directorio, no de una lista: una hoja nueva que anime y olvide
   * su bloque de reduced-motion se cae sola, sin que nadie tenga que acordarse de
   * anadirla aqui.
   */
  it.each(ANIMATING.map((sheet) => sheet.rel))('%s apaga su motion en reduced-motion', (rel) => {
    if (EXEMPT[rel]) return;
    if (!NEEDS_OFF_SWITCH.has(rel)) return;

    const sheet = ANIMATING.find((candidate) => candidate.rel === rel)!;
    const blocks: AtRule[] = [];
    postcss.parse(sheet.css).walkAtRules('media', (rule) => {
      if (REDUCED_MOTION.test(rule.params)) blocks.push(rule);
    });

    expect(blocks.length).toBeGreaterThan(0);

    // No basta con que el bloque exista: tiene que poner transition o animation a
    // none. Un @media vacio, o que solo toque colores, pasaria una comprobacion
    // de presencia y no apagaria nada.
    const off = blocks.flatMap((block) => {
      const decls: Declaration[] = [];
      block.walkDecls((decl) => {
        if (ANIMATES.test(decl.prop) && decl.value.trim() === 'none') decls.push(decl);
      });
      return decls;
    });

    expect(off.length).toBeGreaterThan(0);
  });

  /**
   * Toda duracion que emiten los COMPONENTES sale de la escala expresiva de
   * _brand.scss. La escala es de ratio — un cuarto, media, una, una y media, doble
   * — y ese parentesco es lo que permite desfasar dos gestos y que suenen juntos.
   * Una duracion suelta rompe la relacion sin romper nada visible.
   *
   * Los tokens se leen del propio Sass: una lista copiada a mano se desincroniza
   * en cuanto la escala cambie, que es justo lo que va a pasar cuando la marca
   * sustituya los placeholders.
   */
  const scale = new Set(
    compileString(
      `@use 'brand';
       .probe {
         a: brand.$duration-quarter;
         b: brand.$duration-half;
         c: brand.$duration-base;
         d: brand.$duration-onehalf;
         e: brand.$duration-double;

         /*
          * Los pasos de DESFASE tambien son escala de marca, aunque no sean
          * duraciones: no caben en ella — el escalon mas corto son 0.15s, que en una
          * palabra de seis letras es casi un segundo solo de retardo — pero salen
          * del mismo sitio y estan igual de cerrados. Sin ellos aqui, la unica forma
          * de escalonar nada seria un literal.
          */
         f: brand.$stagger-char;
         g: brand.$stagger-slice;
       }`,
      { ...SASS, loadPaths: [...(SASS.loadPaths ?? []), STYLES] },
    )
      .css.match(/[\d.]+m?s/g)!
      .map((value) => value.trim()),
  );

  const components = ALL.filter((sheet) => sheet.rel.startsWith('components/'));

  it.each(components.map((sheet) => sheet.rel))(
    '%s solo usa duraciones de la escala de marca',
    (rel) => {
      const sheet = components.find((candidate) => candidate.rel === rel)!;

      const durations = animatingDecls(sheet.css)
        .flatMap((decl) => decl.value.match(/(?<![\w.])[\d.]+m?s\b/g) ?? [])
        // 0s es apagar, no una duracion.
        .filter((value) => !/^0(\.0+)?m?s$/.test(value));

      expect(durations.filter((value) => !scale.has(value))).toEqual([]);
    },
  );
});
