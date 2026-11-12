/**
 * Chapter E3 — the efficient frontier and PCA. Tested against tests/answer-key/key_E3.py (engine/__fixtures__/key-E3.json).
 * Returns and risks are fractions per year; σ_P² = wᵀ S w. The frontier with short sales is Merton's closed form; the no-short frontier
 * is the upper envelope of a simplex grid. PCA uses linalg.symEigen (Jacobi), eigenvalues descending, largest-magnitude component positive.
 */
import { symEigen, type Mat } from "./linalg";

export function covFrom(sd: number[], rho: Mat): Mat {
  return sd.map((si, i) => sd.map((sj, j) => si * sj * rho[i][j]));
}

export function portfolioMean(w: number[], mu: number[]): number {
  return w.reduce((s, wi, i) => s + wi * mu[i], 0);
}
export function portfolioRisk(w: number[], S: Mat): number {
  let v = 0;
  for (let i = 0; i < w.length; i++) for (let j = 0; j < w.length; j++) v += w[i] * w[j] * S[i][j];
  return Math.sqrt(Math.max(v, 0));
}

/** two assets: mean and risk of weight w in the first */
export function twoAsset(w: number, a: { mu: number; sd: number }, b: { mu: number; sd: number }, rho: number): { mu: number; sd: number } {
  const mu = w * a.mu + (1 - w) * b.mu;
  const v = w * w * a.sd ** 2 + 2 * w * (1 - w) * rho * a.sd * b.sd + (1 - w) ** 2 * b.sd ** 2;
  return { mu, sd: Math.sqrt(Math.max(v, 0)) };
}
/** the minimum-variance weight in the first of two assets */
export function minVarWeight2(a: { sd: number }, b: { sd: number }, rho: number): number {
  return (b.sd ** 2 - rho * a.sd * b.sd) / (a.sd ** 2 + b.sd ** 2 - 2 * rho * a.sd * b.sd);
}

/** Gauss–Jordan inverse for small symmetric positive-definite matrices */
export function inverse(S: Mat): Mat {
  const n = S.length;
  const A = S.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    const d = A[c][c];
    for (let j = 0; j < 2 * n; j++) A[c][j] /= d;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = A[r][c];
      if (f === 0) continue;
      for (let j = 0; j < 2 * n; j++) A[r][j] -= f * A[c][j];
    }
  }
  return A.map((r) => r.slice(n));
}

export interface FrontierConsts {
  A: number;
  B: number;
  C: number;
  D: number;
}
export function frontierConsts(mu: number[], S: Mat): FrontierConsts & { Si: Mat } {
  const Si = inverse(S);
  const n = mu.length;
  let A = 0;
  let B = 0;
  let C = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      A += Si[i][j];
      B += Si[i][j] * mu[j];
      C += mu[i] * Si[i][j] * mu[j];
    }
  return { A, B, C, D: A * C - B * B, Si };
}

/** minimum-variance weights for target mean m, short sales allowed */
export function frontierWeights(mu: number[], S: Mat, m: number): number[] {
  const { A, B, C, D, Si } = frontierConsts(mu, S);
  const lam = (C - B * m) / D;
  const gam = (A * m - B) / D;
  return Si.map((row) => row.reduce((s, v, j) => s + v * (lam + gam * mu[j]), 0));
}

/** the frontier's risk at target m in closed form: σ² = (A m² − 2 B m + C)/D */
export function frontierRisk(mu: number[], S: Mat, m: number): number {
  const { A, B, C, D } = frontierConsts(mu, S);
  return Math.sqrt((A * m * m - 2 * B * m + C) / D);
}

export function globalMinimum(mu: number[], S: Mat): { w: number[]; mu: number; sd: number } {
  const { A, Si } = frontierConsts(mu, S);
  const w = Si.map((row) => row.reduce((s, v) => s + v, 0) / A);
  return { w, mu: portfolioMean(w, mu), sd: portfolioRisk(w, S) };
}

export function tangency(mu: number[], S: Mat, rf: number): { w: number[]; mu: number; sd: number; sharpe: number } {
  const Si = inverse(S);
  const raw = Si.map((row) => row.reduce((s, v, j) => s + v * (mu[j] - rf), 0));
  const tot = raw.reduce((a, b) => a + b, 0);
  const w = raw.map((v) => v / tot);
  const m = portfolioMean(w, mu);
  const sd = portfolioRisk(w, S);
  return { w, mu: m, sd, sharpe: (m - rf) / sd };
}

/** the best mean at or below risk `sd` on the upper branch of the frontier (m ≥ the global minimum's) */
export function bestMeanAtRisk(mu: number[], S: Mat, sd: number): { m: number; w: number[] } {
  const { A, B, C, D } = frontierConsts(mu, S);
  // A m² − 2 B m + C − D sd² = 0, upper root
  const disc = 4 * B * B - 4 * A * (C - D * sd * sd);
  const m = (2 * B + Math.sqrt(Math.max(disc, 0))) / (2 * A);
  return { m, w: frontierWeights(mu, S, m) };
}

/** the no-short frontier: upper envelope of mean against risk over a simplex grid with the given step */
export function noShortEnvelope(mu: number[], S: Mat, step = 0.02): { sd: number; m: number; w: number[] }[] {
  const n = mu.length;
  const k = Math.round(1 / step);
  const pts: { sd: number; m: number; w: number[] }[] = [];
  const w = new Array<number>(n).fill(0);
  const rec = (i: number, left: number) => {
    if (i === n - 1) {
      w[i] = left * step;
      const ww = w.slice();
      pts.push({ sd: portfolioRisk(ww, S), m: portfolioMean(ww, mu), w: ww });
      return;
    }
    for (let c = 0; c <= left; c++) {
      w[i] = c * step;
      rec(i + 1, left - c);
    }
  };
  rec(0, k);
  pts.sort((a, b) => a.sd - b.sd || a.m - b.m);
  const env: { sd: number; m: number; w: number[] }[] = [];
  let mx = -Infinity;
  for (const p of pts)
    if (p.m > mx + 1e-12) {
      mx = p.m;
      env.push(p);
    }
  return env;
}

// ---------------------------------------------------------------------------------------------------------------------
// PCA

export interface PCA {
  values: number[];
  vectors: number[][];
  shares: number[];
  cum: number[];
  total: number;
}

export function pca(S: Mat): PCA {
  const { values, vectors } = symEigen(S);
  const total = values.reduce((a, b) => a + b, 0);
  const shares = values.map((v) => v / total);
  const cum = shares.map((_, i) => shares.slice(0, i + 1).reduce((a, b) => a + b, 0));
  return { values, vectors, shares, cum, total };
}

/** scores of a change vector on the first k components, and the change rebuilt from them */
export function reconstruct(p: PCA, x: number[], k: number): { scores: number[]; rebuilt: number[]; error: number } {
  const scores = p.vectors.slice(0, k).map((e) => e.reduce((s, ei, i) => s + ei * x[i], 0));
  const rebuilt = x.map((_, i) => scores.reduce((s, sc, j) => s + sc * p.vectors[j][i], 0));
  const error = Math.sqrt(rebuilt.reduce((s, v, i) => s + (v - x[i]) ** 2, 0) / x.length);
  return { scores, rebuilt, error };
}

/** variance of the projection onto a unit direction at angle θ in two dimensions */
export function projectedVariance2(S: Mat, theta: number): number {
  const u = [Math.cos(theta), Math.sin(theta)];
  return u[0] * u[0] * S[0][0] + 2 * u[0] * u[1] * S[0][1] + u[1] * u[1] * S[1][1];
}

/** Hull Table 16.5: a book's exposures per tenor collapsed onto factor loadings, with the factors' sds */
export function factorExposure(exposures: number[], loadings: number[][], sds: number[]): { f: number[]; sd: number } {
  const f = loadings.map((row) => row.reduce((s, l, i) => s + l * exposures[i], 0));
  const sd = Math.sqrt(f.reduce((s, fi, i) => s + (fi * sds[i]) ** 2, 0));
  return { f, sd };
}

/** Nelson–Siegel–Svensson spot rate in CCIL's parameterisation */
export function nss(m: number, p: { b0: number; b1: number; b2: number; b3: number; t1: number; t2: number }): number {
  const a = (1 - Math.exp(-m / p.t1)) / (m / p.t1);
  const c = (1 - Math.exp(-m / p.t2)) / (m / p.t2);
  return p.b0 + (p.b1 + p.b2) * a - p.b2 * Math.exp(-m / p.t1) + p.b3 * c - p.b3 * Math.exp(-m / p.t2);
}
