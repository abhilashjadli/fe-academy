/** Chapter A4: AR(1) ("the forgetting machine"), autocorrelation, random walks, the Dickey–Fuller regression. */
import { normalSample } from "./random";
import { ols } from "./regression";

/** Simulate r_t = c + φ r_{t−1} + σ·noise, n steps from r0. */
export function ar1(n: number, phi: number, sigma: number, next: () => number, r0 = 0, c = 0): number[] {
  const out = [r0];
  for (let i = 1; i <= n; i++) out.push(c + phi * out[i - 1] + sigma * normalSample(next));
  return out;
}

/** Stationary mean and variance of r_t = c + φ r_{t−1} + σ·noise, for |φ| < 1. */
export function ar1Stationary(phi: number, sigma: number, c = 0): { mean: number; variance: number } | null {
  if (Math.abs(phi) >= 1) return null;
  return { mean: c / (1 - phi), variance: (sigma * sigma) / (1 - phi * phi) };
}

/** Theoretical ACF of an AR(1): φ^k. */
export function ar1Acf(phi: number, k: number): number[] {
  return Array.from({ length: k }, (_, i) => Math.pow(phi, i + 1));
}

/** Half-life of a shock in an AR(1): ln(½)/ln φ (0 < φ < 1). */
export function halfLife(phi: number): number {
  return Math.log(0.5) / Math.log(phi);
}

/** Sample autocorrelation at lags 1..k (same estimator as statsmodels acf, fft=False). */
export function sampleAcf(xs: number[], k: number): number[] {
  const n = xs.length;
  const m = xs.reduce((s, v) => s + v, 0) / n;
  let v = 0;
  for (let i = 0; i < n; i++) v += (xs[i] - m) ** 2;
  const out: number[] = [];
  for (let l = 1; l <= k; l++) {
    let c = 0;
    for (let i = l; i < n; i++) c += (xs[i] - m) * (xs[i - l] - m);
    out.push(c / v);
  }
  return out;
}

/**
 * Dickey–Fuller regression with a constant and no lags: Δy_t = a + γ y_{t−1} + e_t.
 * Returns γ (negative = a bowl; zero = a flat table) and its t-ratio. The t-ratio is NOT
 * compared with the usual ±2: under the random-walk null its 5 % critical value is about −2.86
 * (MacKinnon; the "critical values are special" footnote).
 */
export function dickeyFuller(y: number[]): { gamma: number; t: number; a: number; n: number } {
  const lag = y.slice(0, -1);
  const dy = y.slice(1).map((v, i) => v - y[i]);
  const f = ols(lag, dy);
  return { gamma: f.slope, t: f.slope / f.se, a: f.intercept, n: dy.length };
}

/** MacKinnon 5 % critical value for the DF test with a constant (large n). */
export const DF_CRIT_5 = -2.86;
export const DF_CRIT_1 = -3.43;
export const DF_CRIT_10 = -2.57;

/** Random-walk forecast at every horizon = the last value; AR(1) forecast decays toward the mean. */
export function forecastAr1(last: number, phi: number, c: number, h: number): number[] {
  const out: number[] = [];
  let v = last;
  for (let i = 0; i < h; i++) {
    v = c + phi * v;
    out.push(v);
  }
  return out;
}

/** First differences. */
export function diff(xs: number[]): number[] {
  return xs.slice(1).map((v, i) => v - xs[i]);
}

/** Expected number of zero-crossings is not what matters; the expected return time is: finite for |φ|<1, infinite at φ=1.
 *  Here: average first-passage time back to the mean from a start x0, by simulation (capped at maxT). */
export function meanReturnTime(phi: number, sigma: number, x0: number, next: () => number, trials = 200, maxT = 2000): number {
  let total = 0;
  for (let k = 0; k < trials; k++) {
    let x = x0,
      t = 0;
    const sign = Math.sign(x0);
    while (t < maxT && Math.sign(x) === sign && x !== 0) {
      x = phi * x + sigma * normalSample(next);
      t++;
    }
    total += t;
  }
  return total / trials;
}
