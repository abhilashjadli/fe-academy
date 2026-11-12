/**
 * Chapter F1 — the running example: the real chain's 22,600 call (F 22,603, 11 days, σ the chain's implied) on a forward grid
 * 18,000–28,000, and Hull's Example 18.1 American put as the one labelled textbook grid. Every number a figure prints is
 * produced by engine/fdm.ts or read from the tested answer key (src/engine/__fixtures__/key-F1.json); the engine reproduces
 * the key to 1e-5 (engine/fdm.test.ts) and the live runs are asserted against it in dev. Heavy solves are memoised here and
 * computed after first paint (useLazy).
 */
import { useEffect, useState } from "react";
import key from "../../../engine/__fixtures__/key-F1.json";
import { black76 } from "../../../engine/bs";
import { explicitLimit, explicitWeights, hullGrid, neighbourRule, solveForward, type Grid, type HullGrid, type HullParams, type Scheme, type Solution } from "../../../engine/fdm";

export { indian, lakh, n0, n1, n2, rs, rsSigned } from "../../C4-greeks/figures/row";
export { useNarrow } from "../../D2-smile/figures/d2";
export { count, f1, f2 } from "../../E1-var/figures/e1";

export const KEY = key;
export const GRID: Grid = key.chain;
export const TRUTH: number = key.chain.truth;
export const DAYS = Math.round(GRID.T * 365);
export type { Scheme };

/* ---- memoisation: one Map, keyed by the run's parameters ---- */
const memo = new Map<string, unknown>();
function once<T>(k: string, f: () => T): T {
  if (memo.has(k)) return memo.get(k) as T;
  const v = f();
  memo.set(k, v);
  return v;
}

/**
 * Compute after first paint: returns null on the first render, then the memoised value. The work runs once per key for the
 * life of the page (a re-mount finds it in the Map).
 */
export function useLazy<T>(k: string, f: () => T): T | null {
  const [v, setV] = useState<T | null>(() => (memo.has(k) ? (memo.get(k) as T) : null));
  useEffect(() => {
    if (memo.has(k)) {
      setV(memo.get(k) as T);
      return;
    }
    let live = true;
    const id = window.setTimeout(() => {
      const r = once(k, f);
      if (live) setV(r);
    }, 0);
    return () => {
      live = false;
      window.clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);
  return v;
}

/* ---- Figure 0: the rod (key.rod — the 800 × 88 Crank–Nicolson grid with a Rannacher start, every eighth node) ---- */
export const ROD_F: number[] = key.rod.F;
export const ROD_DF = ROD_F[1] - ROD_F[0];
export const ROD_DAYS: number[] = key.rod.days;
export const ROD_ROWS: number[][] = key.rod.rows;
/** index of the dot nearest the strike (22,600) */
export const ROD_J0 = key.rod.rule_example.j;
/** Black-76 over the same dots, live from engine/bs (equals key.rod.formula_row) */
export const FORMULA_ROW: number[] = ROD_F.map((F) => black76({ F, K: GRID.K, r: GRID.r, sigma: GRID.sigma, T: GRID.T }));
/** the 800-node solve the key's rod was taken from; asserted equal to the key's rows in dev */
export function getRodSolve(): Solution {
  return once("rod", () => {
    const keep = ROD_DAYS.slice(1).map((d) => 8 * d);
    const sol = solveForward(GRID, 800, 88, "cn", { rannacher: 1, keep });
    if (import.meta.env.DEV) {
      console.assert(Math.abs(sol.value - key.rod.value_at_F0) < 1e-6, "F1 rod value");
      ROD_ROWS.slice(1).forEach((row, d) => {
        const snap = sol.snaps.get(8 * (d + 1))!;
        row.forEach((v, i) => console.assert(Math.abs(snap[8 * i] - v) < 1e-6, "F1 rod row", d + 1, i));
      });
    }
    return sol;
  });
}
/** linear interpolation of a row at F */
export function rowAt(row: ArrayLike<number>, F: number, Fg: ArrayLike<number> = ROD_F): number {
  const dF = Fg[1] - Fg[0];
  const x = (F - Fg[0]) / dF;
  const i = Math.max(0, Math.min(Math.floor(x), Fg.length - 2));
  return row[i] + (x - i) * (row[i + 1] - row[i]);
}
export interface Rule {
  j: number;
  F: number;
  V: number;
  Vm: number;
  Vp: number;
  avg: number;
  weight: number;
  /** per year */
  pull: number;
}
/** the neighbour rule at dot j of a rod row (interior dots only) */
export function ruleAt(row: ArrayLike<number>, j: number): Rule {
  const r = neighbourRule(GRID, ROD_F[j], ROD_DF, row[j - 1], row[j], row[j + 1]);
  return { j, F: ROD_F[j], V: row[j], Vm: row[j - 1], Vp: row[j + 1], ...r };
}
/** the largest |pull| over the interior dots of a row, and where */
export function maxPull(row: ArrayLike<number>): { pull: number; j: number } {
  let best = 0;
  let bj = 1;
  for (let j = 1; j < ROD_F.length - 1; j++) {
    const p = ruleAt(row, j).pull;
    if (Math.abs(p) > Math.abs(best)) {
      best = p;
      bj = j;
    }
  }
  return { pull: best, j: bj };
}
if (import.meta.env.DEV) {
  const e = key.rod.rule_example;
  const r = ruleAt(ROD_ROWS[ROD_ROWS.length - 1], e.j);
  console.assert(Math.abs(r.pull - e.pull_per_year) < 1e-4 && Math.abs(r.avg - e.avg) < 1e-6, "F1 rule example");
  FORMULA_ROW.forEach((v, i) => console.assert(Math.abs(v - key.rod.formula_row[i]) < 1e-6, "F1 formula row", i));
}
/** nodes per standard deviation of the 11-day move at a spacing dF (key.wide_grid_note.sd_points is σF√T) */
export const nodesPerSd = (dF: number) => key.wide_grid_note.sd_points / dF;

/* ---- Figure 1: the explicit dial (key.dial) ---- */
export type GridName = "grid100" | "grid50";
export const DIAL = key.dial;
export const STEP_DAYS: number[] = key.dial.grid100.rows.map((r) => r.step_days);
export interface DialRun {
  M: number;
  N: number;
  stepDays: number;
  sol: Solution;
  weights: { down: number; stay: number; up: number };
  limitYears: number;
  limitDays: number;
  stable: boolean;
}
export function getDial(name: GridName, i: number): DialRun {
  const d = DIAL[name];
  const row = d.rows[i];
  return once(`dial:${name}:${i}`, () => {
    const sol = solveForward(GRID, d.M, row.N, "explicit");
    const limitYears = explicitLimit(GRID, d.M);
    if (import.meta.env.DEV) {
      if (Math.abs(row.price) < 1e6) console.assert(Math.abs(sol.value - row.price) < 1e-4, "F1 dial price", name, row.step_days);
      console.assert(Math.abs(sol.maxAbs / row.max_abs - 1) < 1e-5, "F1 dial maxAbs", name, row.step_days);
      console.assert(Math.abs(limitYears - d.limit_years) < 1e-12, "F1 dial limit", name);
    }
    return { M: d.M, N: row.N, stepDays: row.step_days, sol, weights: explicitWeights(GRID, d.M, sol.dt), limitYears, limitDays: d.limit_days, stable: row.stable };
  });
}

/* ---- Figure 2: the three ladders (key.schemes) ---- */
export const SCHEMES: Scheme[] = ["explicit", "implicit", "cn"];
export const SCHEME_NAME: Record<Scheme, string> = { explicit: "explicit", implicit: "implicit", cn: "Crank–Nicolson" };
export const LADDER_M: number[] = key.schemes.cn.map((r) => r.M);
export interface Rung {
  M: number;
  N: number;
  price: number;
  error: number;
}
export function getRung(s: Scheme, i: number): Rung {
  const row = key.schemes[s][i];
  return once(`rung:${s}:${row.M}`, () => {
    const sol = solveForward(GRID, row.M, row.N, s, { rannacher: s === "cn" ? 1 : 0 });
    if (import.meta.env.DEV) console.assert(Math.abs(sol.value - row.price) < 1e-5, "F1 rung", s, row.M);
    return { M: row.M, N: row.N, price: sol.value, error: sol.value - TRUTH };
  });
}
export function getLadder(s: Scheme): Rung[] {
  return once(`ladder:${s}`, () => LADDER_M.map((_, i) => getRung(s, i)));
}
export const ERR_DF = key.err_dF;
export const ERR_DT = key.err_dt;
export const SLOPES = key.slopes;

/* ---- Figure 3: Hull Example 18.1 (textbook) ---- */
export const HULL = key.hull;
export const HULL_P: HullParams = key.hull.params;
export function getHull(scheme: Scheme, american: boolean): HullGrid {
  return once(`hull:${scheme}:${american}`, () => {
    const g = hullGrid(HULL_P, scheme, american);
    if (import.meta.env.DEV) {
      const ref = scheme === "implicit" ? (american ? HULL.implicit_american : HULL.implicit_european) : scheme === "explicit" ? (american ? HULL.explicit_american : HULL.explicit_european) : null;
      if (ref) ref.grid.forEach((row, i) => row.forEach((v, j) => console.assert(Math.abs(g.grid[i][j] - v) < 1e-8, "F1 hull cell", scheme, american, i, j)));
    }
    return g;
  });
}
/** months to expiry of column i (Hull labels his columns by time to maturity, 5 → 0) */
export const hullMonths = (i: number) => HULL_P.T * 12 - HULL.implicit_american.months[i];

/* ---- formatting ---- */
/** rupees in the words a desk uses: ₹147 crore, −₹1.78 crore, ₹24 lakh, ₹5,389, ₹249.16 */
export function rupees(v: number): string {
  const a = Math.abs(v);
  const sign = v < 0 ? "−₹" : "₹";
  if (a >= 1e7) return sign + (a / 1e7).toLocaleString("en-US", { maximumFractionDigits: a / 1e7 >= 10 ? 0 : 2 }) + " crore";
  if (a >= 1e5) return sign + (a / 1e5).toLocaleString("en-US", { maximumFractionDigits: a / 1e5 >= 10 ? 0 : 1 }) + " lakh";
  if (a >= 1000) return sign + Math.round(a).toLocaleString("en-US");
  return sign + a.toFixed(2);
}
/** 0.25 → "0.25 day", 1 → "1 day" */
export const dayLabel = (d: number) => `${d} day${d === 1 ? "" : "s"}`;
/** signed to two decimals with a true minus */
export const s2 = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(2);
export const s3 = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(3);
/** a negative number with a true minus sign */
export const neg = (t: string) => t.replace("-", "−");
