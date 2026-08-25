// Genera src/design-system/preview/tokens.generated.ts leyendo los mapas de Sass
// de Carbon. Existe para que la pagina de preview no tenga una lista de nombres
// escrita a mano que se quede desfasada en el siguiente upgrade de Carbon.
//
// Ejecutar tras subir @carbon/react:  node scripts/generate-preview-tokens.mjs

import { writeFileSync } from "node:fs";
import { compileString } from "sass";

const PROBE = `
@use 'sass:map';
@use '@carbon/type';
@use '@carbon/layout';
@use '@carbon/motion';

@each $name, $token in type.$tokens {
  .type-#{$name} { --x: 0; }
}
@each $name, $value in layout.$spacing {
  .spacing-#{$name} { --v: #{$value}; }
}
// @carbon/motion no expone un mapa de duraciones, solo variables sueltas:
// esta lista es la unica parte que hay que tocar a mano si Carbon anade una.
$durations: (
  'fast-01': motion.$duration-fast-01,
  'fast-02': motion.$duration-fast-02,
  'moderate-01': motion.$duration-moderate-01,
  'moderate-02': motion.$duration-moderate-02,
  'slow-01': motion.$duration-slow-01,
  'slow-02': motion.$duration-slow-02,
);
@each $name, $value in $durations {
  .motion-#{$name} { --v: #{$value}; }
}
`;

const { css } = compileString(PROBE, {
  loadPaths: ["node_modules"],
  quietDeps: true,
});

const collect = (prefix) =>
  [...css.matchAll(new RegExp(`\\.${prefix}-([a-z0-9-]+)\\s*\\{[^}]*--v:\\s*([^;}]+)`, "g"))].map(
    ([, name, value]) => ({ name, value: value.trim() }),
  );

const typeStyles = [...css.matchAll(/\.type-([a-z0-9-]+)\s*\{/g)].map(([, name]) => name);
const spacing = collect("spacing");
const motion = collect("motion");

const file = `// GENERADO por scripts/generate-preview-tokens.mjs — no editar a mano.
// Fuente de verdad: los mapas de Sass de @carbon/type, @carbon/layout y @carbon/motion.

export const TYPE_STYLES = ${JSON.stringify(typeStyles, null, 2)} as const;

export const SPACING_STEPS = ${JSON.stringify(spacing, null, 2)} as const;

export const MOTION_TOKENS = ${JSON.stringify(
  motion.map(({ name, value }) => ({ name, duration: value })),
  null,
  2,
)} as const;
`;

writeFileSync("src/design-system/preview/tokens.generated.ts", file);
console.log(
  `type=${typeStyles.length} spacing=${spacing.length} motion=${motion.length}`,
);
