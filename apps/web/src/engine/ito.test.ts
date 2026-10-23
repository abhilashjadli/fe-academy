import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-B4.json";
import { rng } from "./random";
import {
  brownianPath,
  coinPath,
  gbmMean,
  gbmMedian,
  gbmTerminal,
  gbmTerminalNoCorrection,
  incrementSums,
  itoDiffusion,
  itoDrift,
  logDrift,
  overstatementFactor,
  peekingSum,
  quadraticVariationSd,
  telescope,
} from "./ito";

describe("B4 Itô engine vs Python key", () => {
  it("telescoping identity is exact on the key's path and on random paths", () => {
    const t = telescope(key.telescope.W);
    expect(t.WT2).toBeCloseTo(key.telescope.WT2, 12);
    expect(t.twoSumWdW).toBeCloseTo(key.telescope.twoSumWdW, 12);
    expect(t.sumDW2).toBeCloseTo(key.telescope.sumDW2, 12);
    expect(t.WT2 - t.twoSumWdW).toBeCloseTo(t.sumDW2, 10);
    expect(peekingSum(key.telescope.W)).toBeCloseTo(key.telescope.peeking, 12);
    const r = rng(5);
    for (const n of [3, 50, 1000]) {
      const { W } = brownianPath(n, 2, r);
      const u = telescope(W);
      expect(u.WT2 - u.twoSumWdW).toBeCloseTo(u.sumDW2, 9);
      // peeking − honest = Σ(dW)²
      expect(peekingSum(W) - u.twoSumWdW / 2).toBeCloseTo(u.sumDW2, 9);
    }
  });

  it("quadratic variation: mean → T, sd = T√(2/n) (normal and coin paths)", () => {
    for (const c of key.qv) {
      expect(quadraticVariationSd(c.n, c.T)).toBeCloseTo(c.sd_formula, 12);
      const r = rng(c.n);
      const m = 400;
      let acc = 0,
        acc2 = 0;
      for (let k = 0; k < m; k++) {
        const q = incrementSums(brownianPath(c.n, c.T, r).W, c.T).sumDW2;
        acc += q;
        acc2 += q * q;
      }
      const mean = acc / m,
        sd = Math.sqrt(acc2 / m - mean * mean);
      expect(mean).toBeCloseTo(c.mean, 1);
      expect(Math.abs(sd - c.sd) < 0.25 * c.sd + 0.01).toBe(true);
      // coin path: Σ(dW)² is exactly T
      expect(incrementSums(coinPath(c.n, c.T, r).W, c.T).sumDW2).toBeCloseTo(c.T, 9);
    }
  });

  it("tile sums: Σdt² and Σdt·|dW| vanish as n grows while Σ(dW)² does not", () => {
    const r = rng(11);
    const s1 = incrementSums(brownianPath(16, 1, r).W, 1);
    const s2 = incrementSums(brownianPath(4096, 1, r).W, 1);
    expect(s2.sumDt2).toBeLessThan(s1.sumDt2 / 100);
    expect(s2.sumDtDW).toBeLessThan(s1.sumDtDW / 5);
    expect(Math.abs(s2.sumDW2 - 1)).toBeLessThan(0.1);
  });

  it("GBM mean, median, log drift and the overstatement factor (Hull 11.17)", () => {
    for (const c of key.gbm) {
      expect(gbmMean(c.S0, c.mu, c.T)).toBeCloseTo(c.mean, 6);
      expect(gbmMedian(c.S0, c.mu, c.sigma, c.T)).toBeCloseTo(c.median, 6);
      expect(logDrift(c.mu, c.sigma)).toBeCloseTo(c.log_drift, 12);
      expect(overstatementFactor(c.sigma, c.T)).toBeCloseTo(c.overstatement, 10);
      expect(gbmTerminal(c.S0, c.mu, c.sigma, c.T, 0)).toBeCloseTo(c.median, 6);
    }
    expect(gbmMean(100, 0.1, 1)).toBeCloseTo(110.52, 2);
    expect(gbmMedian(100, 0.1, 0.4, 1)).toBeCloseTo(102.02, 2);
  });

  it("the bug: forgetting −½σ² overstates the mean by e^{½σ²T} (Monte Carlo, common random numbers)", () => {
    for (const c of key.bug) {
      const r = rng(7);
      const n = 40000;
      let good = 0,
        bad = 0;
      for (let k = 0; k < n; k++) {
        const { W } = brownianPath(1, 1, r);
        good += gbmTerminal(100, 0.1, c.sigma, 1, W[1]);
        bad += gbmTerminalNoCorrection(100, 0.1, c.sigma, 1, W[1]);
      }
      const base = gbmMean(100, 0.1, 1);
      expect(good / n / base).toBeCloseTo(1, 1);
      expect(bad / n / base).toBeCloseTo(c.factor, 1);
    }
  });

  it("Itô drift and diffusion for x², ln x, eˣ, √x", () => {
    const { a, b, x } = key.ito;
    expect(itoDrift(0, 2 * x, 2, a, b)).toBeCloseTo(key.ito.x2.drift, 10);
    expect(itoDiffusion(2 * x, b)).toBeCloseTo(key.ito.x2.diff, 10);
    expect(itoDrift(0, 1 / x, -1 / (x * x), a, b)).toBeCloseTo(key.ito.lnx.drift, 10);
    expect(itoDrift(0, Math.exp(x), Math.exp(x), a, b)).toBeCloseTo(key.ito.expx.drift, 10);
    expect(itoDrift(0, 0.5 / Math.sqrt(x), -0.25 * Math.pow(x, -1.5), a, b)).toBeCloseTo(key.ito.sqrtx.drift, 10);
  });

  it("Mel's 98.76 is B4's number", () => {
    expect(100 * Math.exp(logDrift(0, 0.01) * 250)).toBeCloseTo(key.mel.median, 6);
    expect(key.mel.median).toBeCloseTo(98.76, 2);
  });
});
