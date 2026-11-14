import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-G2.json";
import record from "../data/nifty50-long.json";
import { dayFeatures, kmeans, reconMse, reconstruct, silhouette, standardise, trainAutoencoder, windowMatrix, windowPca } from "./unsupervised";

const returns = record.returns.map((r) => r.r);
const feats = dayFeatures(returns, key.meta.W);
const P = feats.points;
const Ps = standardise(P, feats.mean, feats.sd);
const SEED = key.meta.seed;

describe("G2 — Figure 0: sort the days (k-means on the real record)", () => {
  it("the features are the key's: today's move and the trailing 20-day realised vol", () => {
    expect(P.length).toBe(key.fig0.features.n);
    expect(feats.mean[0]).toBeCloseTo(key.fig0.features.x_mean, 8);
    expect(feats.sd[1]).toBeCloseTo(key.fig0.features.y_sd, 8);
    expect(P[0][1]).toBeCloseTo(key.fig0.points[0][1], 3);
    expect(P[P.length - 1][0]).toBeCloseTo(key.fig0.points[P.length - 1][0], 4);
  });
  it("raw units: the same starting days, rounds, piles and spread as the key for k = 2, 3, 4", () => {
    for (const k of [2, 3, 4]) {
      const ref = key.fig0.raw[String(k) as "2" | "3" | "4"];
      const r = kmeans(P, k, SEED);
      expect(r.init).toEqual(ref.init);
      expect(r.rounds).toBe(ref.rounds);
      expect(r.sizes).toEqual(ref.sizes);
      expect(r.spread).toBeCloseTo(ref.spread, 4);
      r.centres.forEach((c, j) => {
        expect(c[0]).toBeCloseTo(ref.centres[j][0], 8);
        expect(c[1]).toBeCloseTo(ref.centres[j][1], 8);
      });
      expect(Array.from(r.labels)).toEqual(ref.labels);
    }
  });
  it("two piles: the small one is 36 days of March–May 2020 and nothing else", () => {
    const small = key.fig0.raw["2"].piles.find((p) => p.size < 100)!;
    expect(small.size).toBe(36);
    expect(small.months).toEqual(["2020-03", "2020-04", "2020-05"]);
    expect(key.fig0.trace_raw_k2.length).toBe(key.fig0.raw["2"].rounds);
  });
  it("standardised units: the piles change — at k = 3 they become down days, up days and covid", () => {
    for (const k of [2, 3, 4]) {
      const ref = key.fig0.standardised[String(k) as "2" | "3" | "4"];
      const r = kmeans(Ps, k, SEED);
      expect(r.sizes).toEqual(ref.sizes);
      expect(r.rounds).toBe(ref.rounds);
      expect(r.spread).toBeCloseTo(ref.spread, 6);
    }
    const piles = key.fig0.standardised["3"].piles.slice().sort((a, b) => a.size - b.size);
    expect(piles[0].mean_vol).toBeGreaterThan(60);
    expect(piles[1].mean_move).toBeLessThan(-0.5);
    expect(piles[2].mean_move).toBeGreaterThan(0.4);
  });
});

describe("G2 — Figure 1: how many piles", () => {
  it("spread falls with k; the silhouette says two; all three seeds agree at k = 4", () => {
    let prev = Infinity;
    for (const row of key.fig1.rows) {
      expect(row.best_spread).toBeLessThan(prev);
      prev = row.best_spread;
    }
    expect(key.fig1.rows[1].best_silhouette!).toBeGreaterThan(0.85);
    for (let i = 2; i < key.fig1.rows.length; i++) expect(key.fig1.rows[i].best_silhouette!).toBeLessThan(key.fig1.rows[i - 1].best_silhouette!);
    const k4 = key.fig1.rows[3].per_seed.map((s) => Math.round(s.spread));
    expect(new Set(k4).size).toBe(1);
  });
  it("the engine's silhouette equals the key's for k = 2 and 3", () => {
    for (const k of [2, 3]) {
      const ref = key.fig1.rows[k - 1].per_seed[0];
      const r = kmeans(P, k, ref.seed);
      expect(r.spread).toBeCloseTo(ref.spread, 4);
      expect(silhouette(P, r.labels, k)).toBeCloseTo(ref.silhouette!, 8);
    }
  });
});

describe("G2 — Figure 2: twenty days in two numbers (PCA of move-size windows)", () => {
  const X = windowMatrix(returns, key.meta.W);
  const p = windowPca(X);
  it("level, slope, curvature: the shares, the loadings and the reconstruction errors are the key's", () => {
    expect(X.length).toBe(key.fig2.n_windows);
    p.share.slice(0, 6).forEach((s, j) => expect(s).toBeCloseTo(key.fig2.share[j], 8));
    expect(p.share[0]).toBeGreaterThan(0.27);
    expect(p.cumulative[9]).toBeGreaterThan(0.69);
    for (const j of [0, 1, 2]) p.loadings[j].forEach((v, i) => expect(v).toBeCloseTo(key.fig2.loadings[j][i], 6));
    expect(Math.min(...p.loadings[0])).toBeGreaterThan(0); // level: all positive
    expect(p.loadings[1][0] * p.loadings[1][19]).toBeLessThan(0); // slope: changes sign
    for (const k of [0, 1, 2, 3, 5, 10, 20]) expect(reconMse(p, k)).toBeCloseTo(key.fig2.recon_mse[k], 8);
  });
  it("the windows of 23 March and 20 April 2020 are the extremes of the slope score; reconstructions match", () => {
    const w = key.fig2.windows;
    expect(w.pc2_min.ends).toBe("2020-03-23");
    expect(w.pc2_max.ends).toBe("2020-04-20");
    for (const name of ["pc2_min", "calm"] as const) {
      const i = w[name].index;
      expect(p.scores(i, 1)).toBeCloseTo(w[name].scores[1], 6);
      for (const k of [1, 2, 5]) reconstruct(p, i, k).forEach((v, d) => expect(v).toBeCloseTo(w[name].recon[String(k) as "1" | "2" | "5"][d], 6));
    }
  });
});

describe("G2 — Figure 3: a network that learns PCA", () => {
  const X = windowMatrix(returns, key.meta.W);
  const p = windowPca(X);
  it("the linear autoencoder's loss follows the key step for step and lands on the PCA-2 floor", () => {
    const r = trainAutoencoder(X, p.colmean, { act: "linear", lr: key.fig3.linear.lr, epochs: 3000, seed: key.fig3.linear.seed });
    for (const row of r.log) expect(row.loss).toBeCloseTo(key.fig3.linear.log[String(row.epoch) as "0"].loss, 8);
    expect(Math.abs(r.finalLoss - key.fig3.pca2_floor)).toBeLessThan(1e-4);
  }, 60000);
  it("the tanh autoencoder is slower and, after the same 3,000 steps, worse than PCA", () => {
    const r = trainAutoencoder(X, p.colmean, { act: "tanh", lr: key.fig3.tanh.lr, epochs: 3000, seed: key.fig3.tanh.seed });
    for (const row of r.log) expect(row.loss).toBeCloseTo(key.fig3.tanh.log[String(row.epoch) as "0"].loss, 5);
    expect(r.finalLoss).toBeGreaterThan(key.fig3.pca2_floor + 0.01);
  }, 60000);
});
