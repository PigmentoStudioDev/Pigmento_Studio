#!/usr/bin/env node
/**
 * Runner del contrato del design system.
 *
 * El contrato es DATA (conformance/*.json), el runner es tonto. Cambiar una ley
 * es editar un JSON — revisable en diff — y no tocar codigo. Un agente que
 * necesite relajar una regla tiene que tocar ese directorio explicitamente, y eso
 * se ve en el review; un literal enterrado en un .scss no se ve.
 *
 *   pnpm conformance            # todo el contrato
 *   pnpm conformance style      # una seccion:
 *                               # style | tsx | react | structure | modularity | budgets
 *
 * El compliance completo (build + lint + contrato + tests) es ./scripts/gates.sh.
 */
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const CONF = join(ROOT, 'conformance');

/**
 * Valvula por linea. Las reglas de TSX son mas grises que las de Sass (un `as any`
 * puede ser el unico camino en una frontera con una lib sin tipos), y `exemptFiles`
 * es demasiado grueso para eso: exime el archivo entero. Sin motivo escrito detras
 * de los dos puntos no cuenta como exencion.
 */
const EXEMPT = 'conformance-exempt:';

let failures = 0;
let notes = 0;

const fail = (section, msg) => {
  failures += 1;
  console.error(`  FAIL  [${section}] ${msg}`);
};
const note = (section, msg) => {
  notes += 1;
  console.log(`  nota  [${section}] ${msg}`);
};
const ok = (section, msg) => console.log(`  OK    [${section}] ${msg}`);

const readJson = (name) => JSON.parse(readFileSync(join(CONF, name), 'utf8'));
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');

/**
 * Lo que ve el escaner: primero fuera las lineas con la valvula, DESPUES fuera los
 * comentarios. En ese orden — la valvula vive dentro de un comentario, asi que
 * strippear primero la borraria junto con su motivo.
 */
const scannable = (src) =>
  stripComments(
    src
      .split('\n')
      .filter((line) => !line.includes(EXEMPT))
      .join('\n'),
  );

function* walk(dir, ext) {
  const exts = Array.isArray(ext) ? ext : [ext];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full, exts);
    else if (exts.some((e) => entry.endsWith(e))) yield full;
  }
}

/** Cuenta violaciones de una regla: por patron, o por declaracion cuyo valor no sea var()/inherit. */
function countRule(src, rule) {
  if (rule.pattern) return (src.match(new RegExp(rule.pattern, 'g')) ?? []).length;

  // Lo que la regla persigue es un LITERAL, no una forma concreta de escribirlo. Un
  // `var(...)` vale y una funcion del propio sistema de tokens tambien: las dos
  // dicen de donde sale el valor. La lista es del contrato, no del runner.
  const allow = rule.allow ?? ['var(', 'inherit'];
  let n = 0;
  for (const m of src.matchAll(new RegExp(`${rule.declaration}:\\s*([^;}]+)`, 'g'))) {
    const value = m[1].trim();
    if (!allow.some((prefix) => value.startsWith(prefix))) n += 1;
  }
  return n;
}

/** Secciones de literales (style, tsx, react): mismo motor, distinto contrato. */
function literalSection(section, contractFile) {
  const contract = readJson(contractFile);
  let clean = 0;

  for (const dir of contract.scanDirs) {
    for (const file of walk(join(ROOT, dir), contract.ext)) {
      const rel = relative(join(ROOT, dir), file);

      // La exencion por archivo admite dos formas. Un string exime de TODO el
      // contrato — la forma corta de siempre. Un objeto con `rules` exime solo de
      // las que nombra, y esa es la que hay que preferir: un archivo suele tener
      // permiso para una cosa concreta, no para todas. _brand.scss puede llevar
      // literales porque ES la capa de primitivas; eso no le da barra libre con
      // reglas que no van de literales.
      const exemption = contract.exemptFiles[rel];
      if (typeof exemption === 'string') continue;
      const exemptRules = new Set(exemption?.rules ?? []);

      // Dos vistas del mismo archivo. La normal no ve los comentarios, que es lo
      // correcto para un literal: codigo comentado no viaja al navegador. Pero hay
      // reglas que son SOBRE el comentario — lo que se escribe ahi tambien se
      // publica — y esas piden `includeComments`. En las dos vistas se quitan
      // antes las lineas con la valvula, o exponerla dejaria de funcionar.
      const filtered = readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => !line.includes(EXEMPT))
        .join('\n');
      const src = stripComments(filtered);
      const baseline = contract.baseline[rel] ?? {};
      let dirty = false;

      for (const [name, rule] of Object.entries(contract.rules)) {
        if (exemptRules.has(name)) continue;

        const found = countRule(rule.includeComments ? filtered : src, rule);
        const allowed = baseline[name] ?? 0;

        if (found > allowed) {
          dirty = true;
          fail(section, `${rel}: ${name} ${found} > baseline ${allowed} — ${rule.why}`);
        } else if (found < allowed) {
          note(section, `${rel}: ${name} bajo a ${found} (baseline ${allowed}) — baja el baseline en ${contractFile}`);
        }
      }

      if (!dirty) clean += 1;
    }
  }

  ok(section, `${clean} archivos dentro de contrato`);
}

/**
 * Lineas de codigo reales, numeradas: sin blancos y sin comentarios de linea ni de
 * bloque. Hace falta para las reglas posicionales — 'use client' tiene que ser la
 * PRIMERA sentencia, y un comentario delante no cuenta pero un import si.
 */
function codeLines(src) {
  const out = [];
  let inBlock = false;

  src.split('\n').forEach((raw, i) => {
    let line = raw;

    if (inBlock) {
      const end = line.indexOf('*/');
      if (end === -1) return;
      line = line.slice(end + 2);
      inBlock = false;
    }

    line = line.replace(/\/\*[\s\S]*?\*\//g, '');
    const open = line.indexOf('/*');
    if (open !== -1) {
      inBlock = true;
      line = line.slice(0, open);
    }

    const text = line.replace(/\/\/.*$/, '').trim();
    if (text) out.push({ n: i + 1, text });
  });

  return out;
}

/** react — frontera servidor/cliente y contrato de exports del App Router. */
function sectionReact() {
  literalSection('react', 'react-contract.json');

  const contract = readJson('react-contract.json');
  const base = join(ROOT, contract.scanDirs[0]);
  const dir = contract.directiveFirst;
  const boundary = contract.clientBoundary;
  const routes = contract.routeExports;
  const directive = new RegExp(`^["'\`]${dir.directive}["'\`]`);

  let client = 0;
  let checked = 0;

  /**
   * Una clave que acaba en '/' exime su subarbol. Existe por el codigo generado:
   * Payload anade archivos al arbol cuando cambia el config, y una lista archivo a
   * archivo se desincroniza en silencio. Sin la barra sigue siendo igualdad exacta,
   * que es lo que impide que 'app/' se coma media aplicacion.
   */
  const eximido = (rel) =>
    Object.keys(contract.exemptFiles).some(
      (k) => rel === k || (k.endsWith('/') && rel.startsWith(k)),
    );

  for (const file of walk(base, contract.ext)) {
    const rel = relative(base, file);
    if (eximido(rel)) continue;

    const raw = readFileSync(file, 'utf8');
    const lines = codeLines(raw);
    const at = lines.findIndex((l) => directive.test(l.text));

    if (at > 0) {
      fail('react', `${rel}:${lines[at].n}: '${dir.directive}' no es la primera sentencia (la precede \`${lines[0].text.slice(0, 40)}\`) — ${dir.why}`);
    }

    if (at === 0) {
      client += 1;
      if (!boundary.allow.some((p) => rel === p || rel.startsWith(p))) {
        fail('react', `${rel}: '${dir.directive}' fuera de la frontera declarada — ${boundary.why}`);
      }
    }

    if (!rel.endsWith(routes.ext)) continue;
    checked += 1;

    const isRoute =
      rel.startsWith(`${routes.routeDir}/`) &&
      routes.routeFiles.includes(basename(rel, routes.ext));
    const hasDefault = /^export default\b/m.test(scannable(raw));

    if (isRoute && !hasDefault) {
      fail('react', `${rel}: archivo de ruta sin export default — ${routes.why}`);
    } else if (!isRoute && hasDefault) {
      fail('react', `${rel}: export default fuera de una ruta — ${routes.why}`);
    }
  }

  ok('react', `${client} componentes de cliente dentro de la frontera, ${checked} .tsx con el export que les toca`);
}

/** modularity — longitud de archivo y grafo de imports. */
function sectionModularity() {
  const contract = readJson('modularity-contract.json');

  // 1. Longitud: ningun archivo pasa del tope; los que se acercan avisan.
  const len = contract.fileLength;
  let longest = 0;
  let files = 0;

  for (const dir of len.scanDirs) {
    for (const file of walk(join(ROOT, dir), len.exts)) {
      const rel = relative(join(ROOT, dir), file);
      if (len.exemptFiles[rel]) continue;

      files += 1;
      const n = readFileSync(file, 'utf8').split('\n').length;
      longest = Math.max(longest, n);

      if (n > len.max) fail('modularity', `${rel}: ${n} lineas > tope ${len.max} — ${len.why}`);
      else if (n > len.warn) note('modularity', `${rel}: ${n} lineas (>${len.warn}: candidato a partir)`);
    }
  }

  ok('modularity', `${files} archivos bajo el tope de ${len.max} lineas (el mayor: ${longest})`);

  // 2. Grafo: cada modulo importa solo lo que le toca.
  const imp = contract.imports;
  const SPECIFIER = /(?:from\s*|import\s*|import\(\s*)["'`]([^"'`]+)["'`]/g;
  let edges = 0;

  for (const dir of imp.scanDirs) {
    const base = join(ROOT, dir);

    for (const file of walk(base, imp.exts)) {
      const rel = relative(base, file);
      const src = scannable(readFileSync(file, 'utf8'));

      for (const [, spec] of src.matchAll(SPECIFIER)) {
        // Externo (paquete de node_modules): no es parte de este grafo.
        const isAlias = spec.startsWith(imp.aliasPrefix);
        if (!isAlias && !spec.startsWith('.')) continue;

        const target = isAlias
          ? spec.slice(imp.aliasPrefix.length)
          : relative(base, resolve(dirname(file), spec));
        edges += 1;

        if (spec.includes('../') && moduleOf(target) !== moduleOf(rel)) {
          fail('modularity', `${rel}: '${spec}' sale del modulo '${moduleOf(rel)}' por un relativo — ${imp.crossModuleRelative.why}`);
        }

        for (const rule of imp.boundaries) {
          if (rule.mayNotImport && rel.startsWith(rule.from)) {
            if (rule.mayNotImport.some((p) => target.startsWith(p))) {
              fail('modularity', `${rel} importa '${target}': ${rule.from} no puede depender de ${rule.mayNotImport.join(', ')} — ${rule.why}`);
            }
          }

          if (rule.importableFrom && target.startsWith(rule.to)) {
            if (!rule.importableFrom.some((p) => rel.startsWith(p))) {
              fail('modularity', `${rel} importa '${target}': ${rule.to} solo es importable desde ${rule.importableFrom.join(', ')} — ${rule.why}`);
            }
          }
        }
      }
    }
  }

  ok('modularity', `${edges} imports internos dentro del grafo permitido`);
}

const moduleOf = (rel) => rel.split('/')[0];

/** structure — cada pieza donde el sistema asume que esta. */
function sectionStructure() {
  const contract = readJson('structure-contract.json');

  // 1. Todo entry de Sass (no partial) carga el partial de configuracion.
  const { scanDir, partial, why, exemptFiles = {} } = contract.sassConfigPartial;
  let entries = 0;
  for (const file of walk(join(ROOT, scanDir), '.scss')) {
    const rel = relative(ROOT, file);
    if (file.split('/').pop().startsWith('_')) continue;
    // Una exencion cuenta como entry: si no, quitar la hoja del contrato y quitarla
    // del proyecto darian el mismo numero y nadie notaria la diferencia.
    entries += 1;
    if (exemptFiles[rel]) continue;
    if (!readFileSync(file, 'utf8').includes(partial)) {
      fail('structure', `${rel}: entry de Sass sin @use de '${partial}' — ${why}`);
    }
  }
  ok('structure', `${entries} entries de Sass cargan la configuracion`);

  // 2. Las clases usadas fuera de preview/ estan en la hoja global.
  const g = contract.globalClasses;
  const globalSheet = readFileSync(join(ROOT, g.globalSheet), 'utf8');
  const scoped = join(ROOT, g.scopedDir);
  const used = new Set();

  for (const file of walk(join(ROOT, 'src'), '.tsx')) {
    if (file.startsWith(scoped)) continue;

    // Dos precisiones, las dos por falsos positivos reales:
    //
    // scannable() quita los comentarios, como ya hacen las demas secciones. Esta
    // los leia, asi que nombrar una clase en una nota la daba por usada — y una
    // clase que solo vive en un comentario no llega a ningun DOM.
    //
    // El lookbehind descarta `--pg-x`, que es una CUSTOM PROPERTY y no una clase.
    // Con \b bastaba el guion para abrir palabra, asi que `--pg-mode-dark` se
    // contaba como `.pg-mode-dark` y se le exigia estar en la hoja global.
    for (const [, cls] of scannable(readFileSync(file, 'utf8')).matchAll(
      new RegExp(`["'\`][^"'\`]*(?<![-\\w])(${g.prefix}[a-z0-9-]+)`, 'g'),
    )) {
      used.add(cls);
    }
  }

  for (const cls of [...used].sort()) {
    if (!globalSheet.includes(`.${cls}`)) {
      fail('structure', `.${cls} se usa fuera de preview/ pero no esta en ${g.globalSheet} — ${g.why}`);
    }
  }
  ok('structure', `${used.size} clases globales definidas donde toca`);
}

/**
 * Los archivos que piden DE ENTRADA las paginas PUBLICAS ya renderizadas.
 *
 * Existe desde que hay carga bajo demanda. Sumar todo lo emitido media una cosa
 * distinta de la que este contrato dice medir: partir gsap en su propio trozo baja
 * 54kb de lo que descarga una visita y no mueve el total ni un byte, porque los
 * bytes siguen en el disco. Con el total como unica vara, la optimizacion correcta
 * salia igual de roja que no hacer nada.
 *
 * Que queda fuera y por que vive en FUERA_DE_LA_VISITA, no en un `if` encadenado:
 * asi la siguiente ruta que se excluya tiene que traer su motivo escrito al lado.
 *
 * El mismo fallo en CSS: devolver null cuando la extension no era .js hacia que
 * quien llama cayera a walk() sobre .next/static entero, y el CSS del admin
 * reventaria el techo de gzip midiendo algo que ningun visitante pide.
 *
 * Se leen del HTML prerenderizado y no de un manifiesto: es la lista real de lo
 * que el navegador va a pedir antes de ejecutar nada. Si no hay HTML publico —una
 * app sin rutas estaticas, o solo el panel— se devuelve null y quien llama cae al
 * total, que sigue siendo el techo honesto en ese caso.
 */
const FUERA_DE_LA_VISITA = [
  ['(payload)', 'el panel del CMS: lo abre quien edita, no quien visita el sitio'],
  ['/ds.html', '/ds es herramienta de desarrollo y no una pagina del sitio (CLAUDE.md)'],
];

function firstLoadFiles(dir, ext) {
  const pages = join(ROOT, '.next/server/app');
  if (!existsSync(pages) || (ext !== '.js' && ext !== '.css')) return null;

  const referenced = new Set();

  for (const page of walk(pages, '.html')) {
    if (FUERA_DE_LA_VISITA.some(([fragment]) => page.includes(fragment))) continue;
    const html = readFileSync(page, 'utf8');
    const pattern =
      ext === '.css'
        ? /<link\b[^>]*\brel=["']stylesheet["'][^>]*href=["']\/_next\/(static\/[^"'?]+\.css)/gi
        : /\/_next\/(static\/[^"'?]+\.js)/g;
    for (const [, ref] of html.matchAll(pattern)) {
      const file = join(ROOT, '.next', ref);
      if (existsSync(file)) referenced.add(file);
    }
  }

  return referenced.size > 0 ? [...referenced] : null;
}

/** budgets — peso de lo que viaja al navegador. */
function sectionBudgets() {
  const contract = readJson('budgets.json');

  for (const [name, artifact] of Object.entries(contract.artifacts)) {
    const [base] = artifact.glob.split('/**');
    const dir = join(ROOT, base);
    if (!existsSync(dir)) {
      note('budgets', `${name}: no hay build (${base}) — corre \`pnpm build\` para medir`);
      continue;
    }

    const ext = artifact.glob.slice(artifact.glob.lastIndexOf('.'));
    const files = firstLoadFiles(dir, ext) ?? [...walk(dir, ext)];
    let raw = 0;
    let gzip = 0;
    for (const file of files) {
      const buf = readFileSync(file);
      raw += buf.length;
      gzip += gzipSync(buf).length;
    }

    const rawKb = Math.round(raw / 1024);
    const gzipKb = Math.round(gzip / 1024);

    if (rawKb > artifact.maxRawKb) {
      fail('budgets', `${name}: ${rawKb}kb raw > ${artifact.maxRawKb}kb`);
    } else if (gzipKb > artifact.maxGzipKb) {
      fail('budgets', `${name}: ${gzipKb}kb gzip > ${artifact.maxGzipKb}kb`);
    } else {
      ok('budgets', `${name}: ${rawKb}kb raw / ${gzipKb}kb gzip (limite ${artifact.maxRawKb}/${artifact.maxGzipKb})`);
    }
  }
}

/** payload — la frontera entre el CMS y el sitio. */
function sectionPayload() {
  const contract = readJson('payload-contract.json');
  const base = join(ROOT, contract.scanDir);

  // 1. Ningun secreto escrito en el codigo.
  for (const [name, rule] of Object.entries(contract.rules)) {
    const re = new RegExp(rule.pattern, 'g');
    for (const file of walk(base, rule.exts)) {
      const rel = relative(base, file);
      for (const line of codeLines(readFileSync(file, 'utf8'))) {
        re.lastIndex = 0;
        if (re.test(line.text)) {
          fail('payload', `${rel}:${line.n}: ${name} — ${rule.why}`);
        }
      }
    }
  }

  // 2. Lo generado, en las dos direcciones.
  const gen = contract.generated;
  const reactExempt = readJson('react-contract.json').exemptFiles;
  let generated = 0;

  for (const file of walk(base, ['.ts', '.tsx'])) {
    const rel = relative(base, file);
    const marcado = readFileSync(file, 'utf8').includes(gen.header);
    const dentro = rel.startsWith(gen.dir);

    if (marcado && !dentro) {
      fail('payload', `${rel}: lleva la cabecera de generado fuera de ${gen.dir} — ${gen.why}`);
    }
    if (marcado && dentro) {
      generated += 1;
      const cubierto = Object.keys(reactExempt).some(
        (k) => rel === k || (k.endsWith('/') && rel.startsWith(k)),
      );
      if (!cubierto) {
        fail('payload', `${rel}: generado y sin exencion en react-contract — ${gen.why}`);
      }
    }
  }

  // 3. El panel, fuera del idioma.
  const proxy = contract.adminFueraDelProxy;
  const matcher = readFileSync(join(base, proxy.file), 'utf8').match(/matcher:\s*["'`]([^"'`]+)/);
  if (!matcher) fail('payload', `${proxy.file}: no encuentro el matcher — ${proxy.why}`);
  else if (!matcher[1].includes(proxy.mustExclude)) {
    fail('payload', `${proxy.file}: el matcher no excluye '${proxy.mustExclude}' — ${proxy.why}`);
  }

  // 4. Las dos listas de idiomas dicen lo mismo.
  const loc = contract.localesEnSintonia;
  const leer = (file, clave) => {
    const src = readFileSync(join(base, file), 'utf8');
    const lista = src.match(new RegExp(`${clave}:\\s*\\[([^\\]]*)\\]`));
    const def = src.match(/defaultLocale:\s*["'`]([^"'`]+)/);
    return {
      locales: lista ? [...lista[1].matchAll(/["'`]([a-z-]+)["'`]/g)].map(([, v]) => v).sort() : null,
      defaultLocale: def ? def[1] : null,
    };
  };

  const a = leer(loc.intl, 'locales');
  const b = leer(loc.payload, 'locales');

  if (!a.locales || !b.locales) {
    fail('payload', `no pude leer los locales de ${loc.intl} o ${loc.payload} — ${loc.why}`);
  } else if (a.locales.join(',') !== b.locales.join(',')) {
    fail('payload', `locales distintos: ${loc.intl} [${a.locales}] vs ${loc.payload} [${b.locales}] — ${loc.why}`);
  } else if (a.defaultLocale !== b.defaultLocale) {
    fail('payload', `defaultLocale distinto: '${a.defaultLocale}' vs '${b.defaultLocale}' — ${loc.why}`);
  } else {
    ok('payload', `locales en sintonia: [${a.locales}], default '${a.defaultLocale}'`);
  }

  ok('payload', `${generated} archivos generados dentro de ${gen.dir}, sin secretos en el codigo`);
}

const SECTIONS = {
  style: () => literalSection('style', 'style-contract.json'),
  tsx: () => literalSection('tsx', 'tsx-contract.json'),
  react: sectionReact,
  structure: sectionStructure,
  modularity: sectionModularity,
  budgets: sectionBudgets,
  payload: sectionPayload,
};

const pick = process.argv[2];
if (pick && !SECTIONS[pick]) {
  console.error(`seccion desconocida "${pick}" — usa: ${Object.keys(SECTIONS).join(' | ')}`);
  process.exit(1);
}

console.log(`conformance ${pick ?? '(todo el contrato)'}\n`);
for (const [name, run] of Object.entries(SECTIONS)) {
  if (pick && pick !== name) continue;
  console.log(`— ${name}`);
  run();
}

console.log(
  `\n${failures ? `${failures} violaciones de contrato` : 'contrato completo en verde'}` +
    `${notes ? ` · ${notes} notas` : ''}`,
);
process.exit(failures ? 1 : 0);
