/**
 * The pair of index series for Figure 3 ("the hedge that drifted").
 * Real: NIFTY 50 and NIFTY BANK daily closes from NSE, when `data/banknifty-long.json` is present.
 * Until then: a labelled simulation with the same character (two trending series whose ratio drifts).
 */
import nifty from "../../data/nifty50-long.json";
import { normalSample, rng } from "../../engine/random";

export interface Pair {
  dates: string[];
  a: number[]; // the thing you can trade (NIFTY 50)
  b: number[]; // the thing you hold (NIFTY BANK)
  aName: string;
  bName: string;
  real: boolean;
  source: string;
}

let cached: Pair | null = null;

export function getPair(): Pair {
  if (cached) return cached;
  const rows = nifty.rows;
  const dates = rows.map((r) => r.d);
  const a = rows.map((r) => r.c);
  // Simulated "bank index": beta drifts slowly from 1.6 to 1.1 over the decade, plus its own wobble.
  const r = rng(2016);
  const b: number[] = [1.6 * a[0]];
  for (let i = 1; i < a.length; i++) {
    const beta = 1.6 - (0.5 * i) / a.length; // the hedge ratio drifts over the decade
    const ret = beta * Math.log(a[i] / a[i - 1]) + 0.008 * normalSample(r); // plus the bank index's own daily news
    b.push(b[i - 1] * Math.exp(ret));
  }
  cached = { dates, a, b, aName: "NIFTY 50", bName: "a bank index (simulated)", real: false, source: "NIFTY 50 real (NSE); the bank index is simulated until the NIFTY BANK file arrives" };
  return cached;
}

/** Log-returns of a series. */
export function logReturns(xs: number[]): number[] {
  return xs.slice(1).map((v, i) => Math.log(v / xs[i]));
}
