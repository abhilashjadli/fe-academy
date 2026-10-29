/** Chapter B2: the fair coin table, betting strategies, the meter that will not move, gambler's ruin, Shreve's discounted tree. */

/** What a strategy may look at before placing its bet: everything up to now, never the next toss (unless it cheats). */
export interface History {
  /** tosses so far, +1 = win for a unit bet on "heads", −1 = loss */
  tosses: number[];
  /** signed bets placed so far (positive = on heads) */
  bets: number[];
  /** wealth after each toss; wealth[t] is wealth after t tosses, wealth[0] = 0 */
  wealth: number[];
  /** current toss index (number of tosses already seen) */
  t: number;
  /** current wealth */
  w: number;
  /** consecutive wins (positive) or losses (negative) on the last bets placed */
  streak: number;
  /** the next toss — only present for a strategy that cheats */
  next?: number;
}

/**
 * A strategy returns a signed bet for the next toss: magnitude is the stake, sign is the side (+ heads, − tails).
 * Returning 0 means "leave the table": once a strategy returns 0 it is not asked again.
 */
export interface Strategy {
  name: string;
  bet(h: History): number;
  /** declared cheat: the simulator shows the strategy the next toss */
  peeks?: boolean;
  /** the toss probability of heads for the table (default fair, ½) */
  pHeads?: number;
}

export interface GameResult {
  wealth: number[];
  bets: number[];
  tosses: number[];
  /** number of tosses actually played before leaving (≤ n) */
  played: number;
  final: number;
}

export function tossCoin(next: () => number, pHeads = 0.5): number {
  return next() < pHeads ? 1 : -1;
}

/** Play up to n tosses of the game under a strategy; the wealth path is padded flat after the player leaves. */
export function playGame(strategy: Strategy, n: number, next: () => number, pHeads = strategy.pHeads ?? 0.5): GameResult {
  const tosses: number[] = [];
  const bets: number[] = [];
  const wealth: number[] = [0];
  const h: History = { tosses, bets, wealth, t: 0, w: 0, streak: 0 };
  let played = 0;
  let left = false;
  for (let t = 0; t < n; t++) {
    const toss = tossCoin(next, pHeads);
    let b = 0;
    if (!left) {
      if (strategy.peeks) h.next = toss;
      b = strategy.bet(h);
      if (b === 0) left = true;
    }
    tosses.push(toss);
    bets.push(b);
    h.w += b * toss;
    wealth.push(h.w);
    h.t = t + 1;
    if (b !== 0) {
      played = t + 1;
      const won = b * toss > 0;
      h.streak = won ? (h.streak > 0 ? h.streak + 1 : 1) : h.streak < 0 ? h.streak - 1 : -1;
    }
  }
  return { wealth, bets, tosses, played, final: h.w };
}

/** The plain game: one chip a toss for n tosses. */
export function fairCoinGame(n: number, next: () => number): number[] {
  return playGame(fixedBet(1), n, next).wealth;
}

// ---------------------------------------------------------------- strategies

export function fixedBet(stake = 1): Strategy {
  return { name: `fixed bet ${stake}`, bet: () => stake };
}

/** Quit when up by `target`; otherwise one chip a toss, until `maxTosses` ("saved by the bell"). */
export function quitWhenAhead(target: number, maxTosses = Infinity): Strategy {
  return {
    name: `quit when up ${target}`,
    bet: (h) => (h.w >= target || h.t >= maxTosses ? 0 : 1),
  };
}

/** Two-sided exit: leave when up by `up` or down by `down`. */
export function quitAt(up: number, down: number): Strategy {
  return {
    name: `quit when up ${up} or down ${down}`,
    bet: (h) => (h.w >= up || h.w <= -down ? 0 : 1),
  };
}

/**
 * The martingale system: bet 1, double after every loss, back to 1 after a win. The table limit caps the stake: when the next
 * doubled bet would exceed `limit` the cycle is abandoned (the loss stays) and the player starts a fresh cycle at 1.
 * With limit = 2^k − 1 this is "k doublings allowed".
 */
export function doubling(limit = 31): Strategy {
  return {
    name: `doubling, limit ${limit}`,
    bet: (h) => {
      const last = h.bets.length ? h.bets[h.bets.length - 1] : 0;
      if (last === 0) return 1;
      const lastToss = h.tosses[h.tosses.length - 1];
      if (last * lastToss > 0) return 1; // won: back to 1
      const nxt = 2 * Math.abs(last);
      return nxt > limit ? 1 : nxt; // over the limit: cycle abandoned, start again
    },
  };
}

/** After k tosses the same way, bet `bigStake` on the streak continuing; otherwise one chip on heads. */
export function betOnStreaks(k: number, bigStake = 2): Strategy {
  return {
    name: `bet ${bigStake} on streaks of ${k}`,
    bet: (h) => {
      const n = h.tosses.length;
      if (n < k) return 1;
      const last = h.tosses[n - 1];
      for (let i = n - k; i < n; i++) if (h.tosses[i] !== last) return 1;
      return bigStake * last;
    },
  };
}

/** Your own system: any rule of the history. */
export function customRule(rule: (h: History) => number, name = "custom rule"): Strategy {
  return { name, bet: rule };
}

/** "Your habit" read off a hand-played session: stake after a win, stake after a loss, and the wealth at which you leave (up or down). */
export function habitRule(afterWin: number, afterLoss: number, leaveUp: number, leaveDown: number): Strategy {
  return {
    name: "your habit",
    bet: (h) => {
      if (h.w >= leaveUp || h.w <= -leaveDown) return 0;
      if (h.streak === 0) return afterWin;
      return h.streak > 0 ? afterWin : afterLoss;
    },
  };
}

/** The cheat: bet one chip on the toss you can already see. Gains exactly +1 per peeked toss. */
export function peek(stake = 1): Strategy {
  return { name: "peek at the next toss", peeks: true, bet: (h) => stake * (h.next ?? 1) };
}

/** Peek for only the first `tosses` tosses, then play honestly with one chip. */
export function peekFor(tosses: number, stake = 1): Strategy {
  return { name: `peek for ${tosses} tosses`, peeks: true, bet: (h) => (h.t < tosses ? stake * (h.next ?? 1) : 1) };
}

// ---------------------------------------------------------------- replays and the meter

export interface Replay {
  finals: number[];
  mean: number;
  sd: number;
  /** standard error of the mean, sd/√n */
  se: number;
  /** fraction of players who finish ahead (> 0) */
  pAhead: number;
  median: number;
}

export function summarise(finals: number[]): Replay {
  const n = finals.length;
  let s = 0;
  for (const v of finals) s += v;
  const mean = s / n;
  let ss = 0,
    ahead = 0;
  for (const v of finals) {
    ss += (v - mean) * (v - mean);
    if (v > 0) ahead++;
  }
  const sd = Math.sqrt(ss / n);
  const sorted = finals.slice().sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  return { finals, mean, sd, se: sd / Math.sqrt(n), pAhead: ahead / n, median };
}

/** Replay a strategy for many players over `tosses` tosses each; the meter is `mean`. */
export function simulatePlayers(strategy: Strategy, players: number, tosses: number, next: () => number): Replay {
  const finals = new Array<number>(players);
  for (let i = 0; i < players; i++) finals[i] = playGame(strategy, tosses, next).final;
  return summarise(finals);
}

/** Optional stopping check: is the replay mean within z standard errors of the starting wealth (0)? */
export function optionalStoppingCheck(r: Replay, z = 3): { ok: boolean; mean: number; se: number; z: number } {
  return { ok: Math.abs(r.mean) <= z * r.se, mean: r.mean, se: r.se, z: r.se > 0 ? r.mean / r.se : 0 };
}

/** Histogram of finals over integer bins from lo to hi (inclusive); returns counts indexed by value − lo. */
export function histogram(finals: number[], lo: number, hi: number): number[] {
  const bars = new Array(hi - lo + 1).fill(0);
  for (const v of finals) {
    const i = Math.round(v) - lo;
    if (i >= 0 && i < bars.length) bars[i]++;
  }
  return bars;
}

/** Quit-when-up-by-1 under a horizon T: fraction who reach +1 and the mean loss of those who do not. */
export function quitUpByOneStats(players: number, T: number, next: () => number): { pHit: number; pHitFormula: number; mean: number; meanLossGivenMiss: number; worst: number } {
  const s = quitWhenAhead(1, T);
  let hit = 0,
    sum = 0,
    missSum = 0,
    worst = 0;
  for (let i = 0; i < players; i++) {
    const f = playGame(s, T, next).final;
    sum += f;
    if (f >= 1) hit++;
    else {
      missSum += f;
      if (f < worst) worst = f;
    }
  }
  return { pHit: hit / players, pHitFormula: 1 - 1 / Math.sqrt((Math.PI * T) / 2), mean: sum / players, meanLossGivenMiss: hit === players ? 0 : missSum / (players - hit), worst };
}

/**
 * Doubling with k doublings allowed (bankroll 2^k − 1), played for a fixed number of cycles per player.
 * A cycle ends at the first win (+1) or after k losses (−(2^k − 1)).
 */
export function doublingCycles(k: number, cycles: number, players: number, next: () => number, pHeads = 0.5): Replay & { pRuinPerCycle: number; pAtLeastOneRuin: number; pAtLeastOneRuinFormula: number; meanPerCycleFormula: number } {
  const bankroll = Math.pow(2, k) - 1;
  const finals = new Array<number>(players);
  let ruined = 0;
  for (let i = 0; i < players; i++) {
    let total = 0;
    let anyRuin = false;
    for (let c = 0; c < cycles; c++) {
      let losses = 0;
      while (losses < k && next() >= pHeads) losses++;
      if (losses >= k) {
        total -= bankroll;
        anyRuin = true;
      } else total += 1;
    }
    finals[i] = total;
    if (anyRuin) ruined++;
  }
  const q = 1 - pHeads;
  const pRuin = Math.pow(q, k);
  return {
    ...summarise(finals),
    pRuinPerCycle: pRuin,
    pAtLeastOneRuin: ruined / players,
    pAtLeastOneRuinFormula: 1 - Math.pow(1 - pRuin, cycles),
    meanPerCycleFormula: (1 - pRuin) * 1 - pRuin * bankroll,
  };
}

/** Expected profit per toss for a unit bet when heads has probability p: 2p − 1 (−1/37 on the European wheel). */
export function unitBetEdge(pHeads: number): number {
  return 2 * pHeads - 1;
}

export const ROULETTE_P = 18 / 37;

// ---------------------------------------------------------------- gambler's ruin (fair)

/** From K chips aiming at N (ruin at 0), fair coin: P(reach N) = K/N, expected duration K(N − K). */
export function gamblersRuin(K: number, N: number): { pWin: number; expectedDuration: number } {
  return { pWin: K / N, expectedDuration: K * (N - K) };
}

/** Two-sided quit from 0: up b or down a. P(+b first) = a/(a + b); E[duration] = ab. */
export function twoSidedQuit(up: number, down: number): { pUpFirst: number; expectedDuration: number; mean: number } {
  const r = gamblersRuin(down, down + up);
  return { pUpFirst: r.pWin, expectedDuration: r.expectedDuration, mean: r.pWin * up - (1 - r.pWin) * down };
}

/** Spread (standard deviation) of unit-bet wealth after T tosses: √T. */
export function spreadAfter(T: number): number {
  return Math.sqrt(T);
}

// ---------------------------------------------------------------- Shreve's discounted tree (Figs 8.2.2–8.2.3)

export interface Tree {
  pTilde: number;
  /** levels[n][i]: node after n tosses with (n − i) heads, i.e. most heads first; discounted value S_n/(1+r)^n */
  levels: number[][];
  /** undiscounted prices in the same layout */
  prices: number[][];
}

/** Binomial tree of discounted prices with the risk-neutral probability p̃ = (1 + r − d)/(u − d). Every node is the p̃-mean of its children. */
export function riskNeutralTree(S0: number, u: number, d: number, r: number, steps: number): Tree {
  const pTilde = (1 + r - d) / (u - d);
  const levels: number[][] = [];
  const prices: number[][] = [];
  for (let n = 0; n <= steps; n++) {
    const row: number[] = [];
    const prow: number[] = [];
    for (let i = 0; i <= n; i++) {
      const heads = n - i;
      const S = S0 * Math.pow(u, heads) * Math.pow(d, i);
      prow.push(S);
      row.push(S / Math.pow(1 + r, n));
    }
    levels.push(row);
    prices.push(prow);
  }
  return { pTilde, levels, prices };
}

/** Largest |node − p̃·up − (1 − p̃)·down| over the tree: 0 for a martingale. */
export function martingaleDefect(tree: Tree): number {
  let worst = 0;
  for (let n = 0; n + 1 < tree.levels.length; n++)
    for (let i = 0; i < tree.levels[n].length; i++) {
      const v = tree.levels[n][i];
      const m = tree.pTilde * tree.levels[n + 1][i] + (1 - tree.pTilde) * tree.levels[n + 1][i + 1];
      worst = Math.max(worst, Math.abs(v - m));
    }
  return worst;
}

/** Value of the discounted tree along a path (array of +1 heads / −1 tails) at time t. */
export function nodeAt(tree: Tree, path: number[], t: number): number {
  let tails = 0;
  for (let i = 0; i < t; i++) if (path[i] < 0) tails++;
  return tree.levels[t][tails];
}

/** All 2^N paths as arrays of ±1 (heads first). */
export function allPaths(N: number): number[][] {
  const out: number[][] = [];
  for (let m = 0; m < 1 << N; m++) {
    const p: number[] = [];
    for (let i = 0; i < N; i++) p.push(m & (1 << (N - 1 - i)) ? -1 : 1);
    out.push(p);
  }
  return out;
}

/** Mean of M_{N ∧ τ} over all paths with the tree's probability, where τ(path) gives the stopping index (may look ahead: then it is not a stopping time). */
export function stoppedMean(tree: Tree, tau: (path: number[]) => number): number {
  const N = tree.levels.length - 1;
  let s = 0;
  for (const path of allPaths(N)) {
    let prob = 1;
    for (const x of path) prob *= x > 0 ? tree.pTilde : 1 - tree.pTilde;
    s += prob * nodeAt(tree, path, Math.min(tau(path), N));
  }
  return s;
}

/** Shreve's ρ (Fig. 8.2.3): stop at 0 if the first toss is a head; on TH stop at 1; on TT stop at 2. Not a stopping time — it reads the second toss at time 1. */
export function shreveRho(path: number[]): number {
  if (path[0] > 0) return 0;
  return path[1] > 0 ? 1 : 2;
}

/** A genuine stopping time: stop the first time the discounted value is at or below `level`, else never (N). */
export function firstHitBelow(tree: Tree, level: number): (path: number[]) => number {
  const N = tree.levels.length - 1;
  return (path) => {
    for (let t = 0; t <= N; t++) if (nodeAt(tree, path, t) <= level) return t;
    return N;
  };
}

/** Is τ a stopping time? i.e. does the decision {τ ≤ t} depend only on the first t tosses, for every t. */
export function isStoppingTime(N: number, tau: (path: number[]) => number): boolean {
  const paths = allPaths(N);
  for (let t = 0; t < N; t++) {
    const seen = new Map<string, boolean>();
    for (const p of paths) {
      const prefix = p.slice(0, t).join(",");
      const stopped = tau(p) <= t;
      const prev = seen.get(prefix);
      if (prev === undefined) seen.set(prefix, stopped);
      else if (prev !== stopped) return false;
    }
  }
  return true;
}

/**
 * The information diary: E[S_N | first n tosses] under heads-probability p (undiscounted), per prefix with (n − i) heads, most heads first.
 * Shreve 2.3.4–7 pattern: each page's forecast is S_n · (growth)^(N − n) with growth = p u + (1 − p) d.
 */
export function conditionalForecasts(S0: number, u: number, d: number, p: number, N: number): number[][] {
  const g = p * u + (1 - p) * d;
  const out: number[][] = [];
  for (let n = 0; n <= N; n++) {
    const row: number[] = [];
    for (let i = 0; i <= n; i++) row.push(S0 * Math.pow(u, n - i) * Math.pow(d, i) * Math.pow(g, N - n));
    out.push(row);
  }
  return out;
}
