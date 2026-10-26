import { describe, expect, it } from 'vitest';
import { judgeFrames } from './governor';

const repeat = (frameMs: number, count: number) => Array.from({ length: count }, () => frameMs);

describe('GL performance governor', () => {
  it('keeps the GL on a machine that holds 60 or 120 Hz', () => {
    expect(judgeFrames(repeat(16.7, 600))).toBe('keep');
    expect(judgeFrames(repeat(8.3, 1200))).toBe('keep');
  });

  it('retreats after eight frames in a row over 100 ms, but not seven', () => {
    expect(judgeFrames([...repeat(16.7, 30), ...repeat(120, 8)])).toBe('retreat');
    // Dos rachas de 7 cortadas por un frame sano, en menos de la ventana minima.
    expect(judgeFrames([...repeat(120, 7), 16.7, ...repeat(120, 7)])).toBe('keep');
  });

  it('retreats when over a quarter of the frames in the window pass 32 ms', () => {
    // 1 de cada 3 frames lento: 33 % durante mas de 2 s.
    const stutter = Array.from({ length: 120 }, (_, i) => (i % 3 === 0 ? 40 : 16.7));
    expect(judgeFrames(stutter)).toBe('retreat');
  });

  it('does not judge the share before the window reaches its minimum', () => {
    // Un arranque con frames lentos (subida de texturas) dura menos de 2 s.
    expect(judgeFrames([...repeat(40, 20), ...repeat(16.7, 300)])).toBe('keep');
  });

  it('forgets an old stutter once the window resets', () => {
    // 20 % lento en los primeros 5 s, luego limpio: nunca cruza el 25 %.
    const mild = Array.from({ length: 250 }, (_, i) => (i % 5 === 0 ? 40 : 16.7));
    expect(judgeFrames([...mild, ...repeat(16.7, 600)])).toBe('keep');
  });
});
