/**
 * Figure 1's animated panel: a minute-scale path SIMULATED between two real closes (a Brownian bridge with the row's
 * wobble), and the obvious hedge run on it — hold 100 lots above the strike, none below, buying at K + ε/2 and
 * selling at K − ε/2, so every round trip costs ε points × the position's units. Seeded, so the panel is the same
 * on every visit. No engine number depends on it; it is a picture of why the obvious hedge fails.
 */

/** mulberry32 */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(r: () => number) {
  const u = Math.max(r(), 1e-12),
    v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export const MINUTES = 375; // one NSE session, 09:15 → 15:30

/** Brownian bridge from `from` to `to` over MINUTES steps, per-minute wobble from the annual sigma on 252 × 375 minutes. */
export function bridge(from: number, to: number, sigma: number, seed: number, n = MINUTES): number[] {
  const r = rng(seed);
  const sd = sigma * from * Math.sqrt(1 / (252 * n));
  const w = [0];
  for (let i = 1; i <= n; i++) w.push(w[i - 1] + sd * gauss(r));
  const out = new Array<number>(n + 1);
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    out[i] = from + (w[i] - s * w[n]) + s * (to - from);
  }
  return out;
}

export interface HedgeRun {
  /** lots held after each minute */
  held: number[];
  /** cumulative round trips completed after each minute */
  trips: number[];
  /** index of each trade minute, with its direction */
  trades: { i: number; buy: boolean }[];
}

/** The obvious hedge on a path: all lots above K + ε/2, none below K − ε/2. */
export function obviousHedge(path: number[], K: number, eps: number, lots: number): HedgeRun {
  const held: number[] = [];
  const trips: number[] = [];
  const trades: { i: number; buy: boolean }[] = [];
  let h = path[0] >= K + eps / 2 ? lots : 0;
  let n = 0;
  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    if (h === 0 && p >= K + eps / 2) {
      h = lots;
      trades.push({ i, buy: true });
    } else if (h === lots && p <= K - eps / 2) {
      h = 0;
      n++;
      trades.push({ i, buy: false });
    }
    held.push(h);
    trips.push(n);
  }
  return { held, trips, trades };
}
