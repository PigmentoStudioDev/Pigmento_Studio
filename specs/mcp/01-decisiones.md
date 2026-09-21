# Decisiones de arquitectura

Cada decisión lleva la fuente verificada. Lo que dice "verificado" se leyó en el código
del paquete descargado (`@payloadcms/plugin-mcp@3.88.0`, tarball de npm) o en el
worktree `atom-mcp-wt/acceso-A9s2` (HEAD `cd9015c`, igual a `origin/main`).

## D1 — Base: el plugin oficial, no una réplica del core de Atom

**Decisión.** `@payloadcms/plugin-mcp@3.88.0` como base, dentro de este repo. Se
descarta copiar `@atomchat.io/mcp-core` y montar un servidor aparte.

**Por qué.** Reglas de la casa: "already-installed dependency or package solves it →
use it; only then write the minimum that works". Lo que el plugin ya da, verificado:

| Necesidad | Plugin oficial | Knowledge (core de Atom) |
| --- | --- | --- |
| CRUD por colección | `find/create/update/delete<Slug>` con zod derivado del config (`convertCollectionSchemaToZod`) | tools escritas a mano por colección |
| Transporte | Streamable HTTP en `/api/mcp`, sobre la ruta REST generada que ya existe (`config.endpoints`) | `vercel-handler.ts` propio, 189 líneas |
| Auth | API keys por usuario en el admin, bearer, toggles por operación/tool/resource en tiempo real | OAuth 2.1 propio + Clerk + PAT + Redis de revocación |
| Acceso a datos | `overrideAccess: false` + `user` de la key en cada operación (verificado en `resource/create.js`) | aserción HMAC → endpoint custom de Payload |
| i18n | `locale` / `fallbackLocale` automáticos en cada tool | a mano |
| Extensión | `mcp.tools/resources/prompts` con zod, `serverOptions.instructions` | `defineTool`, `resources.ts`, `instructions.ts` |
| Motor | `mcp-handler` ^1.0.7 + `@modelcontextprotocol/sdk` 1.30.0 | `@modelcontextprotocol/sdk` 1.30.0 directo |

Lo que Knowledge resuelve y aquí **no existe como problema**: varios usuarios con niveles
por área, aprobación por correo, lecturas desde otra base (Supabase), un CMS remoto. El
CMS de Pigmento es local al proceso: la Local API está a un import, con el control de
acceso que ya está escrito y probado en cada colección.

**El precio.** Los nombres de las tools CRUD los pone el plugin (`findProjects`,
`createMedia`…), no nosotros; las tools propias sí llevan prefijo `pigmento_`. Y una
colección nueva (`payload-mcp-api-keys`) → migración, tipos e importMap regenerados.

**Lo que se replica de Knowledge**, porque es lo que hace usable un MCP para poblar
contenido y el plugin no lo trae: descripciones por colección que dicen cómo se escribe
bien (`collections[slug].description`), resources `pigmento://…` con el criterio de
contenido, `instructions` de servidor con reglas de lectura previa, tests que atraviesan
el protocolo y un oráculo de texto contra el servidor vivo. Y su regla de honestidad en
el `tail` de las instrucciones.

## D2 — Dónde vive: `src/mcp/`, un módulo con frontera

```
src/mcp/
  plugin.ts            construye mcpPlugin({...}); es lo único que importa payload.config.ts
  instructions.ts      head + reglas + tail, texto puro
  tools/upload-media.ts  la única tool custom de M2
  resources/guia.ts    pigmento://cms/guia  — cómo está modelado el CMS
  resources/media.ts   pigmento://cms/media — reglas de los assets
```

Frontera en `modularity-contract.json`: `mcp/` solo lo importa `payload.config.ts`;
`mcp/` no importa `design-system/`, `app/` ni `cms/`; `mcp/` no importa `@/payload-types`
(el gate `payload-types-solo-en-cms` ya lo impide, se deja constancia). Habla con
Payload por slugs de colección y por `req.payload`, que es lo que el plugin entrega.

## D3 — Superficie expuesta

| Colección | find | create | update | delete | Por qué |
| --- | --- | --- | --- | --- | --- |
| `media` | sí | sí (solo JSON: `alt`) | sí | sí | poblar y corregir alt; el archivo entra por `pigmento_upload_media` |
| `projects` | sí | sí | sí | sí | portfolio entero por MCP |
| `proposals` | sí | sí | sí | sí | cotizaciones; el token lo acuña el servidor (`mintAccessToken` ignora el entrante, S5) |
| `users` | **no** | **no** | **no** | **no** | dar de alta gente es del panel; un MCP con `createUsers` es una puerta que nadie pidió |
| `payload-mcp-api-keys` | **no** | | | | una key que crea keys es escalada sin diff |

Globals: ninguno hoy (S6 pendiente). Cuando S6 entre, se añaden con `enabled: { find, update }`
en el mismo diff que el global.

"Acceso total al CRUD" incluye `delete`, como pidió Karen. Dos redes debajo: el toggle
por operación de la API key (se apaga `delete` sin deploy) y el control de acceso de
cada colección, que sigue exigiendo usuario.

Tools propias (prefijo `pigmento_`, siempre en minúsculas y con guion bajo):

- `pigmento_upload_media` — D5.

No se añade una tool de "schema": el plugin ya publica los campos de cada colección en
el `inputSchema` de `create<Slug>` / `update<Slug>` y es lo que un cliente lee primero.

## D4 — Auth y transporte

- **Bearer = API key del plugin.** Karen entra al admin, grupo **MCP → API Keys**, crea
  una key ligada a su propio usuario (el plugin la ata al creador y no deja reasignarla;
  verificado en `createApiKeysCollection.js`: `user.access.create/update: () => false`).
  Ninguna env nueva: la key vive en la base, cifrada con `PAYLOAD_SECRET` como toda
  `useAPIKey` de Payload.
- **Sin `overrideApiKeyCollection`.** El default 3.88 deja que un usuario autenticado
  vea y gestione **solo sus propias keys** (`restrictToOwnKeys`). Para un estudio de
  cinco personas es exactamente lo que se quiere. La doc avisa de que "el panel no ve la
  colección por defecto"; el código dice otra cosa, y M1 lo verifica en vivo — si no
  aparece, se añade el override mínimo y se documenta en el handoff.
- **Transporte:** Streamable HTTP, `POST /api/mcp`. `GET` responde 405 por diseño del
  plugin (mismo criterio que Knowledge). En local `http://localhost:3000/api/mcp`; en
  producción la URL del sitio cuando S7 despliegue — el MCP viaja en el mismo deploy.
- **Cliente:** `claude mcp add --transport http pigmento-cms <url> --header "Authorization: Bearer <key>"`,
  y `.mcp.json` en el repo con `${PIGMENTO_MCP_KEY}` para que el proyecto lo traiga
  solo (M3). Cualquier otro cliente MCP con HTTP + header sirve igual.
- **Claude web, la key en la query.** Un conector personalizado de claude.ai solo acepta
  una URL (y OAuth opcional): ni headers ni bearer. El plugin autentica por header, pero
  `overrideAuth` deja pasarle una key alternativa a su helper por defecto, así que
  `?key=<key>` en la URL entra por ahí y, sin `key`, todo sigue como antes. Verificado en
  vivo: sin nada 401, `?key=` correcta 200, `?key=` falsa 401, header solo 200. Si vienen
  las dos, manda la query. El precio es un secreto en la URL (logs, historial), y se paga
  con una key aparte solo para el chat, revocable sin tocar la otra. OAuth de verdad —el
  camino de Atom— queda para cuando el MCP deje de ser de una persona.
- `maxDuration`: 60 s (default del plugin); la subida de un asset de 15 MB desde una
  URL cabe. Se deja explícito en `handlerOptions` para que sea un diff cambiarlo.

## D5 — Subida de assets: tool custom sobre la Local API

Verificado: `create<Slug>` del plugin solo acepta JSON; no hay soporte de archivo en
ninguna tool (grep de `file|upload|mimetype` en `dist/`). La subida es propia.

**`pigmento_upload_media`**

```ts
input: {
  source: { url: string }                                   // https solo
        | { base64: string; filename: string; mimeType: string },
  alt: { es: string; en?: string },                          // alt es requerido y localizado
}
output: { ok: true; id; url; filename; mimeType; width?; height?; bytes }
      | { ok: false; error: 'invalid_url' | 'too_large' | 'unsupported_type' | 'fetch_failed' | 'forbidden' | 'payload_error'; message }
```

Reglas, cada una con test:
- **Solo `https:`** y nunca un host que sea IP literal ni `localhost`. Y el host se
  **resuelve** antes de conectar: si alguna de sus direcciones es loopback, privada,
  link-local, CGNAT, multicast o reservada (v4 y v6, incluidas las v4 mapeadas), se
  rechaza sin pedir nada. El DNS lo controla quien registra el dominio, no nosotros.
  Rebinding entre la resolución y la conexión queda como `HACK:` con su disparador.
- **Redirecciones a mano** (`redirect: 'manual'`, máximo 3): cada salto pasa por las
  mismas dos comprobaciones ANTES de pedirse. Con el `follow` por defecto la petición
  al host interno ya habría salido cuando se pudiera mirar `res.url`.
- **Tope 15 MB**, comprobado por `content-length` si viene y por conteo al leer el
  cuerpo aunque no venga; cortar el stream, no confiar en la cabecera. En base64 se
  mide la longitud del texto antes de decodificar (y el esquema zod lo acota):
  decodificar para medir es reservar la memoria que se quería evitar.
- **Allowlist de MIME** en una constante: `image/png`, `image/jpeg`, `image/webp`,
  `image/gif`, `video/mp4`. Se decide por el `Content-Type` real de la respuesta (o el
  declarado en base64), nunca por la extensión de la URL. Fuera tras la revisión de
  seguridad: `image/svg+xml` (se sirve sin sanear desde un bucket público y puede
  llevar script) e `image/avif` (Next < 16.3.3 tenía RCE en la optimización de imagen,
  GHSA-2xp9-vwfh-vxw4; Next se subió a 16.3.5 en el mismo diff y AVIF se queda fuera
  hasta que haga falta).
- `payload.create({ collection: 'media', data: { alt: alt.es }, file: { data, mimetype, name, size }, locale: 'es', overrideAccess: false, req, user: req.user })`;
  si viene `alt.en`, un `payload.update` en `locale: 'en'` con las mismas reglas.
  Dos llamadas y no una porque la Local API escribe un locale por operación.
- El `name` del archivo: el que venga (base64) o el último segmento del path de la URL,
  saneado a `[a-z0-9._-]`; Payload desduplica solos.
- Nada de `console.*` (gate `console-noise`); los errores vuelven en el `output`, con
  `isError: true`, como hace `runTool` en Knowledge.

El `media` que sale ya trae `url` de R2, `width` y `height` (sharp), que es lo que
`toPiece` en `cms/projects.ts` necesita. Así un `createProjects` puede referenciar el
`id` devuelto en `cover` sin segunda vuelta.

## D6 — Resources e instrucciones

`pigmento://cms/guia` (texto, `text/markdown`): el modelo de contenido en una página —
organismo ↔ bloque, `es` por defecto y `en` por `locale`, `slug` no localizado y
único, `projects` con drafts y `_status`, `proposals` privada con token del servidor y
dinero en centavos (`*Cents`), `order` menor primero, `featured`. Se escribe a mano en
`resources/guia.ts`; no se lee del CMS porque el CMS no tiene un documento que lo diga
y el criterio vive en `CLAUDE.md` y en las colecciones.

`pigmento://cms/media`: `alt` obligatorio y localizado y qué es un buen alt, formatos,
tope, prefijo `pigmento/media` en R2, y que una imagen decorativa no se sube a `media`
(la regla ya escrita en `Media.ts`).

`instructions` (`serverOptions.instructions`): head con tres reglas — leer
`pigmento://cms/guia` antes de crear nada, `findMedia` antes de subir para no
duplicar, y crear en borrador (`draft: true`) lo que la persona no haya visto —, y el
tail de honestidad de Knowledge: si un dato no sale de una lectura de esta sesión, no
se afirma. **El head no nombra tools por su nombre** (regla U1-C9 de core, aquí como
test): las tools cambian, las reglas no.

## D7 — Gates nuevos (`payload-contract.json`), los dos verificados en rojo

- **`mcp-respeta-acceso`** — en `mcp/`, toda llamada `payload.(find|findByID|create|update|delete)(`
  lleva `overrideAccess: false` en la misma llamada. Es la regla `lecturas` que ya existe
  para `cms/`, extendida a escrituras y a este directorio.
- **`mcp-sin-experimental`** — ni `src/mcp/` ni `payload.config.ts` contienen
  `experimental\s*:`. Rojo reproducible en una línea.
- **`mcp-no-expone-users`** — `plugin.ts` no contiene `users:` dentro de `collections`
  del plugin. Un test de Vitest lo afirma sobre el objeto (más fiable que la regex); el
  gate de contrato es la segunda red para que no dependa de que alguien corra tests.

`modularity-contract.json`: la frontera de D2. `payload-contract.json` › `paquetes`:
`payload-fuera-del-ds` no cambia; `mcp/` puede importar `payload` (lo necesita para los
tipos `PayloadRequest`).

## D8 — Verificación

Tres capas, calcadas de Knowledge y adaptadas a que aquí el servidor se arma por
petición dentro de `mcp-handler`:

1. **Unitarios** (Vitest, gate 5): `plugin.test.ts` afirma la superficie sobre las
   opciones (colecciones y operaciones exactas de D3, `users` fuera, `experimental`
   ausente, `instructions` sin nombres de tool); `upload-media.test.ts` afirma las
   reglas de D5 sobre funciones puras y el handler con un `req.payload` doble.
2. **Oráculo por el cable** (`scripts/mcp-oraculo.mjs`, fuera de `gates.sh` porque
   necesita servidor): JSON-RPC real contra `MCP_URL` con `MCP_API_KEY`; `tools/list`
   comparado contra `scripts/mcp/tools.baseline.json` (nombres + `required` + props de
   primer nivel, como `assertToolsMatchBaseline`), `findProjects` con `limit: 1`, y una
   subida de un PNG de 1×1 en base64 seguida de su `deleteMedia`. Sale con **2** si falta
   la key, **1** si el baseline cambió, `--capturar` reescribe el baseline.
3. **Desde Claude Code** (M3): la sesión conecta el MCP recién levantado y crea un
   `projects` en borrador con una cover subida por la tool; la evidencia va al handoff.

## D9 — Lo que este spec NO resuelve

- Producción: llega con S7 (bloqueada por aprobación de deploy). En local funciona
  desde M1.
- Rotación o revocación de keys: se borran desde el admin; no se automatiza.
- Globals (S6) y cualquier colección futura: se añaden al plugin en su propio diff.
- Prompts MCP (recetas tipo `redactar-caso`): fuera hasta que haya un criterio
  editorial escrito para el portfolio; hoy sería inventarlo.
