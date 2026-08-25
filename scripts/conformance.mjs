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

  let n = 0;
  for (const m of src.matchAll(new RegExp(`${rule.declaration}:\\s*([^;}]+)`, 'g'))) {
    const value = m[1].trim();
    if (!value.startsWith('var(') && value !== 'inherit') n += 1;
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
      if (contract.exemptFiles[rel]) continue;

      const src = scannable(readFileSync(file, 'utf8'));
      const baseline = contract.baseline[rel] ?? {};
      let dirty = false;

      for (const [name, rule] of Object.entries(contract.rules)) {
        const found = countRule(src, rule);
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

  for (const file of walk(base, contract.ext)) {
    const rel = relative(base, file);
    if (contract.exemptFiles[rel]) continue;

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
  const { scanDir, partial, why } = contract.sassConfigPartial;
  let entries = 0;
  for (const file of walk(join(ROOT, scanDir), '.scss')) {
    const rel = relative(ROOT, file);
    if (file.split('/').pop().startsWith('_')) continue;
    entries += 1;
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
    for (const [, cls] of readFileSync(file, 'utf8').matchAll(
      new RegExp(`["'\`][^"'\`]*\\b(${g.prefix}[a-z0-9-]+)`, 'g'),
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
    let raw = 0;
    let gzip = 0;
    for (const file of walk(dir, ext)) {
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

const SECTIONS = {
  style: () => literalSection('style', 'style-contract.json'),
  tsx: () => literalSection('tsx', 'tsx-contract.json'),
  react: sectionReact,
  structure: sectionStructure,
  modularity: sectionModularity,
  budgets: sectionBudgets,
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
