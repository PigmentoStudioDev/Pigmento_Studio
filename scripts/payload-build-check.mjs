/**
 * Gate 4 — lo que solo se puede comprobar DESPUES del build.
 *
 * Si Payload no esta instalado, avisa y no falla: un gate que se pone rojo por
 * no haber llegado todavia entrena a la gente a ignorarlo, y ese es el unico
 * fallo del que un gate no se recupera.
 *
 * Los tres primeros vigilan artefactos GENERADOS. No comprueban que esten bien
 * escritos —eso lo hace el compilador— sino que esten AL DIA: un tipo o un
 * importMap viejo no rompe el build, rompe el runtime, y el sintoma aparece
 * lejos de la causa.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
let failures = 0;
const ok = (msg) => console.log(`  OK    [payload-build] ${msg}`);
const note = (msg) => console.log(`  nota  [payload-build] ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.error(`  FAIL  [payload-build] ${msg}`);
};

if (!existsSync(join(ROOT, 'src/payload.config.ts'))) {
  note('Payload no esta instalado todavia — nada que medir');
  process.exit(0);
}

/** Igual salvo finales de linea y espacio al final: un cambio de plataforma no es un fallo. */
const normal = (s) => s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trimEnd();

function generado(script, archivo, nombre) {
  const file = join(ROOT, archivo);
  if (!existsSync(file)) return fail(`${nombre}: falta ${archivo}`);

  const antes = readFileSync(file, 'utf8');
  try {
    execFileSync('pnpm', [script], { cwd: ROOT, stdio: 'pipe' });
  } catch (error) {
    return fail(`${nombre}: \`pnpm ${script}\` fallo — ${error.message.split('\n')[0]}`);
  }
  const despues = readFileSync(file, 'utf8');

  if (normal(antes) !== normal(despues)) {
    fail(`${nombre}: ${archivo} estaba desactualizado. Alguien cambio el config y no
        regenero, asi que a partir de ahi ese archivo miente. Ya quedo regenerado:
        revisa el diff y commitealo con el cambio que lo causo.`);
  } else {
    ok(`${nombre} al dia`);
  }
}

// C1 — el panel entro al build.
const admin = join(ROOT, '.next/server/app/(payload)');
if (!existsSync(join(ROOT, '.next'))) note('no hay build — corre `pnpm build` para medir C1');
else if (existsSync(admin)) ok('el panel compilo (.next/server/app/(payload))');
else fail('C1: el build no emitio nada para app/(payload) — el panel no existe en produccion');

// C2 y C3 — los generados, al dia.
generado('generate:types', 'src/payload-types.ts', 'C2 tipos');
generado('generate:importmap', 'src/app/(payload)/admin/importMap.js', 'C3 importMap');

// C4 — ninguna base de datos en el arbol.
function* bases(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* bases(full);
    else if (/\.db(-shm|-wal)?$/.test(entry.name)) yield full;
  }
}

const sueltas = [...bases(ROOT)].filter((file) => {
  try {
    execFileSync('git', ['check-ignore', '-q', file], { cwd: ROOT, stdio: 'pipe' });
    return false;
  } catch {
    return true;
  }
});

if (sueltas.length) {
  for (const file of sueltas) {
    fail(`C4: ${relative(ROOT, file)} (${statSync(file).size}b) NO esta ignorado — una base
        de SQLite en el repo son datos de clientes en el repo`);
  }
} else {
  ok('C4 ninguna base de datos fuera de .gitignore');
}

// C5 — las migraciones, aplicadas.
if (!process.env.DATABASE_URI && !existsSync(join(ROOT, '.env'))) {
  note('C5 sin DATABASE_URI — no mido migraciones (CI sin base sigue siendo util)');
} else {
  try {
    const out = execFileSync('pnpm', ['payload', 'migrate:status'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    /**
     * La tabla de `migrate:status` viene coloreada y con bordes de dibujo — `│`,
     * no `|` ASCII. Un filtro por la barra recta no casa NINGUNA fila y el gate
     * pasa verde sin haber mirado nada, que es peor que no tenerlo. Se quita el
     * ANSI y se parte por el caracter de verdad.
     */
    const filas = out
      .replace(/\u001b\[[0-9;]*m/g, '')
      .split('\n')
      .filter((line) => line.includes('\u2502'))
      /**
       * `slice(1, -1)` tira los dos trozos vacios que deja partir por el borde.
       * Lo que NO se puede hacer es filtrar los vacios: la celda `Batch` de una
       * migracion sin aplicar viene en blanco, y quitarla desalinea la fila —
       * queda con dos celdas, no pasa el minimo, y el gate da por bueno que no
       * hay nada que comprobar. Verde sin haber mirado, que es peor que no tenerlo.
       */
      .map((line) => line.split('\u2502').slice(1, -1).map((cell) => cell.trim()))
      .filter((cells) => cells.length >= 3 && cells[0] !== 'Name');

    if (!filas.length) {
      note('C5 no hay migraciones que comprobar');
    } else {
      const pendientes = filas.filter((cells) => cells.at(-1) === 'No').map(([name]) => name);
      if (pendientes.length) {
        fail(`C5: ${pendientes.length} migracion(es) sin aplicar (${pendientes.join(', ')}).
        Corre \`pnpm payload migrate\`. Una migracion en el repo que nadie aplico es un
        esquema que difiere del config, y el sintoma sale en la primera consulta.`);
      } else {
        ok(`C5 migraciones al dia (${filas.length})`);
      }
    }
  } catch (error) {
    fail(`C5: \`migrate:status\` fallo — ${String(error.message).split('\n')[0]}`);
  }
}

process.exit(failures > 0 ? 1 : 0);
