import { DARK_STOCK, PAPER_WEIGHTS } from './constants';

export type PaperWeights = { readonly [K in keyof typeof PAPER_WEIGHTS]: number } & { readonly strength: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** darkness 0 es papel claro y 1 oscuro; valores intermedios solo durante el retint. */
export function resolveWeights(darkness: number): PaperWeights {
  const w = PAPER_WEIGHTS;
  const lines = lerp(1, DARK_STOCK.lines, darkness);
  return {
    ...w,
    strength: lerp(1, DARK_STOCK.strength, darkness),
    tooth: w.tooth * lerp(1, DARK_STOCK.tooth, darkness),
    felt: w.felt * lerp(1, DARK_STOCK.felt, darkness),
    crumple: w.crumple * lerp(1, DARK_STOCK.crumple, darkness),
    halftone: w.halftone * lerp(1, DARK_STOCK.halftone, darkness),
    streak1: w.streak1 * lines,
    streak2: w.streak2 * lines,
    crease: w.crease * lines,
  };
}
