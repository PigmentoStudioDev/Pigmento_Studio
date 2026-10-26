import { GOVERNOR } from './constants';

export interface GovernorState {
  streak: number;
  windowMs: number;
  windowFrames: number;
  slowFrames: number;
}

export type GovernorVerdict = 'keep' | 'retreat';

export const INITIAL_GOVERNOR: GovernorState = { streak: 0, windowMs: 0, windowFrames: 0, slowFrames: 0 };

/**
 * Un paso del gobernador por cada frame dibujado. Dos senales distintas: la racha
 * detecta un equipo que se congela (pocos frames, todos enormes) y la proporcion uno
 * que tartamudea sin congelarse nunca. La ventana se reinicia en vez de deslizarse:
 * basta con un juicio cada pocos segundos y asi el estado es de tamano fijo.
 */
export function stepGovernor(state: GovernorState, frameMs: number): { state: GovernorState; verdict: GovernorVerdict } {
  const streak = frameMs > GOVERNOR.longFrameMs ? state.streak + 1 : 0;
  if (streak >= GOVERNOR.longFrameStreak) return { state: { ...state, streak }, verdict: 'retreat' };

  const windowMs = state.windowMs + frameMs;
  const windowFrames = state.windowFrames + 1;
  const slowFrames = state.slowFrames + (frameMs > GOVERNOR.slowFrameMs ? 1 : 0);

  if (windowMs >= GOVERNOR.minWindowMs && slowFrames / windowFrames > GOVERNOR.slowFrameShare) {
    return { state: { streak, windowMs, windowFrames, slowFrames }, verdict: 'retreat' };
  }
  if (windowMs >= GOVERNOR.maxWindowMs) {
    return { state: { ...INITIAL_GOVERNOR, streak }, verdict: 'keep' };
  }
  return { state: { streak, windowMs, windowFrames, slowFrames }, verdict: 'keep' };
}

/** La serie entera de una vez: es lo que prueban los tests y lo que sirve para depurar. */
export function judgeFrames(frames: readonly number[]): GovernorVerdict {
  let state = INITIAL_GOVERNOR;
  for (const frameMs of frames) {
    const step = stepGovernor(state, frameMs);
    if (step.verdict === 'retreat') return 'retreat';
    state = step.state;
  }
  return 'keep';
}
