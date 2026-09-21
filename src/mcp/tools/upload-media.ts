import { lookup as dnsLookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import type { PayloadRequest } from 'payload';
import { z } from 'zod';

/**
 * La subida de un asset por MCP. El `create` del plugin solo acepta JSON, asi
 * que el archivo entra por aqui: desde una URL https o en base64, con su alt en
 * los dos idiomas, y sale como un documento de `media` ya servido desde R2 con
 * sus medidas — lo que `cover` y `gallery` necesitan.
 *
 * Es una funcion que sale a la red por encargo de un modelo. Las reglas de
 * abajo existen por eso y cada una tiene su test.
 */

/** 15 MB: lo que cabe en los 60 s de la funcion desde una URL razonable. */
export const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Lo mismo, medido sobre el texto base64 ANTES de decodificar: 4 caracteres por
 * cada 3 bytes. Decodificar para medir es reservar la memoria que se queria evitar.
 */
export const MAX_BASE64_LENGTH = Math.ceil(MAX_BYTES / 3) * 4;

/** Sin timeout una URL que no responde consume el maxDuration entero. */
export const FETCH_TIMEOUT_MS = 20_000;

/** Un CDN redirige una o dos veces; mas es un bucle o alguien jugando. */
export const MAX_REDIRECTS = 3;

/**
 * Lo que el sitio pinta. Un PDF no se pinta con next/image ni con <video>, y
 * la coleccion `media` es la que el sitio pinta: lo que no se ve no va aqui.
 *
 * Dos que se ven y aun asi quedan fuera:
 * - `image/svg+xml`: se sirve tal cual desde un bucket publico y puede llevar
 *   script. Un portfolio no necesita subir SVG como foto.
 * - `image/avif`: Next < 16.3.3 tenia RCE en la optimizacion de imagen
 *   (GHSA-2xp9-vwfh-vxw4) y todo lo que entra por aqui acaba en el host que
 *   next/image tiene autorizado. Next ya esta parcheado; se deja fuera hasta
 *   que haga falta de verdad, porque el coste de volver a abrirlo es una linea.
 */
export const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4'] as const;

type AllowedMime = (typeof ALLOWED_MIME)[number];

export type UploadError =
  | 'invalid_url'
  | 'too_large'
  | 'unsupported_type'
  | 'fetch_failed'
  | 'payload_error';

type Fail = { ok: false; error: UploadError; message: string };

/** Un `Fail` sin repetir `ok: false` en cada rama. */
const fail = (error: UploadError, message: string): Fail => ({ ok: false, error, message });

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * Solo https y solo hosts con nombre. Una IP literal, `localhost` o un `.local`
 * es la forma de pedirle a la funcion que lea algo de dentro de su propia red.
 * `URL` ya normaliza las IPv4 en decimal, octal o hex a punto-decimal, asi que
 * el regex las ve todas.
 */
export function validateSourceUrl(raw: string): { ok: true; url: URL } | Fail {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return fail('invalid_url', `No es una URL: ${raw}`);
  }
  if (url.protocol !== 'https:') return fail('invalid_url', 'Solo se aceptan URLs https.');

  const host = url.hostname;
  const esIp = IPV4.test(host) || host.startsWith('[') || host.includes(':');
  if (esIp || host === 'localhost' || host.endsWith('.local') || host.endsWith('.localhost')) {
    return fail('invalid_url', `Host no permitido: ${host}`);
  }
  return { ok: true, url };
}

const v4Octets = (ip: string): number[] | null => {
  if (!IPV4.test(ip)) return null;
  const o = ip.split('.').map(Number);
  return o.every((n) => n <= 255) ? o : null;
};

/** Loopback, privadas (RFC 1918), CGNAT, link-local, "this network", multicast y reservadas. */
function isPublicV4(ip: string): boolean {
  const o = v4Octets(ip);
  if (!o) return false;
  const [a, b] = o;
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a >= 224) return false;
  return true;
}

/** Loopback, no especificada, unique-local (fc00::/7), link-local (fe80::/10) y las IPv4 mapeadas. */
function isPublicV6(ip: string): boolean {
  const low = ip.toLowerCase();
  if (low === '::1' || low === '::') return false;
  const mapped = low.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return isPublicV4(mapped[1]);
  const primero = parseInt(low.split(':')[0] || '0', 16);
  if ((primero & 0xfe00) === 0xfc00) return false;
  if ((primero & 0xffc0) === 0xfe80) return false;
  return true;
}

/**
 * El host puede ser un nombre normal cuyo DNS apunte dentro: el DNS lo controla
 * quien registra el dominio, no nosotros. Se comprueba la DIRECCION, no el nombre.
 */
export function isPublicAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPublicV4(ip);
  if (version === 6) return isPublicV6(ip);
  return false;
}

/**
 * El ultimo segmento del path, en minusculas y sin nada fuera de [a-z0-9._-].
 * Payload desduplica solo si ya existe. Nunca vacio: un nombre vacio no es un
 * archivo que R2 sepa guardar.
 */
export function sanitizeFilename(rawUrlOrName: string): string {
  let path = rawUrlOrName;
  try {
    path = new URL(rawUrlOrName).pathname;
  } catch {
    // No era una URL: es un nombre de archivo tal cual.
  }
  const ultimo = path.split('/').filter(Boolean).at(-1) ?? '';
  const limpio = decodeURIComponent(ultimo)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+\./g, '.')
    .replace(/^-+|-+$/g, '');
  return limpio || 'archivo';
}

/**
 * Lee un stream contando bytes y corta un byte por encima del tope. Se cuenta
 * porque `content-length` puede faltar o mentir, y el tope es del servidor, no
 * de quien sirve el archivo.
 */
export async function readCapped(stream: ReadableStream<Uint8Array>, max: number): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      throw new Error('too_large');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

const isAllowedMime = (mime: string): mime is AllowedMime =>
  (ALLOWED_MIME as readonly string[]).includes(mime);

interface FileToUpload {
  data: Buffer;
  mimetype: AllowedMime;
  name: string;
  size: number;
}

type FetchLike = (input: URL) => Promise<Response>;
/** Todas las direcciones a las que resuelve un host. */
type LookupLike = (hostname: string) => Promise<string[]>;

export interface UploadDeps {
  fetch: FetchLike;
  lookup: LookupLike;
}

/**
 * `redirect: 'manual'`: las redirecciones se siguen aqui, validando cada salto
 * ANTES de pedirlo. Con el `follow` por defecto, la peticion al host interno ya
 * habria salido cuando se pudiera mirar `res.url`.
 */
const defaultDeps: UploadDeps = {
  fetch: (input) => fetch(input, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: 'manual' }),
  lookup: async (hostname) => (await dnsLookup(hostname, { all: true })).map((a) => a.address),
};

/**
 * Valida el string Y la direccion a la que resuelve. Si el host tiene varias
 * direcciones y una es privada, se rechaza entero: el cliente HTTP elegiria una
 * de ellas y no se puede saber cual.
 *
 * HACK: se resuelve aqui y el cliente HTTP vuelve a resolver al conectar, asi
 * que un DNS que cambie de respuesta entre las dos (rebinding) se cuela. Cerrarlo
 * pide conectar a la IP ya resuelta con un dispatcher propio. Se hace cuando el
 * MCP deje de ser mono-usuario o corra en una red con algo que proteger detras.
 */
async function resolveChecked(raw: string, lookup: LookupLike): Promise<{ ok: true; url: URL } | Fail> {
  const valid = validateSourceUrl(raw);
  if (!valid.ok) return valid;

  let direcciones: string[];
  try {
    direcciones = await lookup(valid.url.hostname);
  } catch (error) {
    return fail('fetch_failed', `No resuelve ${valid.url.hostname}: ${error instanceof Error ? error.message : 'DNS'}`);
  }
  if (direcciones.length === 0 || !direcciones.every(isPublicAddress)) {
    return fail('invalid_url', `Host no permitido: ${valid.url.hostname} resuelve a una direccion interna`);
  }
  return valid;
}

const esRedireccion = (status: number) => status >= 300 && status < 400;

async function fromUrl(raw: string, deps: UploadDeps): Promise<FileToUpload | Fail> {
  let actual = raw;
  let res: Response | undefined;

  for (let salto = 0; salto <= MAX_REDIRECTS; salto += 1) {
    const checked = await resolveChecked(actual, deps.lookup);
    if (!checked.ok) return checked;

    try {
      res = await deps.fetch(checked.url);
    } catch (error) {
      return fail('fetch_failed', error instanceof Error ? error.message : 'fetch fallo');
    }
    if (!esRedireccion(res.status)) break;

    const location = res.headers.get('location');
    if (!location) return fail('fetch_failed', `Redireccion ${res.status} sin Location`);
    actual = new URL(location, checked.url).href;
    res = undefined;
  }
  if (!res) return fail('fetch_failed', `Mas de ${MAX_REDIRECTS} redirecciones`);
  if (!res.ok) return fail('fetch_failed', `La URL respondio ${res.status}`);

  const mime = (res.headers.get('content-type') ?? '').split(';')[0].trim();
  if (!isAllowedMime(mime)) {
    return fail('unsupported_type', `Content-Type ${mime || 'desconocido'}; se aceptan ${ALLOWED_MIME.join(', ')}`);
  }

  const declarado = Number(res.headers.get('content-length'));
  if (Number.isFinite(declarado) && declarado > MAX_BYTES) {
    return fail('too_large', `content-length ${declarado} > ${MAX_BYTES}`);
  }
  if (!res.body) return fail('fetch_failed', 'La respuesta no trae cuerpo');

  let data: Buffer;
  try {
    data = await readCapped(res.body, MAX_BYTES);
  } catch {
    return fail('too_large', `El archivo pasa de ${MAX_BYTES} bytes`);
  }

  return { data, mimetype: mime, name: sanitizeFilename(actual), size: data.length };
}

function fromBase64(src: { base64: string; filename: string; mimeType: string }): FileToUpload | Fail {
  if (!isAllowedMime(src.mimeType)) {
    return fail('unsupported_type', `mimeType ${src.mimeType}; se aceptan ${ALLOWED_MIME.join(', ')}`);
  }
  if (src.base64.length > MAX_BASE64_LENGTH) {
    return fail('too_large', `El archivo pasa de ${MAX_BYTES} bytes`);
  }
  const data = Buffer.from(src.base64, 'base64');
  if (data.length === 0) return fail('fetch_failed', 'base64 vacio o invalido');
  if (data.length > MAX_BYTES) return fail('too_large', `El archivo pasa de ${MAX_BYTES} bytes`);
  return { data, mimetype: src.mimeType, name: sanitizeFilename(src.filename), size: data.length };
}

export const uploadMediaParameters = {
  source: z
    .union([
      z.object({ url: z.string().describe('URL https publica del archivo. Max 15 MB.') }),
      z.object({
        base64: z.string().max(MAX_BASE64_LENGTH).describe('El archivo en base64, sin prefijo data:'),
        filename: z.string().describe('Nombre con extension, p. ej. portada.webp'),
        mimeType: z.enum(ALLOWED_MIME).describe('El tipo real del archivo'),
      }),
    ])
    .describe('De donde sale el archivo: una URL https o el contenido en base64.'),
  alt: z
    .object({
      es: z.string().min(1).describe('Que se ve, para quien no lo ve. En español.'),
      en: z.string().min(1).optional().describe('Lo mismo en ingles. Si falta, el sitio cae al español.'),
    })
    .describe('Texto alternativo. Obligatorio: la coleccion media lo exige y el sitio corre jest-axe.'),
};

type UploadArgs = z.infer<z.ZodObject<typeof uploadMediaParameters>>;

interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

const responder = (body: Record<string, unknown>, isError = false): ToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(body, null, 2) }],
  ...(isError ? { isError: true } : {}),
});

/**
 * El handler, con `fetch` y `lookup` inyectables para que el test no salga a la
 * red ni al DNS. Corre como el usuario de la key y con `overrideAccess: false`:
 * lo que `media` prohibe desde el panel lo prohibe aqui.
 */
export async function uploadMedia(
  args: UploadArgs,
  req: PayloadRequest,
  deps: Partial<UploadDeps> = {},
): Promise<ToolResult> {
  const d = { ...defaultDeps, ...deps };
  const file = 'url' in args.source ? await fromUrl(args.source.url, d) : fromBase64(args.source);
  if ('ok' in file) return responder(file, true);

  try {
    const doc = await req.payload.create({
      collection: 'media',
      data: { alt: args.alt.es },
      file,
      locale: 'es',
      overrideAccess: false,
      req,
      user: req.user,
    });

    // El alt en ingles es una segunda escritura: la Local API escribe un locale por operacion.
    if (args.alt.en) {
      await req.payload.update({
        collection: 'media',
        id: doc.id,
        data: { alt: args.alt.en },
        locale: 'en',
        overrideAccess: false,
        req,
        user: req.user,
      });
    }

    return responder({
      ok: true,
      id: doc.id,
      url: doc.url,
      filename: doc.filename,
      mimeType: doc.mimeType,
      width: doc.width,
      height: doc.height,
      bytes: doc.filesize,
    });
  } catch (error) {
    return responder(fail('payload_error', error instanceof Error ? error.message : 'Payload rechazo la subida'), true);
  }
}

export const uploadMediaTool = {
  name: 'pigmento_upload_media',
  description:
    'Sube un archivo a la coleccion media (R2) desde una URL https o en base64, con su alt en ' +
    'es y opcionalmente en. Devuelve el id, la url y las medidas: usa el id en cover o ' +
    'gallery de un proyecto. Antes de subir, busca en media si el archivo ya existe. ' +
    `Formatos: ${ALLOWED_MIME.join(', ')}. Tope 15 MB.`,
  parameters: uploadMediaParameters,
  handler: (args: Record<string, unknown>, req: PayloadRequest) => uploadMedia(args as UploadArgs, req),
};
