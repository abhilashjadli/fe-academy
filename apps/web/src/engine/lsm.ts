/**
 * Chapter F2 — Longstaff–Schwartz, calibration, automatic differentiation. Tested against tests/answer-key/key_F2.py (key-F2.json).
 * LSM as Hull §20.9 / Longstaff–Schwartz 2001: at each exercise date (backwards) regress the discounted later cash flow on (1, S, S²) over the
 * in-the-money paths, exercise where intrinsic beats the fit. Dual numbers for forward-mode AD through Black-76. SABR via engine/volmodels.
 */
import { cdf, pdf } from "./normal";
import { normalSample, rng } from "./random";

// ------------------------------------------------------------------ least squares on a small design (normal equations, ≤ 4 columns)
export function lstsq(cols: number[][], y: number[]): number[] {
  const m = cols.length;
  const n = y.length;
  const A: number[][] = Array.from({ length: m }, () => new Array<number>(m + 1).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += cols[i][k] * cols[j][k];
      A[i][j] = s;
    }
    let s = 0;
    for (let k = 0; k < n; k++) s += cols[i][k] * y[k];
    A[i][m] = s;
  }
  for (let c = 0; c < m; c++) {
    let p = c;
    for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < m; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let j = c; j <= m; j++) A[r][j] -= f * A[c][j];
    }
  }
  return A.map((row, i) => row[m] / row[i]);
}

// ------------------------------------------------------------------ Hull's eight paths
export interface SmallRound {
  t: number;
  paths: number[];
  S: number[];
  Y: number[];
  coef: number[];
  continuation: number[];
  exerciseValue: number[];
  exercise: boolean[];
}

/** LSM on a handful of given paths (prices at t = 0 … steps), put struck at K, discount factor D per step */
export function lsmSmall(paths: number[][], K: number, D: number): { price: number; cash: number[][]; rounds: SmallRound[] } {
  const n = paths.length;
  const steps = paths[0].length - 1;
  const cash = paths.map(() => new Array<number>(steps + 1).fill(0));
  for (let i = 0; i < n; i++) cash[i][steps] = Math.max(K - paths[i][steps], 0);
  const rounds: SmallRound[] = [];
  for (let t = steps - 1; t >= 1; t--) {
    const itm = paths.map((p, i) => (K - p[t] > 0 ? i : -1)).filter((i) => i >= 0);
    const S = itm.map((i) => paths[i][t]);
    const Y = itm.map((i) => {
      let s = 0;
      for (let u = t + 1; u <= steps; u++) s += cash[i][u] * D ** (u - t);
      return s;
    });
    const coef = lstsq([S.map(() => 1), S, S.map((s) => s * s)], Y);
    const continuation = S.map((s) => coef[0] + coef[1] * s + coef[2] * s * s);
    const exerciseValue = S.map((s) => K - s);
    const exercise = exerciseValue.map((e, k) => e > continuation[k]);
    itm.forEach((i, k) => {
      if (exercise[k]) {
        cash[i].fill(0);
        cash[i][t] = exerciseValue[k];
      }
    });
    rounds.push({ t, paths: itm.map((i) => i + 1), S, Y, coef, continuation, exerciseValue, exercise });
  }
  let pv = 0;
  for (let i = 0; i < n; i++) for (let u = 1; u <= steps; u++) pv += cash[i][u] * D ** u;
  return { price: pv / n, cash, rounds };
}

// ------------------------------------------------------------------ LSM at scale
export interface LsmModel {
  S0: number;
  K: number;
  r: number;
  sigma: number;
  T: number;
  steps: number;
}

export function gbmPaths(m: LsmModel, Z: Float64Array, n: number): Float64Array {
  const dt = m.T / m.steps;
  const out = new Float64Array(n * m.steps);
  for (let p = 0; p < n; p++) {
    let logS = Math.log(m.S0);
    for (let i = 0; i < m.steps; i++) {
      logS += (m.r - 0.5 * m.sigma * m.sigma) * dt + m.sigma * Math.sqrt(dt) * Z[p * m.steps + i];
      out[p * m.steps + i] = Math.exp(logS);
    }
  }
  return out;
}

export function seededPaths(m: LsmModel, seed: number, n: number): Float64Array {
  const next = rng(seed);
  const Z = new Float64Array(n * m.steps);
  for (let i = 0; i < Z.length; i++) Z[i] = normalSample(next);
  return gbmPaths(m, Z, n);
}

export interface LsmResult {
  price: number;
  se: number;
  /** highest exercised S per date (date 1 … steps−1), 0 where none */
  boundary: number[];
  european: number;
}

/** American put by LSM on paths laid out as [path][step]; basis (1, x, x²[, x³]) with x = S/K */
export function lsmPrice(m: LsmModel, paths: Float64Array, n: number, basis: "quad" | "cubic" = "quad"): LsmResult {
  const { K, steps } = m;
  const dt = m.T / steps;
  const D = Math.exp(-m.r * dt);
  const V = new Float64Array(n);
  for (let p = 0; p < n; p++) V[p] = Math.max(K - paths[p * steps + steps - 1], 0);
  let euro = 0;
  for (let p = 0; p < n; p++) euro += V[p];
  euro = (euro / n) * Math.exp(-m.r * m.T);
  const boundary: number[] = [];
  for (let t = steps - 2; t >= 0; t--) {
    for (let p = 0; p < n; p++) V[p] *= D;
    const idx: number[] = [];
    for (let p = 0; p < n; p++) if (K - paths[p * steps + t] > 0) idx.push(p);
    if (idx.length >= 3) {
      const x = idx.map((p) => paths[p * steps + t] / K);
      const cols = [x.map(() => 1), x, x.map((v) => v * v)];
      if (basis === "cubic") cols.push(x.map((v) => v * v * v));
      const coef = lstsq(
        cols,
        idx.map((p) => V[p]),
      );
      let bind = 0;
      idx.forEach((p, k) => {
        const xv = x[k];
        let cont = coef[0] + coef[1] * xv + coef[2] * xv * xv;
        if (basis === "cubic") cont += coef[3] * xv * xv * xv;
        const ex = K - paths[p * steps + t];
        if (ex > cont) {
          V[p] = ex;
          if (paths[p * steps + t] > bind) bind = paths[p * steps + t];
        }
      });
      boundary.push(bind);
    } else boundary.push(0);
  }
  let mean = 0;
  for (let p = 0; p < n; p++) {
    V[p] *= D;
    mean += V[p];
  }
  mean /= n;
  let v = 0;
  for (let p = 0; p < n; p++) v += (V[p] - mean) ** 2;
  return { price: mean, se: Math.sqrt(v / (n - 1)) / Math.sqrt(n), boundary: boundary.reverse(), european: euro };
}

// ------------------------------------------------------------------ dual numbers (forward-mode AD)
export class Dual {
  v: number;
  d: number;
  constructor(v: number, d = 0) {
    this.v = v;
    this.d = d;
  }
  static c(v: number) {
    return new Dual(v, 0);
  }
  add(o: Dual | number) {
    const q = typeof o === "number" ? Dual.c(o) : o;
    return new Dual(this.v + q.v, this.d + q.d);
  }
  sub(o: Dual | number) {
    const q = typeof o === "number" ? Dual.c(o) : o;
    return new Dual(this.v - q.v, this.d - q.d);
  }
  mul(o: Dual | number) {
    const q = typeof o === "number" ? Dual.c(o) : o;
    return new Dual(this.v * q.v, this.v * q.d + this.d * q.v);
  }
  div(o: Dual | number) {
    const q = typeof o === "number" ? Dual.c(o) : o;
    return new Dual(this.v / q.v, (this.d * q.v - this.v * q.d) / (q.v * q.v));
  }
  neg() {
    return new Dual(-this.v, -this.d);
  }
}
export const dlog = (x: Dual) => new Dual(Math.log(x.v), x.d / x.v);
export const dsqrt = (x: Dual) => {
  const r = Math.sqrt(x.v);
  return new Dual(r, x.d / (2 * r));
};
export const dexp = (x: Dual) => {
  const e = Math.exp(x.v);
  return new Dual(e, e * x.d);
};
export const dcdf = (x: Dual) => new Dual(cdf(x.v), pdf(x.v) * x.d);

export interface TapeNode {
  node: string;
  value: number;
  d: number;
}

/** Black-76 call on dual inputs; the tape records each intermediate value and its derivative */
export function black76Dual(F: Dual, K: Dual, r: Dual, T: Dual, sigma: Dual): { price: Dual; tape: TapeNode[] } {
  const tape: TapeNode[] = [];
  const lg = dlog(F.div(K));
  tape.push({ node: "ln(F/K)", value: lg.v, d: lg.d });
  const st = sigma.mul(dsqrt(T));
  const d1 = lg.add(st.mul(st).mul(0.5)).div(st);
  tape.push({ node: "d1", value: d1.v, d: d1.d });
  const d2 = d1.sub(st);
  tape.push({ node: "d2", value: d2.v, d: d2.d });
  const N1 = dcdf(d1);
  tape.push({ node: "N(d1)", value: N1.v, d: N1.d });
  const N2 = dcdf(d2);
  tape.push({ node: "N(d2)", value: N2.v, d: N2.d });
  const D = dexp(r.mul(T).neg());
  const price = D.mul(F.mul(N1).sub(K.mul(N2)));
  tape.push({ node: "price", value: price.v, d: price.d });
  return { price, tape };
}

export type Seed = "F" | "sigma" | "T" | "r";
/** the derivative of the Black-76 call with respect to one input, by seeding that input's dual part with 1 */
export function adGreek(p: { F: number; K: number; r: number; T: number; sigma: number }, seed: Seed): { value: number; tape: TapeNode[] } {
  const F = new Dual(p.F, seed === "F" ? 1 : 0);
  const sig = new Dual(p.sigma, seed === "sigma" ? 1 : 0);
  const T = new Dual(p.T, seed === "T" ? 1 : 0);
  const r = new Dual(p.r, seed === "r" ? 1 : 0);
  const { price, tape } = black76Dual(F, Dual.c(p.K), r, T, sig);
  return { value: seed === "T" ? -price.d : price.d, tape };
}

export function black76Plain(p: { F: number; K: number; r: number; T: number; sigma: number }): number {
  return black76Dual(Dual.c(p.F), Dual.c(p.K), Dual.c(p.r), Dual.c(p.T), Dual.c(p.sigma)).price.v;
}

/** bump-and-revalue delta, forward and central, at relative bump `rel` */
export function bumpDelta(p: { F: number; K: number; r: number; T: number; sigma: number }, rel: number): { forward: number; central: number } {
  const h = rel * p.F;
  const up = black76Plain({ ...p, F: p.F + h });
  const dn = black76Plain({ ...p, F: p.F - h });
  const base = black76Plain(p);
  return { forward: (up - base) / h, central: (up - dn) / (2 * h) };
}

/** Monte Carlo delta of the call: pathwise, bump with common random numbers, bump with fresh numbers */
export function mcDelta(p: { F: number; K: number; r: number; T: number; sigma: number }, seed: number, seedIndep: number, n: number, rel: number) {
  const st = p.sigma * Math.sqrt(p.T);
  const D = Math.exp(-p.r * p.T);
  const z = (() => {
    const next = rng(seed);
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) out[i] = normalSample(next);
    return out;
  })();
  const z2 = (() => {
    const next = rng(seedIndep);
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) out[i] = normalSample(next);
    return out;
  })();
  const h = rel * p.F;
  const pw = new Float64Array(n);
  const crn = new Float64Array(n);
  const ind = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const g = Math.exp(-0.5 * st * st + st * z[i]);
    const ST = p.F * g;
    pw[i] = D * (ST > p.K ? 1 : 0) * (ST / p.F);
    crn[i] = (D * (Math.max((p.F + h) * g - p.K, 0) - Math.max((p.F - h) * g - p.K, 0))) / (2 * h);
    const g2 = Math.exp(-0.5 * st * st + st * z2[i]);
    ind[i] = (D * (Math.max((p.F + h) * g2 - p.K, 0) - Math.max(ST - p.K, 0))) / h;
  }
  const stat = (x: Float64Array) => {
    let m = 0;
    for (const v of x) m += v;
    m /= n;
    let s = 0;
    for (const v of x) s += (v - m) ** 2;
    return { mean: m, se: Math.sqrt(s / (n - 1)) / Math.sqrt(n) };
  };
  return { pathwise: stat(pw), bumpCrn: stat(crn), bumpIndep: stat(ind) };
}

// ------------------------------------------------------------------ calibration helpers (SABR via volmodels)
export function rmsVolPts(model: number[], market: number[]): number {
  let s = 0;
  for (let i = 0; i < market.length; i++) s += (model[i] - market[i]) ** 2;
  return 100 * Math.sqrt(s / market.length);
}

/** SABR β = 1: the α that reproduces the at-the-money vol for given ρ, ν (fixed point of Hagan's ATM formula) */
export function alphaForAtm(atm: number, rho: number, nu: number, T: number): number {
  let a = atm;
  for (let i = 0; i < 50; i++) a = atm / (1 + (0.25 * rho * nu * a + ((2 - 3 * rho * rho) / 24) * nu * nu) * T);
  return a;
}
