/**
 * Chapter C4 — the running example, read from the tested answer key (src/engine/__fixtures__/key-C3C4.json):
 * the NIFTY 22,600 call of 23 October 2026, 11 days to expiry, Raj short 100 lots of 65. Every number a figure
 * prints is produced by the engine from this row; the captions quote the key's values.
 */
import key from "../../../engine/__fixtures__/key-C3C4.json";
import nifty from "../../../data/nifty50-long.json";
import { black76, black76Greeks, riskLine, type Fwd, type Greeks } from "../../../engine/bs";

export const KEY = key;

export const ROW = {
  F: key.row.F,
  K: key.row.K,
  r: key.row.r,
  sigma: key.atm.iv,
  days: key.row.days,
  lot: key.row.lot,
  lots: 100,
  units: -6500,
} as const;

/** days → the forward-form inputs for the row */
export function at(F: number, days: number, sigma: number = ROW.sigma): Fwd {
  return { F, K: ROW.K, r: ROW.r, sigma, T: Math.max(days, 1e-6) / 365 };
}
export function greeks(F: number, days: number, sigma: number = ROW.sigma): Greeks {
  return black76Greeks(at(F, days, sigma));
}
export function price(F: number, days: number, sigma: number = ROW.sigma): number {
  return black76(at(F, days, sigma));
}

/** the row as the chapter starts: F = 22,603, 11 days */
export const G0: Greeks = greeks(ROW.F, ROW.days);
export const LINE = riskLine(G0, ROW.units, ROW.lot);

/** the one real day: Friday 23 Oct close → Monday 26 Oct close, read from the NIFTY file */
function close(d: string): number {
  const r = (nifty as { rows: { d: string; c: number }[] }).rows.find((x) => x.d === d);
  if (!r) throw new Error("no close for " + d);
  return r.c;
}
export const REAL_DAY = {
  from: "2026-10-23",
  to: "2026-10-26",
  fromClose: close("2026-10-23"),
  toClose: close("2026-10-26"),
  days: 3,
};
export const MOVE = REAL_DAY.toClose - REAL_DAY.fromClose;

/* ---- formatting: units a person feels ---- */

/** Indian grouping: 1619475 → 16,19,475 */
export function indian(v: number, dp = 0): string {
  const neg = v < 0;
  const s = Math.abs(v).toFixed(dp);
  const [int, frac] = s.split(".");
  let out: string;
  if (int.length <= 3) out = int;
  else {
    const last3 = int.slice(-3);
    const rest = int.slice(0, -3);
    out = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  }
  return (neg ? "−" : "") + out + (frac ? "." + frac : "");
}
/** ₹16,19,475 */
export const rs = (v: number, dp = 0) => (v < 0 ? "−₹" : "₹") + indian(Math.abs(v), dp);
/** +₹72,875 / −₹1,01,535 */
export const rsSigned = (v: number, dp = 0) => (v > 0 ? "+" : "") + rs(v, dp);
/** ₹3.25 lakh */
export const lakh = (v: number, dp = 2) => (v < 0 ? "−₹" : "₹") + (Math.abs(v) / 1e5).toFixed(dp) + " lakh";
/** 22,603 (western grouping for index points, as the chain prints them) */
export const n0 = (v: number) => Math.round(v).toLocaleString("en-US", { maximumFractionDigits: 0 });
export const n1 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const n2 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const n3 = (v: number) => v.toFixed(3);
export const s1 = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "") + n1(Math.abs(v));
export const s2 = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "") + n2(Math.abs(v));

/** gamma per unit per point → "per 100 points, per lot" (lots of index to add per 100-point move) */
export const gammaLot100 = (gamma: number) => gamma * ROW.lot * 100;
/** per-year theta → per calendar day */
export const thetaDay = (thetaYr: number) => thetaYr / 365;

/** days left → a short label */
export function daysLabel(d: number): string {
  if (d >= 1) return Number.isInteger(d) ? `${d} d` : `${d.toFixed(1)} d`;
  if (Math.abs(d - 1 / 24) < 1e-9) return "1 h";
  const h = d * 24;
  return h >= 1 ? `${Number.isInteger(h) ? h : h.toFixed(0)} h` : `${Math.round(h * 60)} min`;
}
