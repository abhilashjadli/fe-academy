/**
 * Chapter D2 — one real screen, read straight from the tested answer keys so every number a figure prints is one the
 * engine tests check: key-D2.json (fit, raw butterflies, density, tails, kink, record, Hull 15.2), key-C3C4.json `strip`
 * (the 34 implied vols at the chain's own forward) and key-C1C2.json `nse` (the 17 strikes with their call and put LTPs).
 * The daily record is src/data/nifty50-long.json. Nothing on the page is typed in by hand.
 */
import { useEffect, useState } from "react";
import { format } from "d3-format";
import key from "../../../engine/__fixtures__/key-D2.json";
import keyC3 from "../../../engine/__fixtures__/key-C3C4.json";
import keyC1 from "../../../engine/__fixtures__/key-C1C2.json";
import { fitSmile } from "../../../engine/smile";

export const KEY = key;
export const NSE = keyC1.nse;
export const STRIP = keyC3.strip; // strikes, call_iv, put_iv at the chain's forward

/** the real screen: forward 22,603, 11 days to Tue 3 Nov 2026, 6.5 % */
export const ROW = {
  F: keyC3.row.F,
  K: keyC3.row.K,
  r: keyC3.row.r,
  T: keyC3.row.T,
  days: keyC3.row.days,
} as const;
export const BASE = { F: ROW.F, r: ROW.r, T: ROW.T } as const;

/** the smile fitted once, in log-moneyness, through all 34 dots (the same call the engine test makes) */
export const FIT = fitSmile(ROW.F, [...STRIP.strikes, ...STRIP.strikes], [...STRIP.call_iv, ...STRIP.put_iv]);

export const callAt = (K: number) => NSE.calls[NSE.strikes.indexOf(K)];
export const putAt = (K: number) => NSE.puts[NSE.strikes.indexOf(K)];

/** formats */
export const n2 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const n1 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const n0 = (v: number) => Math.round(v).toLocaleString("en-US", { maximumFractionDigits: 0 });
export const rs = (v: number) => (v < 0 ? "−₹" : "₹") + n2(Math.abs(v));
export const s2 = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "") + n2(Math.abs(v));
export const pct1 = format(".1%");
export const pct2 = format(".2%");
/** "15.9 %" with a thin space, for prose-like readouts */
export const pctSp = (v: number, d = 1) => (100 * v).toFixed(d) + " %";

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
