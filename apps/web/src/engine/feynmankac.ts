/**
 * Chapter B6: Feynman–Kac as "cooling backwards = averaging forwards". A trinomial grid whose every cell is the
 * discounted average of its three children (Wilmott's explicit stencil φ± = ½(δt/δy²)(B² ± A δy), φ0 = 1 − B²δt/δy²,
 * p. 171) run backwards from the payoff; the Monte Carlo forward average with its ±1/√N bracket; the x² exact check;
 * the curvature arrows of the heat rod; and the "step too far" instability. Shreve Thm 6.4.1/6.4.3; Hull p. 249.
 */
import { normalSample } from "./random";
import { bsCall } from "./blackscholes";
import type { OptionKind } from "./options";

// ---------------------------------------------------------------- the backward grid

export interface GridSpec {
  /** drift β of the state x (constant) */
  drift: number;
  /** volatility γ of the state x (constant) */
  vol: number;
  /** discount rate r (0 for the undiscounted Feynman–Kac) */
  rate: number;
  /** where the probe sits today */
  x0: number;
  T: number;
  steps: number;
  /** lattice spacing; default γ√δt, which makes the middle weight 0 (a binomial inside the trinomial) */
  dx?: number;
  payoff: (x: number) => number;
  /** by default a grid with a negative weight (γ²δt/δx² > 1) is refused; set true to watch it blow up */
  allowUnstable?: boolean;
  /** override the three weights (used by the CRR-matched option grid) */
  weights?: { up: number; mid: number; down: number };
}

export interface Grid {
  dt: number;
  dx: number;
  /** the three children's weights: up, middle, down (sum to 1) */
  phi: { up: number; mid: number; down: number };
  /** γ²δt/δx² — the explicit scheme is stable iff ≤ 1 (equivalently λ = ½γ²δt/δx² ≤ ½) */
  courant: number;
  lambda: number;
  stable: boolean;
  /** layers[k] = values at step k on 2k + 1 nodes centred on x0; layers[steps] is the payoff, layers[0] the answer */
  layers: number[][];
  /** x at layer k, node j: x0 + (j − k)·dx */
  xAt: (k: number, j: number) => number;
  value: number;
}

/** Wilmott's stencil for dx = β dt + γ dW: φ± = ½(δt/δx²)(γ² ± β δx), φ0 = 1 − γ²δt/δx². */
export function stencil(drift: number, vol: number, dt: number, dx: number): { up: number; mid: number; down: number; courant: number } {
  const a = (0.5 * dt) / (dx * dx);
  const courant = (vol * vol * dt) / (dx * dx);
  return { up: a * (vol * vol + drift * dx), mid: 1 - courant, down: a * (vol * vol - drift * dx), courant };
}

export function backwardGrid(spec: GridSpec): Grid {
  const { drift, vol, rate, x0, T, steps, payoff } = spec;
  const dt = T / steps;
  const dx = spec.dx ?? vol * Math.sqrt(dt);
  const st = stencil(drift, vol, dt, dx);
  const phi = spec.weights ?? { up: st.up, mid: st.mid, down: st.down };
  const stable = phi.up >= -1e-15 && phi.mid >= -1e-15 && phi.down >= -1e-15;
  if (!stable && !spec.allowUnstable) throw new Error(`step too far: γ²δt/δx² = ${st.courant.toFixed(3)} > 1 gives a negative weight (${phi.mid.toFixed(3)}); shrink δt or widen δx`);
  const disc = Math.exp(-rate * dt);
  const layers: number[][] = new Array(steps + 1);
  const last = new Array<number>(2 * steps + 1);
  for (let j = 0; j <= 2 * steps; j++) last[j] = payoff(x0 + (j - steps) * dx);
  layers[steps] = last;
  for (let k = steps - 1; k >= 0; k--) {
    const next = layers[k + 1];
    const row = new Array<number>(2 * k + 1);
    for (let j = 0; j <= 2 * k; j++) row[j] = disc * (phi.up * next[j + 2] + phi.mid * next[j + 1] + phi.down * next[j]);
    layers[k] = row;
  }
  return { dt, dx, phi, courant: st.courant, lambda: 0.5 * st.courant, stable, layers, xAt: (k, j) => x0 + (j - k) * dx, value: layers[0][0] };
}

/** One column of the grid as (x, value) pairs, for drawing. */
export function gridColumn(g: Grid, k: number): { x: number[]; v: number[] } {
  return { x: g.layers[k].map((_, j) => g.xAt(k, j)), v: g.layers[k] };
}

// ---------------------------------------------------------------- the option grid in x = ln S

export interface OptionGridInput {
  S: number;
  K: number;
  r: number;
  sigma: number;
  T: number;
  n: number;
  kind?: OptionKind | "forward";
  /** "fd": Wilmott's stencil with drift r − ½σ² (explicit finite differences in ln S); "crr": the CRR up-probability, which matches E[S] exactly and reproduces C2's tree */
  probabilities?: "fd" | "crr";
}

export function optionPayoffInX(kind: OptionKind | "forward", K: number): (x: number) => number {
  if (kind === "forward") return (x) => Math.exp(x) - K;
  if (kind === "call") return (x) => Math.max(Math.exp(x) - K, 0);
  return (x) => Math.max(K - Math.exp(x), 0);
}

/** Explicit finite differences in ln S with δx = σ√δt (middle weight 0): every cell is the discounted average of its children. */
export function optionGrid({ S, K, r, sigma, T, n, kind = "call", probabilities = "fd" }: OptionGridInput): Grid & { S: (k: number, j: number) => number } {
  const dt = T / n;
  const dx = sigma * Math.sqrt(dt);
  let weights: GridSpec["weights"];
  if (probabilities === "crr") {
    const u = Math.exp(dx);
    const d = 1 / u;
    const p = (Math.exp(r * dt) - d) / (u - d);
    weights = { up: p, mid: 0, down: 1 - p };
  }
  const g = backwardGrid({ drift: r - 0.5 * sigma * sigma, vol: sigma, rate: r, x0: Math.log(S), T, steps: n, dx, payoff: optionPayoffInX(kind, K), weights });
  return { ...g, S: (k, j) => Math.exp(g.xAt(k, j)) };
}

/** The up-weight of the FD stencil, p_FD = ½ + (r − ½σ²)√δt/(2σ), next to the CRR p: they differ at O(δt). */
export function upWeights(r: number, sigma: number, dt: number): { fd: number; crr: number } {
  const u = Math.exp(sigma * Math.sqrt(dt));
  const d = 1 / u;
  return { fd: 0.5 + ((r - 0.5 * sigma * sigma) * Math.sqrt(dt)) / (2 * sigma), crr: (Math.exp(r * dt) - d) / (u - d) };
}

/** Black–Scholes call/put for the grid's target (put by parity). */
export function bsTarget(S: number, K: number, r: number, sigma: number, T: number, kind: OptionKind = "call"): number {
  const c = bsCall({ S, K, r, sigma, T }).price;
  return kind === "call" ? c : c + K * Math.exp(-r * T) - S;
}

/** The forward's value at (t, S) under Q: S − Ke^{−r(T−t)} (Hull Example 12.6). */
export function forwardValue(S: number, K: number, r: number, tau: number): number {
  return S - K * Math.exp(-r * tau);
}

/** Largest |grid − (S − Ke^{−r(T−t)})| / S over every cell of a forward-payoff grid (relative, since the lattice reaches very large S). */
export function forwardGridDefect(input: Omit<OptionGridInput, "kind">): number {
  const g = optionGrid({ ...input, kind: "forward" });
  let worst = 0;
  for (let k = 0; k < g.layers.length; k++) {
    const tau = input.T - k * g.dt;
    for (let j = 0; j < g.layers[k].length; j++) {
      const S = g.S(k, j);
      worst = Math.max(worst, Math.abs(g.layers[k][j] - forwardValue(S, input.K, input.r, tau)) / S);
    }
  }
  return worst;
}

// ---------------------------------------------------------------- Monte Carlo: the forward average and its bracket

export interface MCResult {
  N: number;
  mean: number;
  /** sample sd of the discounted payoff */
  sd: number;
  /** sd/√N */
  se: number;
  /** mean ± se */
  lo: number;
  hi: number;
  /** the first few discounted payoffs (one future = one number) */
  first: number[];
}

function summarise(vals: number[]): MCResult {
  const N = vals.length;
  let s = 0;
  for (const v of vals) s += v;
  const mean = s / N;
  let ss = 0;
  for (const v of vals) ss += (v - mean) * (v - mean);
  const sd = Math.sqrt(ss / (N - 1));
  const se = sd / Math.sqrt(N);
  return { N, mean, sd, se, lo: mean - se, hi: mean + se, first: vals.slice(0, 5) };
}

/** Under Q, S_T = S exp((r − ½σ²)T + σ√T Z); average the discounted payoff over N futures. */
export function monteCarloOption(S: number, K: number, r: number, sigma: number, T: number, N: number, next: () => number, kind: OptionKind = "call"): MCResult {
  const disc = Math.exp(-r * T);
  const m = (r - 0.5 * sigma * sigma) * T;
  const s = sigma * Math.sqrt(T);
  const vals = new Array<number>(N);
  for (let i = 0; i < N; i++) {
    const ST = S * Math.exp(m + s * normalSample(next));
    vals[i] = disc * (kind === "call" ? Math.max(ST - K, 0) : Math.max(K - ST, 0));
  }
  return summarise(vals);
}

/** One future: the discounted payoff along a single draw z (z = 0 is the median path). */
export function oneFuture(S: number, K: number, r: number, sigma: number, T: number, z: number, kind: OptionKind = "call"): number {
  const ST = S * Math.exp((r - 0.5 * sigma * sigma) * T + sigma * Math.sqrt(T) * z);
  return Math.exp(-r * T) * (kind === "call" ? Math.max(ST - K, 0) : Math.max(K - ST, 0));
}

/** The bracket shrinks like 1/√N: the standard error at N for a payoff with sd `payoffSd`. */
export function bracketWidth(payoffSd: number, N: number): number {
  return payoffSd / Math.sqrt(N);
}

/** Is the grid's number inside the walkers' bracket of z standard errors? */
export function insideBracket(mc: MCResult, value: number, z = 3): boolean {
  return Math.abs(mc.mean - value) <= z * mc.se;
}

// ---------------------------------------------------------------- the x² exact check (u_t + ½u_xx = 0, h = x² → u = x² + (T − t))

export function heatExact(x: number, tau: number): number {
  return x * x + tau;
}

/** The heat grid for h = x², zero drift, unit wobble, no interest; dx chosen so that λ = ½δt/δx² is the given value. */
export function heatGrid(x0: number, tau: number, steps: number, lambda = 0.5, allowUnstable = false, payoff: (x: number) => number = (x) => x * x): Grid {
  const dt = tau / steps;
  const dx = Math.sqrt((0.5 * dt) / lambda);
  return backwardGrid({ drift: 0, vol: 1, rate: 0, x0, T: tau, steps, dx, payoff, allowUnstable });
}

/** Walkers for the heat test: X_T = x + √τ Z, average X_T². Exact sd of X_T² is √(2τ² + 4x²τ). */
export function heatMonteCarlo(x: number, tau: number, N: number, next: () => number): MCResult & { sdExact: number } {
  const vals = new Array<number>(N);
  const s = Math.sqrt(tau);
  for (let i = 0; i < N; i++) {
    const X = x + s * normalSample(next);
    vals[i] = X * X;
  }
  return { ...summarise(vals), sdExact: Math.sqrt(2 * tau * tau + 4 * x * x * tau) };
}

// ---------------------------------------------------------------- the heat rod: curvature arrows and the step too far

/** Second difference per interior node: V_{j+1} − 2V_j + V_{j−1} (0 at the ends). */
export function secondDifference(V: number[]): number[] {
  const out = new Array<number>(V.length).fill(0);
  for (let j = 1; j + 1 < V.length; j++) out[j] = V[j + 1] - 2 * V[j] + V[j - 1];
  return out;
}

/**
 * Curvature arrows: how far each node moves in one backward step under pure diffusion with coefficient D (= ½γ², or
 * ½σ²S² in price): Δ V = D·δt·(second difference)/δx². Positive where the rod bends up (a kink in a call), 0 on straight parts.
 */
export function curvatureArrows(V: number[], dx: number, dt: number, D: number | number[]): number[] {
  const sd = secondDifference(V);
  return sd.map((s, j) => ((typeof D === "number" ? D : D[j]) * dt * s) / (dx * dx));
}

/** How many times the slope of a profile changes sign: 1 for a smooth convex rod, many for an oscillating one. */
export function signChanges(V: number[]): number {
  let count = 0;
  let last = 0;
  for (let j = 1; j < V.length; j++) {
    const d = Math.sign(V[j] - V[j - 1]);
    if (d === 0) continue;
    if (last !== 0 && d !== last) count++;
    last = d;
  }
  return count;
}

/** The step too far: the same kinked rod (|x|) cooled with λ ≤ ½ (smooth) and λ > ½ (oscillating). Half-way profiles so there is a rod left to look at. */
export function stepTooFar(steps: number, lambdaOk = 0.5, lambdaBad = 0.75): { ok: Grid; bad: Grid; okProfile: number[]; badProfile: number[]; okSignChanges: number; badSignChanges: number } {
  const half = Math.floor(steps / 2);
  const ok = heatGrid(0, 1, steps, lambdaOk, true, Math.abs);
  const bad = heatGrid(0, 1, steps, lambdaBad, true, Math.abs);
  const okProfile = ok.layers[half];
  const badProfile = bad.layers[half];
  return { ok, bad, okProfile, badProfile, okSignChanges: signChanges(okProfile), badSignChanges: signChanges(badProfile) };
}
