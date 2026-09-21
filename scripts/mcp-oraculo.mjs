/**
 * Oraculo del MCP: llama al servidor VIVO por JSON-RPC, como lo haria Claude Code,
 * y comprueba que la superficie y el round-trip de un asset siguen siendo los
 * que se firmaron.
 *
 *   MCP_API_KEY=... [MCP_URL=http://localhost:3000/api/mcp] node scripts/mcp-oraculo.mjs
 *   ... --capturar        reescribe scripts/mcp/tools.baseline.json
 *
 * Fuera de gates.sh a proposito: necesita un servidor levantado y una key. Sale
 * con 2 si falta la key (distinto del 1 de "algo cambio"), para que nadie
 * confunda "sin credenciales" con "verde".
 *
 * El baseline compara nombres, `required` y las propiedades de primer nivel de
 * cada tool — no el JSON Schema entero: una descripcion que mejora no es una
 * ruptura, y un argumento que desaparece si lo es.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const URL_MCP = process.env.MCP_URL ?? 'http://localhost:3000/api/mcp';
const KEY = process.env.MCP_API_KEY;
const CAPTURAR = process.argv.includes('--capturar');
const BASELINE = resolve(import.meta.dirname, 'mcp/tools.baseline.json');

if (!KEY) {
  console.error('MCP_API_KEY vacia: crea una en /admin (grupo MCP) y exportala. No es un fallo del servidor.');
  process.exit(2);
}

let fallos = 0;
const ok = (m) => console.log(`  ok    ${m}`);
const fail = (m) => {
  fallos += 1;
  console.error(`  FAIL  ${m}`);
};

async function rpc(method, params = {}) {
  const res = await fetch(URL_MCP, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: '1', method, params }),
  });
  const texto = await res.text();
  // mcp-handler responde en SSE: la respuesta va en la linea `data: `.
  const linea = texto.split('\n').find((l) => l.startsWith('data: '));
  if (!linea) throw new Error(`${method}: HTTP ${res.status} sin cuerpo JSON-RPC — ${texto.slice(0, 200)}`);
  const json = JSON.parse(linea.slice(6));
  if (json.error) throw new Error(`${method}: ${json.error.message}`);
  return json.result;
}

/** El texto de una tool, ya parseado si era JSON (las tools propias responden JSON). */
function textoDe(result) {
  const t = result?.content?.[0]?.text ?? '';
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

// 1. La superficie, contra el baseline.
const { tools } = await rpc('tools/list');
const { resources } = await rpc('resources/list');
const superficie = {
  tools: tools
    .map((t) => ({
      name: t.name,
      required: [...(t.inputSchema?.required ?? [])].sort(),
      props: Object.keys(t.inputSchema?.properties ?? {}).sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name)),
  resources: resources.map((r) => r.uri).sort(),
};

if (CAPTURAR) {
  writeFileSync(BASELINE, `${JSON.stringify(superficie, null, 2)}\n`);
  ok(`baseline capturado: ${superficie.tools.length} tools, ${superficie.resources.length} resources`);
} else {
  const esperado = JSON.parse(readFileSync(BASELINE, 'utf8'));
  const a = JSON.stringify(esperado);
  const b = JSON.stringify(superficie);
  if (a === b) ok(`superficie igual al baseline (${superficie.tools.length} tools, ${superficie.resources.length} resources)`);
  else {
    const nombres = (s) => s.tools.map((t) => t.name);
    fail(`la superficie cambio. Baseline: [${nombres(esperado)}] · vivo: [${nombres(superficie)}]. Si es a proposito: --capturar y sube SERVER_INFO.version`);
  }
}

// 2. Un resource se lee y dice lo que promete.
const guia = await rpc('resources/read', { uri: 'pigmento://cms/guia' });
if (guia.contents?.[0]?.text?.startsWith('# Como esta modelado el CMS')) ok('pigmento://cms/guia se lee');
else fail('pigmento://cms/guia no empieza por su titulo');

// 3. Una lectura de coleccion.
const proyectos = await rpc('tools/call', { name: 'findProjects', arguments: { limit: 1 } });
if (proyectos.isError) fail(`findProjects: ${textoDe(proyectos)}`);
else ok('findProjects responde');

// 4. El round-trip de un asset: PNG 1x1 en base64 → media con url y medidas → borrado.
const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const subida = textoDe(
  await rpc('tools/call', {
    name: 'pigmento_upload_media',
    arguments: {
      source: { base64: PNG_1X1, filename: 'oraculo-pixel.png', mimeType: 'image/png' },
      alt: { es: 'Pixel de prueba del oraculo', en: 'Oracle test pixel' },
    },
  }),
);
if (subida?.ok && subida.id && subida.width === 1 && subida.height === 1) {
  ok(`pigmento_upload_media → media ${subida.id} en ${subida.url ?? '(disco local: sin credenciales de R2)'}`);
  const en = await rpc('tools/call', { name: 'findMedia', arguments: { id: subida.id, locale: 'en', select: '{"alt":true}' } });
  if (String(textoDe(en)).includes('Oracle test pixel')) ok('el alt en ingles quedo en su locale');
  else fail(`el alt en ingles no aparece: ${textoDe(en)}`);
  const borrado = await rpc('tools/call', { name: 'deleteMedia', arguments: { id: subida.id } });
  if (borrado.isError) fail(`deleteMedia: ${textoDe(borrado)}`);
  else ok(`deleteMedia ${subida.id}`);
} else {
  fail(`pigmento_upload_media: ${JSON.stringify(subida)}`);
}

console.log(`\n${fallos} fallos`);
process.exit(fallos > 0 ? 1 : 0);
