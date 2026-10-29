/**
 * Chapter B5: the change of measure. The finite Radon–Nikodym tilt on Hull's one-step tree (Shreve (5.2.4)–(5.2.5)),
 * the continuous tilt Z = exp(−θW_T − ½θ²T) as a weight on the terminal price, "2,000 equally likely futures" as exact
 * lognormal quantiles, and Girsanov's drift shift. riskhub's example: S0 = 100, μ = 9 %, σ = 20 %, r = 4 %, T = 1, θ = 0.25.
 */
import { cdf, quantile } from "./normal";
import { oneStep, realWorldProbability, type OneStepInput } from "./binomial";
import { bsCall } from "./blackscholes";

// ---------------------------------------------------------------- finite tilt on the one-step tree

export interface FiniteTilt {
  p: number;
  q: number;
  /** Z(up) = p/q, Z(down) = (1 − p)/(1 − q) */
  Zup: number;
  Zdown: number;
  /** E_q[Z] = 1 */
  EqZ: number;
  /** e^{−rT} E_q[Z · payoff] — the no-arbitrage price again */
  priceViaZ: number;
  /** e^{−rT} E_p[payoff] */
  price: number;
}

/** Tilt the real-world coin (up with probability q) into the risk-neutral one (p): the weights Z(ω) = P̃(ω)/P(ω). */
export function finiteTilt(input: OneStepInput, q: number): FiniteTilt {
  const s = oneStep(input);
  const Zup = s.p / q;
  const Zdown = (1 - s.p) / (1 - q);
  const disc = Math.exp(-input.r * input.T);
  return { p: s.p, q, Zup, Zdown, EqZ: q * Zup + (1 - q) * Zdown, priceViaZ: disc * (q * Zup * s.fu + (1 - q) * Zdown * s.fd), price: s.f };
}

/** Hull's real-world q from an expected return μ, then the tilt. */
export function finiteTiltFromReturn(input: OneStepInput, mu: number): FiniteTilt {
  return finiteTilt(input, realWorldProbability(input.u, input.d, mu, input.T));
}

/** The price is the same for every belief: Σ over beliefs of e^{−rT} E_q[Z_q · payoff], all equal to f. */
export function priceUnderEveryBelief(input: OneStepInput, beliefs: number[]): number[] {
  return beliefs.map((q) => finiteTilt(input, q).priceViaZ);
}

// ---------------------------------------------------------------- continuous tilt (Shreve Ex. 1.6.6, Thm 5.2.3)

export interface GBMWorld {
  S0: number;
  mu: number;
  sigma: number;
  r: number;
  T: number;
}

/** θ = (μ − r)/σ: the market price of risk, the one tilt that makes the discounted stock a fair bet. */
export function marketPriceOfRisk(w: GBMWorld): number {
  return (w.mu - w.r) / w.sigma;
}

/** W_T recovered from a terminal price: (ln(S_T/S0) − (μ − ½σ²)T)/σ. */
export function brownianFromPrice(w: GBMWorld, ST: number): number {
  return (Math.log(ST / w.S0) - (w.mu - 0.5 * w.sigma * w.sigma) * w.T) / w.sigma;
}

/** Z = exp(−θW_T − ½θ²T) for the Brownian endpoint W_T. E_P[Z] = 1. */
export function radonNikodym(theta: number, WT: number, T: number): number {
  return Math.exp(-theta * WT - 0.5 * theta * theta * T);
}

/**
 * The same Z written as a weight on the terminal price: w(S_T) = c · (S_T/S0)^{−θ/σ} with
 * c = exp(θ(μ − ½σ²)T/σ − ½θ²T) (riskhub: 1.0579 · (S_T/100)^{−1.25} at θ = 0.25).
 */
export function tiltWeightParams(w: GBMWorld, theta: number): { c: number; exponent: number } {
  return { c: Math.exp((theta * (w.mu - 0.5 * w.sigma * w.sigma) * w.T) / w.sigma - 0.5 * theta * theta * w.T), exponent: -theta / w.sigma };
}

export function tiltWeight(w: GBMWorld, theta: number, ST: number): number {
  const { c, exponent } = tiltWeightParams(w, theta);
  return c * Math.pow(ST / w.S0, exponent);
}

/** Under the tilt by θ the drift of S is μ − σθ (Girsanov: W̃ = W + θt is Brownian motion under P̃). r exactly at θ = (μ − r)/σ. */
export function girsanovDrift(mu: number, sigma: number, theta: number): number {
  return mu - sigma * theta;
}

/** Shift a Brownian path: W̃(t) = W(t) + θt. */
export function girsanovShift(t: number[], W: number[], theta: number): number[] {
  return W.map((w, i) => w + theta * t[i]);
}

// ---------------------------------------------------------------- 2,000 equally likely futures (exact lognormal quantiles)

/** n equally likely terminal prices: the lognormal quantiles at (i + ½)/n under the real-world drift μ. */
export function lognormalQuantiles(w: GBMWorld, n: number): number[] {
  const m = (w.mu - 0.5 * w.sigma * w.sigma) * w.T;
  const s = w.sigma * Math.sqrt(w.T);
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) out[i] = w.S0 * Math.exp(m + s * quantile((i + 0.5) / n));
  return out;
}

export interface Reweighted {
  theta: number;
  /** normalised weights, Σ = 1 */
  weights: number[];
  /** mean of the raw (unnormalised) weights: ≈ 1 for every θ (E_P[Z] = 1) */
  rawMean: number;
  /** the needle: Σ wᵢ e^{−rT} S_i (105.13 at θ = 0, 100 at θ = 0.25) */
  discountedMean: number;
  /** Σ wᵢ e^{−rT} (S_i − K)+ */
  call: number;
  /** re-weighted P(S_T < level) */
  pBelow: number;
  /** weighted sd of ln(S_T/S0): σ√T at every θ — the wobble does not move */
  logSd: number;
  /** weighted mean of the log return, and the drift it implies: logMean/T + ½σ² */
  logMean: number;
  impliedDrift: number;
}

/** Same futures, different weights: re-weight the quantile sample by the tilt at θ. */
export function reweight(w: GBMWorld, futures: number[], theta: number, K: number, below = 80): Reweighted {
  const n = futures.length;
  const raw = futures.map((s) => tiltWeight(w, theta, s));
  let sum = 0;
  for (const v of raw) sum += v;
  const weights = raw.map((v) => v / sum);
  const disc = Math.exp(-w.r * w.T);
  let mean = 0,
    call = 0,
    pb = 0,
    lm = 0;
  for (let i = 0; i < n; i++) {
    mean += weights[i] * futures[i];
    call += weights[i] * Math.max(futures[i] - K, 0);
    if (futures[i] < below) pb += weights[i];
    lm += weights[i] * Math.log(futures[i] / w.S0);
  }
  let v = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.log(futures[i] / w.S0) - lm;
    v += weights[i] * d * d;
  }
  return { theta, weights, rawMean: sum / n, discountedMean: disc * mean, call: disc * call, pBelow: pb, logSd: Math.sqrt(v), logMean: lm, impliedDrift: lm / w.T + 0.5 * w.sigma * w.sigma };
}

/** Exact lognormal tail probabilities P(S_T < level) under drift μ (P) and r (Q). */
export function tailProbabilities(w: GBMWorld, level: number): { P: number; Q: number } {
  const s = w.sigma * Math.sqrt(w.T);
  const z = (drift: number) => (Math.log(level / w.S0) - (drift - 0.5 * w.sigma * w.sigma) * w.T) / s;
  return { P: cdf(z(w.mu)), Q: cdf(z(w.r)) };
}

/** Closed forms: E_P[e^{−rT}S_T] = S0 e^{(μ−r)T}, E_Q[e^{−rT}S_T] = S0; the Q call is Black–Scholes; the P-expected discounted call payoff. */
export function exactMeans(w: GBMWorld, K: number): { discountedMeanP: number; discountedMeanQ: number; callQ: number; callP: number } {
  const s = w.sigma * Math.sqrt(w.T);
  const dP1 = (Math.log(w.S0 / K) + (w.mu + 0.5 * w.sigma * w.sigma) * w.T) / s;
  const dP2 = dP1 - s;
  return {
    discountedMeanP: w.S0 * Math.exp((w.mu - w.r) * w.T),
    discountedMeanQ: w.S0,
    callQ: bsCall({ S: w.S0, K, r: w.r, sigma: w.sigma, T: w.T }).price,
    callP: Math.exp(-w.r * w.T) * (w.S0 * Math.exp(w.mu * w.T) * cdf(dP1) - K * cdf(dP2)),
  };
}
