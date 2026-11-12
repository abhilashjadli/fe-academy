/**
 * Chapter E1 — the running example: ₹1 crore long NIFTY on the 2,683 real days 2016-01-04 → 2026-11-03, and Raj's hedged book
 * from D1. Every number a figure prints is produced by engine/var.ts on the real record (src/data/nifty50-long.json) or read from
 * the tested answer key (src/engine/__fixtures__/key-E1.json); captions quote the key. Nothing is typed in by hand except the
 * one textbook constant marked as such below.
 */
import key from "../../../engine/__fixtures__/key-E1.json";
import nifty from "../../../data/nifty50-long.json";
import {
  backtest,
  bookGreeks,
  bookPnl,
  cornishFisher,
  historicalVaR,
  linearVaR,
  normalVaR,
  pnlFromReturns,
  quadVaR,
  rollingFences,
  sd0,
  subadditivityExample,
  type Backtest,
  type Book,
  type Fences,
  type HistVaR,
} from "../../../engine/var";
import { quantile } from "../../../engine/normal";

export { indian, lakh, n0, n1, n2, rs, rsSigned } from "../../C4-greeks/figures/row";
export { useNarrow } from "../../D2-smile/figures/d2";

export const KEY = key;
export const NOTIONAL: number = key.record.notional;
export const WINDOW: number = key.backtest.window;

/* ---- the record ---- */
export const RETURNS: number[] = (nifty as { returns: { d: string; r: number }[] }).returns.map((x) => x.r);
export const DATES: string[] = (nifty as { returns: { d: string; r: number }[] }).returns.map((x) => x.d);
export const N = RETURNS.length;
/** rupee P&L of ₹1 crore long NIFTY, one entry per real day */
export const PNL: Float64Array = pnlFromReturns(RETURNS, NOTIONAL);
/** the same as losses (positive = a losing day) */
export const LOSS: Float64Array = Float64Array.from(PNL, (v) => -v);

/** historical 99 % VaR and ES of the whole record: the 27th worst day and the mean of those 27 */
export const HIST99: HistVaR = historicalVaR(LOSS, 0.01);
/** indices of the record's days sorted worst → best */
export const RANK: number[] = Array.from({ length: N }, (_, i) => i).sort((a, b) => PNL[a] - PNL[b]);
/** the record's sd (population) and the bell's 1 % line on it */
export const SD: number = sd0(PNL);
export const BELL_VAR99: number = normalVaR(SD, 0.01);
export const BEYOND_BELL: number = LOSS.reduce((c, l) => c + (l > BELL_VAR99 ? 1 : 0), 0);
/** the bell's own worst day on a record this long (its median extreme, the quantile at ½/n) and how many real days lie beyond it */
export const BELL_EXTREME: number = -quantile(0.5 / N) * SD;
export const BEYOND_BELL_EXTREME: number = LOSS.reduce((c, l) => c + (l > BELL_EXTREME ? 1 : 0), 0);
/** the bell's quantile curve on the sorted pile: P&L of the bell at rank i (worst first) */
export const bellAtRank = (i: number): number => quantile((i + 0.5) / N) * SD;
export const WORST_INDEX: number = HIST99.worst[0];
export const WORST_IN_SD: number = LOSS[WORST_INDEX] / SD;

/* ---- the backtest (memoised: the fences cost ~2,200 sorts of 500) ---- */
export interface BacktestSet {
  fences: Fences;
  /** dates of the 2,183 test days */
  dates: string[];
  /** losses of the test days */
  loss: Float64Array;
  historical: Backtest;
  normal: Backtest;
  ewma: Backtest;
}
let _bt: BacktestSet | null = null;
export function getBacktest(): BacktestSet {
  if (_bt) return _bt;
  const fences = rollingFences(PNL, WINDOW);
  const loss = LOSS.subarray(fences.start);
  const dates = DATES.slice(fences.start);
  _bt = {
    fences,
    dates,
    loss,
    historical: backtest(loss, fences.historical),
    normal: backtest(loss, fences.normal),
    ewma: backtest(loss, fences.ewma),
  };
  return _bt;
}
export type FenceId = "historical" | "normal" | "ewma";
export const FENCE_NAMES: Record<FenceId, string> = { historical: "the days themselves", normal: "a bell, 500-day width", ewma: "a bell, EWMA 0.94" };

/* ---- Raj's book (D1) ---- */
export const BOOK: Book = { F: 22603, K: 22600, r: 0.065, T: 11 / 365, sigma: key.raj.sigma, short: 6500, sigDay: key.raj.sig_day };
export const HEDGE: number = key.raj.hedge;
export const GREEKS = bookGreeks(BOOK);
export interface DialStop {
  h: number;
  linear: number;
  full: number;
  quad: number;
}
/** the fifteen stops of the hedge dial, computed by the engine (they match key.raj.dial; asserted in dev) */
export const DIAL: DialStop[] = key.raj.dial.map((d) => {
  const full = bookPnl(BOOK, d.h, RETURNS);
  return { h: d.h, linear: linearVaR(BOOK, d.h), full: historicalVaR(Float64Array.from(full, (v) => -v), 0.01).var, quad: quadVaR(BOOK, d.h) };
});
if (import.meta.env.DEV) {
  key.raj.dial.forEach((d, i) => {
    console.assert(Math.abs(DIAL[i].linear - d.linear) < 1e-2, "E1 dial linear", d.h);
    console.assert(Math.abs(DIAL[i].full - d.full) < 1e-2, "E1 dial full", d.h);
    console.assert(Math.abs(DIAL[i].quad - d.quad) < 1, "E1 dial quad", d.h);
  });
}
export const DIAL_DEFAULT: number = DIAL.findIndex((d) => d.h === HEDGE);
/** full revaluation of the book with h futures on every real day */
export const repriced = (h: number): Float64Array => bookPnl(BOOK, h, RETURNS);
export const CF = cornishFisher(BOOK, HEDGE);

/* ---- the two desks ---- */
export const DESKS = subadditivityExample(100, 0.04, 0.05);

/** the one textbook constant on the page: Hull, Options, Futures and Other Derivatives (5e), Ch. 16 — the 19 Oct 1987 S&P 500 move "in excess of 20 standard deviations"; stated as 22 in the storyboard's note. Labelled "textbook" wherever drawn. */
export const HULL_1987_SD = 22;

/* ---- formatters ---- */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2020-03-23" → "23 Mar 2020" */
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${parseInt(d, 10)} ${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}
/** "2020-03-23" → "23 Mar" */
export function fmtDay(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${parseInt(d, 10)} ${MONTHS[parseInt(m, 10) - 1]}`;
}
/** ₹2.65 lakh, signed for P&L */
export function lakhSigned(v: number, dp = 2): string {
  const s = (Math.abs(v) / 1e5).toFixed(dp);
  return (v < 0 ? "−₹" : "+₹") + s + " lakh";
}
export const f1 = (v: number) => v.toFixed(1);
export const f2 = (v: number) => v.toFixed(2);
/** 2,183 */
export const count = (v: number) => Math.round(v).toLocaleString("en-US");
/** 1 % of 2,683 → 27 */
export const ceilPct = (p: number, n: number) => Math.ceil(p * n - 1e-12);
