/**
 * Contrato del gradiente candy: compila las familias REALES de _brand.scss y afirma
 * sobre sus colores.
 *
 * Un texto que no se lee sobre su fondo no rompe nada: la tarjeta se pinta igual. Lo
 * que se vigila es que el primer plano de cada familia aguante en las TRES paradas
 * —el texto cruza el gradiente entero en cuanto la tarjeta tiene dos lineas— y que
 * cada nombre que TS reparte exista en la hoja.
 */
import { join } from 'node:path';
import { compileString } from 'sass';
import { describe, expect, it } from 'vitest';
import { CANDY_CYCLE } from '../../theme/candy';

const STYLES = join(process.cwd(), 'src/design-system/styles');

const css = compileString(
  `@use 'sass:map'; @use 'brand';
   @each $name, $tones in brand.$candy-families {
     .#{$name} { light: map.get($tones, light); mid: map.get($tones, mid); saturated: map.get($tones, saturated); text: map.get($tones, text); }
   }`,
  { loadPaths: [STYLES, 'node_modules'], quietDeps: true, style: 'compressed' },
).css;

/**
 * La placa del control, compilada de verdad: el mismo patron del candy en gris.
 *
 * Se lee del CSS y no de los tokens porque lo que hay que vigilar es lo que queda
 * DESPUES del mixin — las tres paradas tal y como el navegador las va a pintar.
 */
const PLATE = compileString(`@use 'candy'; .plate { @include candy.control; }`, {
  loadPaths: [STYLES, 'node_modules'],
  quietDeps: true,
}).css;

const PLATE_STOPS = [...PLATE.matchAll(/#[0-9a-f]{6}/gi)].map(([hex]) => hex);

const PLATE_INK =
  compileString(`@use 'brand'; .ink { c: brand.$text-on-control-ink; }`, {
    loadPaths: [STYLES, 'node_modules'],
    quietDeps: true,
  }).css.match(/#[0-9a-f]{3,6}/i)?.[0] ?? '';

type Tones = Record<'light' | 'mid' | 'saturated' | 'text', string>;

const FAMILIES: Record<string, Tones> = Object.fromEntries(
  [...css.matchAll(/\.([a-z-]+)\{([^}]*)\}/g)].map(([, name, body]) => [
    name,
    Object.fromEntries(body.split(';').map((decl) => decl.split(':'))) as Tones,
  ]),
);

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe('contrato candy', () => {
  it('lee las siete familias: si no, el contrato no mediria nada', () => {
    expect(Object.keys(FAMILIES)).toHaveLength(7);
  });

  it.each([...CANDY_CYCLE])('%s existe en la hoja', (name) => {
    expect(FAMILIES[name]).toBeDefined();
  });

  it.each([...CANDY_CYCLE])('%s aguanta texto normal (4.5:1) en las tres paradas', (name) => {
    const { light, mid, saturated, text } = FAMILIES[name];

    for (const stop of [light, mid, saturated]) expect(contrast(text, stop)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(Object.keys(FAMILIES))('%s aguanta al menos texto grande (3:1) en las tres paradas', (name) => {
    const { light, mid, saturated, text } = FAMILIES[name];

    for (const stop of [light, mid, saturated]) expect(contrast(text, stop)).toBeGreaterThanOrEqual(3);
  });

  it('la placa del control repite el patron: tres paradas y el angulo de la casa', () => {
    expect(PLATE_STOPS).toHaveLength(3);
    expect(PLATE).toContain('150deg');
  });

  /**
   * La placa es gris y su etiqueta blanca, asi que el contraste no depende de ninguna
   * familia — pero SI de las tres paradas, porque el texto cruza el gradiente entero
   * igual que en una tarjeta.
   *
   * El fallo que vigila: aclarar la parada de arriba para que el gradiente "se note
   * mas". A partir de gray-50 el blanco ya no llega a 4.5:1, y el sintoma seria una
   * etiqueta que se lee peor solo en un extremo del boton — lo mas facil de pasar por
   * alto revisando a ojo, porque el otro extremo sigue impecable.
   */
  it.each([0, 1, 2])('la etiqueta de la placa aguanta texto normal en la parada %i', (index) => {
    expect(contrast(PLATE_INK, PLATE_STOPS[index])).toBeGreaterThanOrEqual(4.5);
  });
});
