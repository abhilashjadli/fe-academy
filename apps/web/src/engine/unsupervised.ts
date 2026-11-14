/**
 * Chapter G2 — unsupervised: clustering, PCA, autoencoders. Tested against tests/answer-key/key_G2.py (key-G2.json).
 * All on the real NIFTY record. k-means is Lloyd's algorithm with mulberry32-seeded starts (the key ports the RNG bit for bit, so a run is a
 * tested number); PCA is engine/linalg.symEigen on the 20-day windows of move sizes; the autoencoder is full-batch gradient descent with a
 * seeded initialisation, reproduced by the key to the last digit.
 */
import { symEigen } from "./linalg";
import { normalSample, rng } from "./random";

export type Pt = [number, number];

// ------------------------------------------------------------------ features: today's move, trailing realised vol
export function dayFeatures(returns: ArrayLike<number>, W = 20): { points: Pt[]; mean: Pt; sd: Pt } {
  const n = returns.length;
  const points: Pt[] = [];
  for (let t = W; t < n; t++) {
    let s = 0;
    for (let i = t - W; i < t; i++) s += returns[i] * returns[i];
    points.push([100 * returns[t], 100 * Math.sqrt((252 * s) / W)]);
  }
  const m = points.length;
  const mean: Pt = [0, 0];
  for (const p of points) {
    mean[0] += p[0] / m;
    mean[1] += p[1] / m;
  }
  const sd: Pt = [0, 0];
  for (const p of points) {
    sd[0] += (p[0] - mean[0]) ** 2 / m;
    sd[1] += (p[1] - mean[1]) ** 2 / m;
  }
  sd[0] = Math.sqrt(sd[0]);
  sd[1] = Math.sqrt(sd[1]);
  return { points, mean, sd };
}

export function standardise(points: Pt[], mean: Pt, sd: Pt): Pt[] {
  return points.map(([a, b]) => [(a - mean[0]) / sd[0], (b - mean[1]) / sd[1]]);
}

// ------------------------------------------------------------------ k-means (Lloyd)
export interface KmRound {
  round: number;
  centres: Pt[];
  sizes: number[];
  spread: number;
}
export interface KmResult {
  init: number[];
  centres: Pt[];
  labels: Int32Array;
  sizes: number[];
  spread: number;
  rounds: number;
  trace: KmRound[];
}

/** One Lloyd assignment: every point to its nearest centre; the pile sizes and the within-pile spread. Exported for the step-through's colouring. */
export function assign(Q: Pt[], C: Pt[]): { labels: Int32Array; spread: number; sizes: number[] } {
  const labels = new Int32Array(Q.length);
  const sizes = new Array<number>(C.length).fill(0);
  let spread = 0;
  for (let i = 0; i < Q.length; i++) {
    let best = 0;
    let bd = Infinity;
    for (let j = 0; j < C.length; j++) {
      const d = (Q[i][0] - C[j][0]) ** 2 + (Q[i][1] - C[j][1]) ** 2;
      if (d < bd) {
        bd = d;
        best = j;
      }
    }
    labels[i] = best;
    sizes[best]++;
    spread += bd;
  }
  return { labels, spread, sizes };
}

function recentre(Q: Pt[], labels: Int32Array, C: Pt[]): Pt[] {
  const k = C.length;
  const sx = new Array<number>(k).fill(0);
  const sy = new Array<number>(k).fill(0);
  const cnt = new Array<number>(k).fill(0);
  for (let i = 0; i < Q.length; i++) {
    const j = labels[i];
    sx[j] += Q[i][0];
    sy[j] += Q[i][1];
    cnt[j]++;
  }
  return C.map((c, j) => (cnt[j] ? [sx[j] / cnt[j], sy[j] / cnt[j]] : [c[0], c[1]]));
}

/** Lloyd's algorithm from k distinct seeded starting days; `trace` holds every round for the step-through. */
export function kmeans(Q: Pt[], k: number, seed: number, maxRounds = 200): KmResult {
  const next = rng(seed);
  const init: number[] = [];
  while (init.length < k) {
    const i = Math.floor(next() * Q.length);
    if (!init.includes(i)) init.push(i);
  }
  let C: Pt[] = init.map((i) => [Q[i][0], Q[i][1]]);
  const trace: KmRound[] = [];
  let rounds = 0;
  for (;;) {
    rounds++;
    const a = assign(Q, C);
    trace.push({ round: rounds, centres: C.map((c) => [c[0], c[1]]), sizes: a.sizes, spread: a.spread });
    const N = recentre(Q, a.labels, C);
    let moved = 0;
    for (let j = 0; j < k; j++) moved = Math.max(moved, Math.abs(N[j][0] - C[j][0]), Math.abs(N[j][1] - C[j][1]));
    C = N;
    if (moved < 1e-9 || rounds >= maxRounds) break;
  }
  const fin = assign(Q, C);
  return { init, centres: C, labels: fin.labels, sizes: fin.sizes, spread: fin.spread, rounds, trace };
}

/** Mean silhouette (b − a)/max(a, b). O(n²): fine for 2,663 days, call it once per (k, seed) and memoise. */
export function silhouette(Q: Pt[], labels: Int32Array, k: number): number {
  const n = Q.length;
  const sizes = new Array<number>(k).fill(0);
  for (let i = 0; i < n; i++) sizes[labels[i]]++;
  let total = 0;
  const sums = new Float64Array(k);
  for (let i = 0; i < n; i++) {
    sums.fill(0);
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      sums[labels[j]] += Math.hypot(Q[i][0] - Q[j][0], Q[i][1] - Q[j][1]);
    }
    const own = labels[i];
    const a = sums[own] / Math.max(1, sizes[own] - 1);
    let b = Infinity;
    for (let c = 0; c < k; c++) if (c !== own && sizes[c] > 0) b = Math.min(b, sums[c] / sizes[c]);
    const m = Math.max(a, b);
    total += m > 0 ? (b - a) / m : 0;
  }
  return total / n;
}

// ------------------------------------------------------------------ PCA of 20-day windows of move sizes
export interface WindowPca {
  X: Float64Array[]; // windows, oldest first
  colmean: Float64Array;
  eigenvalues: number[];
  share: number[];
  cumulative: number[];
  loadings: number[][]; // loadings[j] = j-th component over the 20 days
  scores: (i: number, j: number) => number;
}

export function windowMatrix(returns: ArrayLike<number>, W = 20): Float64Array[] {
  const X: Float64Array[] = [];
  for (let t = W; t < returns.length; t++) {
    const row = new Float64Array(W);
    for (let i = 0; i < W; i++) row[i] = 100 * Math.abs(returns[t - W + i]);
    X.push(row);
  }
  return X;
}

export function windowPca(X: Float64Array[]): WindowPca {
  const n = X.length;
  const W = X[0].length;
  const colmean = new Float64Array(W);
  for (const row of X) for (let i = 0; i < W; i++) colmean[i] += row[i] / n;
  const S: number[][] = Array.from({ length: W }, () => new Array<number>(W).fill(0));
  for (const row of X) {
    for (let i = 0; i < W; i++) {
      const di = row[i] - colmean[i];
      for (let j = i; j < W; j++) S[i][j] += (di * (row[j] - colmean[j])) / n;
    }
  }
  for (let i = 0; i < W; i++) for (let j = 0; j < i; j++) S[i][j] = S[j][i];
  const e = symEigen(S); // values descending, vectors as rows
  const eigenvalues = e.values.slice();
  const loadings = e.vectors.map((v) => v.slice());
  // sign conventions as the key: PC1 positive mean; PC2 positive on the oldest day; PC3 positive in the middle; others: largest entry positive
  const flip = (v: number[]) => v.map((x) => -x);
  if (loadings[0].reduce((s, x) => s + x, 0) < 0) loadings[0] = flip(loadings[0]);
  if (loadings[1][0] < 0) loadings[1] = flip(loadings[1]);
  if (loadings[2][9] < 0) loadings[2] = flip(loadings[2]);
  for (let j = 3; j < W; j++) {
    let am = 0;
    for (let i = 1; i < W; i++) if (Math.abs(loadings[j][i]) > Math.abs(loadings[j][am])) am = i;
    if (loadings[j][am] < 0) loadings[j] = flip(loadings[j]);
  }
  const tot = eigenvalues.reduce((s, v) => s + v, 0);
  const share = eigenvalues.map((v) => v / tot);
  const cumulative: number[] = [];
  share.reduce((s, v) => (cumulative.push(s + v), s + v), 0);
  const scores = (i: number, j: number) => {
    let s = 0;
    for (let d = 0; d < W; d++) s += (X[i][d] - colmean[d]) * loadings[j][d];
    return s;
  };
  return { X, colmean, eigenvalues, share, cumulative, loadings, scores };
}

/** Window i rebuilt from its first k components. */
export function reconstruct(p: WindowPca, i: number, k: number): Float64Array {
  const W = p.colmean.length;
  const out = Float64Array.from(p.colmean);
  for (let j = 0; j < k; j++) {
    const z = p.scores(i, j);
    for (let d = 0; d < W; d++) out[d] += z * p.loadings[j][d];
  }
  return out;
}

/** Mean squared reconstruction error over all windows with k components (= sum of the dropped eigenvalues / W). */
export function reconMse(p: WindowPca, k: number): number {
  const W = p.colmean.length;
  let s = 0;
  for (let j = k; j < W; j++) s += p.eigenvalues[j];
  return s / W;
}

// ------------------------------------------------------------------ autoencoder 20 → h → 20, full-batch gradient descent
export interface AeLog {
  epoch: number;
  loss: number;
}
export interface AeResult {
  log: AeLog[];
  finalLoss: number;
  hidden: (i: number) => [number, number];
  recon: (i: number) => Float64Array;
}

export function trainAutoencoder(
  X: Float64Array[],
  colmean: Float64Array,
  opts: { h?: number; act?: "linear" | "tanh"; lr: number; epochs: number; seed?: number; logAt?: number[] },
): AeResult {
  const { h = 2, act = "linear", lr, epochs, seed = 1 } = opts;
  const logAt = new Set(opts.logAt ?? [0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 3000]);
  const n = X.length;
  const p = colmean.length;
  const next = rng(seed);
  const W1 = Array.from({ length: p }, () => Float64Array.from({ length: h }, () => 0.1 * normalSample(next)));
  const W2 = Array.from({ length: h }, () => Float64Array.from({ length: p }, () => 0.1 * normalSample(next)));
  const b1 = new Float64Array(h);
  const b2 = new Float64Array(p);
  const Xc = X.map((row) => Float64Array.from(row, (v, i) => v - colmean[i]));
  const H = Array.from({ length: n }, () => new Float64Array(h));
  const E = Array.from({ length: n }, () => new Float64Array(p));
  const log: AeLog[] = [];
  let loss = 0;
  const forward = () => {
    loss = 0;
    for (let t = 0; t < n; t++) {
      const x = Xc[t];
      for (let j = 0; j < h; j++) {
        let s = b1[j];
        for (let i = 0; i < p; i++) s += x[i] * W1[i][j];
        H[t][j] = act === "tanh" ? Math.tanh(s) : s;
      }
      for (let i = 0; i < p; i++) {
        let s = b2[i];
        for (let j = 0; j < h; j++) s += H[t][j] * W2[j][i];
        const e = s - x[i];
        E[t][i] = e;
        loss += e * e;
      }
    }
    loss /= n * p;
  };
  for (let e = 0; e <= epochs; e++) {
    forward();
    if (logAt.has(e)) log.push({ epoch: e, loss });
    if (e === epochs) break;
    const scale = 2 / (n * p);
    const gW2 = Array.from({ length: h }, () => new Float64Array(p));
    const gb2 = new Float64Array(p);
    const gW1 = Array.from({ length: p }, () => new Float64Array(h));
    const gb1 = new Float64Array(h);
    const gH = new Float64Array(h);
    for (let t = 0; t < n; t++) {
      const x = Xc[t];
      const Ht = H[t];
      const Et = E[t];
      for (let i = 0; i < p; i++) {
        const g = scale * Et[i];
        gb2[i] += g;
        for (let j = 0; j < h; j++) gW2[j][i] += Ht[j] * g;
      }
      for (let j = 0; j < h; j++) {
        let s = 0;
        for (let i = 0; i < p; i++) s += scale * Et[i] * W2[j][i];
        if (act === "tanh") s *= 1 - Ht[j] * Ht[j];
        gH[j] = s;
        gb1[j] += s;
        for (let i = 0; i < p; i++) gW1[i][j] += x[i] * s;
      }
    }
    for (let i = 0; i < p; i++) for (let j = 0; j < h; j++) W1[i][j] -= lr * gW1[i][j];
    for (let j = 0; j < h; j++) b1[j] -= lr * gb1[j];
    for (let j = 0; j < h; j++) for (let i = 0; i < p; i++) W2[j][i] -= lr * gW2[j][i];
    for (let i = 0; i < p; i++) b2[i] -= lr * gb2[i];
  }
  const hidden = (i: number): [number, number] => [H[i][0], H[i][1] ?? 0];
  const recon = (i: number) => Float64Array.from({ length: p }, (_, d) => colmean[d] + Xc[i][d] + E[i][d]);
  return { log, finalLoss: loss, hidden, recon };
}
