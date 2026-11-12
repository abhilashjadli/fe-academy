/**
 * Chapter E3 — the running objects: Wilmott's two-asset pair (Figure 18.2: A 15 %/20 %, E 20 %/35 %), the five TEXTBOOK assets
 * after Wilmott Figure 18.1 with our own correlations, a drawn two-dimensional cloud, and Frye's ten US Treasury tenors from Hull
 * §16.9 (Tables 16.3–16.5), textbook until CCIL's curve history arrives. Every number a figure prints is produced by
 * engine/portfolio.ts and engine/linalg.ts, or read from the tested answer key (src/engine/__fixtures__/key-E3.json); the captions
 * quote the key. The no-short envelope (a 2 % simplex grid, ~316k portfolios) is computed after first paint and cached (useLazy).
 */
import { useEffect, useState } from "react";
import key from "../../../engine/__fixtures__/key-E3.json";
import { bestMeanAtRisk, covFrom, factorExposure, frontierRisk, globalMinimum, noShortEnvelope, pca, reconstruct, tangency, type PCA } from "../../../engine/portfolio";
import type { Mat } from "../../../engine/linalg";

export { useNarrow } from "../../D2-smile/figures/d2";
export { count, f1, f2 } from "../../E1-var/figures/e1";

export const KEY = key;
export const TWO = key.two;
export const FIVE = key.five;
export const FRYE = key.frye;
export const NSS = key.nss;
export const RF: number = key.five.tangency.rf;

/* ---- memoisation, as E2's e2.ts: one Map, computed once per key for the life of the page ---- */
const memo = new Map<string, unknown>();
export function once<T>(k: string, f: () => T): T {
  if (memo.has(k)) return memo.get(k) as T;
  const v = f();
  memo.set(k, v);
  return v;
}
/** compute after first paint: null on the first render, then the memoised value */
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

/* ---- Figure 0: the five textbook assets ---- */
export const NAMES: string[] = FIVE.names;
export const MU: number[] = FIVE.mu;
export const SD: number[] = FIVE.sd;
export const RHO: Mat = FIVE.rho;
/** the covariance via covFrom (equals key.five.S; asserted in dev) */
export const S5: Mat = covFrom(SD, RHO);
if (import.meta.env.DEV) S5.forEach((r, i) => r.forEach((v, j) => console.assert(Math.abs(v - FIVE.S[i][j]) < 1e-12, "E3 cov", i, j)));

/** the unconstrained frontier, both branches, as (risk, return) pairs in fractions, from the closed form */
export function getFrontierCurve(): { m: number; sd: number }[] {
  return once("frontier", () => {
    const out: { m: number; sd: number }[] = [];
    for (let m = 0.04; m <= 0.2801; m += 0.0025) out.push({ m, sd: frontierRisk(MU, S5, m) });
    return out;
  });
}
export const GLOBAL_MIN = globalMinimum(MU, S5);
export const TANGENCY = tangency(MU, S5, RF);
/** the bet's reveal: the best mean at A's own 20 % risk, short sales allowed (key.five.at_A_risk: 16.646 %) */
export const AT_A_RISK = bestMeanAtRisk(MU, S5, SD[0]);
if (import.meta.env.DEV) {
  console.assert(Math.abs(AT_A_RISK.m - FIVE.at_A_risk.m) < 1e-4, "E3 at_A_risk");
  console.assert(Math.abs(TANGENCY.sharpe - FIVE.tangency.sharpe) < 1e-9, "E3 tangency");
}
export type Envelope = ReturnType<typeof noShortEnvelope>;
/** the no-short envelope on the key's 2 % grid (~316k portfolios; ~a second, so always via useLazy) */
export function getEnvelope(): Envelope {
  return once("envelope", () => {
    const env = noShortEnvelope(MU, S5, FIVE.noshort.step);
    if (import.meta.env.DEV) {
      const at = env.filter((p) => p.sd <= SD[0]).reduce((a, b) => (b.m > a.m ? b : a));
      console.assert(Math.abs(at.m - FIVE.noshort.at_A_risk.m) < 1e-10, "E3 noshort at A risk");
    }
    return env;
  });
}
/** the envelope's best point at or below risk `sd` */
export function envelopeAt(env: Envelope, sd: number): Envelope[number] {
  return env.filter((p) => p.sd <= sd).reduce((a, b) => (b.m > a.m ? b : a));
}

/* ---- Figure 1: the drawn cloud ---- */
export const CLOUD_N = 600;
export const CLOUD_SEED = 3;
export const CLOUD_SD: [number, number] = [1, 0.7];
/** S = [[1, 0.7ρ], [0.7ρ, 0.49]] */
export function cloudCov(rho: number): Mat {
  const [a, b] = CLOUD_SD;
  return [
    [a * a, rho * a * b],
    [rho * a * b, b * b],
  ];
}

/* ---- Figure 2: Frye's factors ---- */
export const TENORS: string[] = FRYE.tenors;
export const TENOR_YEARS: number[] = FRYE.tenor_years;
export const LOADINGS: number[][] = [FRYE.pc1, FRYE.pc2, FRYE.pc3];
export const FACTOR_SD: number[] = FRYE.sds;
export const FACTOR_NAMES = ["shift", "tilt", "bend"] as const;
/** Σ₃ rebuilt from the three printed factors (as portfolio.test.ts does) and its PCA — the only factors the key holds */
export const SIGMA3: Mat = TENORS.map((_, i) => TENORS.map((_, j) => FACTOR_SD[0] ** 2 * FRYE.pc1[i] * FRYE.pc1[j] + FACTOR_SD[1] ** 2 * FRYE.pc2[i] * FRYE.pc2[j] + FACTOR_SD[2] ** 2 * FRYE.pc3[i] * FRYE.pc3[j]));
export const PCA3: PCA = pca(SIGMA3);
/** the made-up day, textbook: 1 sd of PC1 − 0.8 sd of PC2 + 0.5 sd of PC3, in bp per tenor */
export const DAY_MIX: [number, number, number] = [1, -0.8, 0.5];
export const MADE_UP_DAY: number[] = TENORS.map((_, i) => DAY_MIX[0] * FACTOR_SD[0] * FRYE.pc1[i] + DAY_MIX[1] * FACTOR_SD[1] * FRYE.pc2[i] + DAY_MIX[2] * FACTOR_SD[2] * FRYE.pc3[i]);
export function rebuild(k: number): ReturnType<typeof reconstruct> {
  return once(`rebuild:${k}`, () => reconstruct(PCA3, MADE_UP_DAY, Math.min(k, PCA3.vectors.length)));
}
/** one sd of each factor as a move in bp per tenor */
export const ONE_SD_MOVE: number[][] = LOADINGS.map((l, f) => l.map((v) => v * FACTOR_SD[f]));
if (import.meta.env.DEV) ONE_SD_MOVE[0].forEach((v, i) => console.assert(Math.abs(v - FRYE.one_sd_pc1_bp[i]) < 1e-9, "E3 one sd pc1", i));

/** Hull Table 16.5's book: five tenor exposures ($ m per bp) collapsed to two factor exposures and a 99 % one-day VaR */
export const BOOK = FRYE.book;
const bookIdx = BOOK.tenors.map((t) => TENORS.indexOf(t));
export const BOOK_EXPOSURE = factorExposure(
  BOOK.exposures,
  [FRYE.pc1, FRYE.pc2].map((row) => bookIdx.map((i) => row[i])),
  FACTOR_SD.slice(0, 2),
);
export const Z99 = 2.33;
export const BOOK_VAR = Z99 * BOOK_EXPOSURE.sd;
export const BOOK_ONE_FACTOR_VAR = Z99 * Math.abs(BOOK_EXPOSURE.f[0]) * FACTOR_SD[0];
if (import.meta.env.DEV) {
  console.assert(Math.abs(BOOK_EXPOSURE.f[0] - BOOK.f1) < 1e-9 && Math.abs(BOOK_EXPOSURE.f[1] - BOOK.f2) < 1e-9, "E3 book exposures");
  console.assert(Math.abs(BOOK_VAR - BOOK.var99) < 1e-6, "E3 book var");
  console.assert(Math.abs(BOOK_ONE_FACTOR_VAR - BOOK.one_factor_var) < 1e-6, "E3 one factor var");
}

/* ---- formatting ---- */
/** 0.16646 → "16.6 %" */
export const pct1 = (v: number) => (100 * v).toFixed(1) + " %";
/** 0.1 → "10 %" */
export const pct0 = (v: number) => Math.round(100 * v) + " %";
/** a weight: −0.134 → "−13 %" */
export const wpct = (v: number) => (v < -0.005 ? "−" : "") + Math.abs(Math.round(100 * v)) + " %";
/** a signed two-decimal number with a real minus sign */
export const sgn2 = (v: number) => (v < 0 ? "−" : v > 0 ? "+" : "") + Math.abs(v).toFixed(2);
export const sgn0 = (v: number) => (v < 0 ? "−" : v > 0 ? "+" : "") + Math.abs(Math.round(v));
/** correlation: −0.5 → "−0.50" */
export const rho2 = (v: number) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(2);
/** 6.2964 → "6.3 bp" */
export const bp1 = (v: number) => (v < -0.05 ? "−" : "") + Math.abs(v).toFixed(1) + " bp";
