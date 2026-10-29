/**
 * Chapter B3: Brownian motion, the three dials, GBM steps, mean reversion (OU), and "which can you measure".
 * Paths, Σ(dW)² and the GBM closed form live in ito.ts (brownianPath, coinPath, incrementSums, gbm*, quadraticVariationSd) — reused, not repeated.
 */
import { incrementSums } from "./ito";
import { cdf } from "./normal";
import { normalSample } from "./random";

export type Path = { t: number[]; W: number[] };

// ---------------------------------------------------------------- Figure 1: zoom forever (Brownian bridge)

/** Bridge midpoint: W(m) | W(l), W(r) ~ N((W(l)+W(r))/2, (r−l)/4). z is a standard normal. */
export function bridgeMidpoint(wl: number, wr: number, dt: number, z: number): number {
  return 0.5 * (wl + wr) + Math.sqrt(dt / 4) * z;
}

/**
 * Refine a path by inserting a bridge midpoint in every interval: n steps → 2n steps.
 * The original points are kept exactly, so zooming in grows detail without redrawing the wiggles already seen.
 * Works for uneven grids (uses each interval's own Δt).
 */
export function brownianBridgeRefine(path: Path, next: () => number): Path {
  const { t, W } = path;
  const n = t.length - 1;
  const t2: number[] = [t[0]],
    W2: number[] = [W[0]];
  for (let i = 0; i < n; i++) {
    const dt = t[i + 1] - t[i];
    t2.push(t[i] + dt / 2);
    W2.push(bridgeMidpoint(W[i], W[i + 1], dt, normalSample(next)));
    t2.push(t[i + 1]);
    W2.push(W[i + 1]);
  }
  return { t: t2, W: W2 };
}

/** Refine k times (n → n·2^k). */
export function brownianBridgeRefineTimes(path: Path, k: number, next: () => number): Path {
  let p = path;
  for (let i = 0; i < k; i++) p = brownianBridgeRefine(p, next);
  return p;
}

/** Secant ratio |W(b) − W(a)| / (b − a) between two indices of a path — the "speedometer" at one spot. */
export function secantRatio(path: Path, i: number, j: number): number {
  return Math.abs(path.W[j] - path.W[i]) / Math.abs(path.t[j] - path.t[i]);
}

/** Least-squares slope of log|ΔW| against log Δt: ½ for a Brownian path, 1 for a smooth curve. */
export function logLogSlope(dts: number[], moves: number[]): number {
  const x = dts.map(Math.log),
    y = moves.map((m) => Math.log(Math.max(m, 1e-300)));
  const mx = x.reduce((s, v) => s + v, 0) / x.length,
    my = y.reduce((s, v) => s + v, 0) / y.length;
  let sxy = 0,
    sxx = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
  }
  return sxy / sxx;
}

// ---------------------------------------------------------------- Shreve §3.2: the scaled random walk

/** Shreve's W⁽ⁿ⁾(t) = M_{nt}/√n: ±1/√n coin steps at t = k/n, k = 0 … ⌊nT⌋. */
export function scaledRandomWalk(n: number, T: number, next: () => number): Path {
  const m = Math.floor(n * T + 1e-9),
    s = 1 / Math.sqrt(n);
  const t = [0],
    W = [0];
  for (let k = 1; k <= m; k++) {
    t.push(k / n);
    W.push(W[k - 1] + (next() < 0.5 ? -s : s));
  }
  return { t, W };
}

/** Quadratic variation of the scaled walk up to t: ⌊nt⌋ steps of (1/√n)² — exactly t on the grid (Shreve 3.2.10). */
export function scaledWalkQuadraticVariation(n: number, t: number): number {
  return Math.floor(n * t + 1e-9) / n;
}

function logChoose(n: number, k: number): number {
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
}

/** P{W⁽ⁿ⁾(t) = x}: M_{nt} = x√n needs (nt + x√n)/2 heads out of nt tosses (Shreve 3.2.11: n = 100, t = ¼, x = 0.1 → 0.1550). */
export function scaledWalkProbability(n: number, t: number, x: number): number {
  const steps = Math.round(n * t);
  const heads = (steps + x * Math.sqrt(n)) / 2;
  const h = Math.round(heads);
  if (Math.abs(heads - h) > 1e-9 || h < 0 || h > steps) return 0;
  return Math.exp(logChoose(steps, h) - steps * Math.LN2);
}

/** Histogram bar height for that probability: the walk's values are 2/√n apart, so height = p / (2/√n) (Shreve p. 89: 0.7749 vs the normal's 0.7979). */
export function scaledWalkBarHeight(n: number, t: number, x: number): number {
  return scaledWalkProbability(n, t, x) / (2 / Math.sqrt(n));
}

/** N(0, t) density at 0: 1/√(2πt). */
export function normalPeak(t: number): number {
  return 1 / Math.sqrt(2 * Math.PI * t);
}

// ---------------------------------------------------------------- Figure 2: the three dials

/** Speedometer: |ΔW|/Δt over the path. rms = 1/√Δt in expectation; it blows up as the tick shrinks. */
export function speedometer(W: number[], T: number): { rms: number; mean: number; max: number; n: number } {
  const n = W.length - 1,
    dt = T / n;
  let sq = 0,
    ab = 0,
    mx = 0;
  for (let i = 0; i < n; i++) {
    const v = Math.abs(W[i + 1] - W[i]) / dt;
    sq += v * v;
    ab += v;
    if (v > mx) mx = v;
  }
  return { rms: Math.sqrt(sq / n), mean: ab / n, max: mx, n };
}

/** Expected speedometer rms for n steps on [0, T]: 1/√Δt (4, 16, 64, 256 for n = 16 … 65,536 on [0, 1]). */
export function speedometerTypical(n: number, T: number): number {
  return 1 / Math.sqrt(T / n);
}

/** Odometer: Σ|ΔW| (first variation). Runs away like √n. */
export function odometer(W: number[]): number {
  let s = 0;
  for (let i = 0; i < W.length - 1; i++) s += Math.abs(W[i + 1] - W[i]);
  return s;
}

/** Expected odometer reading for n normal steps on [0, T]: n·√(2Δt/π) = √(2nT/π) (3.19, 12.8, 51.1, 204 on [0, 1]). */
export function odometerExpected(n: number, T: number): number {
  return n * Math.sqrt((2 * (T / n)) / Math.PI);
}

/** Squares dial: Σ(ΔW)² — settles to T. Reuses incrementSums. */
export function squaresDial(W: number[], T: number): number {
  return incrementSums(W, T).sumDW2;
}

/** All three dials at once, with the clock reading they are compared to. */
export function dials(W: number[], T: number): { speedometer: number; odometer: number; squares: number; clock: number; n: number } {
  return { speedometer: speedometer(W, T).rms, odometer: odometer(W), squares: squaresDial(W, T), clock: T, n: W.length - 1 };
}

/** The ledger: per-step ratios (ΔW)²/Δt — each ~ χ²₁ (68 % below 1, median 0.455); only their average is near 1. */
export function stepRatios(W: number[], T: number): number[] {
  const n = W.length - 1,
    dt = T / n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push((W[i + 1] - W[i]) ** 2 / dt);
  return out;
}

/** Fraction of a sample below x, and its median. */
export function fractionBelow(xs: number[], x: number): number {
  let c = 0;
  for (const v of xs) if (v < x) c++;
  return c / xs.length;
}
export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b),
    m = s.length >> 1;
  return s.length % 2 ? s[m] : 0.5 * (s[m - 1] + s[m]);
}

// ---------------------------------------------------------------- Hull ch. 11: generalised Wiener and GBM steps

/** Hull 11.3: change in x over T when dx = a dt + b dz is N(aT, b√T) (Ex. 11.2: 50 + 20 dt + 30 dz → N(70, 30) at one year). */
export function wienerChange(a: number, b: number, T: number): { mean: number; sd: number } {
  return { mean: a * T, sd: b * Math.sqrt(T) };
}

/** Hull 11.9: one discrete GBM step δS = μS δt + σS ε√δt (Ex. 11.3: 0.288 + 4.157ε; Table 11.1). */
export function gbmStep(S: number, mu: number, sigma: number, dt: number, eps: number): number {
  return S + mu * S * dt + sigma * S * Math.sqrt(dt) * eps;
}

/** Hull Table 11.1: a path from S0 driven by given ε's. */
export function gbmDiscretePath(S0: number, mu: number, sigma: number, dt: number, eps: number[]): number[] {
  const out: number[] = [];
  let S = S0;
  for (const e of eps) {
    S = gbmStep(S, mu, sigma, dt, e);
    out.push(S);
  }
  return out;
}

/** Hull 11.19 / Problem 11.16: P(S_T > K) = 1 − Φ((ln K − ln S0 − (μ − ½σ²)T) / (σ√T)) → 0.2253 for 50, 12 %, 30 %, 2 y, 80. */
export function gbmProbAbove(S0: number, mu: number, sigma: number, T: number, K: number): number {
  const z = (Math.log(K) - Math.log(S0) - (mu - 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  return 1 - cdf(z);
}

/** Lognormal mode S0·e^{(μ − 3σ²/2)t} (mean and median are gbmMean / gbmMedian in ito.ts). */
export function gbmMode(S0: number, mu: number, sigma: number, t: number): number {
  return S0 * Math.exp((mu - 1.5 * sigma * sigma) * t);
}

// ---------------------------------------------------------------- Figure 5: the leash (Ornstein–Uhlenbeck / Vasicek)

/** dX = κ(θ − X) dt + σ dW. Half-life of a displacement: ln 2 / κ. */
export function ouHalfLife(kappa: number): number {
  return Math.LN2 / kappa;
}

/** Long-run (stationary) sd: σ/√(2κ). */
export function ouStationarySd(kappa: number, sigma: number): number {
  return sigma / Math.sqrt(2 * kappa);
}

/** Expected value at t from x0: θ + (x0 − θ)e^{−κt} (Shreve Ex. 4.4.10). */
export function ouMean(x0: number, kappa: number, theta: number, t: number): number {
  return theta + (x0 - theta) * Math.exp(-kappa * t);
}

/** Variance at t: (σ²/2κ)(1 − e^{−2κt}). */
export function ouVariance(kappa: number, sigma: number, t: number): number {
  return ((sigma * sigma) / (2 * kappa)) * (1 - Math.exp(-2 * kappa * t));
}

/**
 * Exact discretisation on n steps over [0, T]: X_{k+1} = θ + (X_k − θ)e^{−κΔ} + σ√((1 − e^{−2κΔ})/2κ)·Z.
 * Correct for any Δ; one normal per step, so the same rng seed gives ouEuler the same jostles.
 */
export function ouPath(x0: number, kappa: number, theta: number, sigma: number, n: number, T: number, next: () => number): Path {
  const dt = T / n,
    a = Math.exp(-kappa * dt),
    b = sigma * Math.sqrt((1 - Math.exp(-2 * kappa * dt)) / (2 * kappa));
  const t = [0],
    X = [x0];
  for (let k = 1; k <= n; k++) {
    t.push(k * dt);
    X.push(theta + (X[k - 1] - theta) * a + b * normalSample(next));
  }
  return { t, W: X };
}

/**
 * Euler–Maruyama with tick dt: X_{k+1} = X_k + κ(θ − X_k)Δ + σ√Δ·Z. The gap to θ is multiplied by (1 − κΔ) each step:
 * κΔ = 1 forgets the start in one step, 1 < κΔ < 2 overshoots, κΔ ≥ 2 blows up.
 */
export function ouEuler(x0: number, kappa: number, theta: number, sigma: number, n: number, dt: number, next: () => number): Path {
  const t = [0],
    X = [x0],
    s = sigma * Math.sqrt(dt);
  for (let k = 1; k <= n; k++) {
    t.push(k * dt);
    X.push(X[k - 1] + kappa * (theta - X[k - 1]) * dt + s * normalSample(next));
  }
  return { t, W: X };
}

/** Euler gap factor 1 − κΔ (exact: e^{−κΔ}). */
export function ouEulerGapFactor(kappa: number, dt: number): number {
  return 1 - kappa * dt;
}

/** Stationary sd of the Euler scheme: σ√(Δ / (1 − (1 − κΔ)²)); Infinity once |1 − κΔ| ≥ 1 (κΔ ≥ 2) — "grows without limit". */
export function ouEulerStationarySd(kappa: number, sigma: number, dt: number): number {
  const g = ouEulerGapFactor(kappa, dt);
  if (Math.abs(g) >= 1) return Infinity;
  return sigma * Math.sqrt(dt / (1 - g * g));
}

/** Is the Euler scheme stable for this tick? (|1 − κΔ| < 1 ⇔ 0 < κΔ < 2.) */
export function ouEulerStable(kappa: number, dt: number): boolean {
  return Math.abs(ouEulerGapFactor(kappa, dt)) < 1;
}

// ---------------------------------------------------------------- Figure 3: realised volatility, and which can you measure

/** Log-returns of a price series. */
export function logReturns(prices: ArrayLike<number>): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) out.push(Math.log(prices[i] / prices[i - 1]));
  return out;
}

/** Shreve 3.4.16: realised variance (1/T)Σ(log-return)², T in years → annualised vol √(periodsPerYear · mean r²). No demeaning. */
export function realisedVolFromReturns(returns: ArrayLike<number>, periodsPerYear = 252): number {
  const n = returns.length;
  if (n === 0) return NaN;
  let s = 0;
  for (let i = 0; i < n; i++) s += returns[i] * returns[i];
  return Math.sqrt((periodsPerYear * s) / n);
}

/** Annualised drift from the same returns: mean r × periods per year (the readout that never settles). */
export function driftFromReturns(returns: ArrayLike<number>, periodsPerYear = 252): number {
  let s = 0;
  for (let i = 0; i < returns.length; i++) s += returns[i];
  return (periodsPerYear * s) / returns.length;
}

/**
 * Rolling realised vol from prices: one annualised value per window of `window` returns, aligned to the window's last price.
 * Result length = prices.length − window. The whole-file reading is realisedVolFromPrices(p, p.length − 1)[0].
 */
export function realisedVolFromPrices(prices: ArrayLike<number>, window: number, periodsPerYear = 252): number[] {
  const r = logReturns(prices);
  const out: number[] = [];
  if (window <= 0 || window > r.length) return out;
  let s = 0;
  for (let i = 0; i < r.length; i++) {
    s += r[i] * r[i];
    if (i >= window) s -= r[i - window] * r[i - window];
    if (i >= window - 1) out.push(Math.sqrt((periodsPerYear * Math.max(s, 0)) / window));
  }
  return out;
}

/** Sd of the drift estimate from T years of a GBM path: σ/√T — more data per year does not help (Shreve p. 86). */
export function driftEstimateSd(sigma: number, T: number): number {
  return sigma / Math.sqrt(T);
}

/** Sd of the vol estimate from n returns: ≈ σ/√(2n) — more data per year does help. */
export function volEstimateSd(sigma: number, n: number): number {
  return sigma / Math.sqrt(2 * n);
}
