/**
 * Chapter C5 — the running example, read from the tested answer key (src/engine/__fixtures__/key-C5.json) and the
 * chain of C3/C4 (key-C3C4.json): forward 22,603, r = 6.5 %, 11 days, the 22,250 / 22,600 / 23,050 calls at their own
 * chain-implied wobbles, and Raj's short 22,600 book. Every number a figure prints is produced by the engine
 * (greeks2.ts / bs.ts) from this row; the captions quote the key's values.
 */
import { useEffect, useState } from "react";
import { format } from "d3-format";
import key from "../../../engine/__fixtures__/key-C5.json";
import keyC3C4 from "../../../engine/__fixtures__/key-C3C4.json";
import { greeks2Fwd, type Greeks2 } from "../../../engine/greeks2";
import type { Fwd } from "../../../engine/bs";
import type { Pt } from "../../../ui/Plot";

export const KEY = key;
export const STRIP = keyC3C4.strip;

export const ROW = {
  F: keyC3C4.row.F,
  r: keyC3C4.row.r,
  days: keyC3C4.row.days,
  lot: keyC3C4.row.lot,
  atmK: keyC3C4.row.K,
  atmIv: keyC3C4.atm.iv,
} as const;

/** the three strikes the chapter follows, and the role each one draws in */
export const STRIKES = [22250, 22600, 23050] as const;
export type Strike = (typeof STRIKES)[number];
export const STRIKE_ROLE: Record<Strike, "error" | "ink" | "truth"> = { 22250: "error", 22600: "ink", 23050: "truth" };
export const STRIKE_WORD: Record<Strike, string> = { 22250: "in the money", 22600: "at the money", 23050: "out of the money" };

/** the chain's own implied wobble for a strike (C3's strip) */
export function chainIv(K: number): number {
  const i = STRIP.strikes.indexOf(K);
  if (i < 0) throw new Error("strike not on the chain: " + K);
  return STRIP.call_iv[i];
}

export function at(K: number, days: number, sigma: number = chainIv(K)): Fwd {
  return { F: ROW.F, K, r: ROW.r, sigma, T: Math.max(days, 1e-6) / 365 };
}
export function g2(K: number, days: number, sigma: number = chainIv(K)): Greeks2 {
  return greeks2Fwd(at(K, days, sigma));
}

/** delta against the wobble (5 % → 40 %) at `days` left */
export function deltaVsVol(K: number, days = ROW.days): Pt[] {
  const pts: Pt[] = [];
  for (let s = 0.05; s <= 0.4 + 1e-9; s += 0.005) pts.push([s, g2(K, days, s).delta]);
  return pts;
}
/** delta against the days left (60 → 0.5) at the strike's own wobble */
export function deltaVsDays(K: number, sigma: number = chainIv(K)): Pt[] {
  const pts: Pt[] = [];
  for (let d = 0.5; d <= 60 + 1e-9; d += 0.5) pts.push([d, g2(K, d, sigma).delta]);
  return pts;
}

/* ---- formatting ---- */
export const pct1 = format(".1%");
export const f1 = format(".1f");
export const f2 = format(".2f");
export const f3 = format(".3f");
export const s3 = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "") + f3(Math.abs(v));
export const s2 = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "") + f2(Math.abs(v));
/** a count of index units, rounded, no sign */
export const units = (v: number) => Math.round(Math.abs(v)).toLocaleString("en-US");

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
