/**
 * Chapter A4 — shared data and helpers. Every number a figure prints is produced by the engine
 * (src/engine/timeseries.ts) or quoted from its tested answer key (key-A4.json). The real series is
 * NIFTY 50 (src/data/nifty50-long.json); everything else is a labelled, seeded simulation.
 */
import { useEffect, useState } from "react";
import key from "../../../engine/__fixtures__/key-A4.json";
import nifty from "../../../data/nifty50-long.json";
import { normalSample, rng } from "../../../engine/random";
import { ar1 } from "../../../engine/timeseries";

export const KEY = key;

/** the real record */
export const NIFTY_DATES: string[] = nifty.rows.map((r) => r.d);
export const NIFTY_CLOSE: number[] = nifty.rows.map((r) => r.c);
export const NIFTY_RET: number[] = nifty.returns.map((r) => r.r);
export const NIFTY_FROM = NIFTY_DATES[0].slice(0, 4);
export const NIFTY_TO = NIFTY_DATES[NIFTY_DATES.length - 1].slice(0, 4);

/** formats */
export const n0 = (v: number) => Math.round(v).toLocaleString("en-US", { maximumFractionDigits: 0 });
export const n1 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const n2 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const n3 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
/** a signed two-decimal, with a proper minus sign */
export const s2 = (v: number) => (v < 0 ? "−" : "") + n2(Math.abs(v));
export const s3 = (v: number) => (v < 0 ? "−" : "") + n3(Math.abs(v));

export function useNarrow(q = "(max-width: 520px)"): boolean {
  const [narrow, setNarrow] = useState(() => typeof matchMedia !== "undefined" && matchMedia(q).matches);
  useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const mq = matchMedia(q);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return narrow;
}

/** sample standard deviation */
export function sd(xs: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const m = xs.reduce((s, v) => s + v, 0) / n;
  let v = 0;
  for (const x of xs) v += (x - m) ** 2;
  return Math.sqrt(v / (n - 1));
}

/** how many times a series changes sign */
export function zeroCrossings(xs: number[]): number {
  let k = 0;
  for (let i = 1; i < xs.length; i++) if ((xs[i] >= 0) !== (xs[i - 1] >= 0)) k++;
  return k;
}

/** take every k-th point (for drawing long series as small panels) */
export function thin<T>(xs: T[], k: number): T[] {
  if (k <= 1) return xs;
  return xs.filter((_, i) => i % k === 0 || i === xs.length - 1);
}

/* ---------------- Figure 1: the nine charts ---------------- */

export interface Panel {
  id: string;
  name: string;
  real: boolean;
  stationary: boolean;
  /** one reason, shown on the flip */
  reason: string;
  ys: number[];
}

/** AR(2) r_t = φ1 r_{t−1} + φ2 r_{t−2} + noise (complex roots → aperiodic cycles) */
function ar2(n: number, p1: number, p2: number, sigma: number, next: () => number): number[] {
  const out = [0, 0];
  for (let i = 2; i < n; i++) out.push(p1 * out[i - 1] + p2 * out[i - 2] + sigma * normalSample(next));
  return out;
}

let panels: Panel[] | null = null;
export function ninePanels(): Panel[] {
  if (panels) return panels;
  const N = 500;
  const r = rng(404);
  const volIdx = ar1(N - 1, 0.97, 0.9, r, 15, 15 * (1 - 0.97)).map((v) => Math.max(8, v));
  const spread = ar1(N - 1, 0.9, 1, r);
  const seasonal = Array.from({ length: N }, (_, t) => 20 + 8 * Math.sin((2 * Math.PI * t) / 60) + 1.2 * normalSample(r));
  const cycle = ar2(300, 1.8, -0.9, 1, r).slice(50); // complex roots, cycle ≈ 19 steps, timing random
  const trend = ar1(N - 1, 0.7, 1.2, r).map((v, t) => v + 0.05 * t);
  const fx = ar1(N - 1, 1, 0.004, r, Math.log(83)).map(Math.exp);
  const yld = ar1(N - 1, 1, 0.03, r, 7);
  panels = [
    { id: "price", name: "a stock index, daily close", real: true, stationary: false, reason: "its level drifts for years — there is no home to return to", ys: thin(NIFTY_CLOSE, 5) },
    { id: "ret", name: "the same index, daily change", real: true, stationary: true, reason: "same centre, same spread, all decade", ys: thin(NIFTY_RET, 5).map((v) => 100 * v) },
    { id: "vol", name: "a volatility index", real: false, stationary: true, reason: "it spikes, but it always falls back to one level", ys: volIdx },
    { id: "spread", name: "a spread between two stocks", real: false, stationary: true, reason: "crosses its centre over and over — its rules do not change", ys: spread },
    { id: "season", name: "a seasonal volume", real: false, stationary: false, reason: "the calendar sets its level: the rule depends on the date", ys: seasonal },
    { id: "cycle", name: "an aperiodic cycle", real: false, stationary: true, reason: "wild cycles — but their timing is random, so the rules are the same every year", ys: cycle },
    { id: "trend", name: "a trending series", real: false, stationary: false, reason: "the level climbs: its mean depends on the date", ys: trend },
    { id: "fx", name: "an exchange rate", real: false, stationary: false, reason: "a random walk — every step is kept, nothing is forgotten", ys: fx },
    { id: "yield", name: "a bond yield", real: false, stationary: false, reason: "wanders between levels and never returns to one", ys: yld },
  ];
  return panels;
}

/* ---------------- Figure 4: the bank-stock spread ---------------- */

/**
 * Two bank stocks' daily closes, if the file has arrived. Expected file: src/data/bank-pair.json with
 * `{ rows: [{ d, a, b }] }` (a = HDFC Bank close, b = ICICI Bank close, same NSE dates). Until then the
 * spread is simulated and the figure says so.
 */
export interface PairFile {
  rows: Array<{ d: string; a: number; b: number }>;
  aName: string;
  bName: string;
}
export const REAL_PAIR: PairFile | null = null;

export interface Spread {
  ys: number[];
  real: boolean;
  label: string;
  /** days of the spread */
  n: number;
}

let spreadCache: Spread | null = null;
export function getSpread(): Spread {
  if (spreadCache) return spreadCache;
  if (REAL_PAIR) {
    const a = REAL_PAIR.rows.map((r) => r.a);
    const b = REAL_PAIR.rows.map((r) => r.b);
    const h = a[0] / b[0]; // ratio hedge fixed on day one
    const raw = a.map((v, i) => v - h * b[i]);
    const m = raw.reduce((s, v) => s + v, 0) / raw.length;
    const ys = raw.map((v) => v - m);
    spreadCache = { ys, real: true, label: `${REAL_PAIR.aName} − ${n2(h)} × ${REAL_PAIR.bName}, ₹, centred`, n: ys.length };
    return spreadCache;
  }
  const N = 1250; // five trading years
  const ys = ar1(N - 1, 0.98, 4, rng(1251), 0); // φ = 0.98: a slow rubber band
  spreadCache = { ys, real: false, label: "spread between two bank stocks, ₹ (simulated)", n: N };
  return spreadCache;
}

/* ---------------- Figure 5: ten fresh series ---------------- */

export interface Fresh {
  ys: number[];
  /** the rule that made it */
  walk: boolean;
  phi: number;
}

const freshCache = new Map<number, Fresh[]>();
/** five random walks and five AR(1) with φ in 0.95–0.98, shuffled, n points each; deterministic per n */
export function tenFresh(n: number): Fresh[] {
  const hit = freshCache.get(n);
  if (hit) return hit;
  const r = rng(5000 + n);
  const kinds: boolean[] = [true, true, true, true, true, false, false, false, false, false];
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  const phis = [0.95, 0.96, 0.97, 0.975, 0.98];
  let p = 0;
  const out: Fresh[] = kinds.map((walk) => {
    const phi = walk ? 1 : phis[p++];
    return { ys: ar1(n - 1, phi, 1, r, 0), walk, phi };
  });
  freshCache.set(n, out);
  return out;
}
