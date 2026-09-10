# Conformance: los gates que trae Payload

Definidos hasta el assert para que implementarlos sea mecanico. La regla de la casa
sigue mandando: **un gate se verifica EN ROJO reintroduciendo su bug**, y en verde al
quitarlo. Un gate que no falla contra su bug conocido no es un gate, es decoracion.

Tres bloques:

- **A. Deltas** — lo que cambia en los contratos que ya existen
- **B. `payload-contract.json`** — el contrato nuevo, seccion 7 del runner
- **C. Tests de build** — gate 5 de `gates.sh`, y los tests de Vitest

---

## A. Deltas sobre los contratos que ya existen

### A1 — `modularity-contract.json`: abrir `cms/`

```jsonc
// boundaries[] — el que ya existe, con cms/ anadido
{
  "to": "design-system/components/organisms/",
  "importableFrom": ["app/", "cms/", "design-system/components/organisms/", "design-system/preview/"]
}
// nuevo
{
  "from": "design-system/",
  "mayNotImport": ["app/", "cms/"],
  "why": "el design system tiene que poder salir de este repo entero. Si conoce el adaptador del CMS, se lleva payload-types consigo y deja de ser un design system"
}
{
  "to": "cms/",
  "importableFrom": ["app/", "cms/"],
  "why": "cms/ es el adaptador: lo consume una ruta. Si lo importa un organismo, el design system pasa a depender del CMS por la puerta de atras"
}
```

`fileLength.exemptFiles` gana:

```jsonc
"payload-types.ts": "generado por `payload generate:types`. Su tamano lo decide cuantas colecciones hay; partirlo no arregla nada y el generador lo reescribe entero"
```

**Rojo:** un `import { getProjectPieces } from '@/cms/projects'` dentro de
`design-system/components/organisms/Manifesto/Manifesto.tsx` tiene que fallar.

### A2 — `react-contract.json`: eximir lo generado, sin barra libre

Problema real del runner: `exemptFiles` se consulta con `contract.exemptFiles[rel]`,
**igualdad exacta**. Eximir siete archivos generados serian siete entradas que hay que
mantener a mano cada vez que Payload anada uno.

**Cambio en `scripts/conformance.mjs`:** una clave de `exemptFiles` que **termine en
`/`** cubre su subarbol. Se aplica a los dos contratos que usan `exemptFiles` por
igualdad (`react`, `modularity.fileLength`).

```jsonc
"app/(payload)/": "codigo generado por Payload. Va a exemptFiles y NO a clientBoundary.allow a proposito: esa lista mide cuantos componentes NUESTROS se han mudado al navegador, y el panel no es uno de ellos. La cabecera de cada archivo dice que se reescribe solo; el gate generated-untouched vigila que sigan intactos"
```

**Rojo, dos veces.** (1) Con el runner viejo, la clave con `/` no exime nada y el gate
sigue rojo. (2) Con el nuevo, `app/[locale]/page.tsx` **no** queda eximido por la clave
`app/(payload)/` — que el prefijo no se coma a un hermano.

### A3 — `budgets.json`: la nota del alcance

No cambian los limites. Cambia el `$why` del artefacto `css`, que hoy no dice nada del
alcance:

```jsonc
"$why": "Mide el CSS que pide DE ENTRADA una pagina publica prerenderizada, no todo lo emitido. El panel de Payload emite su propio CSS a .next/static y un visitante del sitio no lo descarga jamas: contarlo pondria rojo un gate que habla de otra cosa, y la salida obvia seria subir el limite — que es exactamente lo que este gate existe para impedir."
```

---

## B. `payload-contract.json` — el contrato nuevo

Septima seccion del runner: `pnpm conformance payload`. Data, como las otras seis.

### B1 — `overrideAccess-explicito` — el mas importante del programa

**Por que.** La Local API se salta el control de acceso por defecto. Una lectura sin
`overrideAccess: false` devuelve documentos que el usuario no puede ver, sin error, sin
aviso y sin que ningun tipo se queje. Es el unico fallo de este programa que se lleva
datos de clientes por delante.

**Que comprueba.** Todo archivo bajo `src/cms/` que llame a `payload.find(`,
`payload.findByID(` o `payload.findGlobal(` tiene `overrideAccess: false` dentro del
mismo objeto de opciones.

**Implementacion.** Desde la posicion de la llamada, balancear llaves hasta cerrar el
argumento y buscar `overrideAccess:\s*false` dentro. Nada de regex de una linea: las
opciones ocupan varias.

**Rojo:** quitar la linea de `getProposalByToken`. **Verde:** devolverla.

**Exencion.** Solo por linea, con `// conformance-exempt: <por que>`, y el motivo tiene
que decir por que ese dato puede leerse sin control de acceso.

### B2 — `sin-secretos-literales`

Ningun archivo de `src/` contiene el valor de `PAYLOAD_SECRET`, `DATABASE_AUTH_TOKEN`,
`DATABASE_URI` ni `R2_*` fuera de `process.env.<NOMBRE>`.

```
/(PAYLOAD_SECRET|DATABASE_AUTH_TOKEN|DATABASE_URI|R2_[A-Z_]+)\s*[:=]\s*["'`]/
```

Se exime `.env.example`, que no esta en `src/`. **Rojo:** `secret: "abc123"` en el
config.

### B3 — `generated-untouched`

Dos direcciones, y las dos hacen falta:

1. Todo archivo bajo `src/app/(payload)/` con la cabecera
   `THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD` esta cubierto por `exemptFiles`.
2. **Ningun archivo fuera de `src/app/(payload)/` lleva esa cabecera.** Es la mitad que
   se olvida: sin ella, pegar la cabecera en un archivo propio compra una exencion.

**Rojo:** anadir la cabecera a `src/app/[locale]/page.tsx`.

### B4 — `payload-fuera-del-ds`

`src/design-system/**` no importa `payload`, `@payload-config`, `@payloadcms/*` ni
`@/payload-types`. Solape a proposito con A1: A1 mira el grafo interno, este mira los
paquetes. **Rojo:** `import type { Project } from '@/payload-types'` en un organismo.

### B5 — `payload-types-solo-en-cms`

Solo `src/cms/**` importa `@/payload-types`. **Rojo:** importarlo desde
`src/app/[locale]/page.tsx`.

### B6 — `proposals-noindex`

`src/app/[locale]/propuesta/[token]/page.tsx` exporta `metadata` (o
`generateMetadata`) con `robots` e `index: false`, y **no** exporta
`generateStaticParams`.

**Por que un gate y no una revision:** es una linea que se cae en un refactor y nadie
la echa de menos hasta que aparece en Google. **Rojo:** quitar el `robots`.

### B7 — `admin-fuera-del-proxy`

El `matcher` de `src/proxy.ts` excluye `admin`. **Rojo:** devolver el matcher de hoy.

### B8 — `locales-en-sintonia`

Lee `routing.locales` / `routing.defaultLocale` de `src/i18n/routing.ts` y
`localization.locales` / `defaultLocale` de `src/payload.config.ts`, y exige que sean
el mismo conjunto y el mismo default.

**Por que.** Dos listas de idiomas que se separan no dan error: dan una pagina en
espanol pidiendo contenido de un locale que el CMS no tiene, y el fallback lo tapa.

**Implementacion.** Estatica, con regex sobre los dos archivos. Nada de importar el
config de Payload dentro del runner: arrastraria el paquete entero al gate.

**Rojo:** anadir `pt` a uno de los dos.

### B9 — `dinero-en-centavos`

Todo campo de `src/collections/Proposals.ts` cuyo nombre acabe en `Cents` es
`type: 'number'` y lleva `min: 0`; y **ningun** campo de esa coleccion se llama
`amount`, `price`, `total` o `subtotal` a secas.

**Por que.** SQLite no tiene decimal. Un `price` en coma flotante en una cotizacion es
un centavo que aparece o desaparece al sumar, y el cliente lo ve. El nombre del campo
es lo unico que impide que alguien lo reintroduzca sin pensarlo.

**Rojo:** anadir `total: { type: 'number' }`.

---

## C. Tests de build — gate 5

`./scripts/gates.sh` gana un gate, **despues** del contrato y **antes** de los tests,
porque mide artefactos del build. Se numera por su posicion y los tests pasan a ser el
5: en este repo el numero de un gate dice cuando corre, y un 5 antes de un 4 seria la
primera excepcion a eso.

| Gate | Que | Por que ahi |
| --- | --- | --- |
| 1 build | `pnpm build` | primero: `budgets` mide sobre `.next/` |
| 2 estatico | secretos + `pnpm lint` | ESLint es quien entiende AST |
| 3 contrato | `node scripts/conformance.mjs` | las siete secciones |
| **4 payload** | **`node scripts/payload-build-check.mjs`** | **necesita `.next/` y, para C5, una base** |
| 5 tests | `pnpm test` | los mas lentos, al final |

El comentario de cabecera de `gates.sh` dice "Cuatro gates: build, estatico, contrato,
tests". Se actualiza en el mismo diff: un comentario que miente sobre cuantos gates hay
es como se pierde uno.

`scripts/payload-build-check.mjs`. Si Payload no esta instalado, **avisa y no falla** —
mismo criterio que `budgets` sin build: un gate que se pone rojo por no haber llegado
todavia entrena a la gente a ignorarlo.

### C1 — `admin-compilado`

Tras `pnpm build`, existe salida para `app/(payload)/admin`. **Rojo:** borrar
`src/app/(payload)/admin` y reconstruir.

### C2 — `tipos-al-dia`

`payload generate:types` a un temporal y comparar con `src/payload-types.ts`. Si
difieren: alguien cambio una coleccion y no regenero, y a partir de ahi los tipos
mienten en cada `import`.

Se compara **contenido normalizado** (finales de linea y espacios al final), no el
hash: un cambio de plataforma no es un fallo. **Rojo:** anadir un campo y no regenerar.

### C3 — `importmap-al-dia`

Lo mismo con `payload generate:importmap` contra `src/app/(payload)/admin/importMap.js`.
Un importMap viejo no rompe el build: rompe el panel en runtime, con un componente que
no aparece.

### C4 — `sin-base-en-el-repo`

Ningun `*.db`, `*.db-shm`, `*.db-wal` bajo el arbol del proyecto fuera de `.gitignore`.
Una base de SQLite en el repo son datos de clientes en un repo.

**Rojo:** `touch pigmento.db` con el `.gitignore` sin la regla.

### C5 — `migraciones-al-dia`

Si hay `DATABASE_URI`, `payload migrate:status` no reporta pendientes. Sin
`DATABASE_URI`, avisa y no falla — para que CI sin base siga siendo util.

**Rojo:** crear una migracion y no aplicarla.

### C6 — `panel-fuera-del-budget`

El complemento de S1, por la otra puerta: **ningun CSS ni JS que solo pida `(payload)`
entra en la cuenta de `budgets`**. Se compara la lista de `firstLoadFiles` con la de
chunks referenciados por el HTML del panel: la interseccion tiene que ser solo el
runtime comun de Next.

**Rojo:** devolver `firstLoadFiles` a barrer `.next/server/app` entero, con Payload
instalado. El gate tiene que ponerse rojo — y **si no se pone, S1 no esta terminada**.

### Las tres trampas de C6, medidas en S1

Salieron de la revision de S1 y hay que resolverlas en S2, no descubrirlas alli.

**1. El markup real, en este Next 16.3.2.** No es `/_next/static/css/...`:

```html
<link rel="stylesheet" href="/_next/static/chunks/1in-2ppbwpw40.css" data-precedence="next"/>
```

Los `.css` viven en `chunks/`, junto a los `.js`. Un regex que asuma `static/css/`
no encuentra nada, y entonces se dispara la trampa 2. El de S1 no lo asume; **el de S2
tampoco puede**, y el test tiene que afirmarlo sobre el HTML de verdad.

**2. El fallback a `walk()` es la puerta de atras.** Sin HTML reconocible,
`firstLoadFiles` devuelve `null` y quien llama suma `.next/static` **entero** — que es
justo el bug que S1 arreglo. Basta con que el panel de Payload emita un markup que el
regex no reconozca para que su CSS vuelva a contar, y **el gate no dira que fallo el
regex: dira que el CSS engordo**. En S2, C6 tiene que distinguir los dos casos:
"no encontre HTML publico" no es lo mismo que "medi y da esto".

**3. `/ds` esta dentro del budget, y es una decision sin tomar.** Medido en S1: el sitio
prerenderiza `es/ds.html` y `en/ds.html`, asi que el preview del design system aporta
**22.7kb raw / 2.7kb gzip** al first-load que mide el gate. CLAUDE.md dice que `/ds` es
herramienta de desarrollo y no una pagina del sitio.

Las dos lecturas se sostienen y por eso **no se decide de paso**:

- *excluirlo* — coherente con `(payload)`: el gate mide lo que descarga un visitante, y
  nadie visita `/ds`. Sube el margen de 2kb a ~4.7kb gzip, que es justo lo que S2
  necesita. Precio: una regresion de CSS en `/ds` deja de medirse.
- *dejarlo* — CLAUDE.md ya dice que `/ds` "del gate de tokens no se exenta", y el techo
  actual se fijo con `/ds` dentro: sacarlo regala margen que nadie midio.

**RESUELTO 2026-09-09 — Karen elige EXCLUIRLO.** `/ds` sale de la medida junto con
`(payload)`. Lo que se hizo:

- `firstLoadFiles` filtra por `FUERA_DE_LA_VISITA`, una lista de `[fragmento, motivo]`
  y no un `if` encadenado: la siguiente ruta que se excluya trae su motivo al lado.
- **Los techos BAJAN con la medida.** CSS 161/18 -> 139/15, asi que el limite pasa de
  200/20 a **178/17**; JS 693/216 -> 684/213 (`/ds` tambien aportaba JS), asi que pasa
  de 780/230 a **771/227**. Se conserva el mismo margen absoluto de antes. Dejar los
  techos arriba habria regalado 2.7kb de gzip de holgura que nadie midio, y un techo
  holgado es como vuelve a entrar Carbon sin que nadie se entere.
- Test `el CSS que solo pide /ds no entra en la medida`, **verificado en rojo**
  quitando la exclusion. Compara CONJUNTOS de chunks, no una cifra fija: los nombres
  llevan hash y un test contra "139kb" se cae en el siguiente build sin que nada este mal.

**Dos cosas que costaron una vuelta y quedan escritas:**

1. **El runner manda los OK por stdout y los FAIL por `console.error`.** Un test que lea
   solo `stdout` no ve la linea del css cuando el budget esta roto, y falla por no
   encontrarla — un rojo que no distingue "midio mal" de "midio de mas". Se leen los dos.
2. **Cada llamada al runner gzipea `.next/static` entero en un proceso aparte.** Tres de
   esas en paralelo con la suite mataron por inanicion a dos tests que no tienen nada que
   ver (timeouts de 115s en un test de DOM). Los tests que miden el mismo estado comparten
   una sola medida. **En S2 esto vuelve a morder**: C6 anade mas lecturas del runner.

---

## D. Tests de Vitest

Van con el patron de la casa: contrato publico, y comportamiento solo si es
interactivo. Todos verificados en rojo.

| Archivo | Que asegura | Su bug |
| --- | --- | --- |
| `src/cms/projects.test.ts` | el adaptador devuelve `ProjectPiece[]` con `width`/`height` del documento de media, y `[]` con la coleccion vacia | devolver los PNG de `public/` como fallback |
| `src/cms/proposals.test.ts` | `notes` **no** esta en `ProposalView`; `totalCents` es la suma de los renglones; `expired` sale de `validUntil` | un `...doc` en el mapeo |
| `src/cms/proposals-access.test.ts` | sin sesion, `getProposalByToken` con token equivocado devuelve `null`; con el bueno, la propuesta | quitar `overrideAccess: false` — el test tiene que **fallar**, y ahi esta su valor |
| `src/collections/projects-access.test.ts` | un no-logueado ve publicados y no ve borradores | `read: () => true` |
| `src/design-system/.../ProposalSheet.test.tsx` | contrato publico por rol y nombre, `jest-axe`, y el circuito TS/Sass contando clases | el patron de siempre |
| `src/i18n/locales-contract.test.ts` | duplica B8 desde el otro lado: importa `routing` de verdad | anadir `pt` a uno solo |

**`ProposalSheet` no lleva ni un dato de prueba con pinta de real.** Ni nombres de
clientes ni cifras que parezcan una cotizacion de verdad: un fixture realista acaba en
una captura, y esto es una agencia de marca. `"Cliente A"` y `1000` centavos.

---

## E. Orden de implementacion de los gates

Importa, porque algunos se pueden verificar en rojo antes de que exista lo que vigilan:

1. **S1** — el cambio de `firstLoadFiles` y C6 (C6 se queda avisando hasta S2)
2. **S2** — A2, A3, B2, B3, B7, B8, C1, C2, C3, C4
3. **S3** — C5
4. **S4** — A1, B4, B5, y los tests de `projects`
5. **S5** — B1, B6, B9, y los tests de `proposals`

Un gate que se escribe en su sesion y **no** se verifica en rojo esa misma sesion no
cuenta como escrito. Se anota en el handoff como deuda, con nombre.
