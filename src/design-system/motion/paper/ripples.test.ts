import { describe, expect, it } from 'vitest';
import { RIPPLE } from './constants';
import { addRipple, packRipples, pruneRipples, rippleFrame, type Ripple } from './ripples';

const viewport = { width: 1000, height: 500 };

function clicks(times: number[]): readonly Ripple[] {
  return times.reduce<readonly Ripple[]>((list, t) => addRipple(list, 100, 100, t, viewport), []);
}

describe('paper ripple queue', () => {
  it('drops a click that lands inside the gap after the previous ring', () => {
    expect(clicks([0, 100])).toHaveLength(1);
    expect(clicks([0, 150])).toHaveLength(2);
  });

  it('never holds more rings than uniform slots, and fades the oldest instead of cutting it', () => {
    const list = clicks([0, 200, 400, 600, 800, 1000]);
    expect(list).toHaveLength(RIPPLE.slots);
    expect(list[0].dieAt).toBe(1000);
    expect(list.slice(1).every((r) => r.dieAt === null)).toBe(true);

    const more = addRipple(list, 1, 1, 1200, viewport);
    expect(more).toHaveLength(RIPPLE.slots);
    expect(more[more.length - 1].t0).toBe(1200);
  });

  it('reaches past the farthest corner so the ring leaves the screen', () => {
    const [ring] = clicks([0]);
    expect(ring.rMax).toBeGreaterThan(Math.hypot(900, 400));
    expect(rippleFrame(ring, RIPPLE.durationMs).radius).toBeCloseTo(ring.rMax);
  });

  it('holds full alpha until the tail, then fades to zero and is pruned', () => {
    const [ring] = clicks([0]);
    expect(rippleFrame(ring, RIPPLE.durationMs * 0.5).alpha).toBe(RIPPLE.alpha);
    expect(rippleFrame(ring, RIPPLE.durationMs * 0.85).alpha).toBeCloseTo(RIPPLE.alpha * 0.75);
    expect(pruneRipples([ring], RIPPLE.durationMs)).toHaveLength(0);
  });

  it('packs one vec4 per slot, zeros for empty ones', () => {
    const packed = packRipples(clicks([0]), 0);
    expect(packed).toHaveLength(RIPPLE.slots * 4);
    expect(Array.from(packed.slice(0, 3))).toEqual([100, 100, 0]);
    expect(packed[3]).toBeCloseTo(RIPPLE.alpha);
    expect(packed[7]).toBe(0);
  });
});
