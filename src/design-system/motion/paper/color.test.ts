import { describe, expect, it } from 'vitest';
import { luminance, mixRgb, parseColor } from './color';

describe('paper token colors', () => {
  it('reads hex and rgb() token text, and rejects what it cannot read', () => {
    expect(parseColor(' #d6d6d5')).toEqual([214, 214, 213]);
    expect(parseColor('#fff')).toEqual([255, 255, 255]);
    expect(parseColor('rgb(30, 30, 30)')).toEqual([30, 30, 30]);
    expect(parseColor('var(--x)')).toBeNull();
  });

  it('interpolates channel by channel for the retint', () => {
    expect(mixRgb([0, 100, 200], [100, 100, 0], 0.5)).toEqual([50, 100, 100]);
  });

  it('tells a dark paper from a light one', () => {
    expect(luminance([30, 30, 30])).toBeLessThan(0.5);
    expect(luminance([214, 214, 213])).toBeGreaterThan(0.5);
  });
});
