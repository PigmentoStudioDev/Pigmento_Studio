import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { s3Storage } from '@payloadcms/storage-s3';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Media } from './collections/Media';
import { Users } from './collections/Users';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * El config de Payload. Vive en src/ y no en la raiz porque `@payload-config`
 * lo resuelve por el path del tsconfig, y asi el arbol de codigo sigue entero
 * dentro de src/ como el resto del repo.
 *
 * Sin `editor`: no hay ningun campo richText y la doc no lo marca como
 * requerido — verificado en S0, `generate:types` sale con codigo 0. Meterlo
 * arrastraria @payloadcms/richtext-lexical, que es un arbol de React de cliente
 * por un texto que hoy es un <p>.
 */
export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },

  collections: [Users, Media],

  secret: process.env.PAYLOAD_SECRET || '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || '',
      authToken: process.env.DATABASE_AUTH_TOKEN,
    },

    /**
     * `push` APAGADO, tambien en local. El adaptador lo trae encendido: sincroniza
     * el esquema con el config sin migraciones, que es comodo mientras modelas.
     *
     * Se apaga por dos motivos. Uno, la doc pide no mezclar push y migraciones
     * sobre la misma base — y mezclarlos ya costo un cuelgue: `payload migrate`
     * se para a preguntar y avisa de perdida de datos porque el esquema lo habia
     * escrito el push. Dos, con push en local las migraciones NUNCA se aplican
     * aqui, asi que el gate C5 saldria rojo en la maquina de todos y verde en CI:
     * un gate que solo corre en un sitio es un gate que se aprende a ignorar.
     *
     * El precio es un `migrate:create` por cada cambio de esquema. Se paga a
     * gusto: el archivo de migracion ES el artefacto que corre en produccion, y
     * asi se revisa en el mismo diff que la coleccion que lo causo.
     */
    push: false,
  }),

  /**
   * Los mismos dos idiomas que next-intl, y con el mismo default. Si las dos
   * listas se separan no hay error: hay una pagina en espanol pidiendo un locale
   * que el CMS no tiene, y el fallback lo tapa. El gate `locales-en-sintonia`
   * lee los dos archivos y lo impide.
   */
  localization: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    fallback: true,
  },

  /**
   * El sitio no consulta GraphQL: lee por Local API dentro de sus server
   * components. Una superficie de consulta que no usa nadie es superficie que
   * no audita nadie, asi que se apaga entera en vez de dejarla de adorno.
   */
  graphQL: { disable: true },

  // Payload lo necesita para redimensionar lo que se sube. Sin el, un upload
  // entra tal cual pesa la camara que lo hizo.
  sharp,

  plugins: [
    /**
     * La media va al R2 que el sitio ya usa para el video del hero: en Vercel el
     * sistema de archivos es efimero y lo subido no sobrevive al deploy.
     *
     * `enabled` exige el bucket Y las dos claves. Colgarlo solo del bucket era un
     * error: con el nombre puesto y las claves vacias el plugin se ENCIENDE a
     * medias, y cada subida muere en un error de S3 que habla de firmas y no de
     * configuracion. Apagado del todo, Payload cae a disco local y el proyecto
     * arranca en la maquina de cualquiera sin pedir credenciales.
     *
     * `disablePayloadAccessControl` sirve el archivo directo desde R2 en vez de
     * por /api/media/file/...: es correcto para el portfolio, que es publico.
     * OJO para S5 — un adjunto PRIVADO de una propuesta NO puede vivir aqui: una
     * URL publica de R2 no pregunta quien la pide.
     */
    s3Storage({
      enabled: Boolean(
        process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY,
      ),
      collections: {
        [Media.slug]: {
          /**
           * El bucket `freelance` NO es solo nuestro: ya sirve el video del hero y
           * assets de otros proyectos. Sin prefijo, Payload escribe en la raiz y un
           * `01.png` de Pigmento pisa el `01.png` de quien sea, sin aviso y sin
           * forma de recuperarlo. El prefijo es lo unico que separa los inquilinos.
           */
          prefix: 'pigmento/media',
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }: { filename: string; prefix?: string }) =>
            `${process.env.R2_PUBLIC_URL}/${prefix ? `${prefix}/` : ''}${filename}`,
        },
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        forcePathStyle: true,
      },
    }),
  ],
});
