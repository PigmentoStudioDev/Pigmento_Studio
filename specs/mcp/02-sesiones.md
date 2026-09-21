# Sesiones M0-M3

Cada una es un diff. `./scripts/gates.sh` verde antes de cerrar; handoff en
`handoff/M<n>.md`. Rama `feat/cms-mcp`, worktree `Pigmento_Studio-wt/cms-mcp`.

---

## M0 — Aprobación e instalación. **Requiere aprobación de Karen.**

**Objetivo.** Dejar el worktree listo para compilar y probar.

**Lo que se pide aprobar, literal:**

```bash
cd /Users/karenrebecaog/Desktop/SoftwareDevProjects/Pigmento_Studio-wt/cms-mcp
cp ../../Pigmento_Studio/.env .env            # misma base local, mismas claves de R2
pnpm install                                   # el worktree no tiene node_modules
pnpm add @payloadcms/plugin-mcp@3.88.0         # pin exacto, como el resto de @payloadcms/*
```

**Por qué el pin exacto.** `peerDependencies: { payload: '3.88.0' }` — el plugin exige
la misma versión que el core; un caret lo desalinearía en el siguiente install.

**Archivos.** `package.json`, `pnpm-lock.yaml`.

**DoD.** `pnpm build` verde con el plugin instalado y aún sin usar; `pnpm test` con los
559 tests que ya había.

---

## M1 — Plugin, API keys, migración y deltas de conformance

**Objetivo.** `POST /api/mcp` responde a `tools/list` con un bearer creado desde el
admin, y expone exactamente la superficie de D3.

**Archivos.**
- `src/mcp/plugin.ts` — nuevo. Exporta `pigmentoMcp` (el resultado de `mcpPlugin({...})`)
  y `MCP_COLLECTIONS` (el objeto de D3, exportado para su test).
- `src/mcp/plugin.test.ts` — nuevo.
- `src/mcp/instructions.ts` — nuevo, solo el head provisional; M2 lo completa.
- `src/payload.config.ts` — `plugins: [s3Storage(...), pigmentoMcp]`.
- `src/migrations/<timestamp>_mcp_api_keys.{ts,json}` — `pnpm payload migrate:create mcp_api_keys`.
- `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js` — regenerados, no editados.
- `conformance/modularity-contract.json` — frontera de D2.
- `conformance/payload-contract.json` — `mcp-respeta-acceso`, `mcp-sin-experimental`,
  `mcp-no-expone-users`, y `mcp/` en `paquetes`.
- `scripts/conformance.mjs` — **solo si** las reglas nuevas necesitan una forma que el
  runner no tenga (la de `lecturas` ya existe; se reutiliza su lector).

**API.**

```ts
// src/mcp/plugin.ts
import { mcpPlugin } from '@payloadcms/plugin-mcp';
import { instructions } from './instructions';

export const MCP_COLLECTIONS = {
  media:     { enabled: { find: true, create: true, update: true, delete: true }, description: '…' },
  projects:  { enabled: { find: true, create: true, update: true, delete: true }, description: '…' },
  proposals: { enabled: { find: true, create: true, update: true, delete: true }, description: '…' },
} as const;

export const pigmentoMcp = mcpPlugin({
  collections: MCP_COLLECTIONS,
  mcp: {
    serverOptions: { instructions, serverInfo: { name: 'Pigmento CMS', version: '<package.json>' } },
    handlerOptions: { maxDuration: 60 },
  },
});
```

Las `description` de cada colección son texto de producto, no de esquema: qué es un
proyecto para el portfolio, que `slug` no se traduce, que `cover` es un `id` de `media`,
que una propuesta nace en `borrador` y su token lo pone el servidor. Se escriben en M1
y se afinan en M3 cuando la sesión desde Claude Code diga qué faltó.

**Restricciones.**
- `users` y `payload-mcp-api-keys` no aparecen en `collections` del plugin. Test.
- Sin `experimental`. Test + gate.
- Sin `overrideApiKeyCollection` salvo que la colección no aparezca en el admin
  (D4); si hace falta, es el override mínimo y va al handoff con la captura.
- `push` sigue en `false`: la colección nueva entra por migración, como todo.
- Un gate nuevo se verifica **en rojo** reintroduciendo su bug (regla de la casa).

**DoD.**
1. `pnpm dev`, login en `/admin`, grupo MCP → API Keys, key creada. Captura o la
   respuesta de `GET /api/payload-mcp-api-keys` con sesión en el handoff.
2. `curl -X POST localhost:3000/api/mcp -H 'Authorization: Bearer <key>' … tools/list`
   devuelve **exactamente** `findMedia createMedia updateMedia deleteMedia` × las tres
   colecciones (12 tools) y ninguna otra. Sin bearer → 401. Se pega la salida.
3. `pnpm payload migrate:status` sin pendientes; gate 4 verde con tipos e importMap al día.
4. Tres gates nuevos, cada uno con su rojo reproducido en el handoff.
5. `./scripts/gates.sh` verde.

---

## M2 — Subida de assets, resources, instrucciones y oráculo

**Objetivo.** Un cliente MCP puede subir una imagen a R2 y referenciarla en un proyecto
sin tocar el panel, y sabe cómo está modelado el CMS antes de escribir.

**Archivos.**
- `src/mcp/tools/upload-media.ts` — nuevo. Exporta `uploadMediaTool` (el objeto para
  `mcp.tools`) y las puras: `validateSource`, `sanitizeFilename`, `ALLOWED_MIME`, `MAX_BYTES`.
- `src/mcp/tools/upload-media.test.ts` — nuevo. TDD: primero en rojo.
- `src/mcp/resources/guia.ts`, `src/mcp/resources/media.ts` — nuevos, texto puro.
- `src/mcp/instructions.ts` — head completo + tail.
- `src/mcp/plugin.ts` — `mcp.tools: [uploadMediaTool]`, `mcp.resources: [...]`.
- `scripts/mcp-oraculo.mjs`, `scripts/mcp/tools.baseline.json` — nuevos.
- `src/migrations/<timestamp>_mcp_tool_toggles.*` — **solo si** el plugin añade campos a
  la colección de keys por cada tool/resource custom (lo hace: checkbox por tool y por
  resource, verificado en `createApiKeysCollection.js`). `migrate:create` lo dirá.

**API.** La de D5 y D6, literal. El handler del plugin es `(args, req) => …`; la
validación de entrada la hace el plugin con el zod de `parameters`, y las reglas de
D5 que zod no cubre (host, tope real, MIME real) las hacen las puras antes de tocar la
red.

**Restricciones.**
- Toda llamada a `req.payload.*` en `mcp/` con `overrideAccess: false`, `req` y
  `user: req.user`. Gate `mcp-respeta-acceso`.
- El fetch de la URL con `AbortSignal.timeout(20_000)`; sin timeout una URL que no
  responde consume el `maxDuration` entero.
- Los tests no salen a la red: `fetch` se dobla y cualquier URL no prevista lanza,
  como `stubFetch` en Knowledge.
- El oráculo no entra en `gates.sh` (necesita servidor); se documenta en `CLAUDE.md`
  cómo se corre y sale con 2 si falta la key.

**DoD.**
1. Test rojo → verde para: `http:` rechazada, IP literal rechazada, 15 MB + 1 byte
   rechazado aunque `content-length` mienta, `application/pdf` rechazado, PNG válido
   crea `media` con `alt` en `es` y `en`.
2. `scripts/mcp-oraculo.mjs` verde contra `pnpm dev`: baseline de 13 tools + 2 resources,
   subida de un PNG 1×1 que vuelve con `url` de R2 (o de disco si no hay credenciales:
   se dice cuál) y su borrado.
3. `./scripts/gates.sh` verde.

---

## M3 — Conexión desde Claude Code, docs y handoff

**Objetivo.** Que el repo se conecte solo y que la próxima persona (o agente) sepa
usarlo sin leer este programa.

**Archivos.**
- `.mcp.json` — nuevo, en la raíz: servidor `pigmento-cms`, `type: http`, URL local,
  header `Authorization: Bearer ${PIGMENTO_MCP_KEY}`. La key vive en el entorno de
  quien lo usa, nunca en el archivo.
- `.env.example` — `PIGMENTO_MCP_KEY=` con el comentario de dónde se crea. No la lee
  el código: la lee el cliente MCP.
- `CLAUDE.md` — sección "El MCP del CMS": qué expone, cómo se crea la key, cómo se
  corre el oráculo, y las dos reglas 7 y 8 del README.
- `CHANGELOG.md` — entrada en `Unreleased › Added`.
- `specs/mcp/handoff/M3.md`, `specs/mcp/README.md` — tabla de estado.

**DoD.**
1. Desde una sesión de Claude Code en el worktree con `PIGMENTO_MCP_KEY` exportada:
   `claude mcp list` ve `pigmento-cms`; se lee `pigmento://cms/guia`, se sube una
   imagen con `pigmento_upload_media`, se crea un `projects` **en borrador** con esa
   cover y se lista con `findProjects`. La transcripción resumida va al handoff.
2. Descripciones de colección corregidas con lo que esa sesión echó en falta.
3. `./scripts/gates.sh` verde. PR abierto contra `main` con la bitácora de M0-M3.

**Fuera.** Merge y deploy son de Karen. Producción llega con S7.
