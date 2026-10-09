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

/**
 * El fondo contra el que se pinta una cifra: la superficie base del sitio. No sale de
 * un literal porque el dia que la pagina deje de ser blanca, esta medida tiene que
 * moverse con ella.
 */
const PAGE_BACKGROUND =
  compileString(`@use '@carbon/react/scss/theme'; .bg { c: theme.$background; }`, {
    loadPaths: [STYLES, 'node_modules'],
    quietDeps: true,
  }).css.match(/#[0-9a-f]{3,6}/i) ?? ['#ffffff'];

/**
 * Las dos paradas del gradiente de una cifra, ya mezcladas.
 *
 * La mezcla se hace AQUI y no se lee del CSS a proposito: el mixin la emite como
 * `color-mix()`, que es una funcion del navegador y no un hex. Repetir la cuenta en
 * el test es lo unico que permite medirla antes de que exista un navegador.
 */
function numeralStops(tones: Tones): [string, string] {
  const mix = (a: string, b: string, p: number) =>
    '#' +
    [1, 3, 5]
      .map((i) => {
        const x = Number.parseInt(a.slice(i, i + 2), 16) * p + Number.parseInt(b.slice(i, i + 2), 16) * (1 - p);
        return Math.round(x).toString(16).padStart(2, '0');
      })
      .join('');

  return [tones.text, mix(tones.saturated, tones.text, NUMERAL_SATURATION)];
}

const NUMERAL_SATURATION =
  Number(
    compileString(`@use 'brand'; .n { c: brand.$numeral-saturation; }`, {
      loadPaths: [STYLES, 'node_modules'],
      quietDeps: true,
    }).css.match(/(\d+)%/)?.[1] ?? 0,
  ) / 100;

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

  /**
   * Una CIFRA en gradiente no es una tarjeta: no tiene fondo propio, se recorta contra
   * el de la pagina. Las paradas de la tarjeta no sirven —la saturada de lima da
   * 1.76:1 sobre blanco— y por eso el gradiente de la cifra va de la tinta de la
   * familia a su saturada rebajada con esa misma tinta.
   *
   * 3:1 y no 4.5:1 porque es texto grande: la cifra va en la escala de titular, muy
   * por encima de los 24px desde los que WCAG afloja el umbral. Lo que este test
   * impide es subir `$numeral-saturation` hasta que una familia deje de leerse — al
   * 70%, lima cae a 2.82:1.
   */
  it.each([...CANDY_CYCLE])('la cifra de %s se lee sobre el fondo de la pagina (3:1)', (name) => {
    const fondo = PAGE_BACKGROUND[0];

    for (const stop of numeralStops(FAMILIES[name])) {
      expect(contrast(stop, fondo), `${name} · ${stop}`).toBeGreaterThanOrEqual(3);
    }
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
