/**
 * Beyond Black–Scholes for chapter D3 (three stories, one curve): Heston by the Lewis/Gatheral integral, Merton's series,
 * Hagan's SABR, Dupire local vol from D2's smoothed smile, and a seeded path simulator for each story's "breathing cloud".
 *
 * Conventions (same as tests/answer-key/key_D3.py): forward form throughout. F is the forward for T, a price is
 * e^{-rT} × E[(F_T − K)+] under the pricing measure, and an implied vol is Black-76 against the same F and r.
 *  - Heston (Gatheral (2.12)–(2.15), Lewis (5.6)):  C = F − (√(FK)/π) ∫₀^∞ Re[e^{−iuk} φ(u − i/2)] / (u² + ¼) du, k = ln(K/F),
 *    φ_T(u) = exp(C(u,T) θ + D(u,T) v₀) in Gatheral's branch-safe r₋ form. The integral is a composite 8-point Gauss–Legendre
 *    rule on a graded panel set that depends only on the parameters (so one φ evaluation serves a whole smile); the Python key
 *    checks the same rule against scipy's adaptive quadrature to ~1e−12 relative and against QuantLib's Alan Lewis references.
 *  - Merton: price = e^{-rT} Σₙ Poisson(n; λT) · Black76(Fₙ, K, σₙ), Fₙ = F e^{−λ k̄ T} (1 + k̄)ⁿ, σₙ² = σ² + n σ_J² / T,
 *    k̄ = e^{μ_J + σ_J²/2} − 1 (identical to Merton's rₙ form with rₙ in the discount). 25 terms.
 *  - SABR: Hagan et al. (2002) eq. (2.17a); β = 1 collapses to Gatheral (7.7).
 *  - Local vol: Dupire in total-variance form, Gatheral (1.10), with w(y, t) = σ(y)² t assumed flat in t (one expiry cannot give ∂w/∂T):
 *      σ_L²(y, t) = σ(y)² / [ 1 − y w_y / w − ¼ (¼ + 1/w − y²/w²) w_y² + ½ w_yy ],  w_y = 2σσ′t,  w_yy = 2(σ′² + σσ″)t.
 *    The first term is linear in y w_y / w (the key verifies this against price-based Dupire). The strip is painted on
 *    [21,800, 23,400] from the forward the smile was fitted at and held constant beyond; a cloud grown on σ_L(S, t) reprices the smile.
 * Tested against tests/answer-key/key_D3.py (key-D3.json).
 */
import { black76, impliedVolFwd, type Kind } from "./bs";
import { normalSample, rng } from "./random";
import type { SmileFit } from "./smile";
import key from "./__fixtures__/key-D3.json";

// ------------------------------------------------------------------ tiny complex arithmetic (re, im pairs)
type C = [number, number];
const cmul = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a: C, b: C): C => {
  const d = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};
const cexp = (a: C): C => {
  const e = Math.exp(a[0]);
  return [e * Math.cos(a[1]), e * Math.sin(a[1])];
};
const clog = (a: C): C => [0.5 * Math.log(a[0] * a[0] + a[1] * a[1]), Math.atan2(a[1], a[0])];
/** principal square root */
const csqrt = (a: C): C => {
  const m = Math.hypot(a[0], a[1]);
  const re = Math.sqrt(0.5 * Math.max(m + a[0], 0));
  const im = Math.sqrt(0.5 * Math.max(m - a[0], 0));
  return [re, a[1] < 0 ? -im : im];
};

// ------------------------------------------------------------------ Heston
export interface HestonParams {
  F: number;
  K: number;
  r: number;
  T: number;
  v0: number;
  kappa: number;
  theta: number;
  eta: number;
  rho: number;
}
export type HestonModel = Omit<HestonParams, "K">;

/** Gatheral's φ_T(u) for x = ln(F_T/F), u complex; C and D in the r₋ form (no branch cut trouble). */
export function hestonCf(u: C, T: number, v0: number, kappa: number, theta: number, eta: number, rho: number): C {
  // a = −½u² − ½iu ; b = κ − ρηiu ; g = ½η² ; d = √(b² − 4ag) ; r± = (b ± d)/(2g) ; G = r₋/r₊
  const u2 = cmul(u, u);
  const a: C = [-0.5 * u2[0] + 0.5 * u[1], -0.5 * u2[1] - 0.5 * u[0]];
  const b: C = [kappa + rho * eta * u[1], -rho * eta * u[0]];
  const g = 0.5 * eta * eta;
  const ag = cmul(a, [4 * g, 0]);
  const b2 = cmul(b, b);
  const d = csqrt([b2[0] - ag[0], b2[1] - ag[1]]);
  const rm: C = [(b[0] - d[0]) / (2 * g), (b[1] - d[1]) / (2 * g)];
  const rp: C = [(b[0] + d[0]) / (2 * g), (b[1] + d[1]) / (2 * g)];
  const G = cdiv(rm, rp);
  const e = cexp([-d[0] * T, -d[1] * T]);
  const Ge = cmul(G, e);
  const D = cmul(rm, cdiv([1 - e[0], -e[1]], [1 - Ge[0], -Ge[1]]));
  const L = clog(cdiv([1 - Ge[0], -Ge[1]], [1 - G[0], -G[1]]));
  const Cc: C = [kappa * (rm[0] * T - (2 / (eta * eta)) * L[0]), kappa * (rm[1] * T - (2 / (eta * eta)) * L[1])];
  return cexp([Cc[0] * theta + D[0] * v0, Cc[1] * theta + D[1] * v0]);
}

const GL8_X = [-0.9602898564975362, -0.7966664774136267, -0.525532409916329, -0.18343464249564978, 0.18343464249564978, 0.525532409916329, 0.7966664774136267, 0.9602898564975362];
const GL8_W = [0.10122853629037706, 0.22238103445337443, 0.3137066458778869, 0.36268378337836166, 0.36268378337836166, 0.3137066458778869, 0.22238103445337443, 0.10122853629037706];

/**
 * The quadrature nodes (same construction as the key): graded panels from width ¼ doubling up to wmax = min(10/max(1, 3|k|), max(2/c, 1)),
 * on [0, U] with U = max(200, 36/c), c = √(1−ρ²)(v₀ + κθT)/η the large-u decay rate of |φ(u − i/2)|.
 */
export function hestonNodes(m: HestonModel, kmax = 0): { u: Float64Array; w: Float64Array; U: number } {
  const c = (Math.sqrt(1 - m.rho * m.rho) * (m.v0 + m.kappa * m.theta * m.T)) / m.eta;
  const U = Math.max(200, 36 / c);
  const wmax = Math.min(10 / Math.max(1, 3 * Math.abs(kmax)), Math.max(2 / c, 1));
  const edges = [0];
  let w = 0.25;
  while (edges[edges.length - 1] < U) {
    edges.push(Math.min(edges[edges.length - 1] + w, U));
    w = Math.min(2 * w, wmax);
  }
  const n = edges.length - 1;
  const u = new Float64Array(8 * n);
  const wt = new Float64Array(8 * n);
  for (let p = 0; p < n; p++) {
    const width = edges[p + 1] - edges[p];
    const mid = 0.5 * (edges[p] + edges[p + 1]);
    for (let j = 0; j < 8; j++) {
      u[8 * p + j] = mid + 0.5 * width * GL8_X[j];
      wt[8 * p + j] = 0.5 * width * GL8_W[j];
    }
  }
  return { u, w: wt, U };
}

/** Prepared integrand: φ(u − i/2)/(u² + ¼) at the nodes, reusable across strikes. */
export interface HestonKernel {
  u: Float64Array;
  w: Float64Array;
  re: Float64Array;
  im: Float64Array;
}

export function hestonKernel(m: HestonModel, kmax = 0): HestonKernel {
  const { u, w } = hestonNodes(m, kmax);
  const re = new Float64Array(u.length);
  const im = new Float64Array(u.length);
  for (let i = 0; i < u.length; i++) {
    const ph = hestonCf([u[i], -0.5], m.T, m.v0, m.kappa, m.theta, m.eta, m.rho);
    const den = u[i] * u[i] + 0.25;
    re[i] = ph[0] / den;
    im[i] = ph[1] / den;
  }
  return { u, w, re, im };
}

/** Average variance over [0, T] when η = 0 (deterministic variance path): the Black–Scholes limit. */
function hestonAvgVar(m: HestonModel): number {
  return m.theta + ((m.v0 - m.theta) * (1 - Math.exp(-m.kappa * m.T))) / (m.kappa * m.T);
}

/** Undiscounted forward call from a prepared kernel. */
export function hestonCallFromKernel(k: HestonKernel, F: number, K: number): number {
  const lk = Math.log(K / F);
  let I = 0;
  for (let i = 0; i < k.u.length; i++) {
    // Re[e^{−iuk} ψ] = Re ψ cos(uk) + Im ψ sin(uk)
    const a = k.u[i] * lk;
    I += k.w[i] * (k.re[i] * Math.cos(a) + k.im[i] * Math.sin(a));
  }
  return F - (Math.sqrt(F * K) / Math.PI) * I;
}

/** Heston price, discounted, call by the integral and put by parity. */
export function hestonPrice(p: HestonParams, kind: Kind = "call"): number {
  const D = Math.exp(-p.r * p.T);
  let call: number;
  if (p.eta < 1e-8) call = black76({ F: p.F, K: p.K, r: 0, sigma: Math.sqrt(hestonAvgVar(p)), T: p.T });
  else call = hestonCallFromKernel(hestonKernel(p, Math.log(p.K / p.F)), p.F, p.K);
  return kind === "call" ? D * call : D * (call - (p.F - p.K));
}

/** Implied vols at the strikes, sharing one kernel. NaN where the price has no vol (should not happen for sane inputs). */
export function hestonSmile(m: HestonModel, strikes: number[]): number[] {
  if (m.eta < 1e-8) return strikes.map(() => Math.sqrt(hestonAvgVar(m)));
  let kmax = 0;
  for (const K of strikes) kmax = Math.max(kmax, Math.abs(Math.log(K / m.F)));
  const ker = hestonKernel(m, kmax);
  return strikes.map((K) => {
    const c = hestonCallFromKernel(ker, m.F, K);
    return impliedVolFwd(c, { F: m.F, K, r: 0, T: m.T }, "call", 0.3).sigma;
  });
}

/** Gatheral (3.21): the ATM variance skew ∂σ²_BS/∂k|₀ ≈ ρη/(λ′T)·[1 − (1 − e^{−λ′T})/(λ′T)], λ′ = κ − ρη/2; → ρη/2 as T → 0. */
export function hestonSkew321(T: number, kappa: number, eta: number, rho: number): number {
  const x = (kappa - 0.5 * rho * eta) * T;
  return ((rho * eta) / x) * (1 - (1 - Math.exp(-x)) / x);
}

// ------------------------------------------------------------------ Merton
export interface MertonParams {
  F: number;
  K: number;
  r: number;
  T: number;
  sigma: number;
  lam: number;
  muJ: number;
  sJ: number;
}
export type MertonModel = Omit<MertonParams, "K">;
export const MERTON_TERMS = 25;

/** Poisson(λT) weights for n = 0 … n−1 jumps. */
export function poissonWeights(lam: number, T: number, n = MERTON_TERMS): number[] {
  const x = lam * T;
  const w = [Math.exp(-x)];
  for (let i = 1; i < n; i++) w.push((w[i - 1] * x) / i);
  return w;
}

/** The mixture row n: forward and vol of the bell given n jumps. */
export function mertonComponent(m: MertonModel, n: number): { F: number; sigma: number } {
  const kbar = Math.exp(m.muJ + 0.5 * m.sJ * m.sJ) - 1;
  return { F: m.F * Math.exp(-m.lam * kbar * m.T) * Math.pow(1 + kbar, n), sigma: Math.sqrt(m.sigma * m.sigma + (n * m.sJ * m.sJ) / m.T) };
}

export function mertonPrice(p: MertonParams, kind: Kind = "call", terms = MERTON_TERMS): number {
  const w = poissonWeights(p.lam, p.T, terms);
  let call = 0;
  for (let n = 0; n < terms; n++) {
    const c = mertonComponent(p, n);
    call += w[n] * black76({ F: c.F, K: p.K, r: 0, sigma: c.sigma, T: p.T }, "call");
  }
  const D = Math.exp(-p.r * p.T);
  return kind === "call" ? D * call : D * (call - (p.F - p.K));
}

export function mertonSmile(m: MertonModel, strikes: number[]): number[] {
  return strikes.map((K) => impliedVolFwd(mertonPrice({ ...m, K, r: 0 }), { F: m.F, K, r: 0, T: m.T }, "call", m.sigma).sigma);
}

// ------------------------------------------------------------------ SABR (Hagan 2.17a)
export interface SabrParams {
  alpha: number;
  beta: number;
  rho: number;
  nu: number;
}

export function sabrVol(F: number, K: number, T: number, p: SabrParams): number {
  const { alpha, beta, rho, nu } = p;
  const lg = Math.log(F / K);
  const FK = Math.pow(F * K, (1 - beta) / 2);
  const B = 1 + ((((1 - beta) ** 2 / 24) * alpha * alpha) / (FK * FK) + (0.25 * rho * beta * nu * alpha) / FK + ((2 - 3 * rho * rho) / 24) * nu * nu) * T;
  if (Math.abs(lg) < 1e-12) return (alpha / Math.pow(F, 1 - beta)) * B;
  const z = (nu / alpha) * FK * lg;
  const x = Math.log((Math.sqrt(1 - 2 * rho * z + z * z) + z - rho) / (1 - rho));
  const A = alpha / (FK * (1 + ((1 - beta) ** 2 / 24) * lg * lg + ((1 - beta) ** 4 / 1920) * lg ** 4));
  return ((A * z) / x) * B;
}

export function sabrSmile(F: number, T: number, p: SabrParams, strikes: number[]): number[] {
  return strikes.map((K) => sabrVol(F, K, T, p));
}

// ------------------------------------------------------------------ local vol from the smoothed smile (Dupire (1.10), flat total variance in t)
export interface LocalVolMap {
  /** σ_L at absolute price S and time t (years from today); the map is clamped to [lo, hi] in S. */
  sigma: (S: number, t: number) => number;
  lo: number;
  hi: number;
  F: number;
  T: number;
}

/** σ_L²(y, t) for the quadratic smile σ(y) = a + b y + c y², y = ln(K/F). */
export function localVarFromSmile(fit: SmileFit, y: number, t: number): number {
  t = Math.max(t, 1e-8);
  const s = fit.a + fit.b * y + fit.c * y * y;
  const s1 = fit.b + 2 * fit.c * y;
  const s2 = 2 * fit.c;
  const w = s * s * t;
  const wy = 2 * s * s1 * t;
  const wyy = 2 * (s1 * s1 + s * s2) * t;
  const den = 1 - (y * wy) / w - 0.25 * (0.25 + 1 / w - (y * y) / (w * w)) * wy * wy + 0.5 * wyy;
  return (s * s) / den;
}

/**
 * The map σ_L(S, t) read from D2's fitted smile at forward F. `localVolFromSmile(fit, F, T).sigma(K, T)` is the strip the figure paints
 * (the T-slice); the simulator reads the slice at each step's own time. Held constant outside [lo, hi].
 */
export function localVolFromSmile(fit: SmileFit, F: number, T: number, lo = 21800, hi = 23400): LocalVolMap {
  return {
    F,
    T,
    lo,
    hi,
    sigma: (S: number, t: number = T) => Math.sqrt(localVarFromSmile(fit, Math.log(Math.min(Math.max(S, lo), hi) / F), t)),
  };
}

// ------------------------------------------------------------------ the breathing cloud: seeded terminal values for each story
export type Story = "local" | "heston" | "merton";
export type StoryParams =
  | { story: "local"; map: LocalVolMap; F: number; T: number }
  | { story: "heston"; model: HestonModel }
  | { story: "merton"; model: MertonModel };

/**
 * Terminal values F_T under one story. Antithetic pairs (nPaths rounded up to even). Euler in the log price with nSteps equal steps:
 *  - local: σ_L(S, t_mid) read from the map at the step's midpoint time;
 *  - heston: full-truncation Euler on v (v⁺ = max(v, 0) in both the drift and the diffusion), correlated normals;
 *  - merton: diffusion + compensator −λk̄ dt + compound Poisson jumps (count per step by sequential uniforms), ln J ~ N(μ_J, σ_J²).
 */
export function simulateStory(p: StoryParams, nPaths: number, nSteps: number, seed: number): Float64Array {
  const R = rng(seed);
  const pairs = Math.ceil(nPaths / 2);
  const out = new Float64Array(2 * pairs);
  if (p.story === "local") {
    const dt = p.T / nSteps;
    const sq = Math.sqrt(dt);
    const x0 = Math.log(p.F);
    const x = new Float64Array(2 * pairs).fill(x0);
    for (let s = 0; s < nSteps; s++) {
      const t = (s + 0.5) * dt;
      for (let i = 0; i < pairs; i++) {
        const z = normalSample(R);
        for (let a = 0; a < 2; a++) {
          const j = 2 * i + a;
          const sg = p.map.sigma(Math.exp(x[j]), t);
          x[j] += -0.5 * sg * sg * dt + sg * sq * (a === 0 ? z : -z);
        }
      }
    }
    for (let j = 0; j < out.length; j++) out[j] = Math.exp(x[j]);
    return out;
  }
  if (p.story === "heston") {
    const m = p.model;
    const dt = m.T / nSteps;
    const sq = Math.sqrt(dt);
    const x = new Float64Array(2 * pairs).fill(Math.log(m.F));
    const v = new Float64Array(2 * pairs).fill(m.v0);
    const c2 = Math.sqrt(1 - m.rho * m.rho);
    for (let s = 0; s < nSteps; s++) {
      for (let i = 0; i < pairs; i++) {
        const z1 = normalSample(R);
        const z2 = m.rho * z1 + c2 * normalSample(R);
        for (let a = 0; a < 2; a++) {
          const j = 2 * i + a;
          const sgn = a === 0 ? 1 : -1;
          const vp = Math.max(v[j], 0);
          x[j] += -0.5 * vp * dt + Math.sqrt(vp) * sq * sgn * z1;
          v[j] += m.kappa * (m.theta - vp) * dt + m.eta * Math.sqrt(vp) * sq * sgn * z2;
        }
      }
    }
    for (let j = 0; j < out.length; j++) out[j] = Math.exp(x[j]);
    return out;
  }
  const m = p.model;
  const dt = m.T / nSteps;
  const sq = Math.sqrt(dt);
  const kbar = Math.exp(m.muJ + 0.5 * m.sJ * m.sJ) - 1;
  const drift = (-m.lam * kbar - 0.5 * m.sigma * m.sigma) * dt;
  const pNoJump = Math.exp(-m.lam * dt);
  const x = new Float64Array(2 * pairs).fill(Math.log(m.F));
  for (let s = 0; s < nSteps; s++) {
    for (let i = 0; i < pairs; i++) {
      const z = normalSample(R);
      for (let a = 0; a < 2; a++) {
        const j = 2 * i + a;
        x[j] += drift + m.sigma * sq * (a === 0 ? z : -z);
        // Poisson count by the product-of-uniforms method (independent across the pair: jumps are the story, not the noise)
        let n = 0;
        let prod = R();
        while (prod > pNoJump) {
          n++;
          prod *= R();
        }
        for (let q = 0; q < n; q++) x[j] += m.muJ + m.sJ * normalSample(R);
      }
    }
  }
  for (let j = 0; j < out.length; j++) out[j] = Math.exp(x[j]);
  return out;
}

/**
 * One Heston path drawn step by step for the picture above the breathing cloud: the same full-truncation Euler scheme and the same
 * draw order as `simulateStory("heston")`, so with the same seed its terminal price equals the first (+) path of that cloud.
 * Returns the price and the variance after each step, index 0 = today.
 */
export function hestonPath(m: HestonModel, nSteps: number, seed: number): { price: Float64Array; v: Float64Array } {
  const R = rng(seed);
  const dt = m.T / nSteps;
  const sq = Math.sqrt(dt);
  const c2 = Math.sqrt(1 - m.rho * m.rho);
  const price = new Float64Array(nSteps + 1);
  const v = new Float64Array(nSteps + 1);
  let x = Math.log(m.F);
  let vv = m.v0;
  price[0] = m.F;
  v[0] = vv;
  for (let s = 0; s < nSteps; s++) {
    const z1 = normalSample(R);
    const z2 = m.rho * z1 + c2 * normalSample(R);
    const vp = Math.max(vv, 0);
    x += -0.5 * vp * dt + Math.sqrt(vp) * sq * z1;
    vv += m.kappa * (m.theta - vp) * dt + m.eta * Math.sqrt(vp) * sq * z2;
    price[s + 1] = Math.exp(x);
    v[s + 1] = vv;
  }
  return { price, v };
}

/** Implied smile traced on a finished cloud: out-of-the-money option at each strike (put below F, call above), Black-76 root-finder. */
export function impliedSmileFromCloud(terminals: Float64Array | number[], strikes: number[], r: number, T: number, F?: number): number[] {
  const n = terminals.length;
  let mean = 0;
  for (let i = 0; i < n; i++) mean += terminals[i];
  mean /= n;
  const Fx = F ?? mean;
  const D = Math.exp(-r * T);
  return strikes.map((K) => {
    const call = K >= Fx;
    let pay = 0;
    for (let i = 0; i < n; i++) pay += call ? Math.max(terminals[i] - K, 0) : Math.max(K - terminals[i], 0);
    return impliedVolFwd((D * pay) / n, { F: Fx, K, r, T }, call ? "call" : "put", 0.2).sigma;
  });
}

/** Summary of a cloud: mean and standard error of the mean. */
export function cloudMean(terminals: Float64Array | number[]): { mean: number; se: number } {
  const n = terminals.length;
  let s = 0, s2 = 0;
  for (let i = 0; i < n; i++) {
    s += terminals[i];
    s2 += terminals[i] * terminals[i];
  }
  const mean = s / n;
  return { mean, se: Math.sqrt(Math.max(s2 / n - mean * mean, 0) / n) };
}

// ------------------------------------------------------------------ the fitted stories (read from the key; least squares on the 34 dots)
export const CHAIN = { F: key.chain.F, r: key.chain.r, T: key.chain.T, strikes: key.chain.strikes as number[], callIv: key.chain.call_iv as number[], putIv: key.chain.put_iv as number[] };

export const FITS = {
  quadratic: { a: key.fits.quadratic.params.a, b: key.fits.quadratic.params.b, c: key.fits.quadratic.params.c, rmsVolPts: key.fits.quadratic.rms_vol_pts } as SmileFit,
  sabr: { alpha: key.fits.sabr.params.alpha, beta: 1, rho: key.fits.sabr.params.rho, nu: key.fits.sabr.params.nu } as SabrParams,
  heston: { F: CHAIN.F, r: CHAIN.r, T: CHAIN.T, v0: key.fits.heston.params.v0, kappa: key.fits.heston.params.kappa, theta: key.fits.heston.params.theta, eta: key.fits.heston.params.eta, rho: key.fits.heston.params.rho } as HestonModel,
  hestonK20: { F: CHAIN.F, r: CHAIN.r, T: CHAIN.T, v0: key.fits.heston_k20.params.v0, kappa: key.fits.heston_k20.params.kappa, theta: key.fits.heston_k20.params.theta, eta: key.fits.heston_k20.params.eta, rho: key.fits.heston_k20.params.rho } as HestonModel,
  merton: { F: CHAIN.F, r: CHAIN.r, T: CHAIN.T, sigma: key.fits.merton.params.sigma, lam: key.fits.merton.params.lam, muJ: key.fits.merton.params.muJ, sJ: key.fits.merton.params.sJ } as MertonModel,
  mertonL5: { F: CHAIN.F, r: CHAIN.r, T: CHAIN.T, sigma: key.fits.merton_l5.params.sigma, lam: key.fits.merton_l5.params.lam, muJ: key.fits.merton_l5.params.muJ, sJ: key.fits.merton_l5.params.sJ } as MertonModel,
  rmsVolPts: { quadratic: key.fits.quadratic.rms_vol_pts, sabr: key.fits.sabr.rms_vol_pts, heston: key.fits.heston.rms_vol_pts, hestonK20: key.fits.heston_k20.rms_vol_pts, merton: key.fits.merton.rms_vol_pts, mertonL5: key.fits.merton_l5.rms_vol_pts },
  /** strike grid 21,800 → 23,400 step 25 used for Figure 4's fan-out */
  grid: key.fits.heston.grid as number[],
};

/** rms distance (vol points) between a curve evaluated at the 34 dots and the dots themselves. */
export function rmsToDots(volAt: (K: number) => number): number {
  let ss = 0, n = 0;
  for (let i = 0; i < CHAIN.strikes.length; i++) {
    const v = volAt(CHAIN.strikes[i]);
    ss += (v - CHAIN.callIv[i]) ** 2 + (v - CHAIN.putIv[i]) ** 2;
    n += 2;
  }
  return 100 * Math.sqrt(ss / n);
}
