# Decisiones y auditoria

Verificado contra la doc oficial de Payload y el registro de npm el **2026-09-09**.
Las cuatro preguntas que quedaron abiertas las cerro **S0** (`handoff/S0.md`); sus
respuestas estan incorporadas abajo, incluida **una que corrigio este documento**.

> **Leccion de metodo, de S0.** La primera version de §0 cito el template de la rama
> `main`, que va por DELANTE del release y ya trae trabajo de la v4. Un template de
> `main` no describe la version que vas a instalar. **Se lee el tag** —
> `raw.githubusercontent.com/payloadcms/payload/v3.88.0/...` — y nunca `main`.

## 0. Matriz de compatibilidad — verificada

| Paquete | Version | Peer que declara | Lo que tiene el repo | Veredicto |
| --- | --- | --- | --- | --- |
| `payload` | 3.88.0 | `graphql ^16.8.1` | — | falta, y **hay que fijarlo** (v4) |
| `@payloadcms/next` | 3.88.0 | `next >=16.2.6 <17.0.0` | next **16.3.2** | compatible |
| `@payloadcms/next` | 3.88.0 | `payload 3.88.0` (exacto) | — | **lockstep obligatorio** |
| `@payloadcms/db-sqlite` | 3.88.0 | `payload 3.88.0` (exacto) | — | compatible |
| `@payloadcms/storage-s3` | 3.88.0 | `payload 3.88.0` (exacto) | — | compatible |
| `@payloadcms/richtext-lexical` | 3.88.0 | `react ^19.2.1` | react **19.2.8** | compatible, pero **no se instala** (§4) |
| `sharp` | 0.35.4 | — | ausente y **bloqueado** | ver §5 |
| Node | >=20.9.0 (doc) | — | CI usa 22 | compatible |

**Lockstep.** Los cuatro paquetes de `@payloadcms/*` fijan `payload` a la version
EXACTA. Subir uno obliga a subir todos en el mismo commit. No es una recomendacion
del ecosistema: es el `peerDependencies` publicado.

**Turbopack.** Payload soporta builds con Turbopack desde 3.64.0 y Next 16 desde
3.73.0. 3.88.0 esta por encima de las dos. El repo compila con Turbopack (default de
Next 16), asi que no hay que forzar webpack.

**El script de build no cambia. Resuelto en S0.** En 3.88.0 el comando `payload build`
**no existe** (`Unknown command: "build"`), y el template en el tag `v3.88.0` usa
`next build`. `payload build` es de `main` / v4. `gates.sh` sigue corriendo `pnpm build`
tal cual y S2 no toca ese script.

**Peers con pnpm. Resuelto en S0: `.npmrc` no se toca.** El `legacy-peer-deps=true` del
template es de npm y aqui no aplica; el `.npmrc` de este repo existe por otra cosa (el
hoisting de Carbon para que Sass resuelva).

Pero S0 encontro una trampa concreta: **`graphql` suelto instala 17.0.2 y rompe el peer
`^16.8.1` de `payload`.** El ultimo del rango es 16.14.x. La lista de instalacion de S2
lleva la version fijada — sin eso, el primer `pnpm add` deja el arbol con un peer roto y
el sintoma aparece mas tarde y en otro sitio.

## 1. Base de datos — SQLite sobre libSQL remoto (Turso)

Karen despliega en **Vercel**. Ahi el sistema de archivos es efimero: un `.db` local
se pierde en cada deploy y entre invocaciones. La ruta simple que Payload documenta
para ese caso es su adaptador de SQLite apuntando a un libSQL remoto.

```ts
import { sqliteAdapter } from '@payloadcms/db-sqlite'

db: sqliteAdapter({
  client: {
    url: process.env.DATABASE_URI || '',
    authToken: process.env.DATABASE_AUTH_TOKEN || '',
  },
})
```

Un aviso sobre los nombres: la pagina de referencia del adaptador usa `DATABASE_URL`
y la guia oficial de Turso usa `DATABASE_URI`. Da igual cual — son variables que lee
tu propio config — pero **hay que elegir una y que sea la misma en `.env.example`, en
el config y en Vercel**. Este programa usa `DATABASE_URI`, como la guia de Turso.

**Desarrollo vs produccion.** El adaptador trae `push` activado por defecto: sincroniza
el esquema con el config sin migraciones. Es comodo en local y **no se usa en
produccion**. La doc es explicita en no mezclar los dos modos sobre la misma base.

- local: `DATABASE_URI=file:./pigmento.db`, `*.db` en `.gitignore`
- produccion: Turso remoto, migraciones versionadas en el repo

**CORRECCION de S3 (2026-09-10): `push: false` TAMBIEN en local.** Este documento decia
"push activo" en local, y estaba mal por dos motivos que costaron un cuelgue y un fallo
de subida:

1. `payload migrate` se PARA a preguntar y avisa de perdida de datos cuando el esquema
   lo escribio el push. No es un flag que falte: es la doc diciendo que no se mezclan.
2. Con push en local las migraciones no se aplican nunca aqui, asi que el gate C5 seria
   rojo en la maquina de todos y verde en CI. Un gate que solo corre en un sitio es un
   gate que se aprende a ignorar.

El precio es un `migrate:create` por cada cambio de esquema, y se paga a gusto: cuando
S3 anadio `prefix` al adaptador de R2 —que anade una COLUMNA— la subida fallo con
`no such column: prefix` en vez de funcionar en local y romper en produccion.

Por que no Postgres: el volumen es de decenas de documentos. Postgres es correcto y
tambien funciona, pero mete un servicio mas que administrar para un sitio que va a
tener menos filas que la lista de tokens de Carbon.

## 2. Media — R2 via el adaptador S3

Vercel tampoco persiste los archivos subidos. El repo **ya usa un bucket R2** para el
video del hero, asi que la media del CMS va al mismo sitio.

El adaptador es `@payloadcms/storage-s3`, no `@payloadcms/storage-r2`. **Confirmado en
S0:** `storage-r2` es de Cloudflare Workers — su config recibe un `bucket: R2Bucket`, o
sea un binding del runtime de Workers, que en Vercel no existe. La doc muestra la
configuracion de R2 con `s3Storage` justamente para entornos Node.

```ts
s3Storage({
  enabled: Boolean(process.env.R2_BUCKET),
  collections: {
    media: {
      disablePayloadAccessControl: true,
      generateFileURL: ({ filename, prefix }) =>
        `${process.env.R2_PUBLIC_URL}/${prefix ? `${prefix}/` : ''}${filename}`,
    },
  },
  bucket: process.env.R2_BUCKET,
  config: {
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    forcePathStyle: true,
  },
})
```

**Consecuencia en `next.config.ts`, y es de las que rompen sin avisar:** todo el sitio
pinta con `next/image` y hoy no hay `images.remotePatterns`. Una imagen servida desde
`R2_PUBLIC_URL` no renderiza hasta declarar el host. Va en S3, no "cuando se note".

`disablePayloadAccessControl: true` sirve la media directa desde R2 en vez de por
`/api/media/file/...`. Es lo correcto para el portfolio, que es publico. **Si algun dia
una propuesta lleva un adjunto privado, ese adjunto NO puede vivir en esta coleccion**:
una URL publica de R2 no pregunta quien la pide.

## 3. Rutas de Payload y el proxy de idioma — el choque que ya existe

Payload monta, dentro de `app/(payload)/`:

```
/admin                        el panel
/api/[...slug]                REST de todas las colecciones
/api/graphql                  GraphQL
/api/graphql-playground       el playground
```

El `matcher` de `src/proxy.ts` es hoy:

```
/((?!api|_next|_vercel|.*\..*).*)
```

Excluye `/api`, asi que el REST y el GraphQL se salvan por casualidad. **`/admin` no
esta excluido**: next-intl correria sobre el panel e intentaria prefijarlo con idioma.
S2 lo arregla, y `03-conformance.md` deja un test que falla si alguien lo revierte.

## 4. Rich text — NO entra en v1

Decision deliberada, con tres motivos que se sostienen solos:

1. **Los organismos reciben cadenas planas.** Es el contrato que hace que un organismo
   se alimente 1:1 de un bloque (CLAUDE.md > Props serializables). Lexical devuelve un
   arbol JSON.
2. **El componente `RichText` de `@payloadcms/richtext-lexical/react` es de cliente.**
   Meterlo son dos entradas nuevas en `clientBoundary.allow` y un arbol de React en el
   bundle, por texto que hoy es un `<p>`.
3. **`convertLexicalToHTML` devuelve HTML**, y pintarlo pide `dangerouslySetInnerHTML`,
   que el contrato de React prohibe. Habria que eximirlo — la exencion mas cara del
   repo — para ganar negritas.

Asi que: `textarea` para parrafos, `array` de `text` para listas. **`editor` se omite del
config — confirmado en S0:** `payload generate:types` sale con codigo 0 sobre un config
sin `editor` y sin ningun campo `richText`. `@payloadcms/richtext-lexical` no se instala.

Cuando de verdad haga falta formato (un blog, un caso de estudio largo), se abre otra
spec y se decide entre `convertLexicalToHTMLAsync` en servidor con una exencion escrita,
o un conversor propio a datos planos dentro de `cms/`. No se decide de paso.

## 5. `sharp` esta bloqueado a proposito y hay que desbloquearlo

`pnpm-workspace.yaml` lista `sharp` en `ignoredBuiltDependencies`. Payload lo necesita
compilado para procesar uploads (el template oficial lo pone en `onlyBuiltDependencies`).
S3 lo saca de esa lista.

Ojo con no llevarse por delante lo de al lado: **los `@carbon/*` y `@ibm/*` siguen
bloqueados**, y eso es una decision de privacidad escrita (telemetria de IBM), no una
linea que sobra. Se toca `sharp` y nada mas.

## 6. Control de acceso — el punto en el que este programa se puede romper de verdad

Tres hechos verificados en la doc, y los tres importan:

1. **El default de Payload es `({ req: { user } }) => Boolean(user)`.** Una coleccion
   sin `access` declarado NO es publica. `proposals` esta a salvo por defecto; lo que
   hay que abrir a proposito es la lectura de `projects` y `media`.
2. **El control de acceso se aplica a REST y a GraphQL.** Sin abrir `projects.read`, el
   sitio publico no puede leer su propio portfolio.
3. **La Local API se SALTA el control de acceso por defecto.** Textual: "In the Local
   API, all Access Control is skipped by default". Se recupera con `overrideAccess: false`.

El tercero es la mina. Una ruta publica que haga `payload.find({ collection: 'proposals' })`
para buscar por token devuelve **todas** las propuestas, con sus precios, sin error, sin
aviso y sin que ningun tipo se queje. Por eso `03-conformance.md` convierte
`overrideAccess: false` en un gate y no en una nota de revision.

Ademas: `graphQL.disable: true` en el config. El sitio no expone GraphQL a nadie, y una
superficie de consulta que nadie usa es superficie que nadie audita. (El playground ya
viene desactivado en produccion por defecto — `disablePlaygroundInProduction` es `true`
de fabrica — pero desactivar GraphQL entero cierra tambien el endpoint.)

## 7. i18n — dos sistemas, un solo vocabulario

next-intl ya define `locales: ["es","en"]`, `defaultLocale: "es"`. Payload tiene su
propia `localization`. **Los dos tienen que decir lo mismo**, y el gate
`locales-en-sintonia` (§03) lo comprueba leyendo los dos.

```ts
localization: {
  locales: ['es', 'en'],
  defaultLocale: 'es',
  fallback: true,
}
```

`fallback: true` es el default y aqui conviene: una pieza de portfolio sin traducir se
ve en espanol antes que no verse. El campo se marca `localized: true` uno a uno — un
slug o una URL de imagen NO se localizan, por lo mismo que en `navigation.ts` las rutas
no se traducen: una direccion no es un texto que alguien lee.

En el consumo, `payload.find({ locale })` recibe el `locale` que ya resuelve la ruta.

## 8. Frontera `cms/` — lo que ya estaba escrito y ahora se ejecuta

CLAUDE.md ya declaro esta frontera; el programa solo la enciende.

```
app/                 rutas. Piden datos a cms/ y montan organismos
cms/                 el UNICO que conoce payload-types. Mapea documento -> props
design-system/       no conoce ni Payload ni cms/
```

Deltas de contrato, en `03-conformance.md`: `cms/` entra en `importableFrom` de
`organisms/`, y `design-system/` gana `cms/` en su `mayNotImport`.

## 9. Las dos colecciones

### `projects` — portfolio, publica

Hoy el portfolio son 14 PNG sueltos con medidas a mano **repetidas en tres archivos**
(`navigation.ts`, `manifesto.ts`, `team.ts`). No hay entidad de proyecto: ni titulo, ni
cliente, ni ano, ni slug. Esta coleccion la crea.

| Campo | Tipo | Localizado | Nota |
| --- | --- | --- | --- |
| `title` | text | si | requerido |
| `slug` | text | **no** | unico, indexado. Una direccion no se traduce |
| `client` | text | no | |
| `year` | number | no | |
| `discipline` | select | no | `branding` `web` `motion` `marketing` |
| `summary` | textarea | si | sin rich text (§4) |
| `cover` | upload -> media | no | requerido |
| `gallery` | array de upload | no | |
| `featured` | checkbox | no | alimenta el escaparate del menu |
| `order` | number | no | orden manual; sin esto se ordena por fecha y nadie decide |
| `_status` | draft/publish | — | via `versions.drafts: true` |

`access.read` publico **solo para publicados**, que es una query, no un booleano:

```ts
access: {
  read: ({ req: { user } }) => user ? true : { _status: { equals: 'published' } },
}
```

`cover` y `gallery` guardan `width`/`height` porque `next/image` los necesita para
reservar el hueco. Payload los guarda solo en la coleccion de uploads: el adaptador de
`cms/` los saca de ahi, no se reinventan.

### `proposals` — propuestas comerciales, privada

Documento por cliente. **No indexable, no listable, no publica.**

| Campo | Tipo | Nota |
| --- | --- | --- |
| `client` | text | requerido |
| `contactEmail` | email | |
| `status` | select | `borrador` `enviada` `aceptada` `rechazada` `vencida` |
| `scopeItems` | array | `{ concept: text, detail: textarea, amountCents: number }` |
| `currency` | select | `MXN` `USD` |
| `validUntil` | date | |
| `accessToken` | text | unico, indexado, `admin.readOnly`, generado en hook |
| `notes` | textarea | interno, nunca sale al cliente |

Tres decisiones que no son de estilo:

1. **El dinero se guarda en centavos, en un entero (`amountCents`).** SQLite no tiene
   decimal: un `number` acaba en coma flotante y `0.1 + 0.2` deja de ser `0.3` en una
   cotizacion. El total NO se guarda — se calcula al leer, para que no pueda contradecir
   a sus renglones.
2. **`accessToken` se genera en el servidor** con `crypto.randomUUID()` en un hook
   `beforeChange`, nunca desde el admin ni desde el cliente. `admin.readOnly` para que
   nadie lo escriba a mano y elija "pigmento2026".
3. **`notes` no cruza a `cms/`.** El adaptador escoge campos uno a uno; no hay un
   `...doc` en ningun sitio. Un spread es como se filtra un campo interno sin que nadie
   lo decida.

Acceso:

```ts
access: {
  read: ({ req: { user } }) => Boolean(user),   // explicito aunque sea el default
  create: ({ req: { user } }) => Boolean(user),
  update: ({ req: { user } }) => Boolean(user),
  delete: ({ req: { user } }) => Boolean(user),
}
```

La ruta publica `/propuesta/[token]` **no** usa el token como si fuera una sesion: hace
una consulta acotada por token, con `overrideAccess: false`, y responde 404 —nunca 403—
cuando no hay coincidencia. Un 403 confirma que el token existe.

La pagina exporta `robots: { index: false, follow: false }` y no aparece en el sitemap.
El gate `proposals-noindex` lo vigila, porque es la clase de linea que se cae en un
refactor y nadie la echa de menos hasta que Google la indexa.

## 10. Lo que este programa NO hace

Escrito para que nadie lo anada "ya que estaba":

- **PDF de la propuesta.** Ni generarlo ni mandarlo por correo. Otra spec.
- **Migrar `navigation.ts` y `footer.ts` a globals.** Es S6 y es opcional: los getters
  ya devuelven la forma correcta, asi que puede esperar sin coste.
- **Preview en vivo del admin.** Necesita `draft` en las rutas y una URL firmada.
- **Un blog.** Traeria rich text, y §4 explica lo que cuesta.
- **Tocar la capa de marca de Carbon.** Este programa no escribe un solo token.
