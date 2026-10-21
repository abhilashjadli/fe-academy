/** Counting, the binomial, sums of dice, and the normal approximation (chapter 0.2). */
import { cdf } from "./normal";

export function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

/** Row n of Pascal's triangle. */
export function pascalRow(n: number): number[] {
  const row = [1];
  for (let k = 1; k <= n; k++) row.push((row[k - 1] * (n - k + 1)) / k);
  return row.map(Math.round);
}

/** Binomial pmf over k = 0..n. */
export function binomialPmf(n: number, p: number): number[] {
  const out: number[] = [];
  for (let k = 0; k <= n; k++) out.push(choose(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k));
  return out;
}

export interface Pmf {
  /** value of the first support point */
  x0: number;
  /** probabilities for x0, x0+1, ... */
  p: number[];
}

export function pmfMean(d: Pmf): number {
  return d.p.reduce((s, pi, i) => s + pi * (d.x0 + i), 0);
}
export function pmfVariance(d: Pmf): number {
  const m = pmfMean(d);
  return d.p.reduce((s, pi, i) => s + pi * (d.x0 + i - m) ** 2, 0);
}

/** Convolution of two integer-support pmfs: the distribution of the sum. */
export function convolve(a: Pmf, b: Pmf): Pmf {
  const p = new Array(a.p.length + b.p.length - 1).fill(0);
  for (let i = 0; i < a.p.length; i++) for (let j = 0; j < b.p.length; j++) p[i + j] += a.p[i] * b.p[j];
  return { x0: a.x0 + b.x0, p };
}

/** Distribution of the sum of n i.i.d. copies of d. */
export function sumOf(d: Pmf, n: number): Pmf {
  let acc: Pmf = { x0: 0, p: [1] };
  for (let i = 0; i < n; i++) acc = convolve(acc, d);
  return acc;
}

/** A die with given face weights (faces 1..6), normalised. */
export function die(weights: number[]): Pmf {
  const t = weights.reduce((s, w) => s + w, 0);
  return { x0: 1, p: weights.map((w) => w / t) };
}

/** Normal approximation to P(X ≥ k) with continuity correction. */
export function normalTailAtLeast(k: number, mean: number, sd: number): number {
  return 1 - cdf((k - 0.5 - mean) / sd);
}

/** Exact P(X ≥ k) for a pmf. */
export function pmfTailAtLeast(d: Pmf, k: number): number {
  let s = 0;
  for (let i = 0; i < d.p.length; i++) if (d.x0 + i >= k) s += d.p[i];
  return s;
}

/** Standardised histogram: map a pmf onto z = (x − μ)/σ, returning density-scaled bars. */
export function standardise(d: Pmf): Array<{ z: number; density: number; width: number }> {
  const m = pmfMean(d);
  const s = Math.sqrt(pmfVariance(d));
  return d.p.map((pi, i) => ({ z: (d.x0 + i - m) / s, density: pi * s, width: 1 / s }));
}
