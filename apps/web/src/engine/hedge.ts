/**
 * Delta hedging for chapter D1: a short option hedged with index futures once per step, the day's P&L split into
 * slope / bend / clock (Hull App. 14A), and the week run many times (Wilmott ch. 12 and 47).
 *
 * Conventions (same as tests/answer-key/key_D1.py): the hedge is futures-style — no cash outlay, variation margin
 * hedge × ΔF each step; the premium sits in cash and accrues interest; the option is marked at Black-76.
 */
import { black76Greeks, type Fwd } from "./bs";
import { normalSample, rng } from "./random";

export interface LedgerRow {
  date: string;
  close: number;
  F: number;
  daysLeft: number;
  value: number;
  delta: number;
  gamma: number;
  thetaDay: number;
  /** index units held long against the short calls after today's trade */
  hedgeUnits: number;
  tradeUnits: number;
  tradeLots: number;
  dS: number;
  dtDays: number;
  /** ½Γ δS² for the position, using yesterday's Greeks */
  bend: number;
  /** Θ × days for the position, using yesterday's Greeks */
  clock: number;
  /** exact mark-to-market P&L of the hedged book over the day */
  exactDay: number;
  cash: number;
  /** running value of the book: cash + option mark */
  book: number;
  narration: string;
}

export interface LedgerInput {
  closes: Array<{ d: string; c: number }>;
  expiry: string; // ISO date
  K: number;
  r: number;
  sigma: number;
  units: number; // negative = short
  lot: number;
  carry?: number; // F = close × carry
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

function greeksAt(F: number, K: number, r: number, sigma: number, T: number) {
  if (T <= 0) {
    const v = Math.max(F - K, 0);
    return { price: v, delta: F > K ? 1 : 0, gamma: 0, thetaYr: 0 };
  }
  return black76Greeks({ F, K, r, sigma, T });
}

/** The real week, one row per close (the first row is the day the option was sold). */
export function hedgeLedger(input: LedgerInput): LedgerRow[] {
  const { closes, expiry, K, r, sigma, units, lot } = input;
  const carry = input.carry ?? 1;
  const rows: LedgerRow[] = [];
  let hedge = 0;
  let cash = 0;
  let prev: LedgerRow | null = null;
  for (const c of closes) {
    const daysLeft = daysBetween(c.d, expiry);
    const F = c.c * carry;
    const g = greeksAt(F, K, r, sigma, daysLeft / 365);
    const target = -units * g.delta;
    const row: LedgerRow = {
      date: c.d,
      close: c.c,
      F,
      daysLeft,
      value: g.price,
      delta: g.delta,
      gamma: g.gamma,
      thetaDay: g.thetaYr / 365,
      hedgeUnits: target,
      tradeUnits: 0,
      tradeLots: 0,
      dS: 0,
      dtDays: 0,
      bend: 0,
      clock: 0,
      exactDay: 0,
      cash: 0,
      book: 0,
      narration: "",
    };
    if (!prev) {
      cash = -units * g.price;
      row.tradeUnits = target;
      row.tradeLots = target / lot;
      row.narration = "sold the calls; bought the slope in index";
    } else {
      const dS = F - prev.F;
      const dtDays = prev.daysLeft - daysLeft;
      cash *= Math.exp((r * dtDays) / 365);
      const pnlDay = units * (g.price - prev.value) + hedge * dS;
      const trade = target - hedge;
      cash += hedge * dS;
      row.tradeUnits = trade;
      row.tradeLots = trade / lot;
      row.dS = dS;
      row.dtDays = dtDays;
      row.bend = units * 0.5 * prev.gamma * dS * dS;
      row.clock = units * prev.thetaDay * dtDays;
      row.exactDay = pnlDay;
      row.narration = `${dS > 0 ? "rose" : "fell"} ${Math.abs(dS).toFixed(0)}; slope ${prev.delta.toFixed(3)} → ${g.delta.toFixed(3)}; ${trade > 0 ? "bought" : "sold"} ${(Math.abs(trade) / lot).toFixed(1)} lots after the move`;
    }
    hedge = target;
    row.cash = cash;
    row.book = cash + units * g.price;
    rows.push(row);
    prev = row;
  }
  return rows;
}

/** The hedger's realised volatility: root-mean-square of the log moves, no mean subtracted, annualised on 252 days. */
export function realisedVol(closes: number[]): number {
  let s = 0;
  for (let i = 1; i < closes.length; i++) {
    const m = Math.log(closes[i] / closes[i - 1]);
    s += m * m;
  }
  return Math.sqrt((s / (closes.length - 1)) * 252);
}

/** D1 Figure 2: the position's edge per day against the wobble the index actually has (Wilmott 12.1, for the seller). */
export function edgePerDay(g: { gamma: number }, F: number, units: number, sigmaReal: number, sigmaSold: number): number {
  return (units * 0.5 * g.gamma * F * F * (sigmaReal * sigmaReal - sigmaSold * sigmaSold)) / 365;
}

export interface SimInput {
  F0: number;
  K: number;
  r: number;
  sigmaSold: number;
  sigmaReal: number;
  days: number;
  stepsPerDay: number; // 1/days for "expiry only"
  units: number;
  paths: number;
  seed?: number;
  mu?: number;
}

/** Final P&L of the hedged book on `paths` simulated weeks (rupees, whole position). */
export function simulateHedge(s: SimInput): Float64Array {
  const { F0, K, r, sigmaSold, sigmaReal, days, stepsPerDay, units, paths } = s;
  const mu = s.mu ?? 0;
  const R = rng(s.seed ?? 11);
  const nSteps = Math.max(1, Math.round(days * stepsPerDay));
  const dt = days / 365 / nSteps;
  const out = new Float64Array(paths);
  const g0 = black76Greeks({ F: F0, K, r, sigma: sigmaSold, T: days / 365 });
  for (let p = 0; p < paths; p++) {
    let F = F0;
    let T = days / 365;
    let hedge = -units * g0.delta;
    let cash = -units * g0.price;
    for (let i = 0; i < nSteps; i++) {
      const Fn = F * Math.exp((mu - 0.5 * sigmaReal * sigmaReal) * dt + sigmaReal * Math.sqrt(dt) * normalSample(R));
      T -= dt;
      cash = cash * Math.exp(r * dt) + hedge * (Fn - F);
      F = Fn;
      const g = greeksAt(F, K, r, sigmaSold, Math.max(T, 0));
      hedge = T > 1e-12 ? -units * g.delta : -units * (F > K ? 1 : 0);
    }
    out[p] = cash + units * Math.max(F - K, 0);
  }
  return out;
}

export function summarise(x: Float64Array) {
  const n = x.length;
  let m = 0;
  for (let i = 0; i < n; i++) m += x[i];
  m /= n;
  let v = 0;
  for (let i = 0; i < n; i++) v += (x[i] - m) * (x[i] - m);
  const sd = Math.sqrt(v / (n - 1));
  return { mean: m, sd, se: sd / Math.sqrt(n) };
}

/** Wilmott's exact expected profit for the seller when the index wobbles at σ_real and the option was sold at σ_sold (hedged at σ_real). */
export function wilmottMarker(p: Omit<Fwd, "sigma">, sigmaSold: number, sigmaReal: number, units: number): number {
  return units * (black76Greeks({ ...p, sigma: sigmaReal }).price - black76Greeks({ ...p, sigma: sigmaSold }).price);
}

/** Histogram bins for a figure. */
export function histogram(x: Float64Array, bins: number, lo: number, hi: number): { x0: number; x1: number; n: number }[] {
  const w = (hi - lo) / bins;
  const out = Array.from({ length: bins }, (_, i) => ({ x0: lo + i * w, x1: lo + (i + 1) * w, n: 0 }));
  for (const v of x) {
    const i = Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / w)));
    out[i].n++;
  }
  return out;
}
