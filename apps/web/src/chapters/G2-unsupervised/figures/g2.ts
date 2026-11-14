/**
 * Chapter G2 — the running example: the real NIFTY record (src/data/nifty50-long.json), 2,663 days from 2 Feb 2016 to 3 Nov 2026.
 * Figures 0–1 see each day as (today's move %, the previous twenty days' realised vol % a year) and sort the days by k-means;
 * Figures 2–3 see each day as its last twenty move sizes and compress the 20-vectors by PCA and by a 20 → 2 → 20 autoencoder.
 * Every number a figure prints is produced by engine/unsupervised.ts on the record or read from the tested answer key
 * (src/engine/__fixtures__/key-G2.json); the engine reproduces the key in engine/unsupervised.test.ts and the live runs are
 * asserted against the key here in dev. k-means runs live for the dialled (k, seed); the silhouette (O(n²)) and the autoencoder's
 * 3,000-round training (seconds) are read from the key, and a short live training run checks the key's first hundred rounds in dev.
 */
import key from "../../../engine/__fixtures__/key-G2.json";
import record from "../../../data/nifty50-long.json";
import { assign, dayFeatures, kmeans, reconMse, reconstruct, standardise, trainAutoencoder, windowMatrix, windowPca, type KmResult, type Pt, type WindowPca } from "../../../engine/unsupervised";

export { n0, n1, n2, n3 } from "../../C4-greeks/figures/row";
export { useNarrow } from "../../D2-smile/figures/d2";

export const KEY = key;
export const W: number = key.meta.W;
export const SEED: number = key.meta.seed;

/* ---- memoisation: one Map, keyed by the run's parameters ---- */
const memo = new Map<string, unknown>();
function once<T>(k: string, f: () => T): T {
  if (memo.has(k)) return memo.get(k) as T;
  const v = f();
  memo.set(k, v);
  return v;
}
const DEV = import.meta.env.DEV;
const close = (a: number, b: number, tol: number) => Math.abs(a - b) < tol;

/* ---- formatting ---- */
/** a typographic minus */
export const neg = (s: string) => s.replace(/-/g, "−");
/** 27.9 % — one decimal, typographic minus */
export const pct1 = (v: number) => `${neg((100 * v).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }))} %`;
/** 0.3697 — four decimals (the reconstruction errors) */
export const n4 = (v: number) => neg(v.toFixed(4));
/** +0.58 % / −0.78 % */
export const s2pct = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)} %`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2020-03-13" → "13 Mar" */
export function dm(d: string): string {
  const [, m, day] = d.split("-");
  return `${Number(day)} ${MONTHS[Number(m) - 1]}`;
}
/** "2020-03-13" → "13 Mar 2020" */
export function dmy(d: string): string {
  return `${dm(d)} ${d.slice(0, 4)}`;
}
/** "13 Mar–8 May 2020" or "2 Feb 2016–3 Nov 2026" */
export function span(a: string, b: string): string {
  return a.slice(0, 4) === b.slice(0, 4) ? `${dm(a)}–${dm(b)} ${a.slice(0, 4)}` : `${dmy(a)}–${dmy(b)}`;
}

/* ---- the record ---- */
const RETURNS: number[] = record.returns.map((r) => r.r);
/** the dates of the 2,663 featured days (the return record from day W on); equals key.fig0.days */
export const DAYS: string[] = record.returns.slice(W).map((r) => r.d);
export const N_DAYS = DAYS.length;
export const FIRST_DAY = DAYS[0];
export const LAST_DAY = DAYS[N_DAYS - 1];
if (DEV) {
  console.assert(N_DAYS === key.fig0.features.n && FIRST_DAY === key.fig0.days[0] && LAST_DAY === key.fig0.days[N_DAYS - 1], "G2 days");
}

/* ---- Figures 0–1: the two features (key.fig0.features / points) ---- */
export type Units = "raw" | "standardised";
const FEATS = dayFeatures(RETURNS, W);
/** raw: today's move (%), trailing vol (% a year) */
export const P: Pt[] = FEATS.points;
/** both axes less their mean, over their sd */
export const PS: Pt[] = standardise(P, FEATS.mean, FEATS.sd);
export const FEAT_MEAN = FEATS.mean;
export const FEAT_SD = FEATS.sd;
if (DEV) {
  console.assert(close(FEATS.mean[0], key.fig0.features.x_mean, 1e-8) && close(FEATS.sd[1], key.fig0.features.y_sd, 1e-8), "G2 features");
  console.assert(close(P[0][1], key.fig0.points[0][1], 1e-3), "G2 first point");
}
export const points = (u: Units): Pt[] => (u === "raw" ? P : PS);

/** the extent of the cloud in each unit, for the axes */
export function extent(u: Units): { x: [number, number]; y: [number, number] } {
  return once(`extent:${u}`, () => {
    const Q = points(u);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [a, b] of Q) {
      if (a < x0) x0 = a;
      if (a > x1) x1 = a;
      if (b < y0) y0 = b;
      if (b > y1) y1 = b;
    }
    return { x: [x0, x1], y: [y0, y1] };
  });
}

export interface Pile {
  j: number; // the engine's label
  size: number;
  centre: Pt;
  first: string;
  last: string;
  meanMove: number; // in % (raw units) even when the clustering was standardised
  meanVol: number;
}
export interface Sorted {
  k: number;
  seed: number;
  units: Units;
  res: KmResult;
  /** piles in size order, largest first */
  piles: Pile[];
  /** colour slot of each engine label: 0 blue, 1 amber, 2 grey, 3 red (the smallest pile) */
  slot: number[];
}
type KeyRun = (typeof key.fig0.raw)["2"];
function keyRun(u: Units, k: number): KeyRun | undefined {
  const tbl = u === "raw" ? key.fig0.raw : key.fig0.standardised;
  return (tbl as Record<string, KeyRun>)[String(k)];
}

/** live k-means for (units, k, seed); equals key.fig0[units][k] for seed 1, k = 2, 3, 4 and key.fig1.rows for raw units (asserted in dev) */
export function getSorted(u: Units, k: number, seed = SEED): Sorted {
  return once(`km:${u}:${k}:${seed}`, () => {
    const Q = points(u);
    const res = kmeans(Q, k, seed);
    const piles: Pile[] = res.centres.map((c, j) => {
      let first = "", last = "", sm = 0, sv = 0, n = 0;
      for (let i = 0; i < Q.length; i++) {
        if (res.labels[i] !== j) continue;
        if (!first) first = DAYS[i];
        last = DAYS[i];
        sm += P[i][0];
        sv += P[i][1];
        n++;
      }
      return { j, size: res.sizes[j], centre: c, first, last, meanMove: n ? sm / n : 0, meanVol: n ? sv / n : 0 };
    });
    piles.sort((a, b) => b.size - a.size);
    // colour slots: largest blue (0), then amber (1), grey (2); the smallest pile is always red (3)
    const slot = new Array<number>(k).fill(0);
    piles.forEach((p, s) => (slot[p.j] = s === k - 1 && k > 1 ? 3 : s));
    if (DEV) {
      const ref = seed === SEED ? keyRun(u, k) : undefined;
      if (ref) {
        console.assert(res.rounds === ref.rounds, "G2 kmeans rounds", u, k);
        console.assert(res.sizes.every((s, j) => s === ref.sizes[j]), "G2 kmeans sizes", u, k);
        console.assert(close(res.spread, ref.spread, 1e-4), "G2 kmeans spread", u, k);
        ref.piles.forEach((pp, j) => {
          const live = piles.find((q) => q.j === j)!;
          console.assert(live.first === pp.first && live.last === pp.last, "G2 pile dates", u, k, j);
          console.assert(close(live.meanMove, pp.mean_move, 1e-8) && close(live.meanVol, pp.mean_vol, 1e-8), "G2 pile means", u, k, j);
        });
      }
      if (u === "raw" && k >= 1 && k <= key.fig1.rows.length) {
        const row = key.fig1.rows[k - 1].per_seed.find((s) => s.seed === seed);
        if (row) console.assert(close(res.spread, row.spread, 1e-4) && res.rounds === row.rounds, "G2 fig1 point", k, seed);
      }
    }
    return { k, seed, units: u, res, piles, slot };
  });
}

/** the assignment of every day to the centres of round r (1-based) of a live run — colours for the step-through */
export function assignAt(s: Sorted, r: number): { labels: Int32Array; sizes: number[]; spread: number } {
  return once(`assign:${s.units}:${s.k}:${s.seed}:${r}`, () => {
    const t = s.res.trace[Math.min(r, s.res.trace.length) - 1];
    const a = assign(points(s.units), t.centres);
    if (DEV) console.assert(a.sizes.every((v, j) => v === t.sizes[j]) && close(a.spread, t.spread, 1e-6), "G2 assign trace", r);
    return a;
  });
}

/** the within-pile spread with one pile: the total squared distance about the mean (key.fig1.rows[0]) */
export const SPREAD_K1: number = key.fig1.rows[0].best_spread;
export const FIG1_ROWS = key.fig1.rows;
export const SEEDS: number[] = key.fig1.seeds;
export const K_MAX = FIG1_ROWS.length;

/* ---- Figures 2–3: the twenty-day windows of move sizes (key.fig2) ---- */
export const FIG2 = key.fig2;
export type WindowName = "calm" | "pc2_min";
export const WINDOWS = key.fig2.windows;
export const TSAY = key.fig2.tsay;
/** live PCA of the 2,663 windows; shares, loadings and reconstruction errors equal the key (asserted in dev) */
export function getPca(): WindowPca {
  return once("pca", () => {
    const X = windowMatrix(RETURNS, W);
    const p = windowPca(X);
    if (DEV) {
      console.assert(X.length === key.fig2.n_windows, "G2 windows");
      key.fig2.share.forEach((s, j) => console.assert(close(p.share[j], s, 1e-8), "G2 share", j));
      for (const j of [0, 1, 2]) key.fig2.loadings[j].forEach((v, i) => console.assert(close(p.loadings[j][i], v, 1e-6), "G2 loading", j, i));
      key.fig2.recon_mse.forEach((v, k) => console.assert(close(reconMse(p, k), v, 1e-8), "G2 recon_mse", k));
      for (const name of ["calm", "pc2_min"] as const) {
        const w = WINDOWS[name];
        console.assert(record.returns[W + w.index - 1].d === w.ends, "G2 window date", name); // window i holds returns W+i−20 … W+i−1: it ends the day before day i
        w.values.forEach((v, d) => console.assert(close(X[w.index][d], v, 1e-9), "G2 window values", name, d));
      }
    }
    return p;
  });
}
/** window `name` rebuilt from its first k components (live); equals key.fig2.windows[name].recon[k] for k ∈ {1, 2, 3, 5, 10, 20} (asserted in dev) */
export function getRecon(name: WindowName, k: number): Float64Array {
  return once(`recon:${name}:${k}`, () => {
    const p = getPca();
    const w = WINDOWS[name];
    const r = reconstruct(p, w.index, k);
    if (DEV) {
      const ref = (w.recon as Record<string, number[] | undefined>)[String(k)];
      if (ref) ref.forEach((v, d) => console.assert(close(r[d], v, 1e-6), "G2 recon", name, k, d));
    }
    return r;
  });
}
/** mean squared reconstruction error over all windows with k components (live; = key.fig2.recon_mse[k]) */
export const getReconMse = (k: number) => reconMse(getPca(), k);

/* ---- Figure 3: the autoencoder (key.fig3, read from the key; training takes seconds) ---- */
export type Act = "linear" | "tanh";
export const FIG3 = key.fig3;
export const LOG_AT: number[] = key.fig3.log_at;
export interface AeStep {
  epoch: number;
  loss: number;
  hidden: [number, number];
  recon: number[];
}
type LogRow = (typeof key.fig3.linear.log)["0"];
/** the key's log for `act`, in epoch order */
export function aeLog(act: Act): AeStep[] {
  return once(`aelog:${act}`, () => {
    const src = (act === "linear" ? key.fig3.linear.log : key.fig3.tanh.log) as Record<string, LogRow>;
    return LOG_AT.map((e) => {
      const row = src[String(e)];
      return { epoch: e, loss: row.loss, hidden: [row.hidden_pc2min[0], row.hidden_pc2min[1]], recon: row.recon_pc2min };
    });
  });
}
export const AE = { linear: key.fig3.linear, tanh: key.fig3.tanh } as const;
/** the error of keeping two principal components: the floor the linear network reaches (key; equals reconMse(p, 2), asserted in dev) */
export const PCA2_FLOOR: number = key.fig3.pca2_floor;
export const PCA1_FLOOR: number = key.fig3.pca1_floor;
if (DEV) {
  console.assert(close(PCA2_FLOOR, key.fig2.recon_mse[2], 1e-12) && close(PCA1_FLOOR, key.fig2.recon_mse[1], 1e-12), "G2 floors");
  console.assert(close(key.fig3.linear.final_loss, PCA2_FLOOR, 1e-4), "G2 linear lands on the floor");
}
/**
 * Dev check that the engine reproduces the key's training log: the first `epochs` rounds of each run, asserted at the logged
 * epochs. Called lazily (after first paint) by Figure 3; never on render — the full 3,000 rounds take seconds and are tested in
 * engine/unsupervised.test.ts.
 */
export function checkAutoencoder(act: Act, epochs = 100): void {
  if (!DEV) return;
  once(`aecheck:${act}:${epochs}`, () => {
    const p = getPca();
    const cfg = AE[act];
    const r = trainAutoencoder(p.X, p.colmean, { act, lr: cfg.lr, epochs, seed: cfg.seed });
    const log = aeLog(act);
    for (const row of r.log) {
      const ref = log.find((l) => l.epoch === row.epoch);
      if (ref) console.assert(close(row.loss, ref.loss, act === "linear" ? 1e-8 : 1e-5), "G2 autoencoder log", act, row.epoch);
    }
    const last = log.find((l) => l.epoch === epochs);
    if (last) r.recon(WINDOWS.pc2_min.index).forEach((v, d) => console.assert(close(v, last.recon[d], act === "linear" ? 1e-6 : 1e-4), "G2 autoencoder recon", act, d));
    return true;
  });
}
