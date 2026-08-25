@AGENTS.md

# Pigmento Studio

Sitio del estudio. Next 16 (App Router, Turbopack) + React 19 + IBM Carbon v11 + Sass.

## La idea del design system

**Carbon ES el pipeline de tokens.** No autoramos primitivas ni compilamos con Style
Dictionary: Carbon ya aporta las tres capas — primitivas (`@carbon/colors`,
`@carbon/layout`, `@carbon/type`, `@carbon/motion`), 235 tokens semanticos y 76 de
componente. Encima va una capa de marca fina que se construye token a token.

```
@carbon/*                     upstream, no se toca
  └─ _brand.scss              unicas primitivas nuestras (acentos, radios)
     └─ _theme.scss           delta semantico por grupo (dark / light)
        └─ index.scss         unico punto de emision
```

Los valores de marca de hoy son **placeholders** con `TODO(brand)`: azules de Carbon.
Se iran sustituyendo poco a poco. Los tests existen precisamente para eso — para que
cada override sucesivo no rompa algo que Carbon daba por sentado.

## Reglas duras

Cada una existe porque su fallo YA ocurrio, y cada una tiene un test que se verifico
en rojo reintroduciendo el bug. `pnpm test` antes de dar nada por bueno.

1. **`theme.theme()` recibe SIEMPRE un tema de fabrica sin mezclar**, y la marca como
   segundo argumento: `theme.theme(themes.$g100, pigmento.$overrides-dark)`. Carbon
   resuelve sus 76 tokens de componente con `matches()`, que exige igualdad exacta
   contra un tema de fabrica. Con el tema ya mezclado el match falla y los 76 caen al
   fallback del tema *white* — fondos claros con texto claro. **Un solo override basta
   para tirarlos todos.**

2. **Todo entry de Sass empieza por `@use '.../carbon-config';`**. Cada `.scss` que
   Next compila es una unidad de compilacion independiente: la configuracion de
   `index.scss` no alcanza a los demas. Un entry sin el partial emite el literal
   `'IBM Plex Sans'`, que `next/font` no registra bajo ese nombre, y la tipografia se
   pierde sin ningun error de build. `@forward ... with` es lo que permite COMPARTIR
   configuracion; un `@use ... with` en el entry no se puede compartir.

3. **El mecanismo de tema es el de Carbon: las clases `.cds--white|g10|g90|g100`**,
   que pone `<Theme>` y lee `useTheme()`. `index.scss` re-emite las cuatro con la capa
   de marca encima. No inventar atributos propios (`data-theme` y similares): ningun
   componente de Carbon los lee. Hubo un `data-theme` y se retiro por esto.

4. **Cero valores literales.** Color, spacing, tipografia y motion salen de tokens de
   Carbon. Un literal no re-tematiza y rompe la premisa entera de la capa de marca.

5. **Una clase que use algo fuera de `preview/` va en `_app.scss`**, no en
   `preview/preview.scss`: esa hoja solo se carga en `/ds`. Precedente: `.pg-landing`
   se definio alli y la home la usaba, asi que renderizaba sin estilo.

## `/ds` es herramienta de desarrollo

La pagina de preview no es una pagina del sitio. Queda **exenta de i18n** (decision de
Karen) y no se amplia con previews de cada componente. Del gate de tokens no se exenta.

Los nombres de estilos y espaciados se **generan** desde los mapas de Carbon
(`scripts/generate-preview-tokens.mjs`), no se escriben a mano. Tras subir Carbon:
`pnpm gen:tokens`.

## Como se verifica

Un solo entrypoint: **`./scripts/gates.sh`**. Cuatro gates, y falla el conjunto si
falla uno.

| Gate | Que | Por que ahi |
| --- | --- | --- |
| 1 build | `pnpm build` | va primero porque `budgets` mide sobre `.next/`; sin build no mide, solo avisa |
| 2 estatico | secretos + `pnpm lint` | ESLint es quien entiende AST: hooks y core-web-vitals |
| 3 contrato | `node scripts/conformance.mjs` | las reglas de la casa |
| 4 tests | `pnpm test` | contrato del tema y de las fuentes, sobre el Sass real |

El contrato del gate 3 **es data**: las reglas viven en `conformance/*.json` y el
runner es tonto. Relajar una ley obliga a editar ese directorio, y eso se ve en el
diff; un literal enterrado en un `.scss` no se ve. Seis secciones, ejecutables por
separado con `pnpm conformance <seccion>`:

- `style` / `tsx` — cero literales de color, spacing, tipografia y motion.
- `react` — `any`, `console`, `React.FC`, `dangerouslySetInnerHTML`; que
  `'use client'` sea la primera sentencia; que la frontera de cliente este declarada;
  que el `export default` este en los archivos de ruta y solo ahi.
- `structure` — cada entry de Sass carga `carbon-config`; las clases usadas fuera de
  `preview/` estan en `_app.scss`.
- `modularity` — longitud (400 aviso, 800 tope) y grafo de imports: el DS no depende
  de `app/`, `preview/` solo lo importa `/ds`, `tokens.generated` solo `preview/`.
- `budgets` — peso del CSS que viaja al navegador.

**Las reglas de hooks no estan en el contrato** y no se van a meter: necesitan AST y
ya las cubre `eslint-config-next/core-web-vitals` en el gate 2. Un gate de regex que
finge entender scope cierra en verde sin cubrir la forma real del codigo.

Valvulas, en orden de menos a mas grueso: `// conformance-exempt: <por que>` en la
linea, `exemptFiles` en el contrato, `baseline` para deuda medida. Ninguna cuenta sin
el motivo escrito. **El baseline de este repo esta vacio a proposito**: el proyecto
nacio sin deuda, asi que anadir una entrada para hacer pasar un cambio propio es una
decision consciente y visible en el diff.

Regla para reglas nuevas: **se verifica en ROJO reintroduciendo su bug**, y en verde
al quitarlo. Un gate que no falla contra su bug conocido no es un gate.

## Comandos

```bash
pnpm dev              # localhost:3000 · el preview del DS en /ds
pnpm test             # contrato del tema y de las fuentes
pnpm build            # Turbopack
pnpm lint
pnpm conformance      # el contrato entero (o una seccion: style|tsx|react|structure|modularity|budgets)
pnpm gen:tokens       # regenera la lista de tokens del preview desde Carbon
./scripts/gates.sh    # compliance completo: los cuatro gates
```

## Cosas del stack que sorprenden

- **`proxy.ts`, no `middleware.ts`** — Next 16 lo renombro.
- **`.npmrc` hoistea `@carbon/*` y `@ibm/*`**: Sass no resuelve el arbol anidado de
  pnpm, y `@carbon/react` hace `@forward '@carbon/styles'`.
- **Plex entra por `next/font`, no por Carbon.** Su `$font-path` es `~@ibm/plex`: el
  prefijo tilde es de webpack, y aun quitandolo, `resolve-url-loader` reescribe el
  `url()` relativo al `.scss` de origen dentro de `node_modules` y lo rompe igual.
- **Los `postinstall` de `@carbon/*` y `@ibm/*` estan bloqueados a proposito** en
  `pnpm-workspace.yaml`: son telemetria de IBM.
- **`AGENTS.md` lo regenera `next dev`.** No editarlo a mano; las reglas del proyecto
  van en este archivo.
