import { describe, expect, it, vi } from 'vitest';
import type { PayloadRequest } from 'payload';
import {
  ALLOWED_MIME,
  MAX_BASE64_LENGTH,
  MAX_BYTES,
  MAX_REDIRECTS,
  isPublicAddress,
  readCapped,
  sanitizeFilename,
  uploadMedia,
  uploadMediaParameters,
  validateSourceUrl,
} from './upload-media';

/**
 * Las reglas de la subida, una a una, sobre las funciones puras; y el handler
 * entero con un `req.payload` doble. Ningun test sale a la red ni al DNS: el
 * `fetch` y el `lookup` que ve el handler son los que se le inyectan, y
 * cualquier URL no prevista lanza.
 */

/** PNG de 1x1 valido: cabecera y IHDR reales, para que sharp no se queje si algun dia se usa. */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

const PUBLIC_IP = '93.184.216.34';

describe('validateSourceUrl', () => {
  it('acepta https con host con nombre', () => {
    expect(validateSourceUrl('https://cdn.example.com/a/b/foto.png').ok).toBe(true);
  });

  it.each([
    ['http://cdn.example.com/foto.png', 'http'],
    ['ftp://cdn.example.com/foto.png', 'ftp'],
    ['https://127.0.0.1/foto.png', 'IPv4'],
    ['https://2130706433/foto.png', 'IPv4 decimal'],
    ['https://[::1]/foto.png', 'IPv6'],
    ['https://localhost/foto.png', 'localhost'],
    ['https://cms.local/foto.png', '.local'],
    ['no-es-una-url', 'texto'],
  ])('rechaza %s (%s)', (url) => {
    const r = validateSourceUrl(url);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toBe('invalid_url');
  });
});

/**
 * El host puede ser un nombre normal que resuelva a una IP interna: el DNS lo
 * controla quien registra el dominio. Lo que se comprueba es la direccion.
 */
describe('isPublicAddress', () => {
  it.each(['93.184.216.34', '8.8.8.8', '2606:4700::1111'])('publica: %s', (ip) => {
    expect(isPublicAddress(ip)).toBe(true);
  });

  it.each([
    '127.0.0.1',
    '10.0.0.5',
    '172.16.0.1',
    '172.31.255.254',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '::1',
    '::',
    'fc00::1',
    'fd12::1',
    'fe80::1',
    '::ffff:127.0.0.1',
    '::ffff:10.0.0.1',
  ])('privada o reservada: %s', (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });
});

describe('ALLOWED_MIME', () => {
  /**
   * AVIF fuera hasta que Next este parcheado (GHSA-2xp9-vwfh-vxw4: RCE en la
   * optimizacion de imagen de Next < 16.3.3). Un AVIF subido por aqui acaba en
   * el host que next/image tiene autorizado, asi que la tool era la entrada.
   * SVG fuera porque se sirve sin sanear desde un bucket publico y puede llevar
   * script: un portfolio no necesita subir SVG como foto.
   */
  it('no acepta avif ni svg', () => {
    expect(ALLOWED_MIME).not.toContain('image/avif');
    expect(ALLOWED_MIME).not.toContain('image/svg+xml');
  });
});

describe('sanitizeFilename', () => {
  it('se queda con el ultimo segmento y solo [a-z0-9._-]', () => {
    expect(sanitizeFilename('https://x.com/dir/Mi Foto Ñu (1).PNG')).toBe('mi-foto-nu-1.png');
  });
  it('nunca devuelve vacio', () => {
    expect(sanitizeFilename('https://x.com/')).toBe('archivo');
  });
});

describe('readCapped', () => {
  const stream = (chunks: Buffer[]) =>
    new ReadableStream<Uint8Array>({
      start(c) {
        for (const ch of chunks) c.enqueue(new Uint8Array(ch));
        c.close();
      },
    });

  it('lee hasta el tope', async () => {
    const out = await readCapped(stream([Buffer.alloc(10), Buffer.alloc(5)]), 15);
    expect(out.length).toBe(15);
  });

  /** El tope se mide contando, no leyendo una cabecera que puede mentir. */
  it('corta un byte por encima del tope', async () => {
    await expect(readCapped(stream([Buffer.alloc(10), Buffer.alloc(6)]), 15)).rejects.toThrow(
      /too_large/,
    );
  });
});

/** Un `req` con el `payload` doblado: registra lo que se le pide y devuelve un media. */
function fakeReq() {
  const create = vi.fn(async (args: Record<string, unknown>) => ({
    id: 7,
    url: 'https://media.example.com/pigmento/media/foto.png',
    filename: 'foto.png',
    mimeType: (args.file as { mimetype: string }).mimetype,
    width: 1,
    height: 1,
    filesize: (args.file as { size: number }).size,
  }));
  const update = vi.fn(async (_args: Record<string, unknown>) => ({ id: 7 }));
  const req = { payload: { create, update }, user: { id: 1, collection: 'users' } } as unknown as PayloadRequest;
  return { req, create, update };
}

/** `fetch` que solo conoce las URLs del test; cualquier otra lanza. */
function fakeFetch(routes: Record<string, () => Response>) {
  return vi.fn(async (input: string | URL) => {
    const url = typeof input === 'string' ? input : input.href;
    const r = routes[url];
    if (!r) throw new Error(`fetch inesperado en el test: ${url}`);
    return r();
  });
}

/** `lookup` que resuelve cada host a lo que diga la tabla; el resto, a una IP publica. */
function fakeLookup(table: Record<string, string> = {}) {
  return vi.fn(async (host: string) => [table[host] ?? PUBLIC_IP]);
}

const png = () => new Response(PNG_1X1, { headers: { 'content-type': 'image/png' } });

describe('uploadMedia', () => {
  it('sube un PNG desde una URL con alt en es y en', async () => {
    const { req, create, update } = fakeReq();
    const fetch = fakeFetch({ 'https://cdn.example.com/foto.png': png });
    const lookup = fakeLookup();

    const out = await uploadMedia(
      { source: { url: 'https://cdn.example.com/foto.png' }, alt: { es: 'Una foto', en: 'A photo' } },
      req,
      { fetch, lookup },
    );

    expect(out.isError).toBeUndefined();
    const data = JSON.parse(out.content[0].text);
    expect(data).toMatchObject({ ok: true, id: 7, mimeType: 'image/png', width: 1, height: 1 });
    expect(lookup).toHaveBeenCalledWith('cdn.example.com');

    // La creacion corre como el usuario de la key y respeta el acceso de `media`.
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toMatchObject({
      collection: 'media',
      data: { alt: 'Una foto' },
      locale: 'es',
      overrideAccess: false,
      user: req.user,
    });
    expect(create.mock.calls[0][0].file).toMatchObject({ mimetype: 'image/png', size: PNG_1X1.length });

    // El alt en ingles es una segunda escritura, en su locale.
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0]).toMatchObject({
      collection: 'media',
      id: 7,
      data: { alt: 'A photo' },
      locale: 'en',
      overrideAccess: false,
    });
  });

  it('sube desde base64 sin tocar la red ni el DNS', async () => {
    const { req, create, update } = fakeReq();
    const fetch = fakeFetch({});
    const lookup = fakeLookup();
    const out = await uploadMedia(
      {
        source: { base64: PNG_1X1.toString('base64'), filename: 'pixel.png', mimeType: 'image/png' },
        alt: { es: 'Un pixel' },
      },
      req,
      { fetch, lookup },
    );
    expect(out.isError).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
    expect(lookup).not.toHaveBeenCalled();
    expect(create.mock.calls[0][0].file).toMatchObject({ name: 'pixel.png', size: PNG_1X1.length });
    expect(update).not.toHaveBeenCalled();
  });

  it('rechaza http sin llamar a fetch ni a payload', async () => {
    const { req, create } = fakeReq();
    const fetch = fakeFetch({});
    const out = await uploadMedia(
      { source: { url: 'http://cdn.example.com/foto.png' }, alt: { es: 'x' } },
      req,
      { fetch, lookup: fakeLookup() },
    );
    expect(out.isError).toBe(true);
    expect(JSON.parse(out.content[0].text)).toMatchObject({ ok: false, error: 'invalid_url' });
    expect(fetch).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  /** Un nombre normal cuyo DNS apunta dentro: se rechaza ANTES de conectar. */
  it('rechaza un host que resuelve a una IP privada sin llamar a fetch', async () => {
    const { req, create } = fakeReq();
    const fetch = fakeFetch({ 'https://evil.example.com/foto.png': png });
    const out = await uploadMedia(
      { source: { url: 'https://evil.example.com/foto.png' }, alt: { es: 'x' } },
      req,
      { fetch, lookup: fakeLookup({ 'evil.example.com': '127.0.0.1' }) },
    );
    expect(out.isError).toBe(true);
    expect(JSON.parse(out.content[0].text)).toMatchObject({ ok: false, error: 'invalid_url' });
    expect(fetch).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('si un host resuelve a varias IPs y una es privada, se rechaza', async () => {
    const { req } = fakeReq();
    const fetch = fakeFetch({});
    const lookup = vi.fn(async () => [PUBLIC_IP, '10.0.0.1']);
    const out = await uploadMedia(
      { source: { url: 'https://mixto.example.com/foto.png' }, alt: { es: 'x' } },
      req,
      { fetch, lookup },
    );
    expect(JSON.parse(out.content[0].text)).toMatchObject({ ok: false, error: 'invalid_url' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sigue una redireccion validando el destino y su DNS', async () => {
    const { req, create } = fakeReq();
    const fetch = fakeFetch({
      'https://cdn.example.com/foto.png': () =>
        new Response(null, { status: 302, headers: { location: 'https://cdn2.example.com/real.png' } }),
      'https://cdn2.example.com/real.png': png,
    });
    const lookup = fakeLookup();
    const out = await uploadMedia(
      { source: { url: 'https://cdn.example.com/foto.png' }, alt: { es: 'x' } },
      req,
      { fetch, lookup },
    );
    expect(out.isError).toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(lookup).toHaveBeenCalledWith('cdn2.example.com');
    expect(create).toHaveBeenCalledTimes(1);
  });

  /**
   * Una redireccion a un host prohibido es el mismo agujero por la puerta de
   * atras, y se corta ANTES de pedir el destino: la peticion al host interno no
   * llega a salir.
   */
  it('rechaza una redireccion a un host prohibido sin pedirlo', async () => {
    const { req, create } = fakeReq();
    const fetch = fakeFetch({
      'https://cdn.example.com/foto.png': () =>
        new Response(null, { status: 302, headers: { location: 'https://169.254.169.254/latest/meta-data' } }),
    });
    const out = await uploadMedia(
      { source: { url: 'https://cdn.example.com/foto.png' }, alt: { es: 'x' } },
      req,
      { fetch, lookup: fakeLookup() },
    );
    expect(out.isError).toBe(true);
    expect(JSON.parse(out.content[0].text)).toMatchObject({ ok: false, error: 'invalid_url' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
  });

  it('rechaza una redireccion cuyo destino resuelve a una IP privada sin pedirlo', async () => {
    const { req } = fakeReq();
    const fetch = fakeFetch({
      'https://cdn.example.com/foto.png': () =>
        new Response(null, { status: 301, headers: { location: 'https://interno.example.com/x.png' } }),
    });
    const out = await uploadMedia(
      { source: { url: 'https://cdn.example.com/foto.png' }, alt: { es: 'x' } },
      req,
      { fetch, lookup: fakeLookup({ 'interno.example.com': '192.168.1.10' }) },
    );
    expect(JSON.parse(out.content[0].text)).toMatchObject({ ok: false, error: 'invalid_url' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('corta una cadena de redirecciones demasiado larga', async () => {
    const { req } = fakeReq();
    const routes: Record<string, () => Response> = {};
    for (let i = 0; i <= MAX_REDIRECTS + 1; i += 1) {
      routes[`https://cdn.example.com/${i}.png`] = () =>
        new Response(null, { status: 302, headers: { location: `https://cdn.example.com/${i + 1}.png` } });
    }
    const fetch = fakeFetch(routes);
    const out = await uploadMedia(
      { source: { url: 'https://cdn.example.com/0.png' }, alt: { es: 'x' } },
      req,
      { fetch, lookup: fakeLookup() },
    );
    expect(JSON.parse(out.content[0].text)).toMatchObject({ ok: false, error: 'fetch_failed' });
    expect(fetch.mock.calls.length).toBeLessThanOrEqual(MAX_REDIRECTS + 1);
  });

  it('rechaza un MIME fuera de la lista por el Content-Type real, no por la extension', async () => {
    const { req, create } = fakeReq();
    const fetch = fakeFetch({
      'https://cdn.example.com/foto.png': () =>
        new Response(Buffer.from('%PDF-1.4'), { headers: { 'content-type': 'application/pdf' } }),
    });
    const out = await uploadMedia(
      { source: { url: 'https://cdn.example.com/foto.png' }, alt: { es: 'x' } },
      req,
      { fetch, lookup: fakeLookup() },
    );
    expect(out.isError).toBe(true);
    expect(JSON.parse(out.content[0].text)).toMatchObject({ ok: false, error: 'unsupported_type' });
    expect(create).not.toHaveBeenCalled();
  });

  it('rechaza 15 MB + 1 byte aunque content-length mienta', async () => {
    const { req, create } = fakeReq();
    const big = Buffer.alloc(MAX_BYTES + 1);
    const fetch = fakeFetch({
      'https://cdn.example.com/grande.png': () =>
        new Response(big, { headers: { 'content-type': 'image/png', 'content-length': '10' } }),
    });
    const out = await uploadMedia(
      { source: { url: 'https://cdn.example.com/grande.png' }, alt: { es: 'x' } },
      req,
      { fetch, lookup: fakeLookup() },
    );
    expect(out.isError).toBe(true);
    expect(JSON.parse(out.content[0].text)).toMatchObject({ ok: false, error: 'too_large' });
    expect(create).not.toHaveBeenCalled();
  });

  it('rechaza por content-length antes de descargar', async () => {
    const { req } = fakeReq();
    const fetch = fakeFetch({
      'https://cdn.example.com/grande.png': () =>
        new Response(PNG_1X1, {
          headers: { 'content-type': 'image/png', 'content-length': String(MAX_BYTES + 1) },
        }),
    });
    const out = await uploadMedia(
      { source: { url: 'https://cdn.example.com/grande.png' }, alt: { es: 'x' } },
      req,
      { fetch, lookup: fakeLookup() },
    );
    expect(JSON.parse(out.content[0].text)).toMatchObject({ ok: false, error: 'too_large' });
  });

  /**
   * El base64 se mide por la longitud del texto ANTES de decodificar: decodificar
   * para medir es reservar la memoria que se queria evitar.
   */
  it('rechaza un base64 demasiado largo sin decodificarlo', async () => {
    const { req, create } = fakeReq();
    const from = vi.spyOn(Buffer, 'from');
    const out = await uploadMedia(
      {
        source: { base64: 'A'.repeat(MAX_BASE64_LENGTH + 4), filename: 'x.png', mimeType: 'image/png' },
        alt: { es: 'x' },
      },
      req,
      { fetch: fakeFetch({}), lookup: fakeLookup() },
    );
    expect(JSON.parse(out.content[0].text)).toMatchObject({ ok: false, error: 'too_large' });
    expect(from).not.toHaveBeenCalledWith(expect.any(String), 'base64');
    expect(create).not.toHaveBeenCalled();
    from.mockRestore();
  });

  /** Y el esquema que ve el cliente ya lo dice, para que ni llegue al handler. */
  it('el esquema acota la longitud del base64', () => {
    const base64 = uploadMediaParameters.source.options[1].shape.base64;
    expect(base64.safeParse('A'.repeat(MAX_BASE64_LENGTH + 4)).success).toBe(false);
    expect(base64.safeParse('AAAA').success).toBe(true);
  });

  it('devuelve payload_error si Payload rechaza (acceso, validacion)', async () => {
    const { req, create } = fakeReq();
    create.mockRejectedValueOnce(new Error('You are not allowed to perform this action.'));
    const out = await uploadMedia(
      {
        source: { base64: PNG_1X1.toString('base64'), filename: 'pixel.png', mimeType: 'image/png' },
        alt: { es: 'x' },
      },
      req,
      { fetch: fakeFetch({}), lookup: fakeLookup() },
    );
    expect(out.isError).toBe(true);
    expect(JSON.parse(out.content[0].text)).toMatchObject({ ok: false, error: 'payload_error' });
  });
});
