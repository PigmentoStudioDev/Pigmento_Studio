# Pigmento Studio

Redesign and rebuild of **[pigmentostudio.com.mx](https://pigmentostudio.com.mx/)**.

Pigmento Studio is a brand design and growth studio based in Santa Fe, Mexico City.
It works across branding, digital marketing, web development and motion graphics, and
describes itself as «más que una agencia, un estudio de diseño y crecimiento de marca».

This repository is the new site, built from scratch. The site itself ships in Spanish;
this documentation is in English.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) · React 19 |
| Design system | IBM Carbon v11 with a thin brand layer on top |
| Styling | Sass |
| Testing | Vitest · Testing Library · jest-axe |

**Carbon is the token pipeline.** We author no primitives of our own: Carbon already
ships all three layers — primitives, 235 semantic tokens and 76 component tokens — and
the brand layer on top is built one token at a time. Today's brand values are
placeholders, flagged with `TODO(brand)`.

No Tailwind: Carbon is already the token system, and layering Tailwind on top would
create a second source of truth for spacing and color.

## Getting started

```bash
pnpm install
pnpm dev          # localhost:3000
```

The design system preview lives at **`/ds`**: a token explorer that reads the semantic
tokens from the live element, foundations (type scale, spacing, motion) and a component
gallery. It is a development tool, not a page of the site.

## Verifying

```bash
./scripts/gates.sh   # build · static · contract · tests
```

One entrypoint, the same one CI runs. The four gates are described in
[`CLAUDE.md`](./CLAUDE.md); the executable contract, in
[`conformance/README.md`](./conformance/README.md).

Individually:

```bash
pnpm lint
pnpm test              # theme contract, asserted against the real compiled Sass
pnpm conformance       # or: pnpm conformance <style|tsx|react|structure|modularity|budgets>
pnpm build
pnpm gen:tokens        # regenerate the preview's token list from Carbon
```

## Contributing

`main` is protected: everything lands through a pull request with the `ci` check
green, linear history and no force pushes.

Before touching Sass or the theme, read the hard rules in [`CLAUDE.md`](./CLAUDE.md).
Each one exists because its failure already happened, and none of them produced a
build error.

> Project docs are written in English; `CLAUDE.md`, `CHANGELOG.md` and code comments
> are in Spanish, and the site's user-facing copy is Spanish.
