/**
 * Chapter D3 — the real 11-day chain and the three stories fitted to it, read straight from the tested answer key
 * (src/engine/__fixtures__/key-D3.json) and the engine (src/engine/volmodels.ts). The 34 dots are key-C3C4.json `strip`
 * (D2's STRIP, identical to CHAIN here). Nothing on the page is typed in by hand; captions quote the key.
 */
import { format } from "d3-format";
import key from "../../../engine/__fixtures__/key-D3.json";
import { CHAIN, FITS } from "../../../engine/volmodels";
import { fitSmile, smileVol } from "../../../engine/smile";
import type { Pt } from "../../../ui/Plot";
export { useNarrow, n0, n1, n2, pct1, pct2, pctSp } from "../../D2-smile/figures/d2";
export { CHAIN, FITS };

export const KEY = key;
export const DAYS = 11;
/** the flat line every round starts from: the fitted smile's at-the-money level (D2's quadratic, key 15.95 %) */
export const ATM_FLAT = FITS.quadratic.a;
/** the full fan-out grid 21,800 → 23,400 step 25 (65 strikes) */
export const GRID: number[] = FITS.grid;
/** the strip's own range, step 50 (22 strikes) — for live curves on D2's StripPlot */
export const STRIP_GRID: number[] = Array.from({ length: 22 }, (_, i) => 22100 + 50 * i);
/** the smoothed smile from D2: implied wobble at any strike */
export const impliedAt = (K: number) => smileVol(FITS.quadratic, CHAIN.F, K);

export const toPts = (strikes: number[], vols: number[]): Pt[] => strikes.map((K, i) => [K, vols[i]]);

/** the strip's three readable numbers for any smile: slope at the forward (per unit log-moneyness), curvature (D2's c), and nothing else */
export function tiltAndCurve(volAt: (strikes: number[]) => number[]): { tilt: number; curve: number } {
  const h = 0.01;
  const [lo, at, hi] = volAt([CHAIN.F * Math.exp(-h), CHAIN.F, CHAIN.F * Math.exp(h)]);
  const h2 = 0.02;
  const [lo2, hi2] = volAt([CHAIN.F * Math.exp(-h2), CHAIN.F * Math.exp(h2)]);
  return { tilt: (hi - lo) / (2 * h), curve: 0.5 * ((hi2 - 2 * at + lo2) / (h2 * h2)) };
}

/** D2's quadratic through a model smile on the quoted range: b is the tilt, c the curvature, same units as the key's fit */
export function quadThrough(strikes: number[], vols: number[]) {
  return fitSmile(CHAIN.F, strikes, vols);
}

export const f1 = format(".1f");
export const f2 = format(".2f");
export const f3 = format(".3f");
export const s2 = (v: number) => (Math.abs(v) < 0.005 ? "" : v > 0 ? "+" : "−") + f2(Math.abs(v));
export const s3 = (v: number) => (Math.abs(v) < 0.0005 ? "" : v > 0 ? "+" : "−") + f3(Math.abs(v));
export const pct0 = format(".0%");
/** "−8.9 %" for a signed jump size */
export const pctS = (v: number, d = 1) => (v < 0 ? "−" : v > 0 ? "+" : "") + (100 * Math.abs(v)).toFixed(d) + " %";

/** 0 → 1 over `ms` once `on` turns true; snaps back to 0 when it turns false (C5's reveal timer). */
export { useProgress } from "./useProgress";
