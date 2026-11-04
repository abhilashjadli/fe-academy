/**
 * Black–Scholes for chapters C3 (the formula, implied volatility) and C4 (the Greeks).
 *
 * Two forms, both closed:
 *  - forward form (Black-76): V = e^{-rT}[F N(d1) - K N(d2)], d1 = (ln(F/K) + ½σ²T)/(σ√T). This is what the chapters use on
 *    the real NIFTY row, because the chain gave us the forward (C1) and nothing else.
 *  - spot form (Hull eq. 12.20 with an optional yield q), for the textbook checks and for decoding NSE's own IV column.
 * Greeks are per unit of the option; theta is dV/dt per YEAR with t calendar time (divide by 365 for a day).
 * Tested against tests/answer-key/key_C3C4.py.
 */
import { cdf, pdf, quantile } from "./normal";

export type Kind = "call" | "put";

export interface Fwd {
  F: number;
  K: number;
  r: number;
  sigma: number;
  T: number;
}

export interface Spot {
  S: number;
  K: number;
  r: number;
  sigma: number;
  T: number;
  q?: number;
}

export interface Greeks {
  price: number;
  d1: number;
  d2: number;
  Nd1: number;
  Nd2: number;
  delta: number;
  /** per unit of the underlying, per unit move */
  gamma: number;
  /** per unit of σ (divide by 100 for "per vol point") */
  vega: number;
  /** dV/dt per year, calendar time (÷365 for a day) */
  thetaYr: number;
  /** per unit of r (÷100 for "per rate point") */
  rho: number;
}

function d12(lnRatio: number, sigma: number, T: number): [number, number, number] {
  const st = sigma * Math.sqrt(T);
  const d1 = (lnRatio + 0.5 * st * st) / st;
  return [d1, d1 - st, st];
}

/** Forward-form price. */
export function black76(p: Fwd, kind: Kind = "call"): number {
  const { F, K, r, sigma, T } = p;
  const [d1, d2] = d12(Math.log(F / K), sigma, T);
  const D = Math.exp(-r * T);
  return kind === "call" ? D * (F * cdf(d1) - K * cdf(d2)) : D * (K * cdf(-d2) - F * cdf(-d1));
}

/** Forward-form Greeks (delta and gamma are with respect to the forward). */
export function black76Greeks(p: Fwd, kind: Kind = "call"): Greeks {
  const { F, K, r, sigma, T } = p;
  const [d1, d2, st] = d12(Math.log(F / K), sigma, T);
  const D = Math.exp(-r * T);
  const price = black76(p, kind);
  const delta = kind === "call" ? D * cdf(d1) : -D * cdf(-d1);
  const gamma = (D * pdf(d1)) / (F * st);
  const vega = D * F * Math.sqrt(T) * pdf(d1);
  const thetaYr = (-D * F * pdf(d1) * sigma) / (2 * Math.sqrt(T)) + r * price;
  return { price, d1, d2, Nd1: cdf(d1), Nd2: cdf(d2), delta, gamma, vega, thetaYr, rho: -T * price };
}

/** Spot-form price (Hull 12.20/12.21; with yield q, Hull 13.4/13.5). */
export function bsPrice(p: Spot, kind: Kind = "call"): number {
  const { S, K, r, sigma, T } = p;
  const q = p.q ?? 0;
  const st = sigma * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / st;
  const d2 = d1 - st;
  const Dq = Math.exp(-q * T);
  const Dr = Math.exp(-r * T);
  return kind === "call" ? S * Dq * cdf(d1) - K * Dr * cdf(d2) : K * Dr * cdf(-d2) - S * Dq * cdf(-d1);
}

/** Spot-form Greeks, no yield (Hull §14.4–14.9). */
export function bsGreeks(p: Spot, kind: Kind = "call"): Greeks {
  const { S, K, r, sigma, T } = p;
  const st = sigma * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / st;
  const d2 = d1 - st;
  const Dr = Math.exp(-r * T);
  const price = bsPrice({ S, K, r, sigma, T }, kind);
  const delta = kind === "call" ? cdf(d1) : cdf(d1) - 1;
  const gamma = pdf(d1) / (S * st);
  const vega = S * Math.sqrt(T) * pdf(d1);
  const common = (-S * pdf(d1) * sigma) / (2 * Math.sqrt(T));
  const thetaYr = kind === "call" ? common - r * K * Dr * cdf(d2) : common + r * K * Dr * cdf(-d2);
  const rho = kind === "call" ? K * T * Dr * cdf(d2) : -K * T * Dr * cdf(-d2);
  return { price, d1, d2, Nd1: cdf(d1), Nd2: cdf(d2), delta, gamma, vega, thetaYr, rho };
}

/** Left side minus right side of the pricing equation; zero for every option (forward form: Θ + ½σ²F²Γ = rV). */
export function pdeResidualFwd(p: Fwd, kind: Kind = "call"): number {
  const g = black76Greeks(p, kind);
  return g.thetaYr + 0.5 * p.sigma * p.sigma * p.F * p.F * g.gamma - p.r * g.price;
}

/** Spot form: Θ + rSΔ + ½σ²S²Γ − rV. */
export function pdeResidualSpot(p: Spot, kind: Kind = "call"): number {
  const g = bsGreeks(p, kind);
  return g.thetaYr + p.r * p.S * g.delta + 0.5 * p.sigma * p.sigma * p.S * p.S * g.gamma - p.r * g.price;
}

/** No-arbitrage range of a price, so an implied vol exists: forward form. */
export function priceRangeFwd(p: Omit<Fwd, "sigma">, kind: Kind = "call"): [number, number] {
  const D = Math.exp(-p.r * p.T);
  return kind === "call" ? [D * Math.max(p.F - p.K, 0), D * p.F] : [D * Math.max(p.K - p.F, 0), D * p.K];
}

export interface IvResult {
  sigma: number;
  steps: number;
  path: number[];
  ok: boolean;
}

/**
 * Implied volatility, forward form. Newton with vega as the slope, started at `start`, safeguarded by a bisection
 * bracket so it cannot leave (lo, hi). Returns every iterate so a figure can draw the tangent steps.
 */
export function impliedVolFwd(price: number, p: Omit<Fwd, "sigma">, kind: Kind = "call", start = 0.3, lo = 1e-4, hi = 5, tol = 1e-10): IvResult {
  const [pmin, pmax] = priceRangeFwd(p, kind);
  if (!(price > pmin && price < pmax)) return { sigma: NaN, steps: 0, path: [], ok: false };
  let s = start;
  const path = [s];
  let a = lo,
    b = hi;
  for (let i = 0; i < 100; i++) {
    const g = black76Greeks({ ...p, sigma: s }, kind);
    const diff = g.price - price;
    if (Math.abs(diff) < tol) return { sigma: s, steps: i, path, ok: true };
    if (diff > 0) b = Math.min(b, s);
    else a = Math.max(a, s);
    let next = s - diff / g.vega;
    if (!(next > a && next < b) || !Number.isFinite(next)) next = 0.5 * (a + b);
    s = next;
    path.push(s);
  }
  return { sigma: s, steps: 100, path, ok: false };
}

/** Same for the spot form (used to decode NSE's column, which is spot Black–Scholes at 10 %). */
export function impliedVolSpot(price: number, p: Omit<Spot, "sigma">, kind: Kind = "call", lo = 1e-4, hi = 5): number {
  let a = lo,
    b = hi;
  for (let i = 0; i < 200; i++) {
    const m = 0.5 * (a + b);
    if (bsPrice({ ...p, sigma: m }, kind) < price) a = m;
    else b = m;
    if (b - a < 1e-12) break;
  }
  return 0.5 * (a + b);
}

/** Hull's bisection (§12.11), returned step by step for the collapsed panel. */
export function bisectionPath(price: number, p: Omit<Fwd, "sigma">, lo: number, hi: number, n = 8, kind: Kind = "call"): { sigma: number; price: number }[] {
  const out: { sigma: number; price: number }[] = [];
  for (let i = 0; i < n; i++) {
    const m = 0.5 * (lo + hi);
    const v = black76({ ...p, sigma: m }, kind);
    out.push({ sigma: m, price: v });
    if (v < price) lo = m;
    else hi = m;
  }
  return out;
}

/** C3 Figure 1: n equally likely futures — exact quantiles of the lognormal centred (as a mean) on the forward. */
export function cloud(F: number, sigma: number, T: number, n = 2000): number[] {
  const out = new Array<number>(n);
  const st = sigma * Math.sqrt(T);
  for (let i = 0; i < n; i++) out[i] = F * Math.exp(-0.5 * st * st + st * quantile((i + 0.5) / n));
  return out;
}

/** What the cloud says: share above K, average payoff of a lit dot, and the discounted average over all dots. */
export function cloudStats(futures: number[], K: number, r: number, T: number, kind: Kind = "call") {
  let lit = 0,
    litPay = 0,
    pay = 0;
  for (const x of futures) {
    const v = kind === "call" ? x - K : K - x;
    if (v > 0) {
      lit++;
      litPay += v;
      pay += v;
    }
  }
  const n = futures.length;
  return { shareLit: lit / n, avgLitPayoff: lit ? litPay / lit : 0, price: (Math.exp(-r * T) * pay) / n, mean: futures.reduce((a, b) => a + b, 0) / n };
}

/** Share of the lognormal above K — N(d2) in closed form, for the bet in C3 Figure 1. */
export function shareAbove(F: number, K: number, sigma: number, T: number): number {
  const st = sigma * Math.sqrt(T);
  return cdf((Math.log(F / K) - 0.5 * st * st) / st);
}

export interface TaylorSplit {
  deltaTerm: number;
  gammaTerm: number;
  thetaTerm: number;
  taylor: number;
}

/** C4 Figure 4: Hull App. 14A — ΔδS + ½Γ δS² + Θ δt, with δt in days. */
export function taylorSplit(g: Greeks, dS: number, days: number): TaylorSplit {
  const deltaTerm = g.delta * dS;
  const gammaTerm = 0.5 * g.gamma * dS * dS;
  const thetaTerm = (g.thetaYr / 365) * days;
  return { deltaTerm, gammaTerm, thetaTerm, taylor: deltaTerm + gammaTerm + thetaTerm };
}

/** C4 Figure 5: the move at which ½Γ δS² pays for one day of theta. */
export function breakEvenMove(g: Greeks): number {
  return Math.sqrt((-2 * g.thetaYr) / 365 / g.gamma);
}

/** The risk line for a position of `units` options (negative = short). */
export function riskLine(g: Greeks, units: number, lot: number) {
  return {
    premium: -units * g.price,
    deltaUnits: units * g.delta,
    gammaPer100: units * 0.5 * g.gamma * 100 * 100,
    thetaDay: (units * g.thetaYr) / 365,
    vegaPerPt: (units * g.vega) / 100,
    rhoPerPt: (units * g.rho) / 100,
    gammaPerLotPer100: g.gamma * lot * 100,
  };
}
