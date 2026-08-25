# Conformance — el contrato ejecutable del design system

Las reglas del sistema vivian como prosa en `CLAUDE.md`: un agente podia ignorarlas
sin que nada fallara. Este directorio las convierte en **datos** que
`scripts/conformance.mjs` ejecuta.

```bash
pnpm conformance             # todo el contrato
pnpm conformance style       # una seccion: style | tsx | structure | budgets
```

## Diseno

**1. El contrato es data, el runner es tonto.** Cambiar una ley es editar un JSON de
aqui — revisable en diff — y no tocar codigo. Un agente que necesite relajar una regla
tiene que tocar este directorio explicitamente, y eso se ve en el review; un literal
enterrado en un `.scss` no se ve.

**2. Baseline en cero.** ATOMUIKIT usa un ratchet porque arrastraba deuda anterior al
contrato. Aqui el proyecto nacio con el contrato, asi que no hay nada que perdonar:
cualquier violacion es nueva. El mecanismo de `baseline` existe igualmente, y anadir
una entrada es una decision consciente, no un efecto colateral.

**3. Agnostico de marca.** Las reglas verifican ESTRUCTURA — que todo cuelgue de
tokens, que cada entry cargue su configuracion, que las clases esten donde el sistema
asume. Los VALORES de marca viven en `src/design-system/styles/`. Sustituir la
identidad no toca este directorio.

## Archivos

| Archivo | Contrato |
|---|---|
| `style-contract.json` | Sass propio: cero literales de color, cero `!important`, `font-family` solo por `var()`, espaciado desde los tokens de Carbon, cero motion inventado |
| `tsx-contract.json` | Markup: sin `style={{}}` con literales, sin clases `cds--` escritas a mano |
| `structure-contract.json` | Cada entry de Sass carga `_carbon-config`; las clases usadas fuera de `preview/` estan en la hoja global |
| `budgets.json` | Peso de lo que viaja al navegador. Mide sobre `.next/`, asi que el build va antes |

## Prueba de aceptacion

Un gate que no falla con un bug conocido no es un gate. Los diez se verificaron
inyectando su violacion:

| Gate | Violacion inyectada | Resultado |
|---|---|---|
| `color-literal` | `color: #ff0000` | detectado |
| `important` | `display: none !important` | detectado |
| `spacing-literal` | `padding: 12px` | detectado |
| `font-family-literal` | `font-family: Helvetica` | detectado |
| `duration-literal` | `transition: opacity 300ms` | detectado |
| `easing-literal` | `cubic-bezier(...)` | detectado |
| `inline-style-literal` | `style={{ color: "#fff" }}` | detectado |
| `handwritten-cds-class` | `className="cds--btn"` | detectado |
| `globalClasses` | clase `pg-` usada fuera de `preview/` sin definir | detectado |
| `sassConfigPartial` | entry sin `@use 'carbon-config'` | detectado |
| `budgets` | limite bajado por debajo del peso real | detectado |

## Que NO cubre

El contrato son regex sobre texto: no entiende AST. `rules-of-hooks`,
`exhaustive-deps`, `jsx-key` y las reglas de `core-web-vitals` las cubre **ESLint**, y
por eso el workflow corre ambos. La semantica del tema — que los 76 tokens de
componente no se desvien, que la marca no tenga efectos colaterales — la cubren los
**tests de Vitest**, que compilan el Sass real y afirman sobre el CSS resultante.

Tres capas, tres cosas distintas. Ninguna sustituye a las otras.
