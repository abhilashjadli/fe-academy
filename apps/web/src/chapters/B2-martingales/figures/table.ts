/**
 * Chapter B2 — the one table. The game runs across the six figures (one table, one player, one meter), so the state a
 * later round needs from an earlier one lives here in a tiny external store: whether the reader has played a hand by
 * hand (Figure 3 unlocks the peek of Figure 4), the "habit" read off that hand, and the meter's reading in every round.
 * Everything random is seeded (engine/random.ts): the same visit draws the same coins.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { format } from "d3-format";
import { playGame, summarise, type Replay, type Strategy } from "../../../engine/martingale";
import { rng } from "../../../engine/random";

export const TOSSES = 200; // the croupier's rule: two hundred tosses to the bell
export const PLAYERS = 10_000; // every replay
export const FAN_PATHS = 120; // how many of the 10,000 wealth paths are drawn

export interface Habit {
  afterWin: number;
  afterLoss: number;
  /** wealth at which the reader left, up (Infinity = did not leave ahead) */
  leaveUp: number;
  /** loss at which the reader left, as a positive number (Infinity = did not leave behind) */
  leaveDown: number;
  /** how many tosses the hand lasted */
  tosses: number;
  final: number;
}

export interface Reading {
  mean: number;
  se: number;
  n: number;
}

export interface TableState {
  /** Figure 3 played to the end by hand (unlocks the peek) */
  handPlayed: boolean;
  habit: Habit | null;
  /** the meter's reading in each round, by figure id */
  readings: Record<string, Reading>;
}

const KEY = "fe-b2:table";

function load(): TableState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<TableState>;
      const habit = v.habit
        ? {
            ...v.habit,
            leaveUp: v.habit.leaveUp === null ? Infinity : v.habit.leaveUp,
            leaveDown: v.habit.leaveDown === null ? Infinity : v.habit.leaveDown,
          }
        : null;
      return { handPlayed: !!v.handPlayed, habit, readings: {} };
    }
  } catch {
    /* ignore */
  }
  return { handPlayed: false, habit: null, readings: {} };
}

let state: TableState = load();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function persist() {
  try {
    // JSON has no Infinity: store it as null
    const habit = state.habit ? { ...state.habit, leaveUp: Number.isFinite(state.habit.leaveUp) ? state.habit.leaveUp : null, leaveDown: Number.isFinite(state.habit.leaveDown) ? state.habit.leaveDown : null } : null;
    localStorage.setItem(KEY, JSON.stringify({ handPlayed: state.handPlayed, habit }));
  } catch {
    /* ignore */
  }
}

export const table = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  setHand(habit: Habit) {
    state = { ...state, handPlayed: true, habit };
    persist();
    emit();
  },
  clearHand() {
    state = { ...state, handPlayed: false, habit: null };
    persist();
    emit();
  },
  record(id: string, r: Reading) {
    const prev = state.readings[id];
    if (prev && prev.mean === r.mean && prev.se === r.se && prev.n === r.n) return;
    state = { ...state, readings: { ...state.readings, [id]: r } };
    emit();
  },
};

export function useTable(): TableState {
  return useSyncExternalStore(table.subscribe, table.get, table.get);
}

/** Record a round's meter reading in the store once it exists (effects only, never during render). */
export function useRecordReading(id: string, r: Replay | null) {
  useEffect(() => {
    if (r) table.record(id, { mean: r.mean, se: r.se, n: r.finals.length });
  }, [id, r]);
}

// ---------------------------------------------------------------- replays that keep what the drawings need

export interface Fan extends Replay {
  /** mean wealth after each toss over all players — the meter's path in time */
  meanPath: number[];
  /** a sample of whole wealth paths, drawn faintly */
  paths: number[][];
  /** how many players left before the bell */
  leftEarly: number;
  T: number;
}

/** Replay a strategy for `players` seats of `T` tosses with a fixed seed; keep the mean path and a sample of paths. */
export function replayFan(strategy: Strategy, seed: number, players = PLAYERS, T = TOSSES, pHeads?: number): Fan {
  const next = rng(seed);
  const finals = new Array<number>(players);
  const sum = new Float64Array(T + 1);
  const paths: number[][] = [];
  const every = Math.max(1, Math.floor(players / FAN_PATHS));
  let leftEarly = 0;
  for (let i = 0; i < players; i++) {
    const g = playGame(strategy, T, next, pHeads);
    finals[i] = g.final;
    if (g.played < T) leftEarly++;
    for (let t = 0; t <= T; t++) sum[t] += g.wealth[t];
    if (i % every === 0 && paths.length < FAN_PATHS) paths.push(g.wealth);
  }
  const meanPath = Array.from(sum, (s) => s / players);
  return { ...summarise(finals), meanPath, paths, leftEarly, T };
}

/** One player's wealth path under a strategy (the "play me" path), padded flat after leaving. */
export function onePath(strategy: Strategy, seed: number, T = TOSSES, pHeads?: number) {
  return playGame(strategy, T, rng(seed), pHeads);
}

// ---------------------------------------------------------------- the doubling system, cycle by cycle

export interface CyclePath {
  /** wealth after each cycle, wealth[0] = 0 */
  wealth: number[];
  /** cycles that ended at the table limit */
  cliffs: number[];
}

/** One player's doubling night as a staircase over cycles: +1 per cycle, −(2^k − 1) when k losses in a row hit the limit. */
export function doublingNight(k: number, cycles: number, seed: number, pHeads = 0.5): CyclePath {
  const next = rng(seed);
  const bankroll = Math.pow(2, k) - 1;
  const wealth = [0];
  const cliffs: number[] = [];
  let w = 0;
  for (let c = 1; c <= cycles; c++) {
    let losses = 0;
    while (losses < k && next() >= pHeads) losses++;
    if (losses >= k) {
      w -= bankroll;
      cliffs.push(c);
    } else w += 1;
    wealth.push(w);
  }
  return { wealth, cliffs };
}

// ---------------------------------------------------------------- the two cheats of Figure 4

/**
 * The second cheat: play one chip a toss but leave two tosses before the first run of `run` losses — a rule that reads
 * the future, so not a stopping time. Returns the wealth path and whether the player left.
 */
export function leaveBeforeRun(tosses: number[], run: number, before = 2): { wealth: number[]; left: number | null } {
  let start: number | null = null;
  for (let s = 0; s + run <= tosses.length && start === null; s++) {
    let all = true;
    for (let j = 0; j < run; j++) if (tosses[s + j] !== -1) all = false;
    if (all) start = s;
  }
  const leaveAt = start === null ? null : Math.max(0, start - before);
  const wealth = [0];
  let w = 0;
  for (let t = 0; t < tosses.length; t++) {
    if (leaveAt === null || t < leaveAt) w += tosses[t];
    wealth.push(w);
  }
  return { wealth, left: leaveAt };
}

export function replayLeaveBeforeRun(seed: number, run: number, players = PLAYERS, T = TOSSES): Fan {
  const next = rng(seed);
  const finals = new Array<number>(players);
  const sum = new Float64Array(T + 1);
  const paths: number[][] = [];
  const every = Math.max(1, Math.floor(players / FAN_PATHS));
  let leftEarly = 0;
  for (let i = 0; i < players; i++) {
    const tosses: number[] = [];
    for (let t = 0; t < T; t++) tosses.push(next() < 0.5 ? 1 : -1);
    const g = leaveBeforeRun(tosses, run);
    finals[i] = g.wealth[T];
    if (g.left !== null) leftEarly++;
    for (let t = 0; t <= T; t++) sum[t] += g.wealth[t];
    if (i % every === 0 && paths.length < FAN_PATHS) paths.push(g.wealth);
  }
  return { ...summarise(finals), meanPath: Array.from(sum, (s) => s / players), paths, leftEarly, T };
}

// ---------------------------------------------------------------- formatting shared by the figures

const _f2 = format("+.2f");
/** signed to 2 d.p., never "−0.00" */
export const f2 = (v: number) => _f2(Math.abs(v) < 0.005 ? 0 : v);
export const n3 = format(".3f");
export const f1 = format("+.1f");
export const n0 = format(",.0f");
export const n1 = format(".1f");
export const n2 = format(".2f");
export const pct0 = format(".0%");
export const pct1 = format(".1%");
export const chips = (v: number) => (v > 0 ? "+" + n0(v) : n0(v).replace("-", "−"));

/** Phone or not: the figures draw narrower plots under 520 px. */
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
