/**
 * Chapter D1 — the running example: Raj's real position (the NIFTY 22,600 call of 23 October 2026, short 100 lots of 65,
 * sold at 15.9 %) hedged once a day on the real closes to the 3 November expiry. Every number a figure prints comes
 * from engine/hedge.ts on these inputs; the tested answer key (engine/__fixtures__/key-D1.json) supplies only the
 * inputs it fixed (σ sold, the premium) and is quoted in captions.
 *
 * While the data file stops short of expiry, the week is continued on a seeded simulated path (one lognormal step per
 * calendar day at σ sold, rng(23)), and those rows are tagged `simulated`. The moment the file holds the 3 Nov close
 * (the last real row's daysLeft === 0) the continuation disappears.
 */
import key from "../../../engine/__fixtures__/key-D1.json";
import nifty from "../../../data/nifty50-long.json";
import { black76Greeks, type Greeks } from "../../../engine/bs";
import { hedgeLedger, realisedVol, type LedgerRow } from "../../../engine/hedge";
import { normalSample, rng } from "../../../engine/random";
import { useEffect, useState } from "react";

export { indian, lakh, n0, n1, n2, n3, rs, rsSigned, s1, s2 } from "../../C4-greeks/figures/row";

export const KEY = key;

export const POS = {
  K: 22600,
  r: 0.065,
  sigmaSold: key.realised.sold,
  units: -6500,
  lot: 65,
  lots: 100,
  carry: 22603 / 22600,
  F0: 22603,
  sold: "2026-10-23",
  expiry: "2026-11-03",
  days: 11,
  premium: key.histogram_notes.premium,
} as const;

/** Friday's Greeks, per unit of the call, at F = 22,603 with 11 days left. */
export const G0: Greeks = black76Greeks({ F: POS.F0, K: POS.K, r: POS.r, sigma: POS.sigmaSold, T: POS.days / 365 });

/** what the clock pays Raj per calendar day, rupees (positive) */
export const CLOCK_DAY = POS.units * (G0.thetaYr / 365);
/** what the bend charges Raj on a move of `pts` points, rupees (negative) */
export const bendOn = (pts: number) => POS.units * 0.5 * G0.gamma * pts * pts;

type Close = { d: string; c: number };
const ALL = (nifty as { rows: Close[] }).rows;
export const REAL_CLOSES: Close[] = ALL.filter((x) => x.d >= POS.sold && x.d <= POS.expiry);

const SEED = 23;
const DAY = 86400000;
function iso(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}
function isWeekend(t: number): boolean {
  const w = new Date(t).getUTCDay();
  return w === 0 || w === 6;
}

/** Continue the closes to expiry on a seeded path: one step per calendar day, a row only on trading days (weekend steps roll into Monday). */
function simulatedTail(last: Close, expiry: string, sigma: number): Close[] {
  const R = rng(SEED);
  const out: Close[] = [];
  let c = last.c;
  const dt = 1 / 365;
  for (let t = Date.parse(last.d) + DAY; t <= Date.parse(expiry); t += DAY) {
    c *= Math.exp(-0.5 * sigma * sigma * dt + sigma * Math.sqrt(dt) * normalSample(R));
    if (!isWeekend(t) || iso(t) === expiry) out.push({ d: iso(t), c: Math.round(c * 20) / 20 });
  }
  return out;
}

export interface WeekRow extends LedgerRow {
  simulated: boolean;
  /** P&L of the unhedged (naked) book since Friday, rupees */
  naked: number;
  /** P&L of the unhedged book over the day */
  nakedDay: number;
  /** running sum of the hedged book's daily P&L (the day lines added up), rupees */
  pnl: number;
}

export interface Week {
  rows: WeekRow[];
  nReal: number;
  /** true when the data file reaches expiry: no simulated rows */
  complete: boolean;
  /** the hedger's realised wobble on the real closes so far */
  realised: number;
  realisedDays: number;
  totals: { clock: number; bend: number; pnl: number; naked: number };
}

function build(): Week {
  const realRows = hedgeLedger({ closes: REAL_CLOSES, expiry: POS.expiry, K: POS.K, r: POS.r, sigma: POS.sigmaSold, units: POS.units, lot: POS.lot, carry: POS.carry });
  const lastReal = realRows[realRows.length - 1];
  const complete = lastReal.daysLeft === 0;
  const closes = complete ? REAL_CLOSES : [...REAL_CLOSES, ...simulatedTail(REAL_CLOSES[REAL_CLOSES.length - 1], POS.expiry, POS.sigmaSold)];
  const ledger = hedgeLedger({ closes, expiry: POS.expiry, K: POS.K, r: POS.r, sigma: POS.sigmaSold, units: POS.units, lot: POS.lot, carry: POS.carry });
  let pnl = 0;
  let prevValue = ledger[0].value;
  const rows: WeekRow[] = ledger.map((r, i) => {
    pnl += r.exactDay;
    const nakedDay = i === 0 ? 0 : POS.units * (r.value - prevValue);
    prevValue = r.value;
    return { ...r, simulated: i >= REAL_CLOSES.length, naked: POS.units * (r.value - ledger[0].value), nakedDay, pnl };
  });
  const last = rows[rows.length - 1];
  return {
    rows,
    nReal: REAL_CLOSES.length,
    complete,
    realised: realisedVol(REAL_CLOSES.map((c) => c.c)),
    realisedDays: REAL_CLOSES.length - 1,
    totals: { clock: rows.reduce((s, r) => s + r.clock, 0), bend: rows.reduce((s, r) => s + r.bend, 0), pnl: last.pnl, naked: last.naked },
  };
}

export const WEEK: Week = build();

/** the real part of the week only (what Figure 3 pins) */
export const REAL_SO_FAR = {
  pnl: WEEK.rows[WEEK.nReal - 1].pnl,
  days: WEEK.nReal - 1,
  lastDate: WEEK.rows[WEEK.nReal - 1].date,
  complete: WEEK.complete,
};

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** "Mon 26 Oct" */
export function dayLabel(d: string): string {
  const t = new Date(d + "T00:00:00Z");
  return `${WD[t.getUTCDay()]} ${t.getUTCDate()} ${MONTH[t.getUTCMonth()]}`;
}
/** "Mon 26" */
export function dayShort(d: string): string {
  const t = new Date(d + "T00:00:00Z");
  return `${WD[t.getUTCDay()]} ${t.getUTCDate()}`;
}
export const pct1 = (v: number) => (100 * v).toFixed(1) + " %";
/** ₹1.8 lakh / ₹72.9k — a short money label for bars and screens */
export function short(v: number): string {
  const a = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(a >= 1e6 ? 1 : 2)} lakh`;
  if (a >= 1e3) return `${sign}₹${(a / 1e3).toFixed(1)}k`;
  return `${sign}₹${a.toFixed(0)}`;
}
export const shortSigned = (v: number) => (v > 0 ? "+" : "") + short(v);

/** true on phone-width screens (≤ 520 px): figures pick a narrower viewBox so SVG text stays legible */
export function useNarrow(): boolean {
  const q = "(max-width: 520px)";
  const [narrow, setNarrow] = useState(() => typeof matchMedia !== "undefined" && matchMedia(q).matches);
  useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const mq = matchMedia(q);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}
