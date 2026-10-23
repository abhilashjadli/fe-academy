/** Chapter B4 (and B3): Brownian paths, quadratic variation, the telescoping identity, GBM moments. */
import { normalSample } from "./random";

/** A Brownian path on [0, T] with n steps: returns t[] and W[] (W[0] = 0). */
export function brownianPath(n: number, T: number, next: () => number): { t: number[]; W: number[] } {
  const dt = T / n,
    s = Math.sqrt(dt);
  const t = [0],
    W = [0];
  for (let i = 1; i <= n; i++) {
    t.push(i * dt);
    W.push(W[i - 1] + s * normalSample(next));
  }
  return { t, W };
}

/** Coin-flip path: each step ±√dt. Same totals as the normal path in expectation; a coin is a thing. */
export function coinPath(n: number, T: number, next: () => number): { t: number[]; W: number[] } {
  const dt = T / n,
    s = Math.sqrt(dt);
  const t = [0],
    W = [0];
  for (let i = 1; i <= n; i++) {
    t.push(i * dt);
    W.push(W[i - 1] + (next() < 0.5 ? -s : s));
  }
  return { t, W };
}

/** Sums over the increments of a path: Σ dW (net move), Σ dW², Σ dt², Σ dt·|dW| — the tiles of Figure 3. */
export function incrementSums(W: number[], T: number): { sumDW: number; sumDW2: number; sumDt2: number; sumDtDW: number; n: number } {
  const n = W.length - 1,
    dt = T / n;
  let sumDW = 0,
    sumDW2 = 0,
    sumDtDW = 0;
  for (let i = 0; i < n; i++) {
    const d = W[i + 1] - W[i];
    sumDW += d;
    sumDW2 += d * d;
    sumDtDW += dt * Math.abs(d);
  }
  return { sumDW, sumDW2, sumDt2: n * dt * dt, sumDtDW, n };
}

/** Standard deviation of Σ(dW)² over [0,T] with n normal steps: T·√(2/n). */
export function quadraticVariationSd(n: number, T: number): number {
  return T * Math.sqrt(2 / n);
}

/**
 * The telescoping identity behind d(W²) = 2W dW + dt:
 *   W_T² − 2 Σ W_i (W_{i+1} − W_i) = Σ (W_{i+1} − W_i)²   (exact for any path, any n).
 * Returns the three pieces.
 */
export function telescope(W: number[]): { WT2: number; twoSumWdW: number; sumDW2: number } {
  const n = W.length - 1;
  let s = 0,
    q = 0;
  for (let i = 0; i < n; i++) {
    const d = W[i + 1] - W[i];
    s += W[i] * d;
    q += d * d;
  }
  return { WT2: W[n] * W[n], twoSumWdW: 2 * s, sumDW2: q };
}

/** The "peeking" sum Σ W_{i+1} dW (evaluating at the right end) — not allowed; differs from the honest one by Σ(dW)². */
export function peekingSum(W: number[]): number {
  let s = 0;
  for (let i = 0; i < W.length - 1; i++) s += W[i + 1] * (W[i + 1] - W[i]);
  return s;
}

/** Geometric Brownian motion: exact terminal value and its moments. */
export function gbmTerminal(S0: number, mu: number, sigma: number, T: number, WT: number): number {
  return S0 * Math.exp((mu - 0.5 * sigma * sigma) * T + sigma * WT);
}
export function gbmTerminalNoCorrection(S0: number, mu: number, sigma: number, T: number, WT: number): number {
  return S0 * Math.exp(mu * T + sigma * WT);
}
export function gbmMean(S0: number, mu: number, T: number): number {
  return S0 * Math.exp(mu * T);
}
export function gbmMedian(S0: number, mu: number, sigma: number, T: number): number {
  return S0 * Math.exp((mu - 0.5 * sigma * sigma) * T);
}
/** How much a simulation that forgets −½σ² overstates the mean: e^{½σ²T}. */
export function overstatementFactor(sigma: number, T: number): number {
  return Math.exp(0.5 * sigma * sigma * T);
}

/** Itô's lemma for f(t, X) with dX = a dt + b dW: drift and diffusion of df. */
export function itoDrift(ft: number, fx: number, fxx: number, a: number, b: number): number {
  return ft + a * fx + 0.5 * b * b * fxx;
}
export function itoDiffusion(fx: number, b: number): number {
  return b * fx;
}

/** Hull 11.17: d ln S = (μ − ½σ²) dt + σ dW. */
export function logDrift(mu: number, sigma: number): number {
  return mu - 0.5 * sigma * sigma;
}

/** Second-order term for a few functions at x: ½ f″(x) · b² (the triangle's expected area per unit time). */
export const CURVATURE_TERM: Record<string, (x: number, b: number) => number> = {
  "x²": (_x, b) => b * b, // ½·2·b²
  "ln x": (x, b) => -0.5 * (b * b) / (x * x),
  "eˣ": (x, b) => 0.5 * Math.exp(x) * b * b,
  "√x": (x, b) => -0.125 * (b * b) / Math.pow(x, 1.5),
};
