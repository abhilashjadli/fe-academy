/**
 * The smile for chapter D2: a quadratic fit of implied vols in log-moneyness, butterflies as probabilities
 * (Breeden–Litzenberger, Hull App. 15A), tail probabilities from puts, and the daily-move record's tail counts.
 * Tested against tests/answer-key/key_D2.py.
 */
import { black76, type Kind } from "./bs";
import { cdf as ncdf } from "./normal";

export interface SmileFit {
  a: number;
  b: number;
  c: number;
  rmsVolPts: number;
}

/** Least-squares σ(k) = a + b k + c k², k = ln(K/F), over every (strike, vol) pair given. */
export function fitSmile(F: number, strikes: number[], vols: number[]): SmileFit {
  // normal equations for a 3-parameter fit
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, t0 = 0, t1 = 0, t2 = 0;
  for (let i = 0; i < strikes.length; i++) {
    const k = Math.log(strikes[i] / F);
    const y = vols[i];
    s0 += 1; s1 += k; s2 += k * k; s3 += k * k * k; s4 += k * k * k * k;
    t0 += y; t1 += k * y; t2 += k * k * y;
  }
  // solve [[s0,s1,s2],[s1,s2,s3],[s2,s3,s4]] · [a,b,c] = [t0,t1,t2] by Cramer's rule
  const det = s0 * (s2 * s4 - s3 * s3) - s1 * (s1 * s4 - s3 * s2) + s2 * (s1 * s3 - s2 * s2);
  const a = (t0 * (s2 * s4 - s3 * s3) - s1 * (t1 * s4 - s3 * t2) + s2 * (t1 * s3 - s2 * t2)) / det;
  const b = (s0 * (t1 * s4 - s3 * t2) - t0 * (s1 * s4 - s3 * s2) + s2 * (s1 * t2 - t1 * s2)) / det;
  const c = (s0 * (s2 * t2 - t1 * s3) - s1 * (s1 * t2 - t1 * s2) + t0 * (s1 * s3 - s2 * s2)) / det;
  let ss = 0;
  for (let i = 0; i < strikes.length; i++) {
    const k = Math.log(strikes[i] / F);
    const e = a + b * k + c * k * k - vols[i];
    ss += e * e;
  }
  return { a, b, c, rmsVolPts: 100 * Math.sqrt(ss / strikes.length) };
}

export function smileVol(fit: SmileFit, F: number, K: number): number {
  const k = Math.log(K / F);
  return fit.a + fit.b * k + fit.c * k * k;
}

/** Price from the fitted smile (or from one flat vol when `flat` is given). */
export function smilePrice(fit: SmileFit, p: { F: number; K: number; r: number; T: number }, kind: Kind = "call", flat?: number): number {
  return black76({ ...p, sigma: flat ?? smileVol(fit, p.F, p.K) }, kind);
}

/** The raw butterfly on three screen prices: C(K−h) − 2C(K) + C(K+h). */
export function butterfly(cLo: number, cMid: number, cHi: number): number {
  return cLo - 2 * cMid + cHi;
}

/** Probability of landing within ±h/2 of K, from a butterfly's cost (Breeden–Litzenberger, scaled to a tent of height h). */
export function tentProbability(fly: number, h: number, r: number, T: number): number {
  return (fly / h) * Math.exp(r * T);
}

/** Density per point at K from the smoothed smile (or a flat vol), by the second difference with step h. */
export function density(fit: SmileFit, p: { F: number; K: number; r: number; T: number }, h = 5, flat?: number): number {
  const f = (K: number) => smilePrice(fit, { ...p, K }, "call", flat);
  return ((f(p.K - h) - 2 * f(p.K) + f(p.K + h)) / (h * h)) * Math.exp(p.r * p.T);
}

/** P(S_T < K) from the slope of the put curve. */
export function tailBelow(fit: SmileFit, p: { F: number; K: number; r: number; T: number }, h = 5, flat?: number): number {
  const f = (K: number) => smilePrice(fit, { ...p, K }, "put", flat);
  return ((f(p.K + h) - f(p.K - h)) / (2 * h)) * Math.exp(p.r * p.T);
}

/** Counts of daily moves beyond z standard deviations, against what a bell curve of the same sd expects. */
export function tailCounts(returns: number[], z: number): { down: number; up: number; bellEach: number; sd: number; mean: number } {
  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(returns.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (n - 1));
  let down = 0, up = 0;
  for (const x of returns) {
    if (x < mean - z * sd) down++;
    else if (x > mean + z * sd) up++;
  }
  return { down, up, bellEach: n * (1 - ncdf(z)), sd, mean };
}

/** Forward variance between two expiries at fixed moneyness: variances add, not vols. */
export function forwardVol(sigma1: number, T1: number, sigma2: number, T2: number): number {
  return Math.sqrt((sigma2 * sigma2 * T2 - sigma1 * sigma1 * T1) / (T2 - T1));
}

/** Bilinear interpolation on a vol grid (Hull Table 15.2's "between four numbers"). */
export function interpolateSurface(strikes: number[], Ts: number[], vols: number[][], K: number, T: number): number {
  const ix = (arr: number[], v: number) => Math.max(0, Math.min(arr.length - 2, arr.findIndex((_, i) => i < arr.length - 1 && v <= arr[i + 1])));
  const i = ix(Ts, T), j = ix(strikes, K);
  const u = (T - Ts[i]) / (Ts[i + 1] - Ts[i]);
  const w = (K - strikes[j]) / (strikes[j + 1] - strikes[j]);
  return (1 - u) * ((1 - w) * vols[i][j] + w * vols[i][j + 1]) + u * ((1 - w) * vols[i + 1][j] + w * vols[i + 1][j + 1]);
}
