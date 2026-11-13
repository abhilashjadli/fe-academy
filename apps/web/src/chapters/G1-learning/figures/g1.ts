/**
 * Chapter G1 — the running example: the real NIFTY record (src/data/nifty50-long.json). Figure 0 fits the last sixty closes
 * before 5 Oct 2026 with a polynomial and reads it twenty trading days ahead; Figures 1–3 predict the size of tomorrow's move
 * (|return| in %) from the last k sizes, by least squares (Figure 1), ridge (Figure 2) and five contiguous folds (Figure 3).
 * Every number a figure prints is produced by engine/learning.ts on the record or read from the tested answer key
 * (src/engine/__fixtures__/key-G1.json); the engine reproduces the key in engine/learning.test.ts and the live runs are
 * asserted against the key here in dev. The sweeps (every k, every λ) are read from the key; the engine runs live for the
 * dialled point only.
 */
import key from "../../../engine/__fixtures__/key-G1.json";
import record from "../../../data/nifty50-long.json";
import { crossValidate, fitK, lagDesign, pctBetter, polyFit, ridge, type LagData, type PolyFit } from "../../../engine/learning";

export { indian, n0, n1, n2 } from "../../C4-greeks/figures/row";
export { useNarrow } from "../../D2-smile/figures/d2";
export { pctBetter };

export const KEY = key;
export const K: number = key.meta.K;

/* ---- memoisation: one Map, keyed by the run's parameters ---- */
const memo = new Map<string, unknown>();
function once<T>(k: string, f: () => T): T {
  if (memo.has(k)) return memo.get(k) as T;
  const v = f();
  memo.set(k, v);
  return v;
}
const DEV = import.meta.env.DEV;
const close = (a: number, b: number, tol: number) => Math.abs(a - b) < tol;

/* ---- formatting ---- */
/** a typographic minus */
export const neg = (s: string) => s.replace(/-/g, "−");
export const n3 = (v: number) => neg(v.toFixed(3));
/** 8.2 % — one decimal, typographic minus */
export const pct1 = (v: number) => `${neg(v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }))} %`;
/** "8.2 % better than guessing" / "28.8 % worse than guessing" */
export const betterWorse = (v: number) => (v < 0 ? `${pct1(-v)} worse than guessing` : `${pct1(v)} better than guessing`);
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
export function sup(n: number): string {
  const s = String(Math.abs(n))
    .split("")
    .map((c) => SUP[+c])
    .join("");
  return (n < 0 ? "⁻" : "") + s;
}
/** 1.79e8 → "1.8 × 10⁸" */
export function sci(v: number): string {
  if (v === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(v)));
  const m = v / 10 ** e;
  return `${neg(m.toFixed(1))} × 10${sup(e)}`;
}
/** index points a person can read: 22,641 · −194,301 · 1.7 million · 179 million */
export function pts(v: number): string {
  const a = Math.abs(v);
  if (!Number.isFinite(v)) return "—";
  if (a < 1e6) return neg(Math.round(v).toLocaleString("en-US"));
  const m = v / 1e6;
  return `${neg(a < 1e7 ? m.toFixed(1) : m.toFixed(0))} million`;
}
/** λ on the quarter-decade grid: 0 · 1 · 1.8 · 3.2 · … · 1,000 · 1,778 · 100,000 */
export const lamFmt = (lam: number) => (lam === 0 ? "0" : lam < 10 ? lam.toFixed(1) : Math.round(lam).toLocaleString("en-US"));
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-07-10" → "10 Jul" */
export function dm(d: string): string {
  const [, m, day] = d.split("-");
  return `${Number(day)} ${MONTHS[Number(m) - 1]}`;
}
/** "2026-07-10" → "10 Jul 2026" */
export function dmy(d: string): string {
  return `${dm(d)} ${d.slice(0, 4)}`;
}
/** "2019-05-23" → "May 2019" */
export function my(d: string): string {
  const [y, m] = d.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

/* ---- the record ---- */
const CLOSES: number[] = record.rows.map((r) => r.c);
const DATES: string[] = record.rows.map((r) => r.d);
const RETURNS: number[] = record.returns.map((r) => r.r);
const RET_DATES: string[] = record.returns.map((r) => r.d);
export const N_RETURNS = RETURNS.length;

/* ---- Figure 0: the sixty closes and the twenty days after (key.fig0, real) ---- */
export const FIG0 = key.fig0;
const END = CLOSES.length - FIG0.ahead.n;
/** the sixty fitted closes; equals key.fig0.closes (engine test) */
export const SEG: number[] = CLOSES.slice(END - FIG0.window.n, END);
/** the twenty closes that followed; equals key.fig0.future (engine test) */
export const FUT: number[] = CLOSES.slice(END);
export const SEG_DATES: string[] = DATES.slice(END - FIG0.window.n, END);
export const FUT_DATES: string[] = DATES.slice(END);
export const LAST_CLOSE: number = FIG0.ahead.last_close;
export const MAX_DEGREE = FIG0.rows.length;
if (DEV) {
  console.assert(SEG.length === FIG0.closes.length && SEG.every((c, i) => c === FIG0.closes[i]), "G1 fig0 window");
  console.assert(FUT[FUT.length - 1] === LAST_CLOSE, "G1 fig0 last close");
}
/** live polyFit of degree d; equals key.fig0.rows[d − 1] (asserted in dev, tested in engine/learning.test.ts) */
export function getPoly(degree: number): PolyFit {
  return once(`poly:${degree}`, () => {
    const f = polyFit(SEG, FUT, degree);
    if (DEV) {
      const row = FIG0.rows[degree - 1];
      const tol = degree >= 12 ? 1e-5 : 1e-7;
      console.assert(row.degree === degree, "G1 fig0 row", degree);
      console.assert(Math.abs(f.rmseIn - row.rmse_in) / row.rmse_in < tol, "G1 fig0 rmse_in", degree);
      console.assert(Math.abs(f.rmseOut - row.rmse_out) / row.rmse_out < tol, "G1 fig0 rmse_out", degree);
      console.assert(Math.abs(f.day20 - row.day20) / Math.abs(row.day20) < tol, "G1 fig0 day20", degree);
    }
    return f;
  });
}

/* ---- Figures 1–3: the lagged design (key.fig1 … fig3, real) ---- */
export const FIG1 = key.fig1;
export const FIG2 = key.fig2;
export const FIG3 = key.fig3;
export type TrainSet = "full" | "small";
export const TRAIN_LO = K;
export const TRAIN_HI = K + FIG1.train.n; // 2,000
export const SMALL_LO = TRAIN_HI - FIG1.small.n; // 1,750
/** rows 60 … 1,999 of the return record: 1 Apr 2016–30 Jan 2024 */
export const getTrain = (): LagData => once("design:train", () => lagDesign(RETURNS, K, TRAIN_LO, TRAIN_HI));
/** rows 2,000 … 2,682: 31 Jan 2024–3 Nov 2026 */
export const getTest = (): LagData => once("design:test", () => lagDesign(RETURNS, K, TRAIN_HI, N_RETURNS));
/** the last 250 training rows */
export const getSmall = (): LagData => once("design:small", () => lagDesign(RETURNS, K, SMALL_LO, TRAIN_HI));
if (DEV) {
  console.assert(RET_DATES[TRAIN_LO] === FIG1.train.start && RET_DATES[TRAIN_HI - 1] === FIG1.train.end, "G1 train dates");
  console.assert(RET_DATES[TRAIN_HI] === FIG1.test.start && RET_DATES[N_RETURNS - 1] === FIG1.test.end, "G1 test dates");
  console.assert(RET_DATES[SMALL_LO] === FIG1.small.start, "G1 small dates");
}

/** the "guess the average" errors each set is measured against */
export const BASE = {
  full: { train: FIG1.train.mse_mean, test: FIG1.test.mse_mean },
  small: { train: FIG1.small.mse_mean_train, test: FIG1.small.mse_mean_test },
} as const;

export interface KPoint {
  k: number;
  train: number; // % better than guessing the training mean, on the training days
  test: number; // % better than guessing the training mean, on the test days
}
/** the k-curve from the key, as % better than guessing */
export function kCurve(set: TrainSet): KPoint[] {
  const rows = set === "full" ? FIG1.full : FIG1.small_curve;
  return rows.map((r) => ({ k: r.k, train: pctBetter(r.train, BASE[set].train), test: pctBetter(r.test, BASE[set].test) }));
}
/** live fitK at the dialled k; equals the key's row (asserted in dev) */
export function getFitK(set: TrainSet, k: number): KPoint & { coef: Float64Array } {
  return once(`fitk:${set}:${k}`, () => {
    const f = fitK(set === "full" ? getTrain() : getSmall(), getTest(), k);
    if (DEV) {
      const row = (set === "full" ? FIG1.full : FIG1.small_curve)[k - 1];
      console.assert(row.k === k && close(f.train, row.train, 1e-8) && close(f.test, row.test, 1e-8), "G1 fitK", set, k);
    }
    return { k, train: pctBetter(f.train, BASE[set].train), test: pctBetter(f.test, BASE[set].test), coef: f.coef };
  });
}
/** A5's EWMA forecast of the move size, as % better than guessing on the test days (key.fig1.ewma) */
export const EWMA_TEST_PCT = pctBetter(FIG1.ewma.test, BASE.full.test);
/** the best hand-picked k on all 1,940 days and its test score */
export const BEST_K = FIG1.full.reduce((a, b) => (b.test < a.test ? b : a));
export const BEST_K_PCT = pctBetter(BEST_K.test, BASE.full.test);

/* ---- Figure 2: ridge on sixty lags (key.fig2) ---- */
export const LAMS: number[] = FIG2.lams;
export interface LamPoint {
  i: number;
  lam: number;
  test: number; // % better than guessing, test days, all 1,940 training days
  negatives: number;
  sumAbs: number;
}
/** the λ-curve from the key */
export const LAM_CURVE: LamPoint[] = FIG2.rows.map((r, i) => ({ i, lam: r.lam, test: pctBetter(r.test, BASE.full.test), negatives: r.negatives, sumAbs: r.sum_abs }));
export const BEST_LAM_I = FIG2.rows.reduce((b, r, i) => (r.test < FIG2.rows[b].test ? i : b), 0);
/** live ridge at the dialled λ: the 61 coefficients, the test score, negatives, Σ|β|; equals key.fig2.rows[i] (asserted in dev) */
export function getRidge(i: number): LamPoint & { coef: Float64Array } {
  return once(`ridge:${i}`, () => {
    const lam = LAMS[i];
    const train = getTrain();
    const b = ridge(train.X, train.y, lam);
    const f = fitK(train, getTest(), K, lam);
    const bars = Array.from(b.slice(1));
    const negatives = bars.filter((c) => c < 0).length;
    const sumAbs = bars.reduce((s, c) => s + Math.abs(c), 0);
    if (DEV) {
      const row = FIG2.rows[i];
      console.assert(row.lam === lam, "G1 ridge lam", i);
      b.forEach((c, j) => console.assert(close(c, row.coef[j], 1e-7), "G1 ridge coef", i, j));
      console.assert(close(f.test, row.test, 1e-8), "G1 ridge test", i);
      console.assert(negatives === row.negatives, "G1 ridge negatives", i);
      console.assert(close(sumAbs, row.sum_abs, 1e-7), "G1 ridge sum_abs", i);
    }
    return { i, lam, test: pctBetter(f.test, BASE.full.test), negatives, sumAbs, coef: b };
  });
}

/* ---- Figure 3: five contiguous folds (key.fig3) ---- */
export const FOLDS = FIG3.folds;
export const CV_K_SHOWN = 10;
/** live crossValidate at k = 10, λ = 0: the five per-fold scores; equals key.fig3.per_fold_k10 (asserted in dev) */
export function getFoldScores(): { cv: number; perFold: number[] } {
  return once("cv:k10", () => {
    const c = crossValidate(getTrain(), CV_K_SHOWN, 0);
    if (DEV) {
      c.perFold.forEach((v, i) => console.assert(close(v, FIG3.per_fold_k10[i], 1e-8), "G1 per-fold", i));
      console.assert(close(c.cv, FIG3.cv_k[CV_K_SHOWN - 1].cv, 1e-8), "G1 cv k10");
    }
    return c;
  });
}
/** the CV curve over λ as % better than guessing the fold's training mean (key.fig3.cv_lam against key.fig3.cv_mean) */
export const CV_LAM_CURVE = FIG3.cv_lam.map((r, i) => ({ i, lam: r.lam, cv: pctBetter(r.cv, FIG3.cv_mean), raw: r.cv }));
export const BEST_CV_I = FIG3.cv_lam.reduce((b, r, i) => (r.cv < FIG3.cv_lam[b].cv ? i : b), 0);
export const TEST_AT_CV_PCT = pctBetter(FIG3.test_at_cv_lam, BASE.full.test);
export const TEST_AT_0_PCT = pctBetter(FIG3.test_at_lam0, BASE.full.test);
export const TSAY = FIG3.tsay;
if (DEV) {
  console.assert(LAMS[BEST_CV_I] === FIG3.best_cv_lam, "G1 best cv lam");
  console.assert(LAMS[BEST_LAM_I] === FIG2.best_lam && FIG2.best_lam === FIG3.best_test_lam, "G1 best test lam");
  console.assert(LAMS.every((l, i) => l === FIG3.cv_lam[i].lam), "G1 lam grids agree");
}
/** x position of λ index i on the log axis: λ = 0 sits half a decade left of 1 */
export const lamX = (i: number) => (LAMS[i] === 0 ? -0.5 : Math.log10(LAMS[i]));
