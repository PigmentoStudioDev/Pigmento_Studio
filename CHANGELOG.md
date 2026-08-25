# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
El proyecto todavia no versiona: hasta el primer release todo entra en `Unreleased`.

## [Unreleased]

### Added

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
