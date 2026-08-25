# Pigmento Studio

Rediseño y reconstrucción de **[pigmentostudio.com.mx](https://pigmentostudio.com.mx/)**.

Pigmento Studio es un estudio de diseño y crecimiento de marca en Santa Fe, Ciudad de
México. Trabaja branding, marketing digital, programación web y motion graphics, y se
define como «más que una agencia, un estudio de diseño y crecimiento de marca».

Este repositorio es el sitio nuevo, construido desde cero.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) · React 19 |
| Design system | IBM Carbon v11 con una capa de marca propia encima |
| Estilos | Sass |
| Tests | Vitest · Testing Library · jest-axe |

**Carbon es el pipeline de tokens.** No autoramos primitivas: Carbon ya aporta las
tres capas — primitivas, 235 tokens semánticos y 76 de componente — y encima va una
capa de marca fina que se construye token a token. Los valores de marca de hoy son
placeholders marcados con `TODO(brand)`.

Sin Tailwind: Carbon ya es el sistema de tokens y superponerlo crearía una segunda
fuente de verdad para spacing y color.

## Empezar

```bash
pnpm install
pnpm dev          # localhost:3000
```

El preview del design system vive en **`/ds`**: explorador de tokens semánticos leídos
en runtime, fundamentos (tipografía, espaciado, motion) y galería de componentes. Es
herramienta de desarrollo, no una página del sitio.

## Verificar

```bash
./scripts/gates.sh   # build · estático · contrato · tests
```

Un solo entrypoint, el mismo que corre en CI. Los cuatro gates están descritos en
[`CLAUDE.md`](./CLAUDE.md); el contrato ejecutable, en
[`conformance/README.md`](./conformance/README.md).

Por separado:

```bash
pnpm lint
pnpm test              # contrato del tema, sobre el Sass real
pnpm conformance       # o: pnpm conformance <style|tsx|react|structure|modularity|budgets>
pnpm build
pnpm gen:tokens        # regenera la lista de tokens del preview desde Carbon
```

## Contribuir

`main` está protegida: todo entra por pull request con el check `ci` en verde,
historia lineal y sin force push.

Antes de tocar Sass o el tema, lee las reglas duras de [`CLAUDE.md`](./CLAUDE.md).
Cada una existe porque su fallo ya ocurrió y ninguno produjo error de build.
