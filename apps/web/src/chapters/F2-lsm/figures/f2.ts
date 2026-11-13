/**
 * Chapter F2 — the running examples: Hull §20.9's eight paths (textbook), F1's American put on 50 exercise dates (textbook),
 * the real 34 implied vols of 23 Oct for the SABR valley, and the real 22,600 call for the tape. Every number a figure prints is
 * produced by engine/lsm.ts (+ volmodels.sabrSmile) or read from the tested answer key (src/engine/__fixtures__/key-F2.json);
 * the engine reproduces the key in engine/lsm.test.ts and the live runs are asserted against it here in dev. Heavy runs are
 * memoised and computed after first paint (useLazy).
 */
import { useEffect, useState } from "react";
import key from "../../../engine/__fixtures__/key-F2.json";
import { adGreek, alphaForAtm, bumpDelta, lsmPrice, lsmSmall, mcDelta, rmsVolPts, seededPaths, type LsmModel, type LsmResult, type Seed, type SmallRound, type TapeNode } from "../../../engine/lsm";
import { sabrSmile } from "../../../engine/volmodels";

export { indian, lakh, n0, n1, n2, rs } from "../../C4-greeks/figures/row";
export { useNarrow } from "../../D2-smile/figures/d2";
export type { Seed, SmallRound, TapeNode };

export const KEY = key;

/* ---- memoisation: one Map, keyed by the run's parameters ---- */
const memo = new Map<string, unknown>();
function once<T>(k: string, f: () => T): T {
  if (memo.has(k)) return memo.get(k) as T;
  const v = f();
  memo.set(k, v);
  return v;
}

/** Compute after first paint: null on the first render, then the memoised value (once per key for the life of the page). */
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

/* ---- formatting ---- */
export const n3 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
export const n4 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
export const n5 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 5, maximumFractionDigits: 5 });
/** a typographic minus */
export const neg = (s: string) => s.replace(/-/g, "−");
/** 4.19e-11 → "4.2 × 10⁻¹¹" */
export function sci(v: number): string {
  if (v === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(v)));
  const m = v / 10 ** e;
  return `${neg(m.toFixed(1))} × 10${sup(e)}`;
}
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
export function sup(n: number): string {
  const s = String(Math.abs(n))
    .split("")
    .map((c) => SUP[+c])
    .join("");
  return (n < 0 ? "⁻" : "") + s;
}
/** a plain-English version of a relative bump: 10⁻² → "a hundredth" */
export const BUMP_WORDS: Record<number, string> = {
  1: "a tenth",
  2: "a hundredth",
  3: "a thousandth",
  4: "a ten-thousandth",
  5: "a hundred-thousandth",
  6: "a millionth",
  7: "a ten-millionth",
  8: "a hundred-millionth",
  9: "a billionth",
  10: "a ten-billionth",
  11: "a hundred-billionth",
  12: "a trillionth",
};

/* ---- Figure 0: Hull's eight paths (key.hull209, textbook) ---- */
export const HULL = key.hull209;
export const HULL_PATHS: number[][] = HULL.paths;
export const HULL_D = Math.exp(-HULL.r);
export interface SmallRun {
  price: number;
  cash: number[][];
  rounds: SmallRound[];
}
/** live lsmSmall on Hull's paths; equals key.hull209 (asserted in dev, tested in engine/lsm.test.ts) */
export function getHullRun(): SmallRun {
  return once("hull", () => {
    const r = lsmSmall(HULL_PATHS, HULL.K, HULL_D);
    if (import.meta.env.DEV) {
      console.assert(Math.abs(r.price - HULL.price) < 1e-10, "F2 hull price");
      r.rounds.forEach((round, i) => {
        const k = HULL.rounds[i];
        round.coef.forEach((c, j) => console.assert(Math.abs(c - k.coef[j]) < 1e-8, "F2 hull coef", i, j));
        console.assert(round.exercise.every((e, j) => e === k.exercise[j]), "F2 hull exercise", i);
      });
    }
    return r;
  });
}
/** the exercise date and amount of each path after the run (date 0 = none) */
export function exerciseOf(run: SmallRun): Array<{ t: number; amount: number }> {
  return run.cash.map((row) => {
    const t = row.findIndex((v, i) => i > 0 && v > 0);
    return t < 0 ? { t: 0, amount: 0 } : { t, amount: row[t] };
  });
}

/* ---- Figure 1: LSM at scale against F1's grid (key.lsm, textbook) ---- */
export const LSM = key.lsm;
export const LSM_MODEL: LsmModel = { S0: LSM.S0, K: LSM.K, r: LSM.r, sigma: LSM.sigma, T: LSM.T, steps: LSM.steps };
export const LADDER_N: number[] = LSM.ladder.map((r) => r.n);
export type Basis = "quad" | "cubic";
export interface ScaleRun extends LsmResult {
  n: number;
  basis: Basis;
}
/** live seeded run (seed key.lsm.seeded.seed); at n = 2,000 quad it equals key.lsm.seeded (asserted in dev) */
export function getScaleRun(n: number, basis: Basis): ScaleRun {
  return once(`scale:${n}:${basis}`, () => {
    const paths = seededPaths(LSM_MODEL, LSM.seeded.seed, n);
    const r = lsmPrice(LSM_MODEL, paths, n, basis);
    if (import.meta.env.DEV && n === LSM.seeded.n && basis === "quad") {
      console.assert(Math.abs(r.price - LSM.seeded.price) < 1e-8, "F2 seeded price");
      console.assert(Math.abs(r.se - LSM.seeded.se) < 1e-8, "F2 seeded se");
      console.assert(Math.abs(r.european - LSM.seeded.european_same_paths) < 1e-8, "F2 seeded european");
    }
    return { ...r, n, basis };
  });
}
/** exercise dates in months to expiry for boundary index i (dates 1 … steps−1) */
export const monthsAt = (i: number) => ((LSM.steps - (i + 1)) / LSM.steps) * LSM.T * 12;

/* ---- Figure 2: the calibration valley (key.calib, real) ---- */
export const CAL = key.calib;
export const RHOS: number[] = CAL.rhos;
export const NUS: number[] = CAL.nus;
export const SURFACE: number[][] = CAL.surface_alpha_atm;
export const VALLEY = new Set(CAL.valley_points.map(([r, v]) => `${RHOS.findIndex((x) => Math.abs(x - r) < 1e-9)}:${NUS.findIndex((x) => Math.abs(x - v) < 1e-9)}`));
export const isValley = (i: number, j: number) => VALLEY.has(`${i}:${j}`);
export interface SmileAt {
  rho: number;
  nu: number;
  alpha: number;
  ivs: number[];
  rms: number;
}
/** the SABR smile with α set by the at-the-money vol at (ρ, ν) — live sabrSmile; rms equals key.calib.surface_alpha_atm[i][j] (figures/f2.test.ts) */
export function smileAt(rho: number, nu: number): SmileAt {
  const alpha = alphaForAtm(CAL.atm_iv, rho, nu, CAL.T);
  const ivs = sabrSmile(CAL.F, CAL.T, { alpha, beta: 1, rho, nu }, CAL.strikes);
  return { rho, nu, alpha, ivs, rms: rmsVolPts(ivs, CAL.ivs) };
}
export function smileAtCell(i: number, j: number): SmileAt {
  return once(`smile:${i}:${j}`, () => {
    const s = smileAt(RHOS[i], NUS[j]);
    if (import.meta.env.DEV) console.assert(Math.abs(s.rms - SURFACE[i][j]) < 1e-6, "F2 surface cell", i, j);
    return s;
  });
}
/** the continuous fit's smile (key.calib.fit), live */
export const FIT_SMILE: number[] = sabrSmile(CAL.F, CAL.T, { alpha: CAL.fit.alpha, beta: 1, rho: CAL.fit.rho, nu: CAL.fit.nu }, CAL.strikes);
export const FIT_RMS = rmsVolPts(FIT_SMILE, CAL.ivs);
if (import.meta.env.DEV) console.assert(Math.abs(FIT_RMS - CAL.rms_at_fit) < 1e-8, "F2 fit rms");
/** the grid cell nearest a (ρ, ν) */
export const nearestRho = (rho: number) => RHOS.reduce((b, r, i) => (Math.abs(r - rho) < Math.abs(RHOS[b] - rho) ? i : b), 0);
export const nearestNu = (nu: number) => NUS.reduce((b, v, j) => (Math.abs(v - nu) < Math.abs(NUS[b] - nu) ? j : b), 0);

/* ---- Figure 3: the tape (key.ad, real) ---- */
export const AD = key.ad;
export const CHAIN = AD.chain;
export const SEEDS: Array<{ id: Seed; label: string; greek: string }> = [
  { id: "F", label: "F", greek: "delta" },
  { id: "sigma", label: "σ", greek: "vega" },
  { id: "T", label: "T", greek: "theta" },
  { id: "r", label: "r", greek: "rho" },
];
export const SEED_TEX: Record<Seed, string> = { F: "F", sigma: "σ", T: "T", r: "r" };
/** live adGreek: the tape and the greek; for F it equals key.ad.tape / key.ad.dual.delta (asserted in dev) */
export function getTape(seed: Seed): { value: number; tape: TapeNode[] } {
  return once(`tape:${seed}`, () => {
    const r = adGreek(CHAIN, seed);
    if (import.meta.env.DEV) {
      const want = AD.dual[SEEDS.find((s) => s.id === seed)!.greek as keyof typeof AD.dual];
      console.assert(Math.abs(r.value - want) < 1e-6 * Math.max(1, Math.abs(want)), "F2 tape greek", seed);
      if (seed === "F") r.tape.forEach((n, i) => console.assert(Math.abs(n.d - AD.tape[i].dF) < 1e-10, "F2 tape dF", i));
    }
    return r;
  });
}
export const BUMP_EXPS: number[] = AD.bumps.map((b) => Math.round(-Math.log10(b.rel)));
export interface BumpRow {
  rel: number;
  exp: number;
  forward: number;
  central: number;
  errForward: number;
  errCentral: number;
}
/** live bumpDelta at the key's twelve relative bumps against the AD delta; the truncation regime equals key.ad.bumps (engine test) */
export function getBumps(): BumpRow[] {
  return once("bumps", () => {
    const delta = getTape("F").value;
    return AD.bumps.map((b) => {
      const d = bumpDelta(CHAIN, b.rel);
      return { rel: b.rel, exp: Math.round(-Math.log10(b.rel)), forward: d.forward, central: d.central, errForward: d.forward - delta, errCentral: d.central - delta };
    });
  });
}
export interface McRun {
  pathwise: { mean: number; se: number };
  bumpCrn: { mean: number; se: number };
  bumpIndep: { mean: number; se: number };
}
/** live mcDelta on key.ad.mc's seeds; equals key.ad.mc (asserted in dev) */
export function getMc(): McRun {
  return once("mc", () => {
    const M = AD.mc;
    const r = mcDelta(CHAIN, M.seed, M.seed_indep, M.n, M.bump_rel);
    if (import.meta.env.DEV) {
      console.assert(Math.abs(r.pathwise.mean - M.pathwise.mean) < 1e-8, "F2 mc pathwise");
      console.assert(Math.abs(r.bumpCrn.mean - M.bump_crn.mean) < 1e-8, "F2 mc crn");
      console.assert(Math.abs(r.bumpIndep.mean - M.bump_indep.mean) < 1e-8, "F2 mc indep");
    }
    return r;
  });
}
