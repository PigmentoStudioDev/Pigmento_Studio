# Sesiones

Cada sesion: **objetivo**, **archivos** (los que se tocan, y solo esos), **API**
(las firmas que quedan), **restricciones** y **DoD**. Un agente que necesite un
archivo que no esta en su lista, para y lo pregunta — no lo anade.

`DoD` = definition of done. Todas incluyen, sin repetirlo cada vez:
`./scripts/gates.sh` en verde y un `specs/payload/handoff/S<n>.md` escrito.

---

## S0 — Auditoria de entorno. Cero codigo. **CERRADA 2026-09-09** (`handoff/S0.md`)

> Las cuatro respuestas estan incorporadas en `01-decisiones.md`. La #1 **corrigio** el
> spec: `payload build` no existe en 3.88.0. Se deja la sesion escrita entera porque el
> metodo — leer el tag y no `main`, exigir evidencia — es lo que hay que repetir.

**Objetivo.** Cerrar los cuatro `VERIFICAR EN S0` de `01-decisiones.md` antes de que
nadie instale nada. Una suposicion descubierta en S4 cuesta cuatro sesiones.

**Archivos.** Solo escribe `specs/payload/handoff/S0.md`.

**Que se verifica, y como.**

| # | Pregunta | Como se responde | Si sale distinto |
| --- | --- | --- | --- |
| 1 | `payload build` vs `next build` | `pnpm dlx payload@3.88.0 --help` y leer la doc del CLI | S2 usa lo que diga; `gates.sh` corre `pnpm build`, asi que lo que cambia es el script |
| 2 | `buildConfig` sin `editor` | escribir un config minimo en `/tmp` y correr `payload generate:types` | si lo exige, se instala `richtext-lexical` y se declara `lexicalEditor()` sin usarlo en ningun campo |
| 3 | `@payloadcms/storage-r2` es de Workers | `npm view @payloadcms/storage-r2` + su README | si sirve en Node sobre Vercel, S3 lo usa y se ahorra el cliente S3 |
| 4 | Peers reales con pnpm | `pnpm add --lockfile-only` en un scratch y leer los avisos | si pnpm exige `strict-peer-dependencies=false`, se anota — **no se toca `.npmrc` todavia** |

**Restricciones.** No instala nada en este repo. Los experimentos van al scratchpad.
No edita `package.json` ni `.npmrc` ni `tsconfig.json`.

**DoD.** `S0.md` responde las cuatro con la evidencia pegada (salida del comando o cita
de la doc con URL). Una respuesta sin evidencia no cierra la sesion.

---

## S1 — El budget de CSS, antes de que Payload exista. **CERRADA 2026-09-09**

> Gates verdes: 0 fallos, 0 avisos, 515 tests. CSS **161kb raw / 18kb gzip** — igual
> que antes, que es el resultado correcto: S1 cambia QUE se mide, no cuanto pesa.
> El test se afirma por la salida del runner (`spawnSync`), no importandolo: un
> relativo de `design-system/` a `scripts/` habria roto `crossModuleRelative`.

**Objetivo.** Que el gate de `budgets` mida **lo que descarga una visita** tambien en
CSS. Hoy mide todo lo emitido, y en cuanto entre el panel de Payload el gate se pondra
rojo midiendo un CSS que ningun visitante del sitio descarga.

Es la primera sesion con codigo a proposito: si entra despues de Payload, alguien va a
subir el limite para desbloquearse y el gate deja de decir nada.

**Y el margen es de 2kb.** Medido hoy: 18kb gzip de CSS sobre un techo de 20. El CSS
del panel de Payload no cabe ni de lejos, asi que esto no es una precaucion — es la
diferencia entre que S2 cierre y que S2 empiece con un gate rojo y una tentacion.

**El fallo, exacto.** `scripts/conformance.mjs` > `firstLoadFiles()` devuelve `null`
cuando la extension no es `.js`, y quien llama cae a `walk(dir, '.css')` sobre
`.next/static` entero. Ademas, el barrido de HTML recorre `.next/server/app` completo,
asi que el dia que una ruta de `(payload)` prerenderice, sus chunks contarian como
carga inicial del sitio publico.

**Archivos.**
- `scripts/conformance.mjs` — `firstLoadFiles()`
- `conformance/budgets.json` — nota del cambio y, si procede, los limites
- `src/design-system/styles/__tests__/budget-scope.test.ts` — nuevo

**API.**

```js
/**
 * Los archivos que piden DE ENTRADA las paginas PUBLICAS ya renderizadas.
 * (payload) queda fuera: el panel no lo descarga un visitante del sitio, y
 * medirlo aqui pondria rojo un gate que habla de otra cosa.
 */
function firstLoadFiles(dir, ext)   // ext: '.js' | '.css'
```

- CSS: se leen los `<link rel="stylesheet" href="/_next/static/css/...">` del HTML
- JS: como hoy, `\/_next\/(static\/[^"'?]+\.js)`
- las dos ramas saltan cualquier HTML cuya ruta contenga `(payload)`
- sin HTML publico, `null` y quien llama cae al total: sigue siendo el techo honesto

**Restricciones.**
- **No se sube ningun limite.** Si el gate se pone rojo, es un hallazgo, no un estorbo.
- No se toca `package.json` ni se instala nada.

**DoD.**
1. `pnpm build && pnpm conformance budgets` verde, y las cifras de CSS **bajan o
   quedan igual** que las medidas el 2026-09-09 en este repo: **161kb raw / 18kb gzip**
   sobre un limite de 200/20. (Las 129kb/12kb que cita `budgets.json` son la medicion
   historica de cuando se degrado Carbon, no el estado de hoy.)
2. El test nuevo pasa en verde y **se verifico en rojo**: con un `.css` falso puesto a
   mano en `.next/static/css/` que no referencia ningun HTML, el gate viejo suma y el
   nuevo no. La evidencia va en el handoff.

---

## S2 — Instalacion y arranque. **Requiere aprobacion de Karen.**

**Objetivo.** `/admin` levanta, `pnpm build` compila, los cinco gates verdes.

**Aprobacion previa, sin excepcion.** El CLAUDE.md global de Karen bloquea instalar
dependencias y tocar configs de raiz. El agente presenta esta lista y **espera**:

```
pnpm add payload@3.88.0 @payloadcms/next@3.88.0 @payloadcms/db-sqlite@3.88.0 graphql@^16.8.1
pnpm add -D cross-env
```

**`graphql` va fijado y no suelto.** S0 lo midio: `graphql` a secas instala 17.0.2 y
rompe el peer `^16.8.1` de `payload`. El ultimo del rango es 16.14.x. Un peer roto en el
primer `pnpm add` no falla ahi — falla mas tarde y en otro sitio.

(`sharp` y `@payloadcms/storage-s3` entran en S3, con Media. No antes: una dependencia
que no usa nadie todavia es ruido en el diff que la trae.)

**Archivos.**
- `package.json` — deps y **tres** scripts nuevos: `payload`, `generate:types`,
  `generate:importmap`. **`build` NO se toca**: sigue siendo `next build`. S0 confirmo
  que `payload build` no existe en 3.88.0 (es de v4), y el template del tag `v3.88.0`
  tambien usa `next build`.
- `pnpm-workspace.yaml` — **no se toca en S2**
- `tsconfig.json` — `"@payload-config": ["./src/payload.config.ts"]`
- `next.config.ts` — `withPayload`
- `src/payload.config.ts` — nuevo
- `src/collections/Users.ts` — nuevo, lo minimo para entrar al panel
- `src/app/(payload)/**` — generado, no se edita
- `src/proxy.ts` — excluir `/admin`
- `.env.example`, `.gitignore`
- `conformance/*.json` — los deltas de `03-conformance.md`

**API.**

```ts
// next.config.ts — el orden importa: withPayload por fuera, withNextIntl por dentro.
// Los dos envuelven la config; el de Payload tiene que ver la que ya paso por intl.
export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })
```

```ts
// src/payload.config.ts
export default buildConfig({
  admin: { user: Users.slug, importMap: { baseDir: path.resolve(dirname) } },
  collections: [Users],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URI || '', authToken: process.env.DATABASE_AUTH_TOKEN },
  }),
  localization: { locales: ['es', 'en'], defaultLocale: 'es', fallback: true },
  graphQL: { disable: true },
})
```

```
// src/proxy.ts — matcher
/((?!api|admin|_next|_vercel|.*\..*).*)
```

`.env.example` (valores de ejemplo, nunca reales):

```
DATABASE_URI=file:./pigmento.db
DATABASE_AUTH_TOKEN=
PAYLOAD_SECRET=cambiar-por-una-cadena-larga-y-aleatoria
```

`.gitignore` gana `*.db`, `*.db-shm`, `*.db-wal`.

**Restricciones.**
- **El orden de los envoltorios de `next.config.ts` no se improvisa**: si `withPayload`
  por fuera rompe next-intl, se prueba al reves y se escribe cual funciono y por que.
  Es el unico punto de la sesion donde la doc no manda porque ninguna de las dos lo
  documenta con la otra.
- Los archivos de `app/(payload)/` **se generan y no se editan**. Llevan cabecera
  `THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD`.
- `PAYLOAD_SECRET` real **nunca** entra al repo. `.env` sigue ignorado.

**DoD.**
1. `pnpm dev` -> `/admin` pide crear el primer usuario y lo crea.
2. `/` y `/en` siguen sirviendo la home, con idioma correcto.
3. `/admin` NO recibe prefijo de idioma. Hay test (§03 `admin-fuera-del-proxy`).
4. `pnpm build` compila y `budgets` sigue verde — **este es el pago de S1**.
5. Los cinco gates verdes.

---

## S3 — Users y Media sobre R2

**Objetivo.** Subir una imagen en el admin y verla servida desde R2 dentro de un
`next/image` del sitio.

**Aprobacion previa.** `pnpm add @payloadcms/storage-s3@3.88.0 sharp`, y sacar `sharp`
de `ignoredBuiltDependencies`.

**Archivos.**
- `package.json`
- `pnpm-workspace.yaml` — **solo la linea de `sharp`**. Los `@carbon/*` y `@ibm/*` se
  quedan bloqueados: es una decision de privacidad escrita, no una linea que sobra.
- `src/collections/Media.ts` — nuevo
- `src/payload.config.ts` — `sharp`, `plugins: [s3Storage(...)]`
- `next.config.ts` — `images.remotePatterns` con el host de `R2_PUBLIC_URL`
- `.env.example` — las cinco `R2_*`
- `src/migrations/**` — la primera migracion

**API.** La de `01-decisiones.md` §2, literal. `Media` lleva `alt` requerido y
localizado: una imagen sin texto alternativo es un fallo de accesibilidad y el repo ya
corre `jest-axe` en todos los componentes.

**Restricciones.**
- Credenciales solo por `process.env`. El gate `sin-secretos-literales` lo vigila.
- Si `R2_BUCKET` no esta, `enabled: false` y Payload cae a disco local — asi el sitio
  arranca en la maquina de cualquiera sin credenciales.

**DoD.**
1. Imagen subida en `/admin`, visible en R2, servida por `next/image` sin error de host.
2. `pnpm payload migrate:status` sin pendientes.
3. `pnpm test` verde, incluido el test de que `alt` es requerido.

---

## S4 — `projects` (portfolio) y la frontera `cms/`

**Objetivo.** El portfolio deja de ser catorce PNG a mano y pasa a ser una consulta.
Es la sesion que estrena `cms/`.

**Archivos.**
- `src/collections/Projects.ts` — nuevo
- `src/payload.config.ts`
- `src/cms/projects.ts` — nuevo. El adaptador.
- `src/cms/projects.test.ts` — nuevo
- `src/app/manifesto.ts`, `src/app/navigation.ts` — dejan de traer `PIECES` a mano
- `conformance/modularity-contract.json` — la frontera de `cms/`
- `src/migrations/**`

**API.**

```ts
// src/cms/projects.ts — el UNICO modulo que conoce payload-types.
import type { Project, Media } from '@/payload-types'

/** Piezas para los escaparates (menu, manifiesto): solo lo que pinta una imagen. */
export async function getProjectPieces(locale: Locale): Promise<ProjectPiece[]>

/** Una pieza: exactamente la forma que ya consumen NavBanner y Manifesto. */
export interface ProjectPiece { src: string; width: number; height: number }
```

`ProjectPiece` es **la forma que los componentes ya piden hoy**. El adaptador se
adapta al design system, no al reves — si un dia hiciera falta cambiarla, es un cambio
de organismo con su test, no un efecto colateral de haber modelado la coleccion.

**Restricciones.**
- `cms/` **no importa nada de `design-system/`**: importa sus tipos de props si hace
  falta, y ya. La direccion es `app -> cms -> payload`, y `app -> design-system`.
- `width`/`height` salen del documento de media, **nunca se escriben a mano**. Ese
  fue el bug original: catorce medidas repetidas en tres archivos.
- Si la coleccion viene vacia, el adaptador devuelve `[]` y los componentes ya lo
  aguantan. **No hay fallback a los PNG de `public/`**: un fallback silencioso
  convierte "el CMS no responde" en "el sitio se ve bien", y eso no se arregla nunca.

**DoD.**
1. Un proyecto creado en `/admin` aparece en el escaparate del menu y en el manifiesto.
2. `PIECES` ya no existe en `manifesto.ts` ni en `navigation.ts`.
3. `modularity` verde con la frontera nueva, y **verificado en rojo**: un import de
   `cms/` desde `design-system/` tiene que fallar el gate.
4. `access.read` de `projects` verificado con `overrideAccess: false`: un no-logueado
   ve publicados y no ve borradores.

---

## S5 — `proposals` (privada). Sesion de seguridad.

**Objetivo.** Cotizaciones en el CMS y una URL privada por cliente. Es la unica sesion
del programa donde un fallo tiene consecuencias fuera del repo.

**Archivos.**
- `src/collections/Proposals.ts` — nuevo
- `src/payload.config.ts`
- `src/cms/proposals.ts` + `.test.ts` — nuevos
- `src/app/[locale]/propuesta/[token]/page.tsx` — nuevo
- `src/design-system/components/organisms/ProposalSheet/` — nuevo (tsx + scss + test)
- `conformance/payload-contract.json`
- `src/migrations/**`

**API.**

```ts
// src/cms/proposals.ts
/**
 * Una propuesta por token. CORREGIDO al implementar (ver handoff/S5.md): aqui NO
 * va `overrideAccess: false`. Con `access.read` exigiendo sesion —que es lo que
 * cierra el REST— un visitante anonimo no leeria ni su propia propuesta. Lo que
 * sostiene la seguridad es el filtro por `accessToken`, el `limit: 1` y el mapeo
 * campo a campo. Para el resto de colecciones sigue siendo obligatorio.
 */
export async function getProposalByToken(token: string): Promise<ProposalView | null>

export interface ProposalView {
  client: string
  status: ProposalStatus
  items: { concept: string; detail: string; amountCents: number }[]
  totalCents: number      // se calcula al leer; no se guarda ni se puede contradecir
  currency: 'MXN' | 'USD'
  validUntil: string | null
  expired: boolean
}
```

**Restricciones — las siete que no se negocian.**
1. Toda lectura de `proposals` filtra por `accessToken` y lleva `limit: 1`. Gate,
   no revision. **No** `overrideAccess: false` — el motivo esta arriba y en el
   handoff; para las demas colecciones ese flag si es obligatorio.
2. `notes` **no** aparece en `ProposalView`. El adaptador escoge campo por campo; **no
   hay ningun `...doc`** en `cms/`. Un spread es como se filtra un campo interno.
3. La ruta responde **404** cuando el token no coincide. Nunca 403: un 403 confirma
   que el token existe y convierte la URL en un oraculo.
4. `export const metadata = { robots: { index: false, follow: false } }`.
5. Fuera del sitemap y fuera de `generateStaticParams`.
6. `accessToken` con `crypto.randomUUID()` en un hook `beforeChange`, `admin.readOnly`.
   Nunca escrito a mano.
7. Dinero en enteros de centavos. El total se calcula, no se guarda.

**DoD.**
1. Propuesta creada en el admin, visible en su URL con token, **404 sin token y con
   token equivocado**.
2. `GET /api/proposals` sin sesion responde 403/401 y **no filtra ni un campo**.
   Comprobado con `curl` y pegado en el handoff.
3. El agente `security-reviewer` corre sobre el diff y **no deja ningun hallazgo
   critico ni alto abierto**.
4. Los siete gates de §03 `payload-contract` verdes, cada uno verificado en rojo.

---

## S6 — Globals de navegacion y pie. Opcional.

**Objetivo.** `getNavigation(t)` y `getFooter(t)` pasan a consultar globals.

Es opcional porque **el trabajo caro ya esta hecho**: los getters devuelven la forma
plana que devolveria una consulta, asi que cambia el cuerpo y no la firma.
`SiteHeader` y `SiteFooter` no se enteran, y sus tests tampoco.

**Archivos.** `src/globals/Navigation.ts`, `src/globals/Footer.ts`, `src/cms/nav.ts`,
`src/app/navigation.ts`, `src/app/footer.ts`, `src/payload.config.ts`, migracion.

**Restriccion.** Las rutas (`/trabajo`, `/servicios`) siguen sin traducirse. Es la
decision escrita en `navigation.ts` y el CMS no la cambia: una direccion es una
direccion.

**DoD.** Los tests de `SiteHeader` y `SiteFooter` pasan **sin tocarlos**. Si hubo que
tocarlos, la forma cambio y eso es un hallazgo que va al handoff.

---

## S7 — Produccion. **Requiere aprobacion de Karen.**

**Objetivo.** Turso en produccion, migraciones aplicadas, deploy.

**Restricciones.**
- Deploy bloqueado por el CLAUDE.md global: se pide aprobacion y se espera.
- `push` **desactivado** contra Turso. La doc es explicita en no mezclar push y
  migraciones sobre la misma base.
- Las migraciones corren **antes** del build: `"ci": "payload migrate && pnpm build"`.
- Ojo con el enredo de Vercel que Karen ya tiene documentado (dos cuentas ligadas a la
  misma cuenta de GitHub, `TEAM_ACCESS_REQUIRED`): si el deploy por git se bloquea, el
  camino es el CLI logueado en el team dueno. Se pregunta antes, no se improvisa.

**DoD.** `/admin` responde en produccion, `migrate:status` sin pendientes, la home
publica sirve contenido del CMS, y `/propuesta/<token-inventado>` responde 404.

---

## S8 — La propuesta como documento comparativo. **Dos sesiones.**

**Origen.** Auditado contra una propuesta real de Pigmento (`PROPUESTA_MOEASY.pdf`, 9
paginas, septiembre 2026). Ningun campo de aqui es especulativo: cada uno esta escrito
en alguna de esas paginas. La pagina 9 es cierre de marca y no aporta dato.

**El hallazgo.** Lo que S5 modelo es *una cotizacion con renglones y un total*. Lo que
Pigmento manda es **un documento que compara tres rutas**, donde el precio es atributo
de cada ruta y no del documento. No es que falten campos: cambia la forma.

**Decisiones de Karen (2026-09-10).**
1. **Se extiende `Proposals`**, no se crea otra coleccion. Es el mismo documento y
   hereda entera la maquina de S5: token acunado por el servidor, 404, noindex,
   `force-dynamic` y los gates. `scopeItems` **se queda** para la cotizacion simple de
   una sola ruta; hoy lo lee `toView` y tiene test.
2. **Los criterios de la comparativa se declaran UNA VEZ** en la propuesta y cada
   paquete rellena su valor.
3. **Los terminos van en cada propuesta**, sin global. Maxima libertad por cliente; el
   riesgo de que dos propuestas del mismo mes se contradigan es aceptado a proposito.

### El schema

Se agrupa en **tabs** de Payload. No es cosmetica: un formulario plano de ~40 campos es
inservible para quien edita sin codigo, que es justo el publico de esta coleccion.

```
Cliente        client · contactEmail · status · validUntil · accessToken(ro) · notes
Portada        serviceTitle · tagline
Diagnostico    coverImage → Media · headline · context
Base comun     baseTitle · deliverables[{ name, description }]
               · includedInAll[{ text }]
Rutas          criteria[{ key, label }]
               · packages[{ eyebrow, name, accent, <precio>, deliveryWeeks,
                            body[{ paragraph }], values[{ key, value }] }]
Modulos        addOns[{ name, <precio>, description }]
Recomendacion  recommendedPackage · recHeadline · recBody · technicalNote
Terminos       terms[{ label, value }] · closing
```

### El precio no es un numero

Las tres formas conviven en el mismo PDF: fijo por proyecto (`$48,000 MXN / proyecto`),
recurrente (`$10,000 / mes`) y **rango por unidad** (`$200 - $350 c/u`). El grupo
`<precio>` es:

```ts
priceKind      select   'fijo' | 'mensual' | 'rango'
amountCents    number   required, min 0
amountMaxCents number   min 0, solo visible si priceKind === 'rango'
unit           select   'proyecto' | 'mes' | 'pieza'
```

**Trampa del gate B9, y hay que escribirla antes de caer en ella.** `dinero-en-centavos`
lee **solo `src/collections/Proposals.ts`**. Extraer el grupo de precio a
`collections/fields/price.ts` —que es lo que pide el instinto, porque se repite en
`packages` y en `addOns`— deja el gate **verde vigilando un archivo donde ya no hay
ningun campo `*Cents`**. O el grupo se queda en el mismo archivo, o el gate aprende a
seguir el import. Decidir a proposito y verificarlo en rojo.

### La comparativa: por que criterios declarados

En el PDF las tres rutas comparten cinco criterios —INVENTARIO, CARGA DE PROPIEDADES,
BUSCADOR, FICHA DE PROPIEDAD, CRECIMIENTO— y **la tercera cambia OPERACION por
PERMISOS**. Con listas libres por paquete eso no da error: las columnas dejan de
compararse fila con fila y nadie lo nota, que es exactamente como llego al PDF.

Payload no puede relacionar una fila de array con otra del mismo documento, y un
`select` no lee opciones de sus hermanos sin componente propio. Asi que la alineacion
la sostiene **un hook `beforeValidate` que rechaza todo `values[].key` que no este en
`criteria[]`**, escrito como funcion pura y probado como tal — el mismo patron que
`mintAccessToken` en S5. Un criterio que solo tiene una ruta deja celda vacia, y eso es
informacion: "solo la plataforma conectada define permisos".

### Restricciones

1. **El acento del paquete no es un color.** `accent` guarda un nombre de rol, nunca un
   hex: el gate `style` prohibe literales de color y la capa de marca dejaria de
   re-tematizar. La traduccion a token vive en el organismo.
2. **Nada localizado en v1.** La config tiene es/en, pero una propuesta se manda en un
   idioma. Localizar los ~40 campos duplica el trabajo de captura de un documento que
   nunca se lee en los dos. Se anota como decision, no como olvido.
3. **Dinero en centavos enteros**, tambien en los rangos. Regla de S5, gate B9.
4. **El total no se guarda.** Con paquetes no hay un total del documento: hay un precio
   por ruta. Nada que sumar y nada que pueda contradecirse.
5. `notes` sigue sin cruzar a `ProposalView`, y el mapeo sigue siendo campo a campo.
6. La ruta elige plantilla por los datos: **con `packages` vacio renderiza la
   `ProposalSheet` de S5**; con paquetes, el documento completo. Sin campo de "tipo"
   que se pueda desincronizar del contenido.

### S8a — schema, adaptador y gates

**Archivos.** `src/collections/Proposals.ts` · `src/cms/proposals.ts` + `.test.ts` ·
`src/collections/Proposals.test.ts` · `conformance/payload-contract.json` ·
`scripts/conformance.mjs` · `src/migrations/**`

**DoD.**
1. Los ocho bloques del PDF capturables desde `/admin`, en tabs.
2. El hook de criterios **rechaza** un `values[].key` inventado, con test en rojo.
3. B9 sigue vigilando de verdad los campos `*Cents`, **verificado en rojo tras la
   decision sobre el archivo**.
4. `toView` mapea los paquetes sin filtrar `notes`, con test.
5. Los cinco gates verdes.

### S8b — los organismos y la pagina

**Siete organismos**, uno por bloque, que es la correspondencia de la casa —
`ProposalCover`, `ProposalDiagnosis`, `ProposalBaseline`, `ProposalRoutes`,
`ProposalAddOns`, `ProposalRecommendation`, `ProposalTerms`. `ProposalSheet` de S5 se
queda como la plantilla de la cotizacion simple.

`ProposalRoutes` es el unico con dificultad real: es una **matriz** y tiene que seguir
siendo tabla accesible en movil, donde tres columnas no caben.

**DoD.** La propuesta de MoEasy reproducida desde el CMS, `axe` limpio en los siete,
contrato de modulos verde, y la comparativa legible en movil.

### Lo que este spec NO resuelve

- **Exportar a PDF.** Hoy la propuesta se manda como PDF y esto la vuelve una URL. Si
  el PDF sigue haciendo falta, es otro problema (y otra dependencia).
- **Las erratas del PDF de MoEasy**, que son de la pieza y no del sistema: el ultimo
  item de la pagina 3 sin palomita mientras los cinco de arriba la llevan, el rotulo
  "EN✓LOS TRES PAQUETES" con el glifo encajado, y el pie que dice `PIGMENTO STUDIO` en
  la pagina 3 y `pigmento STUDIO` en las 4 a 8.

## S9 — La propuesta que argumenta antes de cotizar. **Dos sesiones.**

**Origen.** Auditado contra la propuesta que Karen mando a Pigmento como
subcontratista (`karenrebecaortiz.com/en/proposals/moeasy`, septiembre 2026). A Pigmento
le gusto y pidio traer parte de ese contenido a SU propuesta para MoEasy. Este spec
decide que puede cruzar y que no, y que de lo que cruza necesita schema.

**El hallazgo.** S8 modelo el documento comparativo —tres rutas, criterios, precios— y
funciona. Lo que falta esta ANTES del precio: hoy la propuesta abre con `headline` y
`context` y salta a las rutas, o sea que pide $95,000 sin haber dicho todavia que esta
roto. El documento de Karen dedica sus primeras cuatro pantallas a eso, y por eso
convence.

### La frontera, y va primero porque es la que puede costar dinero

Son DOS documentos sobre el mismo cliente y no se parecen en publico: uno es
Karen -> Pigmento y el otro Pigmento -> MoEasy. Lo que sigue **no cruza en ninguna
forma, ni reescrito**:

1. Los precios de Karen a Pigmento, la reventa sugerida y el margen.
2. La tabla de lo que cobra el mercado. Es publica, pero puesta al lado del precio de
   Pigmento le entrega al cliente la calculadora del margen.
3. El argumento de venta *hacia* Pigmento: "la relacion es tuya", "el riesgo tecnico
   no es tuyo".
4. La tabla de objeciones **con su columna de concesion**. Los argumentos si sirven;
   la concesion es el guion de hasta donde ceder.
5. La autoria tecnica de Karen y el vinculo de subcontratacion.
6. **El trato comercial que explica los add-ons** (ver abajo).

**Por que SEO+GEO aparece en los dos documentos y no es una contradiccion**
(aclaracion de Karen, 2026-09-11). Karen NO le cobra a Pigmento el SEO on-page, la
capacitacion ni varias cosas que ya hace en todos sus proyectos: se las incluye para que
Pigmento las revenda como adicionales y se quede el importe entero. Por eso en el
documento de Karen viajan dentro de "en los tres paquetes" y en el de Pigmento son
add-ons de pago — y **asi tiene que quedarse**.

De ahi la unica regla operativa de esta seccion: **la lista `includedInAll` de Pigmento
no se sincroniza con la de Karen**. Copiar esa lista tal cual regala $12,000 de SEO y
$5,500 de capacitacion por documento. No es un detalle de redaccion, es el trato al
reves.

### El schema nuevo (S9a)

Dos arrays y nada mas. Todo lo demas de esta ronda es contenido o cabe en campos que ya
existen.

```
Diagnostico    findings[{ key, area, title, cost }]        <- nuevo
               figures[{ value, label, source }]           <- nuevo
```

**`findings` — la auditoria.** Cuatro hallazgos del sitio actual, cada uno con su
"lo que cuesta". `area` es la etiqueta corta de la columna (captacion, calificacion,
descubrimiento, seguimiento); `title` la afirmacion; `cost` el parrafo que la traduce a
dinero. **Sin campo de numero**: el `01..04` sale del orden del array. Un numero a mano
se desincroniza en cuanto alguien reordena, y entonces el documento dice "responde al
hallazgo 02" senalando a otro.

`key` se acuna como el de `criteria`: **se reusa `criterionKey()`**, que ya existe,
esta probada y normaliza acentos. S9b la necesita para atar entregables a hallazgos; se
declara desde S9a para no migrar dos veces.

**`figures` — las cifras de mercado.** Tres numeros del mercado y uno del cliente, que
es el remate: el cuarto es `0` formularios de contacto. `source` es **`required`**, y esa
es la decision: una cifra sin fuente en una propuesta de agencia es un pasivo, no un
argumento, y el unico momento en que alguien la pone es cuando la escribe. Pedirla
despues no pasa nunca.

### Restricciones

1. **Ninguna cifra se inventa ni se hereda de memoria.** Las del documento de Karen se
   capturan leyendo SU original, no una transcripcion. Cuatro de ellas llevan fuente
   citada y una es verificable en `moeasy.com.mx`.
2. **La critica al sitio del cliente viaja con su prueba.** El documento de Karen
   funciona porque dice "todo esto se puede verificar en moeasy.com.mx". Esa frase es lo
   que convierte el reproche en servicio y va en el organismo, no en el contenido: si
   depende de que quien captura se acuerde, un dia no esta.
3. **`figures` no es una grafica.** Es un numero grande, su frase y su fuente. Nada de
   libreria.
4. Sigue todo lo de S8: dinero en centavos, `accent` como rol, nada localizado,
   `notes` sin cruzar a `ProposalView`.

### S9a — schema, adaptador y dos organismos

**Archivos.** `src/collections/Proposals.ts` · `src/cms/proposals.ts` + `.test.ts` ·
`src/design-system/components/organisms/ProposalAudit/**` ·
`.../organisms/ProposalFigures/**` · `src/app/[locale]/propuesta/[token]/page.tsx` ·
`src/migrations/**`

**DoD.**
1. Auditoria y cifras capturables desde `/admin`, dentro del tab Diagnostico.
2. `source` vacio **rechaza** el guardado, verificado en rojo.
3. Los dos organismos con `axe` limpio y el numero grande dimensionado con `figure` —
   el estilo de escala que se mide contra su contenedor, no contra la ventana. Quien lo
   use declara `container-type: inline-size` o vuelve a medirse contra la pantalla sin
   avisar.
4. `toView` los mapea campo a campo, con el test de fugas cubriendolos.
5. Los cinco gates verdes.

### S9b — el vinculo hallazgo -> solucion, y los limites por paquete

Lo que hace que el alcance no se lea como una lista de features es que cada pieza diga a
que hallazgo responde y que esperar de ella. Y lo que evita la discusion de la semana
seis es que cada paquete diga en voz alta **donde esta el limite**.

```
Base comun     deliverables[{ ..., answersKey, expect, source }]
Rutas          packages[{ ..., limits, excluded[{ text }], recurringCost, bestFor }]
```

`answersKey` apunta a `findings[].key`, y esa relacion tiene el mismo problema que ya
resolvio S8 entre `criteria` y `packages[].values`: Payload no relaciona una fila de
array con otra del mismo documento. **Se extiende `alignProposal`**, que ya es una
funcion pura con tests, en vez de escribir un segundo hook que haga lo mismo.

`recurringCost` tiene una consecuencia comercial que no es tecnica y se decide antes de
escribirlo: publicarlo revela que las dos primeras rutas corren sobre Webflow, y eso le
dice a MoEasy que construirlas es barato. Es decision de Pigmento, no del schema.

**DoD.** Cada entregable resuelve a un hallazgo existente o el guardado falla; ningun
`answersKey` huerfano puede quedar guardado; gates verdes.

### Contenido de esta ronda que NO necesita schema

Se captura desde `/admin` con lo que ya hay, y se anota aqui para que no se pierda entre
lo que si lleva codigo:

- **Cuatro clausulas que faltan en `terms`**: rondas y aprobaciones (tres rondas, ventana
  de tres dias habiles, una ronda corrige y no reabre lo aprobado), garantia posterior al
  lanzamiento, cancelacion, y transferencia de la propiedad del codigo contra pago total.
  La de rondas es la que evita la revision infinita; la de propiedad la va a preguntar
  cualquiera que compre plataforma a medida.
- **Dos add-ons que se quedaron fuera**: traduccion a mandarin y fotografia o renders.
- **La linea de retorno**, en `recBody`: la comision de un solo arrendamiento de 2,000 m2
  ronda los 20,000 USD, asi que un trato adicional al ano paga el proyecto. Sigue siendo
  cierta con el precio de Pigmento.
- **La concesion que da autoridad**: decir en voz alta que un CRM inmobiliario con sitio
  incluido seria la opcion correcta si MoEasy solo vendiera casas.

### Lo que este spec NO resuelve

- **La exportacion a PDF**, que sigue pendiente desde S8.
- **El precio de las rutas.** Pigmento cotizo las tres en el piso de la banda sugerida
  por Karen. Es su decision y su margen; aqui solo se anota que existe techo sin usar.
