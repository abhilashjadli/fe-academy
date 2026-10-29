/** Chapter B1: Markov chains (transition matrices, stationary law, fitting a strip), the simple random walk, and the Poisson process. */

export type Matrix = number[][];

/** Rows must sum to 1 within `tol` and have no negative entries. Returns the offending row index, or −1 if valid. */
export function invalidRow(P: Matrix, tol = 1e-9): number {
  for (let i = 0; i < P.length; i++) {
    const row = P[i];
    if (row.length !== P.length) return i;
    let s = 0;
    for (const x of row) {
      if (x < 0) return i;
      s += x;
    }
    if (Math.abs(s - 1) > tol) return i;
  }
  return -1;
}

export function isStochastic(P: Matrix, tol = 1e-9): boolean {
  return invalidRow(P, tol) === -1;
}

function assertStochastic(P: Matrix): void {
  const bad = invalidRow(P);
  if (bad >= 0) throw new Error(`row ${bad} of the transition matrix does not sum to 1`);
}

/** ψ P: the next-period law from the current one. */
export function stepDistribution(P: Matrix, psi: number[]): number[] {
  const k = P.length;
  const out = new Array(k).fill(0);
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) out[j] += psi[i] * P[i][j];
  return out;
}

/** ψ_0 P^n, by repeated multiplication (exact to rounding). */
export function nStepDistribution(P: Matrix, psi0: number[], n: number): number[] {
  let psi = psi0.slice();
  for (let t = 0; t < n; t++) psi = stepDistribution(P, psi);
  return psi;
}

/** All of ψ_0, ψ_1, …, ψ_n. */
export function distributionPath(P: Matrix, psi0: number[], n: number): number[][] {
  const out = [psi0.slice()];
  for (let t = 0; t < n; t++) out.push(stepDistribution(P, out[t]));
  return out;
}

export function matrixPower(P: Matrix, n: number): Matrix {
  const k = P.length;
  let R: Matrix = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => (i === j ? 1 : 0)));
  for (let t = 0; t < n; t++) R = R.map((row) => stepDistribution(P, row));
  return R;
}

/** Draw a path of n steps from P starting in `start`; returns n + 1 states including the start. */
export function simulateChain(P: Matrix, n: number, start: number, next: () => number): number[] {
  assertStochastic(P);
  const out = new Array<number>(n + 1);
  out[0] = start;
  let x = start;
  for (let t = 0; t < n; t++) {
    const u = next();
    const row = P[x];
    let acc = 0;
    let j = 0;
    for (; j < row.length - 1; j++) {
      acc += row[j];
      if (u < acc) break;
    }
    x = j;
    out[t + 1] = x;
  }
  return out;
}

/** The running fraction of time spent in each state along a path ("what actually happened so far"). */
export function runningFraction(states: number[], k: number): number[][] {
  const counts = new Array(k).fill(0);
  const out: number[][] = [];
  for (let t = 0; t < states.length; t++) {
    counts[states[t]]++;
    out.push(counts.map((c) => c / (t + 1)));
  }
  return out;
}

export function occupancy(states: number[], k: number): number[] {
  const counts = new Array(k).fill(0);
  for (const s of states) counts[s]++;
  return counts.map((c) => c / states.length);
}

/** Count yesterday → today transitions on a strip and turn them into a row-stochastic matrix. `laplace` adds a pseudo-count to each cell. */
export function fitChain(states: number[], k: number, laplace = 0): { counts: Matrix; P: Matrix; n: number } {
  const counts: Matrix = Array.from({ length: k }, () => new Array(k).fill(0));
  for (let t = 0; t + 1 < states.length; t++) counts[states[t]][states[t + 1]]++;
  const P = counts.map((row) => {
    const total = row.reduce((s, c) => s + c, 0) + laplace * k;
    if (total === 0) return new Array(k).fill(1 / k);
    return row.map((c) => (c + laplace) / total);
  });
  return { counts, P, n: Math.max(states.length - 1, 0) };
}

/** Solve ψ P = ψ, Σψ = 1 exactly (Gaussian elimination with partial pivoting). Works for periodic chains, where power iteration never settles. */
export function stationary(P: Matrix): number[] {
  const k = P.length;
  if (k === 2) {
    // two-state closed form: ψ*(0) = β / (α + β) with α = P01, β = P10
    const alpha = P[0][1],
      beta = P[1][0];
    if (alpha + beta === 0) return [0.5, 0.5];
    return [beta / (alpha + beta), alpha / (alpha + beta)];
  }
  // Build (Pᵀ − I) ψ = 0 with the last equation replaced by Σψ = 1
  const A: number[][] = [];
  for (let j = 0; j < k - 1; j++) {
    const row = new Array(k + 1).fill(0);
    for (let i = 0; i < k; i++) row[i] = P[i][j] - (i === j ? 1 : 0);
    A.push(row);
  }
  A.push([...new Array(k).fill(1), 1]);
  for (let c = 0; c < k; c++) {
    let piv = c;
    for (let r = c + 1; r < k; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]];
    const p = A[c][c];
    if (Math.abs(p) < 1e-14) throw new Error("stationary distribution is not unique");
    for (let r = 0; r < k; r++) {
      if (r === c) continue;
      const f = A[r][c] / p;
      if (f === 0) continue;
      for (let cc = c; cc <= k; cc++) A[r][cc] -= f * A[c][cc];
    }
  }
  return A.map((row, i) => row[k] / row[i]);
}

/** Power iteration ψ ← ψ P from a uniform start; returns the law after `iters` steps and the last change (which stays large for a periodic chain). */
export function stationaryByPower(P: Matrix, iters = 10_000, tol = 1e-14): { psi: number[]; iterations: number; lastChange: number } {
  const k = P.length;
  let psi = new Array(k).fill(1 / k);
  let change = Infinity;
  let t = 0;
  for (; t < iters; t++) {
    const nxt = stepDistribution(P, psi);
    change = Math.max(...nxt.map((v, i) => Math.abs(v - psi[i])));
    psi = nxt;
    if (change < tol) break;
  }
  return { psi, iterations: t, lastChange: change };
}

/** Second-largest eigenvalue modulus of a 2-state chain: |1 − α − β|, the forgetting speed. */
export function secondEigenvalue2(P: Matrix): number {
  return Math.abs(1 - P[0][1] - P[1][0]);
}

/** Two-state closed form: ψ_t(0) = ψ*(0) + (ψ_0(0) − ψ*(0)) (1 − α − β)^t. */
export function twoStateLaw(P: Matrix, psi0: number[], t: number): number[] {
  const star = stationary(P);
  const lam = 1 - P[0][1] - P[1][0];
  const a = star[0] + (psi0[0] - star[0]) * Math.pow(lam, t);
  return [a, 1 - a];
}

/** Periodic check for a 2-state chain: both diagonal entries zero means the law alternates forever. */
export function isPeriodic2(P: Matrix): boolean {
  return P.length === 2 && P[0][0] === 0 && P[1][1] === 0;
}

/** General periodicity test by the gcd of return times to state 0 along P^t (up to `maxT`). */
export function period(P: Matrix, state = 0, maxT = 64): number {
  let g = 0;
  let R = P;
  for (let t = 1; t <= maxT; t++) {
    if (R[state][state] > 1e-12) g = gcd(g, t);
    if (g === 1) return 1;
    R = R.map((row) => stepDistribution(P, row));
  }
  return g;
}
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Lengths of the runs (spells) of equal consecutive states. */
export function runLengths(states: number[]): number[] {
  if (states.length === 0) return [];
  const out: number[] = [];
  let len = 1;
  for (let t = 1; t < states.length; t++) {
    if (states[t] === states[t - 1]) len++;
    else {
      out.push(len);
      len = 1;
    }
  }
  out.push(len);
  return out;
}

export function meanRunLength(states: number[]): number {
  const r = runLengths(states);
  return r.length === 0 ? NaN : r.reduce((s, x) => s + x, 0) / r.length;
}

/** Expected holding time in state i: 1/(1 − P_ii), the geometric mean. */
export function expectedHoldingTime(P: Matrix, i: number): number {
  return 1 / (1 - P[i][i]);
}

// ---------------------------------------------------------------- the simple random walk (Shreve §3.2)

/** One ±1 walk of n steps; M_0 = 0. With `memory` p > 0.5 a step repeats the previous one with probability p (the "give him memory" toggle). */
export function randomWalk(n: number, next: () => number, memory = 0.5): number[] {
  const M = new Array<number>(n + 1);
  M[0] = 0;
  let step = next() < 0.5 ? -1 : 1;
  M[1] = step;
  for (let t = 2; t <= n; t++) {
    if (memory === 0.5) step = next() < 0.5 ? -1 : 1;
    else step = next() < memory ? step : -step;
    M[t] = M[t - 1] + step;
  }
  return M;
}

/** Many walkers at once; returns the positions at each step as columns (positions[t][w]). */
export function walkerCloud(walkers: number, n: number, next: () => number, memory = 0.5): { positions: Int32Array[]; meanSquare: (t: number) => number } {
  const positions: Int32Array[] = [];
  for (let t = 0; t <= n; t++) positions.push(new Int32Array(walkers));
  for (let w = 0; w < walkers; w++) {
    const M = randomWalk(n, next, memory);
    for (let t = 0; t <= n; t++) positions[t][w] = M[t];
  }
  return {
    positions,
    meanSquare: (t: number) => {
      let s = 0;
      for (let w = 0; w < walkers; w++) s += positions[t][w] * positions[t][w];
      return s / walkers;
    },
  };
}

/** Histogram counts of positions on the lattice −n…n (index = x + n). The bars always sum to the walker count. */
export function countBars(positions: Int32Array, n: number): number[] {
  const bars = new Array(2 * n + 1).fill(0);
  for (let w = 0; w < positions.length; w++) bars[positions[w] + n]++;
  return bars;
}

/** Exact P(M_n = x) = C(n, (n + x)/2) / 2^n. */
export function walkPmf(n: number, x: number): number {
  if ((n + x) % 2 !== 0 || Math.abs(x) > n) return 0;
  const k = (n + x) / 2;
  // log-binomial for large n
  let lc = 0;
  for (let i = 1; i <= k; i++) lc += Math.log(n - k + i) - Math.log(i);
  return Math.exp(lc - n * Math.LN2);
}

/** Exact P(|M_n| ≤ a). */
export function walkWithin(n: number, a: number): number {
  let s = 0;
  for (let x = -a; x <= a; x++) s += walkPmf(n, x);
  return s;
}

export function walkSd(n: number): number {
  return Math.sqrt(n);
}

/** Long-run Var(M_t)/t for the memory walk: (1 + ρ)/(1 − ρ) with ρ = 2p − 1. */
export function memoryVarianceRatio(p: number): number {
  const rho = 2 * p - 1;
  return (1 + rho) / (1 - rho);
}

// ---------------------------------------------------------------- the Poisson process (Shreve §11.2)

export function poissonPmf(lambda: number, k: number): number {
  if (k < 0) return 0;
  let logp = -lambda + k * Math.log(lambda);
  for (let i = 2; i <= k; i++) logp -= Math.log(i);
  return Math.exp(logp);
}

export function poissonPmfTable(lambda: number, kMax: number): number[] {
  const out: number[] = [];
  for (let k = 0; k <= kMax; k++) out.push(poissonPmf(lambda, k));
  return out;
}

export function poissonCdf(lambda: number, k: number): number {
  let s = 0;
  for (let i = 0; i <= k; i++) s += poissonPmf(lambda, i);
  return s;
}

/** P{τ > t} = e^{−λt}: no arrival in a window of length t. */
export function noArrivalProbability(lambda: number, t: number): number {
  return Math.exp(-lambda * t);
}

/** Exponential(λ) sample by inversion. */
export function exponentialSample(lambda: number, next: () => number): number {
  return -Math.log(Math.max(1 - next(), 1e-300)) / lambda;
}

/** Event times of a Poisson process of rate λ on [0, T): cumulative sums of exponential gaps. */
export function poissonArrivals(lambda: number, T: number, next: () => number): number[] {
  const out: number[] = [];
  let t = exponentialSample(lambda, next);
  while (t < T) {
    out.push(t);
    t += exponentialSample(lambda, next);
  }
  return out;
}

/** The discrete lottery: a ticket each tick of length dt with success probability λ·dt; the exponential is the fine-grid limit. */
export function lotteryArrivals(lambda: number, T: number, dt: number, next: () => number): number[] {
  const out: number[] = [];
  const p = lambda * dt;
  const ticks = Math.floor(T / dt);
  for (let i = 1; i <= ticks; i++) if (next() < p) out.push(i * dt);
  return out;
}

/** Counts per unit window: N(i+1) − N(i) for i = 0..windows−1. */
export function countsPerWindow(times: number[], windows: number, width = 1): number[] {
  const out = new Array(windows).fill(0);
  for (const t of times) {
    const i = Math.floor(t / width);
    if (i >= 0 && i < windows) out[i]++;
  }
  return out;
}

/** Wait from time `at` to the next event, or NaN if there is none. */
export function waitFrom(times: number[], at: number): number {
  for (const t of times) if (t >= at) return t - at;
  return NaN;
}

/** Inspection (waiting-time) paradox: the gap an inspector arriving at a random moment lands in has mean E[X²]/E[X]; for exponential gaps that is 2/λ, and the mean residual wait is 1/λ, not 1/(2λ). */
export function waitingTimeParadox(gapMean: number, gapVariance: number): { observedGapMean: number; meanWait: number } {
  const observedGapMean = (gapVariance + gapMean * gapMean) / gapMean;
  return { observedGapMean, meanWait: observedGapMean / 2 };
}

export function exponentialWaitingTimeParadox(lambda: number): { observedGapMean: number; meanWait: number; timetabledWait: number } {
  const r = waitingTimeParadox(1 / lambda, 1 / (lambda * lambda));
  return { ...r, timetabledWait: 1 / (2 * lambda) };
}

/** Superposition: independent streams add their rates. */
export function superposedRate(rates: number[]): number {
  return rates.reduce((s, r) => s + r, 0);
}
