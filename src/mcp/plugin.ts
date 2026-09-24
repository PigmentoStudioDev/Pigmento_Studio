import { mcpPlugin } from '@payloadcms/plugin-mcp';
import { instructions } from './instructions';
import { GUIA_URI, guia } from './resources/guia';
import { MEDIA_URI, mediaRules } from './resources/media';
import { uploadMediaTool } from './tools/upload-media';

/**
 * La superficie del MCP: que colecciones y con que operaciones. Exportada por su
 * test, que es quien afirma lo que queda FUERA — `users` y la coleccion de keys
 * del propio plugin. Enumerar lo permitido en un objeto y no en una lista de
 * `enabled: true` es lo que hace visible en el diff cada operacion que se abre.
 *
 * Las descripciones son texto de producto, no de esquema: los campos ya viajan
 * en el inputSchema de cada tool. Aqui va lo que un campo significa y lo que el
 * esquema no puede decir.
 */
export const MCP_COLLECTIONS = {
  media: {
    enabled: { find: true, create: true, update: true, delete: true },
    description:
      'Los archivos del sitio, servidos desde R2. Crear aqui solo registra metadatos (alt); ' +
      'el archivo entra por pigmento_upload_media, que devuelve el id para usar en cover o ' +
      'gallery. alt es obligatorio y se localiza: describe lo que se ve para quien no lo ve.',
  },
  projects: {
    enabled: { find: true, create: true, update: true, delete: true },
    description:
      'El portfolio. Cada documento es una pieza: title y summary se localizan, slug NO ' +
      '(una direccion es una direccion) y es unico. cover y gallery[].image son ids de media. ' +
      'Tiene borradores: crea con draft=true y deja que la persona publique. order menor ' +
      'primero; featured lo mete en el escaparate del menu y en el manifiesto.',
  },
  'team-members': {
    enabled: { find: true, create: true, update: true, delete: true },
    description:
      'Quien forma el estudio: la franja del equipo. name no se localiza; role y bio si. ' +
      'group (direccion | diseno | desarrollo | estrategia) es lo que filtran las pastillas. ' +
      'photo es un id de media, retrato vertical. links[] lleva network (linkedin | instagram | ' +
      'behance | x | web) y una url https. Tiene borradores: crea con draft=true, porque ' +
      'publicar a una persona es decision de la persona. order menor primero.',
  },
  legal: {
    /**
     * Sin `delete`: borrar un documento legal es un 404 en una URL indexada, y
     * puede ser el texto que un cliente acepto. Esa decision no la toma un
     * modelo — se hace en el panel, a mano y a sabiendas.
     */
    enabled: { find: true, create: true, update: true, delete: false },
    description:
      'Los textos legales del sitio: aviso de privacidad, terminos, cookies. El cuerpo es una ' +
      'lista de secciones, no un bloque de texto: el indice de la pagina se deriva de ellas. ' +
      'Cada seccion lleva encabezado, nivel (2 seccion, 3 subseccion), parrafos separados por ' +
      'linea en blanco y una lista opcional. Al CREAR, el ancla la acuña el servidor desde el ' +
      'encabezado: no la escribas. Al ACTUALIZAR un documento que ya existe, devuelve en cada ' +
      'seccion el `anchor` tal cual lo leiste: una fila que llega sin el se trata como nueva y ' +
      'su ancla se recalcula, lo que rompe el enlace del indice que alguien pudo guardar. ' +
      'Nace en borrador; publicar un legal es decision de la persona.',
  },
  proposals: {
    enabled: { find: true, create: true, update: true, delete: true },
    description:
      'Cotizaciones privadas para un cliente. Su URL publica lleva un token que acuña el ' +
      'servidor: nunca lo mandes ni lo inventes. El dinero va en centavos enteros en campos ' +
      '*Cents. Los criterios de la comparativa se alinean solos entre paquetes al guardar. ' +
      'Una propuesta nace en borrador y cambiar status es decision de la persona.',
  },
} as const;

/**
 * El nombre y la version que ve el cliente. La version es la de la SUPERFICIE —
 * sube cuando cambian las tools o sus argumentos, y va de la mano del baseline
 * de scripts/mcp/tools.baseline.json — no la del sitio, que no le dice nada a
 * quien se conecta.
 */
export const SERVER_INFO = { name: 'pigmento-cms', version: '4' };

/**
 * 60 s es el default del plugin; se escribe para que cambiarlo sea un diff. Una
 * subida de 15 MB desde una URL lenta es lo mas largo que corre aqui.
 */
export const MAX_DURATION_SECONDS = 60;

/**
 * Sin `experimental`: esas tools escriben archivos de coleccion y editan el config
 * en disco. En Vercel no tienen sentido y en local son un agente reescribiendo el
 * repo por un canal sin diff. El gate `mcp-sin-experimental` lo vigila.
 *
 * Sin `overrideApiKeyCollection`: el default del plugin deja que cada usuario del
 * panel vea y gestione solo SUS keys, y para un estudio de cinco personas es
 * exactamente lo que se quiere.
 */
/**
 * Un resource estatico: el SDK llama al handler con la URI pedida y el plugin
 * le añade `req`; aqui no hace falta ninguno de los dos.
 */
const textResource = (uri: string, name: string, title: string, description: string, text: string) => ({
  uri,
  name,
  title,
  description,
  mimeType: 'text/markdown',
  handler: () => ({ contents: [{ uri, mimeType: 'text/markdown', text }] }),
});

export const MCP_RESOURCES = [
  textResource(
    GUIA_URI,
    'cms-guia',
    'Como esta modelado el CMS',
    'Idiomas, slugs, borradores, cotizaciones privadas y lo que cada campo significa. Leer antes de crear nada.',
    guia,
  ),
  textResource(
    MEDIA_URI,
    'cms-media',
    'Las reglas de los assets',
    'alt obligatorio y localizado, formatos, tope, R2 y que no subir. Leer antes de subir un archivo.',
    mediaRules,
  ),
];

export const MCP_TOOLS = [uploadMediaTool];

/**
 * La key, si viene en la URL como `?key=`. Claude web solo acepta una URL para
 * un conector personalizado — ni headers ni bearer — y el plugin autentica por
 * el header. Sin `key` en la query se devuelve undefined y el plugin sigue
 * leyendo `Authorization` como siempre; la key de la query no sustituye a la
 * del header, la complementa.
 *
 * Un secreto en la URL puede quedar en logs y en el historial del navegador:
 * es una key APARTE, solo para el chat, que se revoca desde el panel sin tocar
 * la de Claude Code.
 */
export function apiKeyFromUrl(url: string): string | undefined {
  try {
    return new URL(url).searchParams.get('key') || undefined;
  } catch {
    return undefined;
  }
}

export const pigmentoMcp = mcpPlugin({
  collections: MCP_COLLECTIONS,
  overrideAuth: (req, getDefaultMcpAccessSettings) =>
    getDefaultMcpAccessSettings(apiKeyFromUrl(req.url ?? '')),
  mcp: {
    tools: MCP_TOOLS,
    resources: MCP_RESOURCES,
    serverOptions: { instructions, serverInfo: SERVER_INFO },
    handlerOptions: { maxDuration: MAX_DURATION_SECONDS },
  },
});
