export type Rgb = readonly [number, number, number];

/** Lo que devuelve getPropertyValue de un token: el texto tal cual se escribio, hex o rgb(). */
export function parseColor(value: string): Rgb | null {
  const text = value.trim();
  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    const channel = (i: number) => parseInt(digits.slice(i, i + 2), 16);
    return [channel(0), channel(2), channel(4)];
  }
  const rgb = text.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
}

export function mixRgb(from: Rgb, to: Rgb, t: number): Rgb {
  const lerp = (i: 0 | 1 | 2) => from[i] + (to[i] - from[i]) * t;
  return [lerp(0), lerp(1), lerp(2)];
}

/** Luminancia relativa aproximada: decide los pesos de grano por modo sin leer el modo. */
export function luminance([r, g, b]: Rgb): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
