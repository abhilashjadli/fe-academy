/**
 * Chapter E1 — Value at Risk and Expected Shortfall. Tested against tests/answer-key/key_E1.py (engine/__fixtures__/key-E1.json).
 * Conventions: losses are positive numbers; historical VaR at level p on n losses is the k-th worst with k = ceil(p n); ES is the mean
 * of those k; the normal model has mean zero. The backtest fences use a window of W days strictly before the day.
 */
import { black76, black76Greeks, type Fwd } from "./bs";
import { cdf, pdf, quantile } from "./normal";

export const Z99 = quantile(0.99);
export const Z95 = quantile(0.95);

/** rupee P&L of a long position of `notional` for each daily log return */
export function pnlFromReturns(returns: ArrayLike<number>, notional: number): Float64Array {
  const out = new Float64Array(returns.length);
  for (let i = 0; i < returns.length; i++) out[i] = notional * (Math.exp(returns[i]) - 1);
  return out;
}

export interface HistVaR {
  var: number;
  es: number;
  k: number;
  /** indices of the k worst losses, worst first */
  worst: number[];
}

/** historical VaR and ES of a loss array (losses positive) */
export function historicalVaR(losses: ArrayLike<number>, p: number): HistVaR {
  const n = losses.length;
  const k = Math.ceil(p * n - 1e-12);
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => losses[b] - losses[a]);
  const worst = idx.slice(0, k);
  let s = 0;
  for (const i of worst) s += losses[i];
  return { var: losses[worst[k - 1]], es: s / k, k, worst };
}

export function normalVaR(sd: number, p: number): number {
  return quantile(1 - p) * sd;
}
export function normalES(sd: number, p: number): number {
  const z = quantile(1 - p);
  return (sd * pdf(z)) / p;
}

export function sd0(x: ArrayLike<number>): number {
  let m = 0;
  for (let i = 0; i < x.length; i++) m += x[i];
  m /= x.length;
  let v = 0;
  for (let i = 0; i < x.length; i++) v += (x[i] - m) ** 2;
  return Math.sqrt(v / x.length);
}

export interface Fences {
  /** index into the P&L array of the first test day */
  start: number;
  historical: Float64Array;
  normal: Float64Array;
  ewma: Float64Array;
}

/** the three 99 % fences, each from the W days before the day */
export function rollingFences(pnl: ArrayLike<number>, W = 500, p = 0.01, lambda = 0.94): Fences {
  const n = pnl.length;
  const T = n - W;
  const historical = new Float64Array(T);
  const normal = new Float64Array(T);
  const ewma = new Float64Array(T);
  const z = quantile(1 - p);
  const k = Math.ceil(p * W - 1e-12);
  let v = 0;
  for (let i = 0; i < W; i++) v += pnl[i] * pnl[i];
  let m = 0;
  for (let i = 0; i < W; i++) m += pnl[i];
  m /= W;
  v = v / W - m * m; // population variance of the first window
  const win: number[] = [];
  for (let i = 0; i < W; i++) win.push(-pnl[i]);
  for (let i = 0; i < T; i++) {
    const t = W + i;
    const sorted = [...win].sort((a, b) => b - a);
    historical[i] = sorted[k - 1];
    normal[i] = z * sd0(win.map((l) => -l));
    ewma[i] = z * Math.sqrt(v);
    v = lambda * v + (1 - lambda) * pnl[t] * pnl[t];
    win.shift();
    win.push(-pnl[t]);
  }
  return { start: W, historical, normal, ewma };
}

export interface Backtest {
  exceptions: number;
  /** indices (into the test window) of the exceptions */
  at: number[];
  expected: number;
  kupiecLR: number;
  /** Basel zone by exceptions per 250 days scaled to the test length */
  zone: "green" | "yellow" | "red";
}

export function backtest(loss: ArrayLike<number>, fence: ArrayLike<number>, p = 0.01): Backtest {
  const T = fence.length;
  const at: number[] = [];
  for (let i = 0; i < T; i++) if (loss[i] > fence[i]) at.push(i);
  const x = at.length;
  const per250 = (x * 250) / T;
  return { exceptions: x, at, expected: p * T, kupiecLR: kupiec(x, T, p), zone: per250 < 5 ? "green" : per250 < 10 ? "yellow" : "red" };
}

/** Kupiec's proportion-of-failures likelihood ratio, ~ chi-square(1) under the right model */
export function kupiec(x: number, T: number, p = 0.01): number {
  if (x === 0) return -2 * T * Math.log(1 - p);
  const l0 = (T - x) * Math.log(1 - p) + x * Math.log(p);
  const l1 = (T - x) * Math.log(1 - x / T) + x * Math.log(x / T);
  return -2 * (l0 - l1);
}
export const KUPIEC_CRIT_95 = 3.841458820694124;

/** P(X >= x) for X ~ Binomial(T, p), by direct summation in logs */
export function binomialTail(x: number, T: number, p: number): number {
  let s = 0;
  for (let i = x; i <= T; i++) {
    let lc = 0;
    for (let j = 1; j <= i; j++) lc += Math.log(T - i + j) - Math.log(j);
    s += Math.exp(lc + i * Math.log(p) + (T - i) * Math.log(1 - p));
  }
  return Math.min(1, s);
}

// ---------------------------------------------------------------------------------------------------------------------
// Raj's book (D1): short N calls on the forward, long h futures; one-day P&L under a log move x of the index

export interface Book {
  F: number;
  K: number;
  r: number;
  T: number;
  sigma: number;
  short: number;
  /** realised daily sd of the index log return */
  sigDay: number;
}

export function bookGreeks(b: Book) {
  const p: Fwd = { F: b.F, K: b.K, r: b.r, sigma: b.sigma, T: b.T };
  const g = black76Greeks(p);
  const c0 = black76(p);
  const c1 = black76({ ...p, T: b.T - 1 / 365 });
  return { call: c0, delta: g.delta, gamma: g.gamma, thetaDay: -(c1 - c0) * b.short };
}

/** one-day P&L of the book with h futures under each log move x; the option is repriced one day older */
export function bookPnl(b: Book, h: number, x: ArrayLike<number>): Float64Array {
  const c0 = black76({ F: b.F, K: b.K, r: b.r, sigma: b.sigma, T: b.T });
  const out = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const F1 = b.F * Math.exp(x[i]);
    const c1 = black76({ F: F1, K: b.K, r: b.r, sigma: b.sigma, T: b.T - 1 / 365 });
    out[i] = h * (F1 - b.F) - b.short * (c1 - c0);
  }
  return out;
}

export function linearVaR(b: Book, h: number, p = 0.01): number {
  const { delta } = bookGreeks(b);
  return quantile(1 - p) * Math.abs(h - b.short * delta) * b.F * b.sigDay;
}

/** coefficients of the delta-gamma P&L a x + b x² (dF ≈ F (x + x²/2)) */
export function quadCoefficients(b: Book, h: number): { a: number; b: number } {
  const { delta, gamma } = bookGreeks(b);
  const a = (h - b.short * delta) * b.F;
  return { a, b: -0.5 * b.short * gamma * b.F * b.F + 0.5 * a };
}

/** exact p-quantile loss of a x + b x², x ~ N(0, s²) */
export function quadVaR(b: Book, h: number, p = 0.01): number {
  const { a, b: bb } = quadCoefficients(b, h);
  const s = b.sigDay;
  const F = (q: number): number => {
    if (Math.abs(bb) < 1e-12) return a > 0 ? cdf(q / (a * s)) : 1 - cdf(q / (a * s));
    const disc = a * a + 4 * bb * q;
    if (disc < 0) return bb < 0 ? 1 : 0;
    const r1 = (-a - Math.sqrt(disc)) / (2 * bb);
    const r2 = (-a + Math.sqrt(disc)) / (2 * bb);
    const [x1, x2] = r1 < r2 ? [r1, r2] : [r2, r1];
    const inside = cdf(x2 / s) - cdf(x1 / s);
    return bb > 0 ? inside : 1 - inside;
  };
  let lo = -5e6;
  let hi = 5e5;
  for (let i = 0; i < 200; i++) {
    const mid = 0.5 * (lo + hi);
    if (F(mid) < p) lo = mid;
    else hi = mid;
  }
  return -0.5 * (lo + hi);
}

/** Cornish–Fisher first percentile of the delta-gamma P&L from its exact moments */
export function cornishFisher(b: Book, h: number, p = 0.01): { mu: number; sd: number; skew: number; w: number; var: number } {
  const { a, b: bb } = quadCoefficients(b, h);
  const s2 = b.sigDay * b.sigDay;
  const mu = bb * s2;
  const v = a * a * s2 + 2 * bb * bb * s2 * s2;
  const m3 = 6 * a * a * bb * s2 * s2 + 8 * bb ** 3 * s2 ** 3;
  const skew = m3 / v ** 1.5;
  const z = quantile(p);
  const w = z + ((z * z - 1) / 6) * skew;
  return { mu, sd: Math.sqrt(v), skew, w, var: -(mu + w * Math.sqrt(v)) };
}

/** Hull Example 16.2's Cornish–Fisher correction on stated moments */
export function cornishFisherQuantile(mu: number, sd: number, skew: number, z: number): number {
  return mu + sd * (z + ((z * z - 1) / 6) * skew);
}

/** two independent bets each losing L with probability q: VaR and ES at level p of each and of the pair */
export function subadditivityExample(L: number, q: number, p: number) {
  const pBoth = q * q;
  const pOne = 2 * q * (1 - q);
  const eachVaR = q > p ? L : 0;
  const jointVaR = pOne + pBoth > p ? (pBoth > p ? 2 * L : L) : 0;
  const eachES = q <= p ? (L * q) / p : L;
  const jointES = pBoth >= p ? 2 * L : (2 * L * pBoth + L * Math.min(pOne, p - pBoth)) / p;
  return { eachVaR, jointVaR, eachES, jointES, pJoint: pOne + pBoth };
}
