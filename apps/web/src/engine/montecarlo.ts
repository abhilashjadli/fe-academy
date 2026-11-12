/**
 * Chapter E2 — Monte Carlo. Tested against tests/answer-key/key_E2.py (engine/__fixtures__/key-E2.json), which ports this file's
 * generator (mulberry32 + Box–Muller, engine/random.ts) bit for bit, so every seeded experiment here is reproduced by the key exactly.
 * Conventions: forward form, S_T = F exp(-σ²T/2 + σ√T Z); payoffs discounted at e^{-rT}; SE = sample sd (n − 1) / √n.
 */
import { black76 } from "./bs";
import { cdf, pdf, quantile } from "./normal";
import { normalSample, rng } from "./random";

export interface Chain {
  F: number;
  K: number;
  r: number;
  T: number;
  sigma: number;
}

export function normals(seed: number, n: number): Float64Array {
  const next = rng(seed);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = normalSample(next);
  return out;
}

export function terminal(c: Chain, z: number): number {
  const st = c.sigma * Math.sqrt(c.T);
  return c.F * Math.exp(-0.5 * st * st + st * z);
}
export function callPayoff(c: Chain, z: number): number {
  return Math.exp(-c.r * c.T) * Math.max(terminal(c, z) - c.K, 0);
}
export function straddlePayoff(c: Chain, z: number): number {
  return Math.exp(-c.r * c.T) * Math.abs(terminal(c, z) - c.K);
}

export interface Estimate {
  mean: number;
  sd: number;
  se: number;
  n: number;
}
export function estimate(y: ArrayLike<number>): Estimate {
  const n = y.length;
  let m = 0;
  for (let i = 0; i < n; i++) m += y[i];
  m /= n;
  let v = 0;
  for (let i = 0; i < n; i++) v += (y[i] - m) ** 2;
  const sd = Math.sqrt(v / (n - 1));
  return { mean: m, sd, se: sd / Math.sqrt(n), n };
}

/** plain estimate of the call from n seeded dots */
export function experiment(c: Chain, seed: number, n: number, pay: (c: Chain, z: number) => number = callPayoff): Estimate & { z: Float64Array; y: Float64Array } {
  const z = normals(seed, n);
  const y = Float64Array.from(z, (v) => pay(c, v));
  return { ...estimate(y), z, y };
}

/** antithetic: the first n/2 dots and their mirrors; ratio = (var of n independent)/2 ÷ var of the n/2 pair means */
export function antithetic(c: Chain, seed: number, n: number, pay: (c: Chain, z: number) => number = callPayoff) {
  const z = normals(seed, n);
  const half = n >> 1;
  const y = Float64Array.from(z, (v) => pay(c, v));
  const pairs = new Float64Array(half);
  for (let i = 0; i < half; i++) pairs[i] = 0.5 * (pay(c, z[i]) + pay(c, -z[i]));
  const e = estimate(pairs);
  const plain = estimate(y);
  return { ...e, ratio: plain.sd ** 2 / 2 / e.sd ** 2, plainSe: plain.se };
}

/** control variate with X = S_T (E X = F): Y − b (X − F), b = sample Cov / Var */
export function controlVariate(c: Chain, seed: number, n: number) {
  const z = normals(seed, n);
  const x = Float64Array.from(z, (v) => terminal(c, v));
  const y = Float64Array.from(z, (v) => callPayoff(c, v));
  const ex = estimate(x);
  const ey = estimate(y);
  let cov = 0;
  for (let i = 0; i < n; i++) cov += (x[i] - ex.mean) * (y[i] - ey.mean);
  cov /= n - 1;
  const b = cov / ex.sd ** 2;
  const adj = Float64Array.from(y, (v, i) => v - b * (x[i] - c.F));
  const e = estimate(adj);
  return { ...e, b, rho: cov / (ex.sd * ey.sd), plainSe: ey.se };
}

/** least-squares slope of log(se) on log(n) */
export function logLogSlope(ns: number[], ses: number[]): number {
  const x = ns.map(Math.log);
  const y = ses.map(Math.log);
  const mx = x.reduce((a, b) => a + b, 0) / x.length;
  const my = y.reduce((a, b) => a + b, 0) / y.length;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
  }
  return sxy / sxx;
}

// ---------------------------------------------------------------------------------------------------------------------
// exact quantities by quadrature over the standard normal

export function expectation(f: (z: number) => number, lo = -12, hi = 12, n = 24001): number {
  const h = (hi - lo) / (n - 1);
  let s = 0;
  for (let i = 0; i < n; i++) {
    const z = lo + i * h;
    const w = i === 0 || i === n - 1 ? 0.5 : 1;
    s += w * f(z) * pdf(z);
  }
  return s * h;
}

/** correlation between S_T and a payoff, and the antithetic pair ratio, exactly */
export function exactCall(c: Chain) {
  const f = (z: number) => callPayoff(c, z);
  const m1 = expectation(f);
  const v = expectation((z) => f(z) ** 2) - m1 * m1;
  const pair = expectation((z) => 0.25 * (f(z) + f(-z)) ** 2) - m1 * m1;
  const ex = expectation((z) => terminal(c, z));
  const vx = expectation((z) => terminal(c, z) ** 2) - ex * ex;
  const cxy = expectation((z) => terminal(c, z) * f(z)) - ex * m1;
  const g = (z: number) => straddlePayoff(c, z);
  const s1 = expectation(g);
  const vs = expectation((z) => g(z) ** 2) - s1 * s1;
  const pairS = expectation((z) => 0.25 * (g(z) + g(-z)) ** 2) - s1 * s1;
  return { mean: m1, sd: Math.sqrt(v), antiRatio: v / 2 / pair, rho: cxy / Math.sqrt(vx * v), b: cxy / vx, straddleMean: s1, straddleAntiRatio: vs / 2 / pairS };
}

/** Glasserman Table 4.1: ρ(S_T, discounted call payoff) in spot form */
export function rhoSpot(S0: number, sigma: number, r: number, T: number, K: number): number {
  const st = sigma * Math.sqrt(T);
  const S = (z: number) => S0 * Math.exp((r - 0.5 * sigma * sigma) * T + st * z);
  const f = (z: number) => Math.exp(-r * T) * Math.max(S(z) - K, 0);
  const ex = expectation(S);
  const vx = expectation((z) => S(z) ** 2) - ex * ex;
  const ef = expectation(f);
  const vf = expectation((z) => f(z) ** 2) - ef * ef;
  const cv = expectation((z) => S(z) * f(z)) - ex * ef;
  return cv / Math.sqrt(vx * vf);
}

// ---------------------------------------------------------------------------------------------------------------------
// the Asian what-if: fixings at times t[0..n-1] (years from today), exact log steps, normals drawn path by path in fixing order

export interface AsianRun {
  arith: Float64Array;
  geo: Float64Array;
  paths: Float64Array[];
  payArith: Float64Array;
  payGeo: Float64Array;
}

export function asianPaths(c: Chain, t: number[], seed: number, n: number): AsianRun {
  const m = t.length;
  const z = normals(seed, n * m);
  const dts = t.map((ti, i) => ti - (i ? t[i - 1] : 0));
  const D = Math.exp(-c.r * c.T);
  const arith = new Float64Array(n);
  const geo = new Float64Array(n);
  const payArith = new Float64Array(n);
  const payGeo = new Float64Array(n);
  const paths: Float64Array[] = [];
  for (let p = 0; p < n; p++) {
    let logS = Math.log(c.F);
    let sum = 0;
    let lsum = 0;
    const path = new Float64Array(m);
    for (let i = 0; i < m; i++) {
      logS += -0.5 * c.sigma * c.sigma * dts[i] + c.sigma * Math.sqrt(dts[i]) * z[p * m + i];
      const S = Math.exp(logS);
      path[i] = S;
      sum += S;
      lsum += logS;
    }
    arith[p] = sum / m;
    geo[p] = Math.exp(lsum / m);
    payArith[p] = D * Math.max(arith[p] - c.K, 0);
    payGeo[p] = D * Math.max(geo[p] - c.K, 0);
    if (p < 50) paths.push(path);
  }
  return { arith, geo, paths, payArith, payGeo };
}

/** geometric-average call in closed form: ln G ~ N(ln F − σ² t̄/2, σ² Σᵢⱼ min(tᵢ,tⱼ)/m²) */
export function geometricAsian(c: Chain, t: number[]): { price: number; muG: number; vG: number } {
  const m = t.length;
  const tbar = t.reduce((a, b) => a + b, 0) / m;
  let s = 0;
  for (const a of t) for (const b of t) s += Math.min(a, b);
  const vG = (c.sigma * c.sigma * s) / (m * m);
  const muG = Math.log(c.F) - 0.5 * c.sigma * c.sigma * tbar;
  const d = (muG - Math.log(c.K)) / Math.sqrt(vG);
  const price = Math.exp(-c.r * c.T) * (Math.exp(muG + 0.5 * vG) * cdf(d + Math.sqrt(vG)) - c.K * cdf(d));
  return { price, muG, vG };
}

/** the arithmetic Asian corrected by the geometric control */
export function asianControl(run: AsianRun, geoPrice: number) {
  const a = estimate(run.payArith);
  const g = estimate(run.payGeo);
  let cov = 0;
  for (let i = 0; i < run.payArith.length; i++) cov += (run.payArith[i] - a.mean) * (run.payGeo[i] - g.mean);
  cov /= run.payArith.length - 1;
  const b = cov / g.sd ** 2;
  const adj = Float64Array.from(run.payArith, (v, i) => v - b * (run.payGeo[i] - geoPrice));
  const e = estimate(adj);
  return { ...e, b, ratio: a.sd ** 2 / e.sd ** 2, plain: a };
}

// ---------------------------------------------------------------------------------------------------------------------
// Monte Carlo VaR on Raj's book with two correlated risks (index move x, relative vol move dv)

export interface TwoFactorBook extends Chain {
  short: number;
  sigDay: number;
  volRelSd: number;
}

export function mcVaR(b: TwoFactorBook, seed: number, n: number, rho: number, h: number, volMoves = true, p = 0.01) {
  const z = normals(seed, 2 * n);
  const c0 = black76({ F: b.F, K: b.K, r: b.r, sigma: b.sigma, T: b.T });
  const pnl = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const z1 = z[2 * i];
    const z2 = z[2 * i + 1];
    const x = b.sigDay * z1;
    const dv = volMoves ? b.volRelSd * (rho * z1 + Math.sqrt(1 - rho * rho) * z2) : 0;
    const F1 = b.F * Math.exp(x);
    const c1 = black76({ F: F1, K: b.K, r: b.r, sigma: b.sigma * (1 + dv), T: b.T - 1 / 365 });
    pnl[i] = h * (F1 - b.F) - b.short * (c1 - c0);
  }
  const loss = Float64Array.from(pnl, (v) => -v).sort((a, c) => c - a);
  const k = Math.ceil(p * n - 1e-12);
  let es = 0;
  for (let i = 0; i < k; i++) es += loss[i];
  return { var: loss[k - 1], es: es / k, pnl, k };
}

/** bootstrap sd of the p-quantile loss from the sample itself (seeded) */
export function bootstrapQuantileSd(pnl: Float64Array, p: number, seed: number, reps = 400): number {
  const next = rng(seed);
  const n = pnl.length;
  const k = Math.ceil(p * n - 1e-12);
  const qs: number[] = [];
  const tmp = new Float64Array(n);
  for (let r = 0; r < reps; r++) {
    for (let i = 0; i < n; i++) tmp[i] = -pnl[Math.floor(next() * n)];
    const s = Float64Array.from(tmp).sort((a, b) => b - a);
    qs.push(s[k - 1]);
  }
  return estimate(qs).sd;
}

/** standard error of the p-quantile for a normal of sd s: √(p(1−p)/n)/f(q) */
export function quantileSeNormal(s: number, p: number, n: number): number {
  const q = quantile(p);
  return Math.sqrt((p * (1 - p)) / n) / (pdf(q) / s);
}

/** π by darts: estimate 4·inside/n and its standard error */
export function piDarts(seed: number, n: number): { estimate: number; se: number; inside: number } {
  const next = rng(seed);
  let inside = 0;
  for (let i = 0; i < n; i++) {
    const x = next();
    const y = next();
    if (x * x + y * y <= 1) inside++;
  }
  const p = inside / n;
  return { estimate: 4 * p, se: 4 * Math.sqrt((p * (1 - p)) / n), inside };
}
