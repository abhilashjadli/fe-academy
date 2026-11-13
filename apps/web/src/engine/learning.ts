/**
 * Chapter G1 — supervised learning, regularisation, validation. Tested against tests/answer-key/key_G1.py (key-G1.json).
 * Everything is least squares with more columns: a polynomial through the last sixty closes (Figure 0); the size of tomorrow's move
 * regressed on the last k sizes (Figure 1); the same with a ridge penalty (Figure 2); five contiguous folds to choose the penalty (Figure 3).
 * Solver: normal equations by Cholesky (symmetric positive definite once λ > 0 or the design has full rank).
 */

// ------------------------------------------------------------------ dense symmetric solve (Cholesky), A x = b
export function solveSPD(A: Float64Array[], b: Float64Array): Float64Array {
  const n = b.length;
  const L: Float64Array[] = A.map((row) => Float64Array.from(row));
  for (let j = 0; j < n; j++) {
    let d = L[j][j];
    for (let k = 0; k < j; k++) d -= L[j][k] * L[j][k];
    if (d <= 0) throw new Error("solveSPD: matrix is not positive definite");
    const s = Math.sqrt(d);
    L[j][j] = s;
    for (let i = j + 1; i < n; i++) {
      let v = L[i][j];
      for (let k = 0; k < j; k++) v -= L[i][k] * L[j][k];
      L[i][j] = v / s;
    }
  }
  const y = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let v = b[i];
    for (let k = 0; k < i; k++) v -= L[i][k] * y[k];
    y[i] = v / L[i][i];
  }
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let v = y[i];
    for (let k = i + 1; k < n; k++) v -= L[k][i] * x[k];
    x[i] = v / L[i][i];
  }
  return x;
}

/** Ridge regression with an unpenalised intercept: β = (XᵀX + λI)⁻¹Xᵀy, I[0][0] = 0. X is rows × k; returns [b0, b1..bk]. */
export function ridge(X: ArrayLike<number>[], y: ArrayLike<number>, lam = 0, cols?: number): Float64Array {
  const k = cols ?? X[0].length;
  const n = y.length;
  const m = k + 1;
  const A: Float64Array[] = Array.from({ length: m }, () => new Float64Array(m));
  const b = new Float64Array(m);
  for (let t = 0; t < n; t++) {
    const row = X[t];
    const yt = y[t];
    A[0][0] += 1;
    b[0] += yt;
    for (let i = 0; i < k; i++) {
      const xi = row[i];
      A[0][i + 1] += xi;
      b[i + 1] += xi * yt;
      for (let j = i; j < k; j++) A[i + 1][j + 1] += xi * row[j];
    }
  }
  for (let i = 0; i < m; i++) for (let j = 0; j < i; j++) A[i][j] = A[j][i];
  for (let i = 1; i < m; i++) A[i][i] += lam;
  return solveSPD(A, b);
}

export function predict(X: ArrayLike<number>[], b: Float64Array): Float64Array {
  const k = b.length - 1;
  const out = new Float64Array(X.length);
  for (let t = 0; t < X.length; t++) {
    let v = b[0];
    const row = X[t];
    for (let i = 0; i < k; i++) v += b[i + 1] * row[i];
    out[t] = v;
  }
  return out;
}

export function mse(X: ArrayLike<number>[], y: ArrayLike<number>, b: Float64Array): number {
  const p = predict(X, b);
  let s = 0;
  for (let t = 0; t < p.length; t++) s += (y[t] - p[t]) ** 2;
  return s / p.length;
}

// ------------------------------------------------------------------ Figure 0: polynomial through the closes
export interface PolyFit {
  degree: number;
  coef: Float64Array;
  fit: Float64Array;
  ext: Float64Array;
  rmseIn: number;
  rmseOut: number;
  day20: number;
}

/** Degree-d polynomial through `seg` on the standardised index, extended `ahead` days; rmseOut against `future`. */
export function polyFit(seg: number[], future: number[], degree: number): PolyFit {
  const n = seg.length;
  const xm = (n - 1) / 2;
  let v = 0;
  for (let i = 0; i < n; i++) v += (i - xm) ** 2;
  const xs = Math.sqrt(v / n);
  const z = (i: number) => (i - xm) / xs;
  const rows: Float64Array[] = Array.from({ length: n }, (_, i) => {
    const r = new Float64Array(degree);
    const zi = z(i);
    let p = zi;
    for (let d = 0; d < degree; d++) {
      r[d] = p;
      p *= zi;
    }
    return r;
  });
  // a hair of ridge keeps the Cholesky alive at degree ≥ 12 (the key's lstsq is exact; readings agree to 1e-7 relative below degree 12, 1e-5 above)
  const b = ridge(rows, seg, degree >= 12 ? 1e-12 : 0);
  const evalAt = (zi: number) => {
    let s = b[0];
    let p = zi;
    for (let d = 0; d < degree; d++) {
      s += b[d + 1] * p;
      p *= zi;
    }
    return s;
  };
  const fit = Float64Array.from({ length: n }, (_, i) => evalAt(z(i)));
  const ext = Float64Array.from({ length: future.length }, (_, j) => evalAt(z(n + j)));
  let si = 0;
  for (let i = 0; i < n; i++) si += (fit[i] - seg[i]) ** 2;
  let so = 0;
  for (let j = 0; j < future.length; j++) so += (ext[j] - future[j]) ** 2;
  return { degree, coef: b, fit, ext, rmseIn: Math.sqrt(si / n), rmseOut: Math.sqrt(so / future.length), day20: ext[ext.length - 1] };
}

// ------------------------------------------------------------------ Figures 1–3: tomorrow's move size from the last k sizes
export interface LagData {
  X: Float64Array[]; // rows × K, newest lag first
  y: Float64Array;
}

/** |r| in percent, lagged design with K columns over rows [lo, hi) of the return record. */
export function lagDesign(returns: ArrayLike<number>, K: number, lo: number, hi: number): LagData {
  const a = Float64Array.from({ length: returns.length }, (_, i) => Math.abs(returns[i]) * 100);
  const X: Float64Array[] = [];
  const y = new Float64Array(hi - lo);
  for (let t = lo; t < hi; t++) {
    const row = new Float64Array(K);
    for (let i = 0; i < K; i++) row[i] = a[t - 1 - i];
    X.push(row);
    y[t - lo] = a[t];
  }
  return { X, y };
}

export function meanOf(y: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < y.length; i++) s += y[i];
  return s / y.length;
}

export function mseOfConstant(y: ArrayLike<number>, c: number): number {
  let s = 0;
  for (let i = 0; i < y.length; i++) s += (y[i] - c) ** 2;
  return s / y.length;
}

/** Train on the first k columns of `train`, score on `test`. */
export function fitK(train: LagData, test: LagData, k: number, lam = 0): { coef: Float64Array; train: number; test: number } {
  const b = ridge(train.X, train.y, lam, k);
  const mseK = (D: LagData) => {
    let s = 0;
    for (let t = 0; t < D.y.length; t++) {
      let v = b[0];
      const row = D.X[t];
      for (let i = 0; i < k; i++) v += b[i + 1] * row[i];
      s += (D.y[t] - v) ** 2;
    }
    return s / D.y.length;
  };
  return { coef: b, train: mseK(train), test: mseK(test) };
}

/** EWMA (λ 0.94) volatility forecast of |r| in percent: √(2/π)·σ_t, seeded with the variance of the first 60 returns. */
export function ewmaAbsForecast(returns: ArrayLike<number>, lam = 0.94, seedN = 60): Float64Array {
  const n = returns.length;
  const s2 = new Float64Array(n);
  let m = 0;
  for (let i = 0; i < seedN; i++) m += returns[i];
  m /= seedN;
  let v = 0;
  for (let i = 0; i < seedN; i++) v += (returns[i] - m) ** 2;
  s2[0] = v / seedN;
  for (let t = 1; t < n; t++) s2[t] = lam * s2[t - 1] + (1 - lam) * returns[t - 1] ** 2;
  return Float64Array.from(s2, (x) => Math.sqrt(2 / Math.PI) * Math.sqrt(x) * 100);
}

/** Contiguous fold index ranges, as numpy.array_split does it. */
export function foldRanges(n: number, folds: number): Array<[number, number]> {
  const base = Math.floor(n / folds);
  const extra = n % folds;
  const out: Array<[number, number]> = [];
  let start = 0;
  for (let f = 0; f < folds; f++) {
    const len = base + (f < extra ? 1 : 0);
    out.push([start, start + len]);
    start += len;
  }
  return out;
}

/** Pooled k-fold cross-validation error of ridge(k columns, λ) over contiguous blocks; also the per-fold errors. */
export function crossValidate(D: LagData, k: number, lam: number, folds = 5): { cv: number; perFold: number[] } {
  const n = D.y.length;
  const ranges = foldRanges(n, folds);
  let total = 0;
  const perFold: number[] = [];
  for (const [lo, hi] of ranges) {
    const Xtr: Float64Array[] = [];
    const ytr: number[] = [];
    for (let t = 0; t < n; t++) {
      if (t >= lo && t < hi) continue;
      Xtr.push(D.X[t]);
      ytr.push(D.y[t]);
    }
    const b = ridge(Xtr, ytr, lam, k);
    let s = 0;
    for (let t = lo; t < hi; t++) {
      let v = b[0];
      const row = D.X[t];
      for (let i = 0; i < k; i++) v += b[i + 1] * row[i];
      s += (D.y[t] - v) ** 2;
    }
    perFold.push(s / (hi - lo));
    total += s;
  }
  return { cv: total / n, perFold };
}

export const pctBetter = (err: number, base: number) => 100 * (1 - err / base);
