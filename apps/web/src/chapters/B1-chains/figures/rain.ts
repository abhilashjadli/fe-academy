/**
 * Chapter B1 — the season every figure reads. One strip of days in three states (dry / some / heavy), a fitted 3 × 3 table,
 * and the key's reference numbers. Nothing on the page is typed in by hand: the strip comes from the engine, the table from
 * `fitChain` on that strip, and every quoted constant from `key-B1.json` (made by tests/answer-key/key_B1.py).
 *
 * REAL DATA: the Open-Meteo file could not be fetched from the build environment, so the season is SIMULATED for now, from
 * the engine's own chain with the key's `stand_in.P` matrix — a sticky one (diagonal 0.87 / 0.65 / 0.55, dry spells 7.7 days
 * on average) so the strip has the spells the page describes; the key holds the exact strip drawn at this seed and tests it.
 * The figures that show it say so in their prompts. When the real file is dropped in at
 *   apps/web/src/data/rain-bengaluru-2024.json
 * with the shape { city: string; from: "YYYY-MM-DD"; to: "YYYY-MM-DD"; mm: number[] } (one daily precipitation sum per
 * day, from..to inclusive), the glob below picks it up at build time and every figure switches to it — the "simulated"
 * labels disappear and the states are read from the millimetres with the thresholds printed on the strip.
 */
import { useEffect, useState } from "react";
import { format } from "d3-format";
import key from "../../../engine/__fixtures__/key-B1.json";
import { rng } from "../../../engine/random";
import { fitChain, meanRunLength, occupancy, runLengths, simulateChain, stationary, type Matrix } from "../../../engine/markov";

export interface RainFile {
  city: string;
  from: string;
  to: string;
  mm: number[];
}

// Build-time switch: an empty glob when the file is absent (no import error), the parsed JSON when it is present.
const found = import.meta.glob("../../../data/rain-bengaluru-2024.json", { eager: true, import: "default" }) as Record<string, RainFile>;
export const REAL_RAIN: null | RainFile = Object.values(found)[0] ?? null;

export const KEY = key;

/** the three states, in strip order */
export const STATES = ["dry", "some", "heavy"] as const;
export type State = 0 | 1 | 2;
export const STATE_NAME = ["dry", "some rain", "heavy"] as const;
export const STATE_SHORT = ["dry", "some", "heavy"] as const;
/** thresholds printed on the strip: dry < 1 mm, some 1–10 mm, heavy > 10 mm */
export const THRESH = { some: 1, heavy: 10 } as const;
export function stateOfMm(mm: number): State {
  return mm > THRESH.heavy ? 2 : mm >= THRESH.some ? 1 : 0;
}

/** the simulated season's generating matrix: the key's sticky `stand_in.P`; the key reproduces this very strip at this seed */
export const P_SEASON: Matrix = key.stand_in.P;
export const SEASON_SEED = key.stand_in.season_seed; // 20261029 — the key ports the engine's PRNG and draws the same strip
export const SEASON_DAYS = key.stand_in.season_days; // 120

export interface Season {
  city: string;
  from: string;
  to: string;
  states: State[];
  mm: number[] | null;
  real: boolean;
  /** one line for prompts */
  label: string;
  source: string;
}

function isoAdd(from: string, days: number): string {
  const d = new Date(from + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildSeason(): Season {
  if (REAL_RAIN) {
    const states = REAL_RAIN.mm.map(stateOfMm);
    return {
      city: REAL_RAIN.city,
      from: REAL_RAIN.from,
      to: REAL_RAIN.to,
      states,
      mm: REAL_RAIN.mm,
      real: true,
      label: `${REAL_RAIN.city}, ${longDate(REAL_RAIN.from)} – ${longDate(REAL_RAIN.to)}`,
      source: "Open-Meteo Historical Weather, daily precipitation sum",
    };
  }
  const from = "2024-06-01";
  const states = simulateChain(P_SEASON, SEASON_DAYS - 1, 0, rng(SEASON_SEED)) as State[];
  return {
    city: "Bengaluru",
    from,
    to: isoAdd(from, SEASON_DAYS - 1),
    states,
    mm: null,
    real: false,
    label: "simulated season (the real Bengaluru file is pending)",
    source: "simulated from the engine's chain; the real Open-Meteo file is pending",
  };
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const SEASON: Season = buildSeason();
export const DAYS = SEASON.states.length;

/** the fitted table — the reader's own tally in Figure 1, used by Figures 2 and 4 */
export const FIT = fitChain(SEASON.states, 3);
export const P_FIT: Matrix = FIT.P;
export const COUNTS: Matrix = FIT.counts;
export const PSI_STAR = stationary(P_FIT);
export const OCCUPANCY = occupancy(SEASON.states, 3);
export const RUNS = runLengths(SEASON.states);
export const MEAN_RUN = meanRunLength(SEASON.states);

/** calendar layout: one row per month, one column per day of month */
export interface DayCell {
  i: number;
  date: string;
  month: number; // 0-based row
  dom: number; // 1..31
  state: State;
}
export const CELLS: DayCell[] = SEASON.states.map((s, i) => {
  const date = isoAdd(SEASON.from, i);
  const m = Number(date.slice(5, 7));
  const m0 = Number(SEASON.from.slice(5, 7));
  return { i, date, month: m - m0, dom: Number(date.slice(8, 10)), state: s };
});
export const MONTHS = Array.from(new Set(CELLS.map((c) => c.date.slice(0, 7)))).map((ym) => MON[Number(ym.slice(5, 7)) - 1]);

/** Spells of each state: [start index, length] */
export function spells(states: readonly number[]): Array<{ start: number; len: number; state: State }> {
  const out: Array<{ start: number; len: number; state: State }> = [];
  let start = 0;
  for (const len of runLengths(states as number[])) {
    out.push({ start, len, state: states[start] as State });
    start += len;
  }
  return out;
}

/** the longest dry spell on the strip, and the longest that sits inside one calendar row (the one the hotspot can box) */
export const LONGEST_DRY_ALL = spells(SEASON.states)
  .filter((s) => s.state === 0)
  .reduce((best, s) => (s.len > best.len ? s : best), { start: 0, len: 0, state: 0 as State });
export const LONGEST_DRY = spells(SEASON.states)
  .filter((s) => s.state === 0)
  .flatMap((s) => {
    // split a spell at the row breaks: the hotspot boxes the longest piece that sits in one calendar row
    const pieces: Array<{ start: number; len: number; state: State; whole: boolean }> = [];
    let start = s.start;
    for (let i = s.start + 1; i <= s.start + s.len; i++) {
      if (i === s.start + s.len || CELLS[i].month !== CELLS[start].month) {
        pieces.push({ start, len: i - start, state: 0, whole: s.len === i - start });
        start = i;
      }
    }
    return pieces;
  })
  .reduce((best, s) => (s.len > best.len ? s : best), { start: 0, len: 0, state: 0 as State, whole: true });
export const HEAVY_DAYS = CELLS.filter((c) => c.state === 2 && c.i + 1 < DAYS).map((c) => c.i);
export const AFTER_HEAVY = HEAVY_DAYS.map((i) => SEASON.states[i + 1]);
export const AFTER_HEAVY_RAIN = AFTER_HEAVY.filter((s) => s > 0).length;
/** the first heavy day that opens a heavy spell of two or more — a day to point at; falls back to the first heavy day */
export const A_HEAVY_DAY = (() => {
  const sp = spells(SEASON.states).find((s) => s.state === 2 && s.len >= 2);
  return sp ? sp.start : HEAVY_DAYS[0] ?? 0;
})();
export const STATE_COUNTS = [0, 1, 2].map((s) => SEASON.states.filter((x) => x === s).length);

/** rain fraction (some or heavy) in the first and second half of a strip — Figure 4's honest gap */
export function halves(states: readonly number[]): [number, number] {
  const h = Math.floor(states.length / 2);
  const f = (a: readonly number[]) => a.filter((s) => s > 0).length / a.length;
  return [f(states.slice(0, h)), f(states.slice(h))];
}

/** formats */
export const f2 = format(".2f");
export const f1 = format(".1f");
export const f3 = format(".3f");
export const f4 = format(".4f");
export const pct0 = format(".0%");
export const pct1 = format(".1%");
export const n0 = format(",.0f");
export function longDate(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MON[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}
export function shortDate(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MON[Number(iso.slice(5, 7)) - 1]}`;
}

/** narrow screens get narrower drawings so the lettering stays legible */
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
