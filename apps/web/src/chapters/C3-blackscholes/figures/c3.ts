/**
 * Chapter C3 — the one real row, read straight from the tested answer keys so every number a figure prints is one the
 * engine tests check: src/engine/__fixtures__/key-C3C4.json (row, atm, cloud, rounds, strip, newton, bisection, nse_iv)
 * and key-C1C2.json `nse` (the 17 strikes with their call and put LTPs, lot 65). Nothing on the page is simulated.
 */
import { useEffect, useState } from "react";
import { format } from "d3-format";
import key from "../../../engine/__fixtures__/key-C3C4.json";
import keyC1 from "../../../engine/__fixtures__/key-C1C2.json";

export const KEY = key;
export const NSE = keyC1.nse;

/** the real row: forward 22,603 (C1's median implied forward), strike 22,600, 11 days to Tue 3 Nov 2026, 6.5 % */
export const ROW = {
  F: key.row.F,
  K: key.row.K,
  r: key.row.r,
  T: key.row.T,
  days: key.row.days,
  lot: key.row.lot,
  call: key.row.call,
  put: key.row.put,
} as const;

/** the forward-form inputs without a wobble */
export const BASE = { F: ROW.F, K: ROW.K, r: ROW.r, T: ROW.T } as const;

/** the screen's own IV column, as printed (percent) */
export const NSE_CALL_IV: number[] = key.nse_iv.call_iv_printed;
export const NSE_PUT_IV: number[] = key.nse_iv.put_iv_printed;
export const NSE_FORWARD: number = key.nse_iv.nse_forward; // 22,668.2 — spot 22,600 grown at 10 %

/** the dial's range, everywhere it appears */
export const DIAL = { min: 0.05, max: 0.4, step: 0.001, start: 0.3 } as const;
/** "snapped": the machine agrees with the screen to better than half a rupee */
export const SNAP_RUPEES = 0.5;

/** formats */
export const n2 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const n0 = (v: number) => Math.round(v).toLocaleString("en-US", { maximumFractionDigits: 0 });
export const rs = (v: number) => (v < 0 ? "−₹" : "₹") + n2(Math.abs(v));
export const s2 = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "") + n2(Math.abs(v));
export const pct1 = format(".1%");
export const pct2 = format(".2%");
export const f2 = format(".2f");
export const f3 = format(".3f");

/** Light or dark, following the page's theme attribute and the OS preference (same as B6's clips). */
export function useDark() {
  const read = () => {
    const t = document.documentElement.getAttribute("data-theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
  };
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setDark(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => setDark(read());
    mq.addEventListener("change", on);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", on);
    };
  }, []);
  return dark;
}
