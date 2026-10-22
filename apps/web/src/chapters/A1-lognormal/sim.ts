import { rng } from "../../engine/random";

export const DAYS = 250;

export interface Savers {
  /** ada[p][d], mel[p][d] balances for path p at day d (d = 0..DAYS) */
  ada: Float32Array[];
  mel: Float32Array[];
}

/** Two savers: Ada ±step (amount), Mel ±step% (proportion), same coin flips. */
export function simulateSavers(paths: number, step = 1, seed = 2024, start = 100): Savers {
  const r = rng(seed);
  const ada: Float32Array[] = [];
  const mel: Float32Array[] = [];
  for (let p = 0; p < paths; p++) {
    const a = new Float32Array(DAYS + 1);
    const m = new Float32Array(DAYS + 1);
    a[0] = start;
    m[0] = start;
    for (let d = 1; d <= DAYS; d++) {
      const up = r() < 0.5;
      a[d] = a[d - 1] + (up ? step : -step);
      m[d] = m[d - 1] * (up ? 1 + step / 100 : 1 - step / 100);
    }
    ada.push(a);
    mel.push(m);
  }
  return { ada, mel };
}

/** End-of-year balances only (many paths, cheap). */
export function endBalances(paths: number, stepPct: number, seed = 77, start = 100, days = DAYS): { ada: Float64Array; mel: Float64Array } {
  const r = rng(seed);
  const ada = new Float64Array(paths);
  const mel = new Float64Array(paths);
  for (let p = 0; p < paths; p++) {
    let a = start,
      m = start;
    for (let d = 0; d < days; d++) {
      const up = r() < 0.5;
      a += up ? stepPct : -stepPct;
      m *= up ? 1 + stepPct / 100 : 1 - stepPct / 100;
    }
    ada[p] = a;
    mel[p] = m;
  }
  return { ada, mel };
}

/** Histogram of values into equal-width bins; returns bin centres and densities. */
export function histogram(xs: ArrayLike<number>, lo: number, hi: number, bins: number) {
  const w = (hi - lo) / bins;
  const counts = new Array(bins).fill(0);
  let n = 0;
  for (let i = 0; i < xs.length; i++) {
    const b = Math.floor((xs[i] - lo) / w);
    if (b >= 0 && b < bins) {
      counts[b]++;
      n++;
    }
  }
  return counts.map((c, i) => ({ lo: lo + i * w, hi: lo + (i + 1) * w, x: lo + (i + 0.5) * w, w, density: n ? c / xs.length / w : 0, count: c }));
}
