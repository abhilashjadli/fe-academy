/**
 * Chapter E2 — the running example: the real chain's 22,600 call (F 22,603, 11 days to 3 Nov 2026, σ the chain's implied),
 * an Asian what-if on the seven real closes 26 Oct → 3 Nov, and Raj's book from D1 on 5,000 drawn tomorrows. Every number a
 * figure prints is produced by engine/montecarlo.ts with the seeds shown, or read from the tested answer key
 * (src/engine/__fixtures__/key-E2.json), which ports the site's generator bit for bit so the live runs equal the key's.
 * Heavy runs are memoised here and computed after first paint (useLazy).
 */
import { useEffect, useState } from "react";
import key from "../../../engine/__fixtures__/key-E2.json";
import keyE1 from "../../../engine/__fixtures__/key-E1.json";
import {
  antithetic,
  asianControl,
  asianPaths,
  bootstrapQuantileSd,
  controlVariate,
  estimate,
  experiment,
  geometricAsian,
  logLogSlope,
  mcVaR,
  normals,
  quantileSeNormal,
  straddlePayoff,
  terminal,
  type AsianRun,
  type Chain,
  type Estimate,
  type TwoFactorBook,
} from "../../../engine/montecarlo";
import { quantile } from "../../../engine/normal";

export { indian, lakh, n0, n1, n2, rs, rsSigned } from "../../C4-greeks/figures/row";
export { useNarrow } from "../../D2-smile/figures/d2";
export { fmtDate, fmtDay, count, f1, f2 } from "../../E1-var/figures/e1";

export const KEY = key;
export const KEY_E1 = keyE1;
export const CHAIN: Chain = key.chain;
export const TRUE_CALL: number = key.exact.call;
export const DAYS = Math.round(CHAIN.T * 365);
export const EXPIRY = "2026-11-03";

/* ---- memoisation: one Map per kind, keyed by the run's parameters ---- */
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

/* ---- Figure 0: the cloud, 2,000 random dots per seed ---- */
export const CLOUD_N = 2000;
export const SEEDS: number[] = key.rerolls.map((r) => r.seed);
export interface Reroll extends Estimate {
  seed: number;
  /** terminal index level of every dot */
  st: Float64Array;
  z: Float64Array;
  y: Float64Array;
  /** |price − 249.15| ≤ 1.96 SE */
  inside: boolean;
}
export function getReroll(seed: number): Reroll {
  return once(`reroll:${seed}`, () => {
    const e = experiment(CHAIN, seed, CLOUD_N);
    const st = Float64Array.from(e.z, (z) => terminal(CHAIN, z));
    return { ...e, seed, st, inside: Math.abs(e.mean - TRUE_CALL) <= 1.96 * e.se };
  });
}
/** all twenty re-rolls (the engine reproduces key.rerolls; asserted in dev) */
export function getRerolls(): Reroll[] {
  return once("rerolls", () => {
    const rs = SEEDS.map(getReroll);
    if (import.meta.env.DEV) {
      key.rerolls.forEach((r, i) => {
        console.assert(Math.abs(rs[i].mean - r.price) < 1e-6, "E2 reroll price", r.seed);
        console.assert(Math.abs(rs[i].se - r.se) < 1e-6, "E2 reroll se", r.seed);
      });
      console.assert(rs.filter((r) => r.inside).length === key.inside_95, "E2 inside_95");
    }
    return rs;
  });
}

/* ---- Figure 1: the ladder, the mirror, the control ---- */
/** the dial's stops: the key's seven ladder rungs plus Figure 0's 2,000 (the default; not in the slope fit) */
export const LADDER_N: number[] = key.ladder.map((l) => l.n);
export const DIAL_N: number[] = [...LADDER_N, CLOUD_N].sort((a, b) => a - b);
export const DIAL_DEFAULT = DIAL_N.indexOf(CLOUD_N);
export interface Rung extends Estimate {
  n: number;
}
export function getRung(n: number): Rung {
  return once(`rung:${n}`, () => ({ ...estimate(experiment(CHAIN, 1, n).y), n }));
}
export function getLadder(): { rungs: Rung[]; slope: number } {
  return once("ladder", () => {
    const rungs = LADDER_N.map(getRung);
    const slope = logLogSlope(
      rungs.map((r) => r.n),
      rungs.map((r) => r.se),
    );
    if (import.meta.env.DEV) {
      key.ladder.forEach((l, i) => console.assert(Math.abs(rungs[i].se - l.se) < 1e-6, "E2 ladder", l.n));
      console.assert(Math.abs(slope - key.ladder_slope) < 1e-6, "E2 ladder slope");
    }
    return { rungs, slope };
  });
}
export interface Tricks {
  n: number;
  plain: Estimate;
  call: ReturnType<typeof antithetic>;
  straddle: ReturnType<typeof antithetic>;
  straddlePlain: Estimate;
  control: ReturnType<typeof controlVariate>;
}
export function getTricks(n: number): Tricks {
  return once(`tricks:${n}`, () => ({
    n,
    plain: getRung(n),
    call: antithetic(CHAIN, 1, n),
    straddle: antithetic(CHAIN, 1, n, straddlePayoff),
    straddlePlain: estimate(experiment(CHAIN, 1, n, straddlePayoff).y),
    control: controlVariate(CHAIN, 1, n),
  }));
}

/* ---- Figure 2: the Asian what-if ---- */
export const ASIAN = key.asian;
export const ASIAN_SEED: number = key.asian.seeded.seed;
export const ASIAN_N: number = key.asian.seeded.n;
export const FIX_DAYS: number[] = ASIAN.t.map((t) => Math.round(t * 365));
export const GEO = geometricAsian(CHAIN, ASIAN.t);
export interface AsianSet {
  run: AsianRun;
  /** all 2,000 roads, m levels each, row-major (the engine keeps the first 50; the rest are replayed from the same normals) */
  roads: Float64Array;
  m: number;
  ends: Float64Array;
  arith: Estimate;
  endsSd: number;
  avgSd: number;
  cv: ReturnType<typeof asianControl>;
  /** share of the 2,000 arithmetic payoffs below the real road's */
  realPct: number;
  realRank: number;
}
export function getAsian(): AsianSet {
  return once("asian", () => {
    const run = asianPaths(CHAIN, ASIAN.t, ASIAN_SEED, ASIAN_N);
    const m = ASIAN.t.length;
    const z = normals(ASIAN_SEED, ASIAN_N * m);
    const dts = ASIAN.t.map((ti, i) => ti - (i ? ASIAN.t[i - 1] : 0));
    const roads = new Float64Array(ASIAN_N * m);
    const ends = new Float64Array(ASIAN_N);
    for (let p = 0; p < ASIAN_N; p++) {
      let logS = Math.log(CHAIN.F);
      for (let i = 0; i < m; i++) {
        logS += -0.5 * CHAIN.sigma * CHAIN.sigma * dts[i] + CHAIN.sigma * Math.sqrt(dts[i]) * z[p * m + i];
        roads[p * m + i] = Math.exp(logS);
      }
      ends[p] = roads[p * m + m - 1];
    }
    const arith = estimate(run.payArith);
    const cv = asianControl(run, GEO.price);
    let below = 0;
    for (let i = 0; i < ASIAN_N; i++) if (run.payArith[i] < ASIAN.real_payoff) below++;
    const set: AsianSet = { run, roads, m, ends, arith, endsSd: estimate(ends).sd, avgSd: estimate(run.arith).sd, cv, realPct: below / ASIAN_N, realRank: ASIAN_N - below };
    if (import.meta.env.DEV) {
      run.paths.forEach((path, p) => path.forEach((v, i) => console.assert(Math.abs(roads[p * m + i] - v) < 1e-6, "E2 asian road replay", p, i)));
      console.assert(Math.abs(arith.mean - ASIAN.seeded.arith) < 1e-6, "E2 asian arith");
      console.assert(Math.abs(cv.se - ASIAN.seeded.cv_se) < 1e-6, "E2 asian cv se");
      console.assert(Math.abs(set.endsSd - ASIAN.seeded.endpoint_sd) < 1e-6, "E2 asian endpoint sd");
      console.assert(Math.abs(GEO.price - ASIAN.geo_closed) < 1e-8, "E2 geo closed");
    }
    return set;
  });
}
/** running average of one road (levels only, from the first fixing) */
export function runningAverage(road: ArrayLike<number>): number[] {
  const out: number[] = [];
  let s = 0;
  for (let i = 0; i < road.length; i++) {
    s += road[i];
    out.push(s / (i + 1));
  }
  return out;
}

/* ---- Figure 3: Raj's book on 5,000 tomorrows ---- */
export const MC = key.mcvar;
export const BOOK: TwoFactorBook = { ...CHAIN, short: MC.short, sigDay: MC.sig_day, volRelSd: MC.vol_rel_sd };
export const HEDGE: number = MC.hedge;
export const MC_SEED: number = MC.corr.seed;
export const MC_N: number = MC.corr.n;
export const BOOT_SEED = 11;
export const RHOS = [-0.6, 0, 0.6] as const;
export type Rho = (typeof RHOS)[number];
export interface Tomorrows {
  rho: number;
  h: number;
  var: number;
  es: number;
  k: number;
  pnl: Float64Array;
  /** losses sorted worst first */
  sortedLoss: Float64Array;
  /** the key's row for the same setting */
  keyVar: number;
}
export function getTomorrows(rho: number, h: number): Tomorrows {
  return once(`mcvar:${rho}:${h}`, () => {
    const v = mcVaR(BOOK, MC_SEED, MC_N, rho, h);
    const sortedLoss = Float64Array.from(v.pnl, (p) => -p).sort((a, b) => b - a);
    const row = MC.grid.find((g) => g.rho === rho && g.h === h);
    if (import.meta.env.DEV && row) console.assert(Math.abs(v.var - row.var99) < 1e-3, "E2 mcvar", rho, h);
    return { rho, h, var: v.var, es: v.es, k: v.k, pnl: v.pnl, sortedLoss, keyVar: row?.var99 ?? NaN };
  });
}
/** bootstrap sd of the 50th-worst, relative to the VaR (seed 11, 400 resamples; ~half a second, so always via useLazy) */
export function getBootRel(rho: number, h: number): number {
  return once(`boot:${rho}:${h}`, () => {
    const t = getTomorrows(rho, h);
    return bootstrapQuantileSd(t.pnl, 0.01, BOOT_SEED) / t.var;
  });
}
/** a plain bell's relative error bar on its 1 % quantile from 5,000 draws: √(p(1−p)/n)/φ(q) ÷ q */
export const BELL_REL: number = quantileSeNormal(1, 0.01, MC_N) / quantile(0.99);
/** E1's exact bend-on-a-bell figure for the same book (key-E1), by futures held */
export function e1Quad(h: number): number {
  if (h === keyE1.raj.hedge) return keyE1.raj.quad_var99;
  const d = keyE1.raj.dial.find((x) => x.h === h);
  return d ? d.quad : NaN;
}
/** the sheared pair (A2's picture): x = z1, y = ρ z1 + √(1−ρ²) z2 */
export function shear(z1: number, z2: number, rho: number): [number, number] {
  return [z1, rho * z1 + Math.sqrt(1 - rho * rho) * z2];
}

/* ---- small shared helpers ---- */
/** bucket values into bins of width w starting at lo; returns counts and the bin edges */
export function histogram(v: ArrayLike<number>, lo: number, hi: number, w: number): { counts: number[]; lo: number; w: number } {
  const nb = Math.max(1, Math.ceil((hi - lo) / w));
  const counts = new Array<number>(nb).fill(0);
  for (let i = 0; i < v.length; i++) {
    const b = Math.floor((v[i] - lo) / w);
    if (b >= 0 && b < nb) counts[b]++;
  }
  return { counts, lo, w };
}
/** ± 8.3 */
export const pm = (v: number, dp = 1) => "± " + v.toFixed(dp);
/** 249.2 → "249.2"; large counts with separators */
export const p1 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const p2 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pct1 = (v: number) => (100 * v).toFixed(1) + " %";
/** multiply sign for ratios: 1.99× */
export const times = (v: number, dp = 2) => v.toFixed(dp) + "×";

/** read a CSS token off an element (canvases cannot use var()) */
export function cssVar(el: Element, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}
/** re-render when the theme flips, so a canvas re-reads its tokens */
export function useThemeBump(): number {
  const [v, bump] = useState(0);
  useEffect(() => {
    const mo = new MutationObserver(() => bump((x) => x + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => bump((x) => x + 1);
    mq.addEventListener("change", on);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", on);
    };
  }, []);
  return v;
}
/** the width of a container, for a canvas that must fit the phone */
export function useWidth(ref: React.RefObject<HTMLElement | null>, initial = 880): number {
  const [w, setW] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((es) => {
      for (const e of es) setW(Math.max(280, Math.floor(e.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}
