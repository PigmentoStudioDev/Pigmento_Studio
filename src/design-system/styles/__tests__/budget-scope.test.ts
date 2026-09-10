/**
 * Contrato del alcance de budgets: mide lo que pide DE ENTRADA una pagina
 * publica, no todo lo emitido.
 *
 * El gate viejo devolvia null para CSS y quien llamaba caia a walk() sobre
 * `.next/static` entero. El dia que el panel de Payload emita su propio CSS,
 * ese barrido lo suma — y el techo de 20kb gzip (hoy 18, margen 2) se pone
 * rojo midiendo algo que ningun visitante descarga. La salida obvia seria
 * subir el limite, que es exactamente lo que el gate existe para impedir.
 *
 * El test no importa scripts/: un relativo que sale de design-system esconde
 * el acoplamiento y el gate de modularidad lo rechaza. El runner se afirma
 * por su salida, que es el contrato publico; el walk viejo se reproduce aqui
 * porque ES el bug, no una API que el design system deba conocer.
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const BUILD = join(ROOT, '.next/server/app');
const STATIC = join(ROOT, '.next/static');
const FAKE = join(STATIC, 'css', 'payload-admin.fake.css');

function* walkCss(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkCss(full);
    else if (entry.name.endsWith('.css')) yield full;
  }
}

function budgets(): string {
  const result = spawnSync('node', ['scripts/conformance.mjs', 'budgets'], {
    encoding: 'utf8',
    cwd: ROOT,
  });
  expect(result.error).toBeUndefined();
  // stdout Y stderr: el runner manda los OK por stdout y los FAIL por stderr
  // (console.error). Leyendo solo stdout, un budget roto hace desaparecer la
  // linea del css y el test falla por no encontrarla — un rojo que no distingue
  // "midio mal" de "midio de mas", que es justo lo que este archivo compara.
  return `${result.stdout}\n${result.stderr}`;
}

/**
 * La lectura del estado LIMPIO, una sola vez para todo el archivo.
 *
 * Cada llamada gzipea `.next/static` entero en un proceso aparte. Con la suite
 * corriendo en paralelo, tres de estas mataron por inanicion a dos tests que no
 * tienen nada que ver — timeouts de 115s en un test de DOM. Los dos que miden el
 * estado limpio miden LO MISMO, asi que comparten la medida; el que ensucia con
 * el css falso sigue pidiendo la suya, que es otro estado.
 */
let limpio: string | undefined;
const budgetsLimpio = () => (limpio ??= budgets());

function cssLine(stdout: string): string {
  const line = stdout.split('\n').find((row) => row.includes('[budgets] css:'));
  expect(line).toBeDefined();
  return line ?? '';
}

describe.skipIf(!existsSync(BUILD))('alcance del budget de CSS', () => {
  afterEach(() => {
    if (existsSync(FAKE)) unlinkSync(FAKE);
    try {
      rmdirSync(dirname(FAKE));
    } catch {
      // no esta vacio: no es el artefacto de este test
    }
  });

  it('un css que ningun HTML referencia lo suma el walk y el runner no', () => {
    const before = cssLine(budgetsLimpio());
    const rawBefore = [...walkCss(STATIC)].reduce((n, file) => n + statSync(file).size, 0);

    mkdirSync(dirname(FAKE), { recursive: true });
    writeFileSync(FAKE, `${'x'.repeat(104_053)}\n`);

    const walked = [...walkCss(STATIC)];
    const rawAfter = walked.reduce((n, file) => n + statSync(file).size, 0);

    expect(walked).toContain(FAKE);
    expect(rawAfter).toBeGreaterThan(rawBefore);

    // Si firstLoadFiles devolviera null, sectionBudgets cae al walk y el
    // falso mueve la cifra: el gate nuevo se comportaria como el viejo.
    expect(cssLine(budgets())).toBe(before);
  });

  /**
   * /ds no es una pagina del sitio (CLAUDE.md) y desde 2026-09-09 no entra en la
   * medida. Se afirma comparando conjuntos y no una cifra fija: los nombres de
   * chunk llevan hash y un test contra "139kb" se cae en el siguiente build sin
   * que nada este mal.
   */
  it('el CSS que solo pide /ds no entra en la medida', () => {
    const cssRefs = (html: string) =>
      new Set(
        [...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*href=["']\/_next\/(static\/[^"'?]+\.css)/gi)]
          .map(([, ref]) => ref),
      );

    const of = (page: string) => cssRefs(readFileSync(join(BUILD, page), 'utf8'));

    const publicas = new Set([...of('es.html'), ...of('en.html')]);
    const soloDs = [...of('es/ds.html'), ...of('en/ds.html')].filter((ref) => !publicas.has(ref));

    // Si /ds no aportara nada propio no habria nada que excluir y el test
    // pasaria por vacio: eso es un fallo del test, no del gate.
    expect(soloDs.length).toBeGreaterThan(0);

    const kb = (refs: Iterable<string>) =>
      Math.round(
        [...refs].reduce((n, ref) => n + statSync(join(ROOT, '.next', ref)).size, 0) / 1024,
      );

    const reportado = Number(cssLine(budgetsLimpio()).match(/css: (\d+)kb raw/)?.[1]);

    // Dos caminos al rojo, los dos validos: si /ds vuelve a la medida y el techo
    // aguanta, `reportado` sale 161 y no 139; si ademas revienta el techo de gzip,
    // la linea de FAIL no imprime cifra raw y sale NaN. Se detecta igual.
    expect(reportado).toBe(kb(publicas));
    expect(reportado).toBeLessThan(kb([...publicas, ...soloDs]));
  });
});
