/** Chapter A3: ordinary least squares with honest and dishonest standard errors, residual diagnostics, random walks. */
import { normalSample } from "./random";

export interface Fit {
  slope: number;
  intercept: number;
  r2: number;
  /** naive (textbook) standard error of the slope */
  se: number;
  /** White heteroskedasticity-consistent (HC0) */
  seHC: number;
  /** Newey–West HAC with Bartlett kernel, `lags` lags */
  seHAC: number;
  resid: number[];
  fitted: number[];
  dw: number;
  n: number;
  sigma2: number;
}

export function mean(xs: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += xs[i];
  return s / xs.length;
}

/** Simple regression y = a + b x with naive, White and Newey–West slope standard errors. */
export function ols(x: number[], y: number[], lags = 4): Fit {
  const n = x.length;
  const mx = mean(x),
    my = mean(y);
  let sxx = 0,
    sxy = 0,
    syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx,
      dy = y[i] - my;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const fitted = x.map((v) => intercept + slope * v);
  const resid = y.map((v, i) => v - fitted[i]);
  const sse = resid.reduce((s, e) => s + e * e, 0);
  const r2 = 1 - sse / syy;
  const sigma2 = sse / (n - 2);
  const se = Math.sqrt(sigma2 / sxx);
  // HC0: Var(b) = Σ (x−x̄)² e² / sxx²
  let hc = 0;
  for (let i = 0; i < n; i++) hc += (x[i] - mx) ** 2 * resid[i] ** 2;
  const seHC = Math.sqrt(hc) / sxx;
  // HAC (Newey–West, Bartlett): S = Σ_t u_t² + 2 Σ_l w_l Σ_t u_t u_{t−l},  u_t = (x_t−x̄) e_t
  const u = x.map((v, i) => (v - mx) * resid[i]);
  let S = u.reduce((s, a) => s + a * a, 0);
  for (let l = 1; l <= lags; l++) {
    const w = 1 - l / (lags + 1);
    let c = 0;
    for (let t = l; t < n; t++) c += u[t] * u[t - l];
    S += 2 * w * c;
  }
  const seHAC = Math.sqrt(S) / sxx;
  let dnum = 0;
  for (let i = 1; i < n; i++) dnum += (resid[i] - resid[i - 1]) ** 2;
  const dw = dnum / sse;
  return { slope, intercept, r2, se, seHC, seHAC, resid, fitted, dw, n, sigma2 };
}

/** Sample autocorrelation of a series at lags 1..k. */
export function acf(xs: number[], k: number): number[] {
  const m = mean(xs);
  const n = xs.length;
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

/** A random walk of n steps (±1 coin by default, or normal). */
export function randomWalk(n: number, next: () => number, coin = true): number[] {
  const out = [0];
  for (let i = 1; i <= n; i++) out.push(out[i - 1] + (coin ? (next() < 0.5 ? -1 : 1) : normalSample(next)));
  return out;
}

/** First differences. */
export function diff(xs: number[]): number[] {
  return xs.slice(1).map((v, i) => v - xs[i]);
}

/** Variance inflation factor for x1 given x2 in a two-regressor model: 1/(1 − r²). */
export function vif(x1: number[], x2: number[]): number {
  const f = ols(x2, x1);
  return 1 / (1 - f.r2);
}

/** Two-regressor OLS (with intercept) by normal equations — for the Twins panel. Returns [a, b1, b2] and their naive SEs. */
export function ols2(x1: number[], x2: number[], y: number[]): { coef: number[]; se: number[]; r2: number } {
  const n = y.length;
  // X'X and X'y for X = [1, x1, x2]
  const cols = [new Array(n).fill(1), x1, x2];
  const XtX = cols.map((a) => cols.map((b) => a.reduce((s, v, i) => s + v * b[i], 0)));
  const Xty = cols.map((a) => a.reduce((s, v, i) => s + v * y[i], 0));
  const inv = inv3(XtX);
  const coef = inv.map((row) => row.reduce((s, v, j) => s + v * Xty[j], 0));
  const fitted = y.map((_, i) => coef[0] + coef[1] * x1[i] + coef[2] * x2[i]);
  const sse = y.reduce((s, v, i) => s + (v - fitted[i]) ** 2, 0);
  const my = mean(y);
  const syy = y.reduce((s, v) => s + (v - my) ** 2, 0);
  const s2 = sse / (n - 3);
  return { coef, se: inv.map((row, i) => Math.sqrt(s2 * row[i])), r2: 1 - sse / syy };
}

function inv3(m: number[][]): number[][] {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h,
    B = -(d * i - f * g),
    C = d * h - e * g;
  const det = a * A + b * B + c * C;
  const D = -(b * i - c * h),
    E = a * i - c * g,
    F = -(a * h - b * g);
  const G = b * f - c * e,
    H = -(a * f - c * d),
    I = a * e - b * d;
  return [
    [A / det, D / det, G / det],
    [B / det, E / det, H / det],
    [C / det, F / det, I / det],
  ];
}
