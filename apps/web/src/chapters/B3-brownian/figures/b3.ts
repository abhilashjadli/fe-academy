/**
 * Chapter B3 — shared bits for the six figures. Every number a figure prints is computed by the engine
 * (src/engine/brownian.ts, src/engine/ito.ts) or read from the tested answer key key-B3.json; nothing is typed in by hand.
 */
import { useEffect, useState } from "react";
import { format } from "d3-format";
import key from "../../../engine/__fixtures__/key-B3.json";

export const KEY = key;

/** one unit of time for the drawn path: the dials are compared with it */
export const T = 1;
/** the refinement ladder of Figure 2: 16 → 256 → 4,096 → 65,536 readings of one path */
export const LADDER = KEY.qv.n as number[];

/** formats */
export const n1 = format(".1f");
export const n2 = format(".2f");
export const n3 = format(".3f");
export const int = format(",d");
export const pct0 = format(".0%");
export const pct1 = format(".1%");
export const pct2 = format(".2%");
/** "15.9 %" with a thin space, for prose-like readouts */
export const pctSp = (v: number, d = 1) => (100 * v).toFixed(d) + " %";
/** a zoom factor: ×1, ×10, ×1,000 … */
export const zoomLabel = (z: number) => "×" + (z >= 10 ? format(",.0f")(z) : z.toFixed(1));

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

/**
 * Thin a long path for drawing without losing its jaggedness: for each bucket keep the first point, the min and the max
 * (in time order), so a 65,536-point path draws as ≤ 3·buckets segments and still looks as rough as it is.
 */
export function thin(t: number[], W: number[], buckets = 700): Array<[number, number]> {
  const n = t.length;
  if (n <= buckets * 2) return t.map((ti, i) => [ti, W[i]]);
  const out: Array<[number, number]> = [];
  const per = n / buckets;
  for (let b = 0; b < buckets; b++) {
    const i0 = Math.floor(b * per),
      i1 = Math.min(n, Math.floor((b + 1) * per));
    let imin = i0,
      imax = i0;
    for (let i = i0; i < i1; i++) {
      if (W[i] < W[imin]) imin = i;
      if (W[i] > W[imax]) imax = i;
    }
    const idx = [...new Set([i0, imin, imax])].sort((a, b2) => a - b2);
    for (const i of idx) out.push([t[i], W[i]]);
  }
  out.push([t[n - 1], W[n - 1]]);
  return out;
}

/** d/MMM/yyyy from an ISO date, without a timezone shift */
export const niceDate = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const monthYear = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
