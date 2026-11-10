/**
 * Higher Greeks for chapter C5: vanna, volga, charm, speed, zomma, color, veta.
 * Convention: charm and color are in CALENDAR time (d/dt, t running forward), so an out-of-the-money call's charm is
 * negative (its delta decays) and an at-the-money gamma's color is positive (it grows as expiry nears). veta is d(vega)/dτ.
 * Two forms as in bs.ts: forward (Black-76, the chapter) and spot (textbook rows). Tested against tests/answer-key/key_C5.py,
 * which checks every formula against a central finite difference of the price.
 */
import { black76Greeks, bsGreeks, type Fwd, type Greeks, type Kind, type Spot } from "./bs";
import { cdf, pdf } from "./normal";

export interface Greeks2 extends Greeks {
  /** ∂Δ/∂σ = ∂vega/∂F, per unit of σ */
  vanna: number;
  /** ∂²V/∂σ², per unit of σ² */
  volga: number;
  /** ∂Δ/∂t in calendar time, per year */
  charm: number;
  /** ∂Γ/∂F */
  speed: number;
  /** ∂Γ/∂σ */
  zomma: number;
  /** ∂Γ/∂t in calendar time, per year */
  color: number;
}

/** Forward form. */
export function greeks2Fwd(p: Fwd, kind: Kind = "call"): Greeks2 {
  const g = black76Greeks(p, kind);
  const { F, r, sigma, T } = p;
  const st = sigma * Math.sqrt(T);
  const D = Math.exp(-r * T);
  const nd1 = pdf(g.d1);
  const vanna = (-D * nd1 * g.d2) / sigma;
  const volga = (g.vega * g.d1 * g.d2) / sigma;
  const dd1dtau = -g.d2 / (2 * T);
  const charm = kind === "call" ? -(-r * D * cdf(g.d1) + D * nd1 * dd1dtau) : -(r * D * cdf(-g.d1) + D * nd1 * dd1dtau);
  const speed = -(g.gamma / F) * (1 + g.d1 / st);
  const zomma = (g.gamma * (g.d1 * g.d2 - 1)) / sigma;
  // color by the same route as the key (central difference of gamma in calendar time)
  const h = 1e-6;
  const color = -(black76Greeks({ ...p, T: T + h }, kind).gamma - black76Greeks({ ...p, T: T - h }, kind).gamma) / (2 * h);
  return { ...g, vanna, volga, charm, speed, zomma, color };
}

/** Spot form, no yield (Haug's closed forms, q = 0), with veta. */
export function greeks2Spot(p: Spot, kind: Kind = "call"): Greeks2 & { veta: number } {
  const g = bsGreeks(p, kind);
  const { S, r, sigma, T } = p;
  const st = sigma * Math.sqrt(T);
  const nd1 = pdf(g.d1);
  const vanna = (-nd1 * g.d2) / sigma;
  const volga = (g.vega * g.d1 * g.d2) / sigma;
  const charm = (-nd1 * (2 * r * T - g.d2 * st)) / (2 * T * st);
  const speed = -(g.gamma / S) * (1 + g.d1 / st);
  const zomma = (g.gamma * (g.d1 * g.d2 - 1)) / sigma;
  const color = (nd1 / (2 * S * T * st)) * (1 + ((2 * r * T - g.d2 * st) * g.d1) / st);
  const veta = -S * nd1 * Math.sqrt(T) * ((r * g.d1) / st - (1 + g.d1 * g.d2) / (2 * T));
  return { ...g, vanna, volga, charm, speed, zomma, color, veta };
}

/** The hedger's line (Wilmott p. 126 plus the two cross terms): how much the delta drifts. */
export function deltaDrift(g: Greeks2, dF: number, dSigma: number, dtYears: number): { gamma: number; speed: number; vanna: number; charm: number; total: number } {
  const gamma = g.gamma * dF;
  const speed = 0.5 * g.speed * dF * dF;
  const vanna = g.vanna * dSigma;
  const charm = g.charm * dtYears;
  return { gamma, speed, vanna, charm, total: gamma + speed + vanna + charm };
}

/** C5 Figure 2: Raj's book on the spot × wobble grid — P&L of `units` options hedged at today's delta. */
export function pnlGrid(p: Fwd, units: number, vols: number[], moves: number[], kind: Kind = "call"): { hedgeUnits: number; pnl: number[][] } {
  const g0 = black76Greeks(p, kind);
  const hedge = -units * g0.delta;
  const pnl = vols.map((s) =>
    moves.map((m) => {
      const F = p.F * (1 + m);
      const v = black76Greeks({ ...p, F, sigma: s }, kind).price;
      return units * (v - g0.price) + hedge * (F - p.F);
    }),
  );
  return { hedgeUnits: hedge, pnl };
}

/** A plane of one Greek over strikes × days (for the poster). */
export function plane(name: keyof Greeks2, F: number, r: number, sigma: number, strikes: number[], days: number[], kind: Kind = "call"): number[][] {
  return days.map((d) => strikes.map((K) => greeks2Fwd({ F, K, r, sigma, T: d / 365 }, kind)[name]));
}
