import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-G1.json";
import record from "../data/nifty50-long.json";
import { crossValidate, ewmaAbsForecast, fitK, foldRanges, lagDesign, meanOf, mseOfConstant, polyFit, ridge } from "./learning";

const closes = record.rows.map((r) => r.c);
const returns = record.returns.map((r) => r.r);
const K = key.meta.K;
const train = lagDesign(returns, K, K, 2000);
const test = lagDesign(returns, K, 2000, returns.length);
const small = lagDesign(returns, K, 2000 - 250, 2000);

describe("G1 — Figure 0: a polynomial through the last sixty closes", () => {
  const end = closes.length - key.fig0.ahead.n;
  const seg = closes.slice(end - key.fig0.window.n, end);
  const fut = closes.slice(end);
  it("the window and the twenty days after it are the key's", () => {
    expect(seg).toEqual(key.fig0.closes);
    expect(fut).toEqual(key.fig0.future);
    expect(fut[fut.length - 1]).toBe(key.fig0.ahead.last_close);
  });
  it("degrees 1, 5 and 15 reproduce the in-sample miss, the twenty-day miss and the 3 November reading", () => {
    for (const row of key.fig0.rows) {
      const f = polyFit(seg, fut, row.degree);
      const tol = row.degree >= 12 ? 1e-5 : 1e-7; // normal equations at degree 15 are ill-conditioned; the page prints these to two figures
      expect(Math.abs(f.rmseIn - row.rmse_in) / row.rmse_in).toBeLessThan(tol);
      expect(Math.abs(f.rmseOut - row.rmse_out) / row.rmse_out).toBeLessThan(tol);
      expect(Math.abs(f.day20 - row.day20) / Math.abs(row.day20)).toBeLessThan(tol);
    }
    const d1 = polyFit(seg, fut, 1);
    const d15 = polyFit(seg, fut, 15);
    expect(d15.rmseIn).toBeLessThan(d1.rmseIn / 4); // the fit gets better…
    expect(d15.rmseOut).toBeGreaterThan(1e7); // …and the forecast collapses
    expect(d15.day20).toBeGreaterThan(1e8);
    expect(Math.abs(d1.day20 - key.fig0.ahead.last_close)).toBeLessThan(1200);
  });
});

describe("G1 — Figure 1: tomorrow's move size from the last k sizes", () => {
  it("the training and test windows and the mean-guess errors are the key's", () => {
    expect(train.y.length).toBe(key.fig1.train.n);
    expect(test.y.length).toBe(key.fig1.test.n);
    const m = meanOf(train.y);
    expect(m).toBeCloseTo(key.fig1.train.mean, 10);
    expect(mseOfConstant(train.y, m)).toBeCloseTo(key.fig1.train.mse_mean, 10);
    expect(mseOfConstant(test.y, m)).toBeCloseTo(key.fig1.test.mse_mean, 10);
  });
  it("the k-curve: training error falls for ever, test error bottoms at four lags and is back to guessing at sixty", () => {
    let prevTrain = Infinity;
    for (const row of key.fig1.full) {
      const f = fitK(train, test, row.k);
      expect(f.train).toBeCloseTo(row.train, 8);
      expect(f.test).toBeCloseTo(row.test, 8);
      expect(f.train).toBeLessThanOrEqual(prevTrain + 1e-12);
      prevTrain = f.train;
    }
    const best = key.fig1.full.reduce((a, b) => (b.test < a.test ? b : a));
    expect(best.k).toBe(4);
    expect(key.fig1.best_k_full).toBe(4);
    expect(Math.abs(key.fig1.full[K - 1].test - key.fig1.test.mse_mean)).toBeLessThan(0.001);
  });
  it("on 250 training days sixty lags are a quarter worse than guessing", () => {
    for (const row of key.fig1.small_curve.filter((r) => [1, 4, 10, 30, 60].includes(r.k))) {
      const f = fitK(small, test, row.k);
      expect(f.train).toBeCloseTo(row.train, 8);
      expect(f.test).toBeCloseTo(row.test, 8);
    }
    expect(key.fig1.small_curve[K - 1].test / key.fig1.small.mse_mean_test).toBeGreaterThan(1.25);
  });
  it("A5's EWMA forecast of the move size is the benchmark line", () => {
    const e = ewmaAbsForecast(returns);
    let s = 0;
    for (let t = 2000; t < returns.length; t++) s += (test.y[t - 2000] - e[t]) ** 2;
    expect(s / test.y.length).toBeCloseTo(key.fig1.ewma.test, 8);
  });
});

describe("G1 — Figure 2: the leash (ridge on sixty lags)", () => {
  it("the λ path reproduces the key: errors, negative coefficients, the sum of the bars", () => {
    for (const row of key.fig2.rows) {
      const b = ridge(train.X, train.y, row.lam);
      b.forEach((c, i) => expect(c).toBeCloseTo(row.coef[i], 7));
      const f = fitK(train, test, K, row.lam);
      expect(f.test).toBeCloseTo(row.test, 8);
      expect(Array.from(b.slice(1)).filter((c) => c < 0).length).toBe(row.negatives);
    }
    expect(key.fig2.named["0"].negatives).toBe(25);
    expect(key.fig2.named["100000"].negatives).toBe(0);
  });
  it("the best λ on the grid comes within 0.003 of the best hand-picked k, and far below λ = 0", () => {
    const bestLam = key.fig2.rows.reduce((a, b) => (b.test < a.test ? b : a));
    const bestK = key.fig1.full.reduce((a, b) => (b.test < a.test ? b : a));
    expect(bestLam.lam).toBeCloseTo(key.fig2.best_lam, 8);
    expect(bestLam.test - bestK.test).toBeLessThan(0.003);
    expect(key.fig2.named["0"].test - bestLam.test).toBeGreaterThan(0.02);
  });
});

describe("G1 — Figure 3: five contiguous folds", () => {
  it("the folds are numpy's array_split and carry the key's dates", () => {
    const ranges = foldRanges(train.y.length, 5);
    ranges.forEach(([lo, hi], i) => {
      expect(hi - lo).toBe(key.fig3.folds[i].n);
      expect(record.returns[K + lo].d).toBe(key.fig3.folds[i].start);
      expect(record.returns[K + hi - 1].d).toBe(key.fig3.folds[i].end);
    });
  });
  it("the CV curves over k and λ reproduce the key; the 2019–20 fold dominates", () => {
    for (const row of key.fig3.cv_k.filter((r) => [1, 4, 9, 10, 20, 60].includes(r.k))) {
      const c = crossValidate(train, row.k, 0);
      expect(c.cv).toBeCloseTo(row.cv, 8);
      c.perFold.forEach((v, i) => expect(v).toBeCloseTo(row.per_fold[i], 8));
    }
    for (const row of key.fig3.cv_lam) expect(crossValidate(train, K, row.lam).cv).toBeCloseTo(row.cv, 8);
    const pf = key.fig3.per_fold_k10;
    expect(Math.max(...pf)).toBe(pf[2]);
    expect(pf[2]).toBeGreaterThan(2.5 * Math.max(...pf.filter((_, i) => i !== 2)));
  });
  it("CV's λ and the test's λ both beat λ = 0 by a wide margin; CV picked without touching the test set", () => {
    const cvBest = key.fig3.cv_lam.reduce((a, b) => (b.cv < a.cv ? b : a));
    expect(cvBest.lam).toBeCloseTo(key.fig3.best_cv_lam, 8);
    expect(fitK(train, test, K, cvBest.lam).test).toBeCloseTo(key.fig3.test_at_cv_lam, 8);
    expect(key.fig3.test_at_lam0 - key.fig3.test_at_cv_lam).toBeGreaterThan(0.02);
    expect(key.fig3.best_test_lam).toBeGreaterThan(cvBest.lam); // the test set would have pulled a little harder
    expect(key.fig3.best_cv_k).toBe(9);
  });
});
