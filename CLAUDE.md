@AGENTS.md

# Pigmento Studio

Sitio del estudio. Next 16 (App Router, Turbopack) + React 19 + IBM Carbon v11 + Sass.

## La idea del design system

**Carbon es una plantilla de tokens por capas, y solo eso.** No autoramos primitivas
ni compilamos con Style Dictionary: Carbon ya aporta las tres capas — primitivas
(`@carbon/colors`, `@carbon/layout`, `@carbon/type`, `@carbon/motion`), 235 tokens
semanticos y 77 de componente. Encima va una capa de marca que se construye token a
token.

Lo que **no** es: nuestra libreria de componentes. Los atomos son de Pigmento. De
Carbon no entra ni una regla de CSS de sus componentes ni un solo import de su JS.

```
@carbon/*                     upstream, no se toca
  └─ _brand.scss              primitivas nuestras (acentos, radios, contenedores)
     └─ _theme.scss           delta semantico por grupo (dark / light)
        └─ index.scss         unico punto de emision
           └─ _component-tokens.scss   puente a la 3a capa para los atomos
```

### Emision delgada

`index.scss` **no hace `@use '@carbon/react'`**. Registra a mano los cinco grupos de
tokens de componente con `theme.add-component-tokens()` — la misma llamada que Carbon
hace dentro del modulo de cada componente, junto a su CSS — y asi se queda con la capa
entera sin arrastrar una sola regla suya.

Medido: **938kb raw / 96kb gzip → 129kb / 12kb**. Y el JS, **1226kb / 358kb → 611kb /
188kb**, porque importar `{ Theme } from '@carbon/react'` metia el barrel completo en
el bundle: aparecian `flatpickr`, `TreeView` y `MultiSelect` por pedir un componente
que concatena un string. `design-system/theme/zone.ts` lo sustituye por lo que era.

Los tokens de componente **solo existen como variable de Sass dentro de la unidad de
compilacion que llamo a `add-component-tokens()`**, y esa es `index.scss`. Cada
`.module.scss` es su propia unidad, asi que un atomo los pide por
`_component-tokens.scss`, que resuelve contra los mapas de Carbon: un nombre inventado
es error de compilacion, no una custom property huerfana que no pinta nada.

Dos familias dejaron de emitirse a proposito, `grid-*` y `layout-*`: no salen del mapa
de tema, las declaran sueltas las utilidades que viajan con el CSS de componentes. El
test las excluye por nombre y dice por que.

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

## El modelo atomico de componentes

**Los atomos son nuestros.** Ni uno de Carbon. Su lenguaje visual es de UI de producto
— esquina recta, retmica fija en rem, densidad de aplicacion — y el de Pigmento no. Un
atomo nuestro consume la tercera capa de la plantilla (`button-primary`,
`tag-background-gray`: los mismos nombres de token que usaria el suyo) y pone encima la
forma, el radio y el motion de la marca.

```
layout/       primitivas de COMPOSICION: ritmo vertical, ancho, zona de tema
atoms/        Button, Tag, Logo — sobre la 3a capa de tokens
molecules/    una pieza, un trabajo (NavToggle, NavLinkList, NavBanner)
organisms/    una seccion de pagina = UN bloque de Payload (SiteHeader, Hero)
templates     el renderer de bloques (cms/), cuando entre Payload
pages         App Router
```

La correspondencia **organismo ↔ bloque de Payload es la regla central**: cada bloque
que marketing pueda soltar en una pagina tiene exactamente un organismo que lo
renderiza. El modelo atomico aqui no es una convencion de carpetas, es el contrato
entre el CMS y el frontend — y por eso el grafo entre capas es una regla ejecutable
(`modularity-contract.json`), no un acuerdo verbal.

Carpeta por componente (`Section/Section.tsx` + `.module.scss` + `.test.tsx`), named
exports, y **sin barriles `index.ts`**: un barril arrastra capas enteras al bundle y
quien lo nota es `budgets`, tarde y sin nombrar la causa.

### Props serializables

Los componentes reciben datos planos: `string`, `number`, `boolean`, arrays y objetos
de esos. Es lo que sostiene a Payload — un organismo con props serializables se
alimenta 1:1 desde un bloque del CMS. En cuanto un `Hero` pide `children: ReactNode`,
el adaptador tiene que COMPONER en vez de MAPEAR y la equivalencia se rompe.

Quien conoce `payload-types` es el adaptador en `cms/`, nunca el DS: el contrato de
modularidad ya exige que el design system pueda salir de este repo entero.

La regla vigila **lo que alimenta el CMS**. Dos cosas quedan fuera y estan escritas
para que no se usen como rendija:

- **`layout/` recibe `children: ReactNode`.** Esa capa compone, no mapea contenido.
- **Un componente interactivo recibe callbacks** (`onToggle`, `onNavigate`). Payload
  no alimenta un manejador de eventos, asi que no hay nada que serializar. Lo que si
  sigue en pie es que el resto de sus props sean datos planos.

### Estilos: `*.module.scss`, y por defecto ninguno

Con CSS Modules la clase entra en el TSX como `styles.root` y no como literal `pg-`,
asi que la regla `globalClasses` no se dispara y `_app.scss` se queda en chrome de
pagina en vez de crecer hasta el tope de 800 lineas.

El default es **no** tener hoja: una molecula que compone Carbon ya viene estilada. El
archivo se crea cuando hay algo que decir, y entonces empieza por `carbon-config` como
cualquier otro entry (regla 2 — el gate de fuentes ya recorre `design-system/` entero).

### Section: el ritmo vertical es de la pagina, no del organismo

`layout/Section` pone el padding-block, el ancho de contenedor y la zona de tema. Los
organismos no llevan margenes externos ni deciden su tema: si lo hicieran, el hueco
entre dos bloques dependeria de cuales sean y no del orden que arme la pagina.

Sin `theme` no se envuelve en `<Theme>`, y no es un atajo: `<Theme>` es componente de
cliente (`usePrefix`) y anade SIEMPRE `cds--layer-one`, que reinicia la capa aunque no
haya cambio de tema.

Con `theme`, ademas, **publica `data-theme-section`**. Es el contrato con la cabecera,
que lo observa para adoptar el tema de la seccion que tiene debajo. Un atributo propio
y no las clases `.cds--*`: esas son de Carbon y pueden cambiar en cualquier minor, y
la cabecera no debe conocer ninguna seccion concreta.

### Nada de capas que cubren la ventana para devolver el puntero mas adentro

Un contenedor a pantalla completa con `pointer-events: none` que va re-habilitando el
puntero pieza a pieza convierte cada hijo nuevo en candidato a quedarse sin clics, y
el sintoma no se ve: el elemento esta ahi, se pinta y no responde.

`SiteHeader` ocupa lo que mide — la barra, y la barra mas el panel al abrirse. El unico
que cubre la ventana es el fondo oscuro, y con el panel cerrado esta en
`visibility: hidden`, que ya no recibe clics. Lo detecto el test del organismo, que no
pudo ni pulsar su propio boton.

### El patron de test de componente

Todo componente nuevo trae: **contrato publico** (las props producen el DOM accesible
que prometen, consultado por rol y nombre — nunca por clase), **accesibilidad**
(`jest-axe`, ya cableado en `src/test/setup.ts`) y **comportamiento** solo si es
interactivo.

Los que tienen `.module.scss` cierran ademas el circuito TS ↔ Sass: que cada clase que
el componente pone en el DOM exista de verdad en su hoja. Se cuenta ademas de
comprobar pertenencia, y esa es la parte que importa — si un mapa apunta a una clase
que el Sass no declara, `styles.x` es `undefined` y `join(' ')` lo convierte en cadena
vacia, no en la palabra "undefined": la clase no sale rota, sale ausente. Comprobar
solo pertenencia pasa verde. El hueco unicamente se ve contando.

Esto depende de `css.modules.classNameStrategy: 'non-scoped'` en `vitest.config.mts`:
sin procesar el CSS, Vitest devuelve un proxy que responde a cualquier clave y un
test no puede distinguir un mapa correcto de uno con un typo.

Y por encima de los tests de componente, `__tests__/module-contract.test.ts` lo
comprueba **estatico y para todos los modulos a la vez**, en los dos sentidos: que
toda clase que pide un TSX exista en su hoja, y que toda clase de la hoja la use
alguien. Es el gate que faltaba cuando `SiteHeader` referenciaba un `styles.isClosed`
que nunca llego a declararse — el estado cerrado del navbar estuvo sin su clase una
tarde entera de trabajo sobre ese mismo componente.

### Radios

La escala esta **calcada de OSMO**, que no tiene tokens pero si sistema: sus radios
van en dieciseisavos — 2/16, 3/16, 4/16, 6/16, 8/16, 12/16, 16/16, 24/16. Vive en
`_brand.scss` porque Carbon v11 no define ninguno: su lenguaje visual es de esquina
recta.

En **rem y no en em**, unica desviacion deliberada del original: el spacing de Carbon
es rem, y un radio que escala con la tipografia junto a un padding que no rompe la
concentricidad en cuanto alguien toca un `font-size`.

**Una pildora no es un escalon de la escala.** Es la leccion que costo una iteracion:
en OSMO las pildoras son de los CONTROLES — botones, tags — y las superficies llevan
un escalon; su propia barra de navegacion usa 4/16, el radio mas pequeno que tienen.
Un mismo valor grande aplicado a una caja baja y a una alta da dos formas que no se
parecen, y eso es exactamente lo que se lee como incoherente.

- `$radius-full` — cajas cuya altura decide su contenido y el CSS no conoce. El
  navegador recorta a la mitad del lado corto.
- `$radius-header` — pildora EXACTA de la barra, derivada de su alto. Un radio
  recortado no interpola: la transicion no se ve hasta que el valor declarado baja
  del recorte, y entonces salta.
La **concentricidad** — una caja dentro de otra lleva radio exterior menos la
separacion, como el `calc(0.125em - 2px)` del original — es la regla, pero todavia no
hay ninguna superficie anidada que la necesite. Cuando la haya es una linea; un helper
esperando por si acaso no.

Lo vigila `__tests__/radius-contract.test.ts`, sobre el CSS compilado y con los dos
gates verificados en rojo: **todo radio de un componente es un escalon de la escala**,
y **la pildora solo la usan los controles**. Un radio incoherente no rompe nada — no
hay error ni aviso, la pieza se pinta y lo unico que pasa es que el conjunto deja de
parecer del mismo sistema.

### Motion

**El navbar de OSMO no toca GSAP.** Se comprobo en su fuente: su coreografia es CSS
puro sobre atributos de estado, y GSAP se reserva para el motion de PAGINA — reveals,
cursor, slider, marquee. Copiar su navbar no necesita una dependencia; ese es el orden
correcto y no al reves.

**Las duraciones y la curva salen de `_brand.scss`, no de Carbon.** El registro de
Carbon es productivo: 70-700ms y cuatro curvas discretas, hechas para que un control
responda sin llamar la atencion. Un panel que se despliega en 240ms no se lee como un
gesto, se lee como un salto.

La escala es de RATIO sobre una base — cuarto, media, una, una y media, doble — y no
una lista de pasos con nombre, porque ese parentesco es lo que permite desfasar dos
gestos y que suenen juntos. Un desfase se escribe como MULTIPLOS de un paso
(`calc($duration-quarter * 3)`), no como sumas: sumando, el tercero deja de leerse como
el tercero y reafinar el ritmo obliga a recalcular cada suma a mano.

**Una sola curva en todo el sitio.** Tambien en los micro-gestos: un hover usa el
cuarto de la escala, no el registro productivo de Carbon. Dos curvas conviviendo son
dos sensaciones distintas, y eso se nota aunque no se sepa nombrar.

Lo vigilan tres gates, cada uno verificado en rojo:

- `__tests__/motion-contract.test.ts` — **reduced-motion obligatorio** en toda hoja que
  anime, comprobado sobre el CSS COMPILADO y exigiendo que el bloque ponga
  `transition`/`animation` a `none`. Un `@media` presente pero vacio pasaria una
  comprobacion de presencia sin apagar nada. Se apaga TODO, no se acorta: quien pide
  reduced-motion no esta pidiendo prisa.
- el mismo archivo — **toda duracion de un componente esta en la escala**, leyendo los
  tokens del propio Sass para que la lista no se desincronice cuando la marca sustituya
  los placeholders.
- `tsx-contract.json` → `motion-literal` y `gsap-import` — el mismo gate que en Sass,
  por la otra puerta. Sin ellos, un `gsap.to(el, { duration: 0.6, ease: 'power2.out' })`
  pasaba los cuatro gates sin despeinarse.

Unica exencion de reduced-motion, con el motivo escrito en el propio test:
`preview/preview.scss`, que ES la demo de los tokens de motion — apagarla dejaria un
cuadro quieto que no explica nada.

### Los deltas que traeran Payload y Resend

Ninguno esta puesto todavia; se anaden en el diff que traiga cada uno, a proposito:

- **`cms/` entra en `importableFrom` de `organisms/`** — hoy la lista es `app/`,
  `organisms/` y `preview/`, asi que el primer renderer de bloques falla el gate hasta
  que alguien declare la frontera.
- **`design-system/` no puede importar `cms/`** — se anade a su `mayNotImport`.
- **`payload-types.ts` a `exemptFiles` de longitud**, como `tokens.generated.ts`.
- **El admin de Payload** (`app/(payload)/`) es cliente entero pero es codigo generado:
  va a `exemptFiles`, no a `clientBoundary.allow`.
- **`budgets` habra que reescribirlo**: el CSS del admin cae en `.next/static` y
  reventaria el limite midiendo algo que ningun visitante del sitio descarga.
- **`emails/` no importa `design-system/`** — el HTML de correo no lee `var(--cds-*)`
  ni hojas externas. Los valores de marca llegan resueltos, generados aparte.

La frontera de cliente se declara **archivo a archivo** en `clientBoundary.allow`,
nunca un directorio en bloque: cada componente que se muda al navegador tiene que ser
una linea visible en el diff. Ayuda que `@carbon/react` ya trae `"use client"` en su
propio barrel — una molecula que solo compone Carbon se queda server component.

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
- `budgets` — peso del CSS **y del JS** que viajan al navegador.
- `modularity` — longitud (400 aviso, 800 tope) y grafo de imports: el DS no depende
  de `app/`, `preview/` solo lo importa `/ds`, `tokens.generated` solo `preview/`, y
  el modelo atomico va en un solo sentido — `layout/` no conoce a nadie, `atoms/` no
  sube a `molecules/`, `molecules/` no sube a `organisms/`, y un organismo solo lo
  monta una ruta.

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
