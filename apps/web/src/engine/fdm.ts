/**
 * Chapter F1 — finite-difference solvers. Tested against tests/answer-key/key_F1.py (engine/__fixtures__/key-F1.json).
 * Forward form (the site's convention): V_t + ½σ²F²V_FF − rV = 0 on F ∈ [Flo, Fhi]; a_j = ½σ²F_j²/δF²; L V = a_j(V_{j−1} − 2V_j + V_{j+1}) − rV_j.
 * Explicit V⁺ = V + δt L V; implicit (I − δt L)V⁺ = V; Crank–Nicolson (I − ½δt L)V⁺ = (I + ½δt L)V; Rannacher = the first step as two implicit
 * half-steps. Deep-in boundary = the discounted intrinsic e^{−rτ}(F − K) (a forward contract's value in this form). Hull's spot-grid stencil
 * (Example 18.1) and Wilmott's explicit loop (Tables 77.1/77.2) are reproduced as the books wrote them.
 */

export type Scheme = "explicit" | "implicit" | "cn";

export interface Grid {
  F: number;
  K: number;
  r: number;
  T: number;
  sigma: number;
  Flo: number;
  Fhi: number;
}

/** Thomas algorithm for a tridiagonal system (sub[0] and sup[n−1] unused) */
export function thomas(sub: Float64Array, dia: Float64Array, sup: Float64Array, rhs: Float64Array): Float64Array {
  const n = rhs.length;
  const cp = new Float64Array(n);
  const dp = new Float64Array(n);
  cp[0] = sup[0] / dia[0];
  dp[0] = rhs[0] / dia[0];
  for (let i = 1; i < n; i++) {
    const m = dia[i] - sub[i] * cp[i - 1];
    cp[i] = i < n - 1 ? sup[i] / m : 0;
    dp[i] = (rhs[i] - sub[i] * dp[i - 1]) / m;
  }
  const x = new Float64Array(n);
  x[n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}

export interface Solution {
  /** value at g.F by linear interpolation */
  value: number;
  /** the final row (today) */
  V: Float64Array;
  Fg: Float64Array;
  dF: number;
  dt: number;
  /** rows kept at the requested step counts */
  snaps: Map<number, Float64Array>;
  maxAbs: number;
}

export function solveForward(g: Grid, M: number, N: number, scheme: Scheme, opts: { rannacher?: number; keep?: number[]; call?: boolean } = {}): Solution {
  const call = opts.call ?? true;
  const rann = opts.rannacher ?? 0;
  const keep = new Set(opts.keep ?? []);
  const dF = (g.Fhi - g.Flo) / M;
  const dt = g.T / N;
  const Fg = new Float64Array(M + 1);
  for (let j = 0; j <= M; j++) Fg[j] = g.Flo + j * dF;
  let V: Float64Array = Float64Array.from(Fg, (f) => Math.max(call ? f - g.K : g.K - f, 0));
  const a = Float64Array.from(Fg, (f) => (0.5 * g.sigma * g.sigma * f * f) / (dF * dF));
  const di = Float64Array.from(a, (v) => -(2 * v + g.r));
  const bc = (tau: number): [number, number] =>
    call ? [0, Math.exp(-g.r * tau) * (g.Fhi - g.K)] : [Math.exp(-g.r * tau) * (g.K - g.Flo), 0];
  const step = (Vn: Float64Array, th: number, h: number, tau: number): Float64Array => {
    const [b0, bM] = bc(tau);
    if (th === 0) {
      const W = Vn.slice();
      for (let j = 1; j < M; j++) W[j] = Vn[j] + h * (a[j] * Vn[j - 1] + di[j] * Vn[j] + a[j] * Vn[j + 1]);
      W[0] = b0;
      W[M] = bM;
      return W;
    }
    const sub = new Float64Array(M + 1);
    const dia = new Float64Array(M + 1);
    const sup = new Float64Array(M + 1);
    const rhs = new Float64Array(M + 1);
    dia[0] = 1;
    dia[M] = 1;
    rhs[0] = b0;
    rhs[M] = bM;
    for (let j = 1; j < M; j++) {
      sub[j] = -th * h * a[j];
      dia[j] = 1 - th * h * di[j];
      sup[j] = -th * h * a[j];
      rhs[j] = Vn[j] + (1 - th) * h * (a[j] * Vn[j - 1] + di[j] * Vn[j] + a[j] * Vn[j + 1]);
    }
    return thomas(sub, dia, sup, rhs);
  };
  const th = scheme === "explicit" ? 0 : scheme === "implicit" ? 1 : 0.5;
  const snaps = new Map<number, Float64Array>();
  let tau = 0;
  let n = 0;
  for (let i = 0; i < rann; i++) {
    tau += dt / 2;
    V = step(V, 1, dt / 2, tau);
    tau += dt / 2;
    V = step(V, 1, dt / 2, tau);
    n++;
    if (keep.has(n)) snaps.set(n, V.slice());
  }
  for (let k = n; k < N; k++) {
    tau += dt;
    V = step(V, th, dt, tau);
    if (keep.has(k + 1)) snaps.set(k + 1, V.slice());
  }
  const x = (g.F - g.Flo) / dF;
  const i = Math.min(Math.floor(x), M - 1);
  let maxAbs = 0;
  for (const v of V) maxAbs = Math.max(maxAbs, Math.abs(v));
  return { value: V[i] + (x - i) * (V[i + 1] - V[i]), V, Fg, dF, dt, snaps, maxAbs };
}

/** the explicit scheme's stability limit on this grid, in years: δt ≤ δF²/(σ² F_max²) */
export function explicitLimit(g: Grid, M: number): number {
  const dF = (g.Fhi - g.Flo) / M;
  return (dF * dF) / (g.sigma * g.sigma * g.Fhi * g.Fhi);
}

/** the explicit scheme's three weights (down, stay, up) at the top node for a step of `dt` years */
export function explicitWeights(g: Grid, M: number, dt: number): { down: number; stay: number; up: number } {
  const dF = (g.Fhi - g.Flo) / M;
  const a = (0.5 * g.sigma * g.sigma * g.Fhi * g.Fhi) / (dF * dF);
  return { down: a * dt, stay: 1 - 2 * a * dt - g.r * dt, up: a * dt };
}

/** the neighbour rule at one node: the pull per year toward the neighbours' average, weighted by F² */
export function neighbourRule(g: Grid, Fj: number, dF: number, Vm: number, V: number, Vp: number) {
  const weight = (0.5 * g.sigma * g.sigma * Fj * Fj) / (dF * dF);
  return { avg: 0.5 * (Vm + Vp), weight, pull: weight * (Vm + Vp - 2 * V) - g.r * V };
}

/** least-squares slope of log|error| on log x */
export function logSlope(xs: number[], errs: number[]): number {
  const x = xs.map(Math.log);
  const y = errs.map((e) => Math.log(Math.abs(e)));
  const mx = x.reduce((s, v) => s + v, 0) / x.length;
  const my = y.reduce((s, v) => s + v, 0) / y.length;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
  }
  return sxy / sxx;
}

// ---------------------------------------------------------------------------------------------------------------------
// Hull Example 18.1 on Hull's own stencil (S-grid, equations 18.25 / 18.32), American put

export interface HullParams {
  S0: number;
  K: number;
  r: number;
  sigma: number;
  T: number;
  Smax: number;
  M: number;
  N: number;
}

export interface HullGrid {
  S: number[];
  /** rows from today (index 0) to expiry (index N) */
  grid: Float64Array[];
  atS0: number;
  /** highest S at which exercise binds, per row today → expiry−1 */
  boundary: number[];
}

export function hullGrid(p: HullParams, scheme: Scheme, american: boolean): HullGrid {
  const { K, r, sigma, T, Smax, M, N } = p;
  const dS = Smax / M;
  const dt = T / N;
  const S = Array.from({ length: M + 1 }, (_, j) => j * dS);
  let V: Float64Array = Float64Array.from(S, (s) => Math.max(K - s, 0));
  const rows: Float64Array[] = [V.slice()];
  const boundary: number[] = [];
  for (let n = 0; n < N; n++) {
    const Vn = V.slice();
    if (scheme === "explicit") {
      const W = Vn.slice();
      for (let j = 1; j < M; j++) {
        const A = (1 / (1 + r * dt)) * (-0.5 * r * j * dt + 0.5 * sigma * sigma * j * j * dt);
        const B = (1 / (1 + r * dt)) * (1 - sigma * sigma * j * j * dt);
        const C = (1 / (1 + r * dt)) * (0.5 * r * j * dt + 0.5 * sigma * sigma * j * j * dt);
        W[j] = A * Vn[j - 1] + B * Vn[j] + C * Vn[j + 1];
      }
      V = W;
    } else {
      const th = scheme === "implicit" ? 1 : 0.5;
      const sub = new Float64Array(M + 1);
      const dia = new Float64Array(M + 1);
      const sup = new Float64Array(M + 1);
      const rhs = new Float64Array(M + 1);
      dia[0] = 1;
      dia[M] = 1;
      rhs[0] = K;
      rhs[M] = 0;
      for (let j = 1; j < M; j++) {
        const lo = 0.5 * (sigma * sigma * j * j - r * j);
        const di = -(sigma * sigma * j * j + r);
        const up = 0.5 * (sigma * sigma * j * j + r * j);
        sub[j] = -th * dt * lo;
        dia[j] = 1 - th * dt * di;
        sup[j] = -th * dt * up;
        rhs[j] = Vn[j] + (1 - th) * dt * (lo * Vn[j - 1] + di * Vn[j] + up * Vn[j + 1]);
      }
      V = thomas(sub, dia, sup, rhs);
    }
    V[0] = K;
    V[M] = 0;
    if (american) {
      let bind = 0;
      for (let j = 0; j <= M; j++) {
        const ex = K - S[j];
        if (V[j] < ex) V[j] = ex;
        if (ex > 0 && Math.abs(V[j] - ex) < 1e-9) bind = S[j];
      }
      boundary.push(bind);
    }
    rows.push(V.slice());
  }
  rows.reverse();
  boundary.reverse();
  return { S, grid: rows, atS0: rows[0][Math.round(p.S0 / dS)], boundary };
}

/** Wilmott's explicit loop (Ch. 77 code): returns the row at t = T for S = 0 … 2E in NAS steps */
export function wilmottExplicit(call: boolean, vol = 0.2, r = 0.05, E = 100, T = 1, NAS = 20): { S: number[]; V: Float64Array; NTS: number } {
  const dS = (2 * E) / NAS;
  let dt = 0.9 / vol / vol / NAS / NAS;
  const NTS = Math.floor(T / dt) + 1;
  dt = T / NTS;
  const S = Array.from({ length: NAS + 1 }, (_, i) => i * dS);
  const q = call ? 1 : -1;
  let V: Float64Array = Float64Array.from(S, (s) => Math.max(q * (s - E), 0));
  for (let k = 0; k < NTS; k++) {
    const Vn = V.slice();
    const W = Vn.slice();
    for (let i = 1; i < NAS; i++) {
      const D = (Vn[i + 1] - Vn[i - 1]) / 2 / dS;
      const G = (Vn[i + 1] - 2 * Vn[i] + Vn[i - 1]) / dS / dS;
      const Th = -0.5 * vol * vol * S[i] * S[i] * G - r * S[i] * D + r * Vn[i];
      W[i] = Vn[i] - dt * Th;
    }
    W[0] = Vn[0] * (1 - r * dt);
    W[NAS] = 2 * W[NAS - 1] - W[NAS - 2];
    V = W;
  }
  return { S, V, NTS };
}
