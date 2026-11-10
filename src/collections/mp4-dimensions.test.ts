import { describe, expect, it } from 'vitest';
import { mp4Dimensions } from './mp4-dimensions';

const box = (type: string, payload: Uint8Array) => {
  const out = new Uint8Array(8 + payload.length);
  new DataView(out.buffer).setUint32(0, out.length);
  out.set([...type].map((c) => c.charCodeAt(0)), 4);
  out.set(payload, 8);
  return out;
};

/** Un tkhd version 0 con la medida en 16.16 donde la pone el formato. */
const tkhd = (width: number, height: number) => {
  const payload = new Uint8Array(84);
  const view = new DataView(payload.buffer);
  view.setUint32(76, width << 16);
  view.setUint32(80, height << 16);
  return box('tkhd', payload);
};

const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  parts.reduce((at, p) => (out.set(p, at), at + p.length), 0);
  return out;
};

describe('mp4Dimensions', () => {
  /** La pista de audio va primero y mide 0x0: tomarla dejaria el video sin medidas. */
  it('lee la pista de video y salta la de audio', () => {
    const file = concat(
      box('ftyp', new Uint8Array(8)),
      box('moov', concat(box('trak', tkhd(0, 0)), box('trak', tkhd(1080, 1920)))),
    );
    expect(mp4Dimensions(file)).toEqual({ width: 1080, height: 1920 });
  });

  it('devuelve null si la cabecera no esta en los bytes', () => {
    expect(mp4Dimensions(box('mdat', new Uint8Array(32)))).toBeNull();
  });
});
