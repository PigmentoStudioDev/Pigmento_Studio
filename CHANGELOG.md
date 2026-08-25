# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
El proyecto todavia no versiona: hasta el primer release todo entra en `Unreleased`.

## [Unreleased]

### Added

- **Birken Nue como la sans del sitio**, los nueve pesos. `next/font` emite un
  `@font-face` por peso y el navegador solo descarga los que algun texto usa: recortar
  la lista quitaria opciones al diseno sin ahorrar un byte a quien visita.
- **Escala tipografica de marca** (`_type.scss`), junto a la de Carbon y no en su
  lugar. Carbon cubre el registro de UI de producto — tracking cero e interlineados de
  1.19 a 1.4 — y lo que se calca de la referencia son las dos curvas que le faltan: el
  tracking que se aprieta segun crece el cuerpo (-0.01em a -0.06em) y el interlineado
  que baja de 1 en display. `type-contract` exige que todo tamano y tracking de un
  componente sea miembro de UNA de las dos escalas.
- **El logotipo real**, invertido en las zonas oscuras con `--pg-on-dark`: una bandera
  derivada, no un token de tema, para lo que no puede tomar color de `currentColor`.
- **La tercera columna del mega menu**, que faltaba entera. `NavBanner` existia y
  nadie lo montaba porque la navegacion no traia el dato.
- **`$container-mega`**, techo de la PLACA del mega menu — otra medida que el techo de
  su contenido. Sin el, en un monitor muy grande el fondo seguia creciendo con la
  ventana con lo de dentro ya parado, y el hueco se lee como un borde vacio.
- **Regla `reference-name`** en los tres contratos: la referencia de diseno se cita
  sin nombrarla. El runner gana `includeComments` — las reglas que van SOBRE el
  comentario necesitan la vista que el escaner descartaba — y exenciones por regla, no
  por archivo entero.

- **Modelo atomico de componentes.** `layout/` (primitivas de composicion),
  `atoms/`, `molecules/`, `organisms/`. La correspondencia organismo ↔ bloque de
  Payload es la regla central: por eso las props son serializables. El grafo entre
  capas va en un solo sentido y es una regla ejecutable, no un acuerdo verbal.
- **`layout/Section`**, que pone el ritmo vertical, el ancho y la zona de tema. Los
  organismos no llevan margenes externos: si los llevaran, el hueco entre dos bloques
  dependeria de cuales sean y no del orden que arme la pagina.
- **Navbar completa** portada de la referencia: `atoms/Logo`, `molecules/NavToggle`,
  `NavLinkList`, `NavBanner` y `organisms/SiteHeader`, montada en el layout raiz.
  Panel expandible, cierre por Escape, por fondo y por scroll, e `inert` para que la
  tabulacion no se pierda en un panel invisible.
- **Atomos propios**: `atoms/Button` y `atoms/Tag`, sobre la tercera capa de tokens
  de Carbon. Carbon deja de ser la capa de atomos.
- **Escala de motion de marca** en `_brand.scss` (ratio sobre una base) y **escala de
  radios** en dieciseisavos, ambas calcadas del sistema de la referencia.
- **Cuatro contratos nuevos**, todos sobre el CSS compilado y verificados en rojo:
  `motion-contract` (reduced-motion obligatorio y duraciones de la escala),
  `radius-contract` (escalones de la escala; la pildora solo para controles),
  `module-contract` (cada `styles.x` existe y cada clase se usa) y las reglas
  `motion-literal` y `gsap-import` del contrato de TSX.
- **Budget de JS**, que no existia. Los limites salen del build real y el margen es
  corto a proposito.

### Changed

- **Los anchos de contenedor salen de la reticula**, por `map.get()` sobre
  `$grid-breakpoints`, en vez de escribirse a ojo. La excepcion es `$container-full` y
  esta escrita: un mega menu no es una columna de LECTURA, y las dos medidas
  compartian numero por accidente.
- Los enlaces del panel ocupan el ancho de su `<li>`: el area de clic es la fila
  entera y no lo que mide el texto.

- **Carbon deja de emitir el CSS de sus componentes.** `index.scss` registra a mano
  los cinco grupos de tokens de componente con `add-component-tokens()`, asi que la
  plantilla sigue entera — primitivas, 235 semanticos y 77 de componente — sin una
  sola regla suya. **938kb raw / 96kb gzip → 129kb / 12kb.**
- **Ni un import de `@carbon/react` en JS.** Pedir `<Theme>` metia el barrel completo
  en el bundle: aparecian `flatpickr`, `TreeView` y `MultiSelect` por un componente
  que concatena un string. `design-system/theme/zone.ts` lo sustituye por lo que era.
  **1226kb raw / 358kb gzip → 611kb / 188kb.**
- El gate de fuentes recorre `design-system/` entero en vez de dos directorios fijos:
  un `.module.scss` que olvide `carbon-config` ya se cae solo.
- El contrato de tema se parte en dos afirmaciones: que la plantilla siga completa y
  que la marca no toque nada que no haya declarado.

### Fixed

- **El sitio entero llevaba renderizando en Times.** La familia base la ponia el reset
  de Carbon, y desde que dejamos de emitir el CSS de sus componentes no la ponia nadie:
  sus tokens de tipo llevan tamano, peso e interlineado pero no familia. Sin literal
  que detectar ni build que romper, el unico gate posible es exigir que `html` o `body`
  traigan una familia salida de una variable.
- **Faltaba el `box-sizing: border-box`**, del mismo reset. `content-box` suma padding
  y borde al tamano declarado, y lo delata cualquier caja que mezcle `aspect-ratio` con
  `padding`: la proporcion se calcula sobre la caja de contenido y la pieza deja de
  mantenerla justo en los anchos donde mas se nota.
- **`list-style: none` no quita el sangrado.** El navegador le pone a todo `<ul>` un
  `padding-inline-start` de 40px para el marcador, y son dos reglas distintas: la lista
  quedaba sangrada sin un bullet que lo justificara.
- El import estatico de `next/image` no sobrevivia a Vitest: Next lo resuelve a
  `{src, width, height}` y Vite a una URL pelada, asi que `<Image>` moria por falta de
  `width`. El plugin lee las medidas de los BYTES del archivo (IHDR en png, VP8X en
  webp) y lanza un error con el nombre si no puede — un limite declarado, no un hueco.

- `SiteHeader` referenciaba `styles.isClosed`, que nunca se declaro. `join()` no
  escribe "undefined" sino cadena vacia, asi que la clase no salia rota: salia
  ausente. El estado cerrado se quedo sin su clase sin que nada avisara.
- El panel cerrado ocupaba alto y empujaba la placa por debajo de la barra. El
  `padding` estaba en el item del grid, y `min-block-size: 0` solo pone a cero la
  caja de contenido: el padding se seguia sumando y la fila de `0fr` nunca colapsaba.
- Una capa a pantalla completa con `pointer-events: none` devolviendo el puntero
  pieza a pieza dejaba elementos que se pintan y no responden. La cabecera ocupa
  ahora solo lo que mide.
- `aria-controls` apuntaba a un panel ausente en el test aislado, y el nombre
  accesible de `NavBanner` dependia del layout — separado en el navegador y pegado en
  jsdom. Los dos los destapo `jest-axe`.

- Scaffold inicial: Next 16.3.2 (App Router, Turbopack), React 19.2.8, IBM Carbon v11
  y Sass. Sin Tailwind — Carbon ya es el sistema de tokens y superponerlo crearia una
  segunda fuente de verdad para spacing y color.
- Capa de marca sobre Carbon: `_brand.scss` (primitivas propias) y `_theme.scss`
  (delta semantico por grupo claro/oscuro). Valores actuales son placeholders.
- Preview del design system en `/ds`: explorador de los tokens semanticos leidos en
  runtime del propio elemento, fundamentos (58 estilos de tipo, 13 de espaciado,
  6 de motion) y galeria de componentes. Es herramienta de desarrollo, no una pagina
  del sitio.
- `scripts/generate-preview-tokens.mjs`: genera la lista de estilos y espaciados
  desde los mapas de Sass de Carbon, para que el preview no tenga nombres a mano que
  se desfasen al subir Carbon (`pnpm gen:tokens`).
- Suite de contrato con Vitest (16 tests). Cada gate se verifico en ROJO
  reintroduciendo su bug antes de darlo por bueno.
- `error.tsx`, `not-found.tsx` y `global-error.tsx`. Ninguno expone `error.message`:
  solo el `digest`, que es lo que cruza con los logs del servidor.
- `metadataBase`, sin el cual las URLs relativas de Open Graph no resuelven.
- IBM Plex Serif via `next/font`. Carbon lo usa en `quotation-01/02` y
  `fluid-paragraph-01`, no era decorativo.
- **`scripts/gates.sh`: un unico entrypoint para el compliance completo** — build,
  estatico (secretos + ESLint), contrato y tests. El build va PRIMERO a proposito: la
  seccion `budgets` mide sobre `.next/`, asi que sin build se saltaba con una nota en
  vez de medir.
- **Seccion `react` del contrato** (`conformance/react-contract.json`): `React.FC`,
  `any`, `console.log|info|debug` y `dangerouslySetInnerHTML` como patrones; y tres
  reglas posicionales que ninguna regex de una linea puede ver — que `'use client'`
  sea la PRIMERA sentencia (si algo que no es comentario lo precede deja de ser
  directiva, el archivo se queda en el servidor y no hay error de build), que la
  frontera de cliente este declarada en el contrato y no se descubra en el budget, y
  que el `export default` este en los archivos de ruta y solo en ellos.
  `console.error` queda fuera de la regla: es el canal deliberado de los error
  boundaries.
- **Seccion `modularity` del contrato** (`conformance/modularity-contract.json`):
  longitud de archivo (400 aviso, 800 tope) y grafo de imports — el design system no
  depende de `app/`, `preview/` solo lo importa `/ds` y `tokens.generated` solo
  `preview/`. Es el gate que llega antes que `budgets`: si el sitio importara
  `ComponentGallery`, los 263 exports de Carbon entran al bundle de produccion y el
  peso lo delata tarde y sin nombrar la causa.
- **Valvula `// conformance-exempt: <por que>`** en el runner. Las reglas de TSX son
  mas grises que las de Sass y `exemptFiles` exime el archivo entero. Sin motivo
  escrito detras de los dos puntos no cuenta como exencion.
- Las reglas de hooks (`rules-of-hooks`, `exhaustive-deps`, `jsx-key`) **no** se
  reimplementan en el contrato: necesitan AST y ya las cubre
  `eslint-config-next/core-web-vitals`. Por eso `pnpm lint` es un gate y no un
  comando suelto. Un gate de regex que finge entender scope cierra en verde sin
  cubrir la forma real del codigo.

### Changed

- **El mecanismo de tema pasa a ser el de Carbon.** `index.scss` re-emite las cuatro
  clases de zona (`.cds--white|g10|g90|g100`) con la capa de marca encima, en vez del
  atributo `data-theme` que habiamos inventado y que ningun componente de Carbon lee.
  Ahora `<Theme>` y `useTheme()` funcionan y llevan la marca.
- Los overrides de marca pasan por los varargs de `theme()` — la API de Carbon — en
  vez de construir el nombre de la custom property a mano. Quita el acoplamiento al
  prefijo y garantiza el orden sin depender de que nuestro bloque quede el ultimo.
- `_carbon-config.scss` centraliza la configuracion de Carbon con `@forward ... with`,
  el mecanismo de Sass para compartirla entre unidades de compilacion.
- `_app.scss` recoge el chrome que necesita cualquier ruta.
- El parser de la cascada en los tests usa postcss y no una regex: hacia falta excluir
  el `:root` que Carbon emite dentro de `@media (forced-colors: active)`, cuyos
  valores de sistema la regex leia como si fueran el tema.
- Los `postinstall` de `@carbon/*` y `@ibm/*` (telemetria de IBM) se bloquean de forma
  explicita en `pnpm-workspace.yaml`. Un `.env` no habria servido: esta en
  `.gitignore`, asi que nunca llegaria a CI, el unico sitio donde esa telemetria corre.

### Fixed

- **Los 76 tokens de componente caian al tema claro.** Carbon los resuelve con
  `matches()`, que exige igualdad exacta contra un tema de fabrica; al pasarle a
  `theme()` el tema ya mezclado con la marca, el match fallaba y los 76 tomaban los
  valores del tema *white*. Sintoma visible: notificaciones con fondo claro y texto
  claro. 65 de 76 tokens estaban mal.
- **`preview.scss` cargaba Carbon sin configurar.** Cada `.scss` es una unidad de
  compilacion independiente, asi que emitia el literal `'IBM Plex Sans'` que
  `next/font` no registra: los 4 estilos serif y los 2 de `code` caian al fallback del
  sistema y la seccion de tipografia del preview mentia.
- **`.pg-landing` vivia en `preview.scss`**, que solo se carga en `/ds`, pero la usaba
  la home: renderizaba sin estilo y sin ningun error.

### Removed

- SVGs del scaffold en `public/`.
- `vite-tsconfig-paths`: Vitest 4 avisa en runtime de que Vite ya resuelve los paths
  del tsconfig de forma nativa. La guia de Next todavia lo recomienda.
