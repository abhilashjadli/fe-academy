/**
 * Chapter A5 — one real series, one clock. Every number a figure prints is computed here by engine/volatility.ts on
 * the real NIFTY 50 daily log moves (src/data/nifty50-long.json, 2,679 days, Jan 2016 → 28 Oct 2026), or quoted
 * from the tested answer key (engine/__fixtures__/key-A5.json). The fitted GARCH(1,1) parameters are the key's —
 * the engine's own `garchFit` output, checked by the engine tests — so the fit is not re-run in the browser.
 * Nothing on the page is typed in by hand.
 */
import { useEffect, useState } from "react";
import key from "../../../engine/__fixtures__/key-A5.json";
import nifty from "../../../data/nifty50-long.json";
import { ewmaVariance, garchVariance, halfLife, likelihoodTerm, meanSquare, realisedVariance, mean } from "../../../engine/volatility";

export const KEY = key.nifty;
/** the computer's three pipes: ω, α, β fitted by maximum likelihood (engine garchFit = key fit_own) */
export const FIT = KEY.fit_own;

export const R: number[] = nifty.returns.map((p) => p.r);
export const DATES: string[] = nifty.returns.map((p) => p.d);
export const N = R.length;
/** the squares, in %² (a 1 % day is 1, a 2 % day is 4) */
export const SQ: number[] = R.map((r) => (100 * r) * (100 * r));
export const PCT: number[] = R.map((r) => 100 * r);
export const MEAN_SQ = meanSquare(R); // the ten-year average cup, decimal variance

/** decimal year for the x axis (2016.0 … 2026.8) */
export const YEAR: number[] = DATES.map(decimalYear);
export const X_DOMAIN: [number, number] = [YEAR[0] - 0.05, YEAR[N - 1] + 0.05];

export function decimalYear(iso: string): number {
  const d = new Date(iso + "T00:00:00Z");
  const y = d.getUTCFullYear();
  const start = Date.UTC(y, 0, 1);
  const end = Date.UTC(y + 1, 0, 1);
  return y + (d.getTime() - start) / (end - start);
}
export function indexAtYear(x: number): number {
  // binary search for the day nearest a decimal year
  let lo = 0,
    hi = N - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (YEAR[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(YEAR[lo - 1] - x) < Math.abs(YEAR[lo] - x)) return lo - 1;
  return lo;
}
export function indexOf(date: string): number {
  return DATES.indexOf(date);
}

/** the three paths every figure shares (decimal variance, length n+1; path[i] is the variance for day i) */
export const EWMA94 = ewmaVariance(R, 0.94);
export const RV250 = realisedVariance(R, 250); // trailing year, ends at i inclusive
export const RV25 = realisedVariance(R, 25); // Hull's realised variance for scoring
export const GARCH_FIT = garchVariance(R, FIT.omega, FIT.alpha, FIT.beta);

/** the day the limit was wrong */
export const JUNE4 = indexOf("2024-06-04");
export const MARCH23 = indexOf("2020-03-23");

/** the real strip's statistics — identical for the shuffled strip, by construction */
export const STATS = (() => {
  const m = mean(R);
  let s = 0;
  for (const r of R) s += (r - m) * (r - m);
  const sd = Math.sqrt(s / (N - 1));
  let worst = 0;
  for (let i = 1; i < N; i++) if (R[i] < R[worst]) worst = i;
  return { mean: m, sd, worst };
})();

/**
 * Storms: runs of ten or more trading days on which the RiskMetrics bucket (λ = 0.94) stands above 1.5 × its ten-year
 * median; each is labelled by its biggest day. Computed, not typed.
 */
export interface Storm {
  from: number;
  to: number;
  peak: number; // index of the biggest |move| inside
}
export const STORMS: Storm[] = (() => {
  const vol = EWMA94.map(Math.sqrt);
  const sorted = vol.slice().sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const out: Storm[] = [];
  let start = -1;
  for (let i = 0; i <= N; i++) {
    const hot = i < N && vol[i + 1] > 1.5 * median; // vol[i+1] is the level after day i's cup
    if (hot && start < 0) start = i;
    if (!hot && start >= 0) {
      if (i - start >= 10) {
        let peak = start;
        for (let k = start; k < i; k++) if (Math.abs(R[k]) > Math.abs(R[peak])) peak = k;
        out.push({ from: start, to: i - 1, peak });
      }
      start = -1;
    }
  }
  return out;
})();
/** the four biggest storms, the ones that get a date */
export const NAMED_STORMS: Storm[] = STORMS.slice()
  .sort((a, b) => Math.abs(R[b.peak]) - Math.abs(R[a.peak]))
  .slice(0, 4)
  .sort((a, b) => a.from - b.from);

/** clustering in words: how often a big square follows a big square, against chance (big = top tenth of |move|) */
export const CLUSTER = (() => {
  const abs = R.map(Math.abs).sort((a, b) => a - b);
  const thr = abs[Math.floor(0.9 * abs.length)];
  let big = 0,
    bigAfterBig = 0,
    up = 0,
    upAfterUp = 0,
    nBig = 0,
    nUp = 0;
  for (let i = 0; i < N; i++) {
    if (Math.abs(R[i]) >= thr) nBig++;
    if (R[i] > 0) nUp++;
  }
  for (let i = 0; i < N - 1; i++) {
    if (Math.abs(R[i]) >= thr) {
      big++;
      if (Math.abs(R[i + 1]) >= thr) bigAfterBig++;
    }
    if (R[i] > 0) {
      up++;
      if (R[i + 1] > 0) upAfterUp++;
    }
  }
  return { thr, pBig: nBig / N, pBigAfterBig: bigAfterBig / big, pUp: nUp / N, pUpAfterUp: upAfterUp / up };
})();

/** EWMA half-life in days for a hole (1 − λ) */
export const halfLifeOfHole = (hole: number) => halfLife(1 - hole);

/**
 * The score of Figure 5: points above the 250-day average = Σ over the days from the 251st on of
 * (−ln v − u²/v) with the model's v, minus the same sum with the trailing year as v (Hull eq. 17.12).
 * Returns the per-day differences (NaN before day 250) and the total.
 */
export function scoreAgainstTrailingYear(path: number[]): { perDay: number[]; total: number } {
  const perDay = new Array<number>(N).fill(NaN);
  let total = 0;
  for (let i = 250; i < N; i++) {
    const d = likelihoodTerm(R[i], path[i]) - likelihoodTerm(R[i], RV250[i - 1]);
    perDay[i] = d;
    total += d;
  }
  return { perDay, total };
}

/* ---- formats ---- */
/** decimal variance → %² (the bottom picture's unit) */
export const toPct2 = (v: number) => 10000 * v;
/** "1.01 %" from a decimal volatility */
export const volPct = (v: number, d = 2) => (100 * v).toFixed(d) + " %";
/** "−6.1 %" from a decimal move */
export const movePct = (r: number, d = 1) => (r < 0 ? "−" : r > 0 ? "+" : "") + (100 * Math.abs(r)).toFixed(d) + " %";
/** "1.02 %²" from a decimal variance */
export const varPct2 = (v: number, d = 2) => (10000 * v).toFixed(d) + " %²";
/** "−0.034" with a real minus sign */
export const s3 = (v: number) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(3);
export const n0 = (v: number) => Math.round(v).toLocaleString("en-US", { maximumFractionDigits: 0 });
export const n1 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const niceDate = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const shortDate = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

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
