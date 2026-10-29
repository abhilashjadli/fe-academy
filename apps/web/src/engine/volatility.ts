/**
 * Chapter A5: volatility — realised variance, EWMA (RiskMetrics), GARCH(1,1), maximum likelihood,
 * forecasts and the term structure, Ljung–Box, and the "real or shuffled?" opener.
 *
 * Every formula is quoted from Hull, Options, Futures, and Other Derivatives (10th ed.), ch. 17, with the page
 * numbers used in research/r1/A5.md §6. Conventions (shared with tests/answer-key/key_A5.py so the recursions
 * are checked exactly, not approximately):
 *  - returns u_i are decimals (0.01 = 1 %) and their mean is taken as zero (Hull eq. 17.2–17.3, p. 373);
 *  - a variance path has length n+1: path[0] is the seed (default: the zero-mean sample variance, mean of u²),
 *    path[i] is the variance *for* return i (built from returns 0..i−1), path[n] is the next-day forecast;
 *  - the log-likelihood is Σ_{i=0}^{n−1} (−ln v_i − u_i²/v_i) with v_i = path[i] (Hull eq. 17.12, p. 379).
 */
import { lnGamma } from "./distributions";
import { acf as sampleAcf, mean } from "./regression";

export const TRADING_DAYS = 252;

/** Zero-mean sample variance (1/m) Σ u² — Hull eq. 17.3 with the mean set to zero (p. 373). */
export function meanSquare(xs: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += xs[i] * xs[i];
  return s / xs.length;
}

/**
 * Realised (trailing, equal-weight) variance: out[i] = (1/window) Σ_{j=i−window+1}^{i} u_j² — Hull eq. 17.3 (p. 373).
 * Entries before the first full window are NaN. With window = 25 this is Hull's realised variance used to score
 * forecasts (p. 375); with window = 250 it is the "trailing year" of the storyboard.
 */
export function realisedVariance(returns: number[], window: number): number[] {
  const n = returns.length;
  const out = new Array<number>(n).fill(NaN);
  let s = 0;
  for (let i = 0; i < n; i++) {
    s += returns[i] * returns[i];
    if (i >= window) s -= returns[i - window] * returns[i - window];
    if (i >= window - 1) out[i] = s / window;
  }
  return out;
}

/* ------------------------------------------------------------------------------------ EWMA (RiskMetrics) ---- */

/** One EWMA step: σ_n² = λ σ_{n−1}² + (1 − λ) u_{n−1}² — Hull eq. 17.7 (p. 374). Example 17.1 (p. 375). */
export function ewmaStep(sigma2Prev: number, uPrev: number, lambda: number): number {
  return lambda * sigma2Prev + (1 - lambda) * uPrev * uPrev;
}

/**
 * EWMA variance path (length n+1, see the header). RiskMetrics uses λ = 0.94 for daily data (Hull p. 375).
 * The seed defaults to the zero-mean sample variance (Hull p. 379 allows u₂² or the sample variance as the start).
 */
export function ewmaVariance(returns: number[], lambda: number, seed?: number): number[] {
  const n = returns.length;
  const out = new Array<number>(n + 1);
  out[0] = seed ?? meanSquare(returns);
  for (let i = 0; i < n; i++) out[i + 1] = ewmaStep(out[i], returns[i], lambda);
  return out;
}

/** The EWMA weight on u²_{n−i} is (1 − λ) λ^{i−1}, i = 1, 2, … (Hull p. 374); they sum to 1. */
export function ewmaWeights(lambda: number, k: number): number[] {
  return Array.from({ length: k }, (_, i) => (1 - lambda) * Math.pow(lambda, i));
}

/** Half-life of a shock under a geometric decay factor d (λ for EWMA, α + β for GARCH): ln ½ / ln d. */
export function halfLife(decay: number): number {
  return Math.log(0.5) / Math.log(decay);
}

/** Effective window of an EWMA, 1/(1 − λ): 16.7 days at λ = 0.94 (note §6). */
export function ewmaWindow(lambda: number): number {
  return 1 / (1 - lambda);
}

/* ------------------------------------------------------------------------------------ GARCH(1,1) ---- */

/** One GARCH(1,1) step: σ_n² = ω + α u_{n−1}² + β σ_{n−1}² — Hull eq. 17.8 (p. 376). Example 17.2 (pp. 376–377). */
export function garchStep(sigma2Prev: number, uPrev: number, omega: number, alpha: number, beta: number): number {
  return omega + alpha * uPrev * uPrev + beta * sigma2Prev;
}

/** GARCH(1,1) variance path (length n+1, see the header); seed defaults to the zero-mean sample variance. */
export function garchVariance(returns: number[], omega: number, alpha: number, beta: number, seed?: number): number[] {
  const n = returns.length;
  const out = new Array<number>(n + 1);
  out[0] = seed ?? meanSquare(returns);
  for (let i = 0; i < n; i++) out[i + 1] = garchStep(out[i], returns[i], omega, alpha, beta);
  return out;
}

/** Long-run (unconditional) variance V_L = ω / (1 − α − β) — Hull eq. 17.9 (p. 376); the model is stable iff α + β < 1. */
export function garchLongRun(omega: number, alpha: number, beta: number): number {
  return omega / (1 - alpha - beta);
}

/** The GARCH weight on u²_{n−i} is α β^{i−1} (Hull p. 377) — the EWMA with the long-run anchor subtracted. */
export function garchWeights(alpha: number, beta: number, k: number): number[] {
  return Array.from({ length: k }, (_, i) => alpha * Math.pow(beta, i));
}

/**
 * Expected variance k days ahead, k = 1..h: E[σ²_{n+k}] = V_L + (α + β)^k (σ_n² − V_L) — Hull eq. 17.13 (p. 383).
 * `sigma2Now` is σ_n², today's variance (the last entry of a variance path).
 */
export function garchForecast(sigma2Now: number, omega: number, alpha: number, beta: number, h: number): number[] {
  const VL = garchLongRun(omega, alpha, beta);
  const ab = alpha + beta;
  const out = new Array<number>(h);
  for (let k = 1; k <= h; k++) out[k - 1] = VL + Math.pow(ab, k) * (sigma2Now - VL);
  return out;
}

/**
 * Volatility term structure (Hull §17.9, eq. 17.14, p. 384): the average variance over the next N days is
 * (1/N) Σ_{k=0}^{N−1} E[σ²_{n+k}] = V_L + (σ_n² − V_L)(1 − (α+β)^N) / (N (1 − (α+β))), and the N-day volatility
 * quoted per year is √(252 × average). This discrete average reproduces Hull's Table 17.3 (12.03/11.61/11.35/11.01/10.65 %).
 */
export function garchTermStructure(
  sigma2Now: number,
  omega: number,
  alpha: number,
  beta: number,
  days: number[],
): Array<{ days: number; avgVariance: number; volAnnual: number }> {
  const VL = garchLongRun(omega, alpha, beta);
  const ab = alpha + beta;
  return days.map((N) => {
    const avg = VL + ((sigma2Now - VL) * (1 - Math.pow(ab, N))) / (N * (1 - ab));
    return { days: N, avgVariance: avg, volAnnual: Math.sqrt(TRADING_DAYS * avg) };
  });
}

/* ------------------------------------------------------------------------------------ Maximum likelihood ---- */

/** One day's contribution to the log-likelihood, −ln v − u²/v (Hull eq. 17.12, p. 379; Table 17.1 rows, p. 380). */
export function likelihoodTerm(u: number, v: number): number {
  return -Math.log(v) - (u * u) / v;
}

/**
 * GARCH(1,1) log-likelihood Σ (−ln v_i − u_i²/v_i) over the returns, with v the variance path above (Hull eq. 17.12).
 * Constants (−½ ln 2π) and the factor ½ are dropped, as Hull does; they do not move the optimum.
 */
export function garchLogLikelihood(returns: number[], omega: number, alpha: number, beta: number, seed?: number): number {
  const v = garchVariance(returns, omega, alpha, beta, seed);
  let s = 0;
  for (let i = 0; i < returns.length; i++) s += likelihoodTerm(returns[i], v[i]);
  return s;
}

export interface GarchFit {
  omega: number;
  alpha: number;
  beta: number;
  logLikelihood: number;
  longRunVariance: number;
  iterations: number;
}

/**
 * Fit GARCH(1,1) by maximum likelihood (Hull §17.5, pp. 379–381): Nelder–Mead on an unconstrained
 * parameterisation ω = e^{t0}, α = s(t1), β = (1 − α) s(t2) (s = logistic) so that ω > 0, α, β > 0 and α + β < 1,
 * started from a coarse grid of (α, β) with ω set by variance targeting ω = V (1 − α − β) (p. 381).
 */
export function garchFit(returns: number[], seed?: number): GarchFit {
  const V = meanSquare(returns);
  const logistic = (t: number) => 1 / (1 + Math.exp(-t));
  const logit = (p: number) => Math.log(p / (1 - p));
  const unpack = (t: number[]) => {
    const alpha = logistic(t[1]);
    const beta = (1 - alpha) * logistic(t[2]);
    return { omega: Math.exp(t[0]), alpha, beta };
  };
  const neg = (t: number[]) => {
    const p = unpack(t);
    return -garchLogLikelihood(returns, p.omega, p.alpha, p.beta, seed);
  };
  let best: { x: number[]; f: number; iter: number } | null = null;
  for (const a0 of [0.05, 0.1, 0.2]) {
    for (const b0 of [0.8, 0.9, 0.95]) {
      if (a0 + b0 >= 0.995) continue;
      const t0 = [Math.log(V * (1 - a0 - b0)), logit(a0), logit(b0 / (1 - a0))];
      const r = nelderMead(neg, t0, { xtol: 1e-8, ftol: 1e-10, maxIter: 5000 });
      if (!best || r.f < best.f) best = r;
    }
  }
  const p = unpack(best!.x);
  return { ...p, logLikelihood: -best!.f, longRunVariance: garchLongRun(p.omega, p.alpha, p.beta), iterations: best!.iter };
}

/** A compact Nelder–Mead simplex minimiser (standard coefficients: reflect 1, expand 2, contract ½, shrink ½). */
export function nelderMead(
  f: (x: number[]) => number,
  x0: number[],
  opts: { xtol?: number; ftol?: number; maxIter?: number; step?: number } = {},
): { x: number[]; f: number; iter: number } {
  const { xtol = 1e-8, ftol = 1e-10, maxIter = 5000, step = 0.25 } = opts;
  const n = x0.length;
  let simplex = [x0.slice()];
  for (let i = 0; i < n; i++) {
    const x = x0.slice();
    x[i] += x[i] !== 0 ? step * Math.abs(x[i]) : step;
    simplex.push(x);
  }
  let fs = simplex.map(f);
  const order = () => {
    const idx = fs.map((_, i) => i).sort((a, b) => fs[a] - fs[b]);
    simplex = idx.map((i) => simplex[i]);
    fs = idx.map((i) => fs[i]);
  };
  let iter = 0;
  for (; iter < maxIter; iter++) {
    order();
    let xspread = 0;
    for (let i = 1; i <= n; i++) for (let j = 0; j < n; j++) xspread = Math.max(xspread, Math.abs(simplex[i][j] - simplex[0][j]));
    if (xspread <= xtol && Math.abs(fs[n] - fs[0]) <= ftol) break;
    const centroid = new Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) centroid[j] += simplex[i][j] / n;
    const worst = simplex[n];
    const xr = centroid.map((c, j) => c + (c - worst[j]));
    const fr = f(xr);
    if (fr < fs[0]) {
      const xe = centroid.map((c, j) => c + 2 * (c - worst[j]));
      const fe = f(xe);
      if (fe < fr) {
        simplex[n] = xe;
        fs[n] = fe;
      } else {
        simplex[n] = xr;
        fs[n] = fr;
      }
    } else if (fr < fs[n - 1]) {
      simplex[n] = xr;
      fs[n] = fr;
    } else {
      const outside = fr < fs[n];
      const xc = centroid.map((c, j) => c + 0.5 * ((outside ? xr[j] : worst[j]) - c));
      const fc = f(xc);
      if (fc < (outside ? fr : fs[n])) {
        simplex[n] = xc;
        fs[n] = fc;
      } else {
        for (let i = 1; i <= n; i++) {
          simplex[i] = simplex[i].map((v, j) => simplex[0][j] + 0.5 * (v - simplex[0][j]));
          fs[i] = f(simplex[i]);
        }
      }
    }
  }
  order();
  return { x: simplex[0], f: fs[0], iter };
}

/* ------------------------------------------------------------------------------------ Evaluation ---- */

/** Sample autocorrelation at lags 1..k (regression.ts estimator, = statsmodels acf with fft=False). */
export const acf = sampleAcf;

/** Standardised residuals u_i / σ_i from a variance path (Tsay p. 109; Hull Table 17.2 uses u²/σ²). */
export function standardise(returns: number[], variancePath: number[]): number[] {
  return returns.map((u, i) => u / Math.sqrt(variancePath[i]));
}

/**
 * Ljung–Box statistic Q = n (n + 2) Σ_{k=1}^{m} ρ_k² / (n − k) with a χ²(m) p-value (Hull p. 382: ≈123 on u²,
 * 8.2 on u²/σ², 95 % cut-off 25 at m = 15; Tsay p. 109 on the standardised squares).
 */
export function ljungBox(xs: number[], lags: number): { stat: number; df: number; pValue: number; acf: number[] } {
  const n = xs.length;
  const rho = sampleAcf(xs, lags);
  let q = 0;
  for (let k = 1; k <= lags; k++) q += (rho[k - 1] * rho[k - 1]) / (n - k);
  q *= n * (n + 2);
  return { stat: q, df: lags, pValue: 1 - chi2Cdf(q, lags), acf: rho };
}

/** χ² CDF with k degrees of freedom = regularised lower incomplete gamma P(k/2, x/2). */
export function chi2Cdf(x: number, k: number): number {
  if (x <= 0) return 0;
  return gammaP(k / 2, x / 2);
}

/** Regularised lower incomplete gamma P(a, x) (series for x < a + 1, continued fraction otherwise). */
function gammaP(a: number, x: number): number {
  if (x <= 0) return 0;
  const lg = lnGamma(a);
  if (x < a + 1) {
    let sum = 1 / a,
      term = 1 / a;
    for (let i = 1; i < 500; i++) {
      term *= x / (a + i);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-15) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - lg);
  }
  // Lentz continued fraction for Q(a, x)
  const tiny = 1e-300;
  let b = x + 1 - a,
    c = 1 / tiny,
    d = 1 / b,
    h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < tiny) d = tiny;
    c = b + an / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - lg) * h;
}

/** Fisher–Yates shuffle with the project rng (`next` in [0,1)); returns a new array. The "real or shuffled?" opener. */
export function shuffle<T>(xs: T[], next: () => number): T[] {
  const out = xs.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const t = out[i];
    out[i] = out[j];
    out[j] = t;
  }
  return out;
}

export { mean };
