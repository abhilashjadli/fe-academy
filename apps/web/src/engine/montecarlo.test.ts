import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-E2.json";
import { black76 } from "./bs";
import {
  antithetic,
  asianControl,
  asianPaths,
  bootstrapQuantileSd,
  controlVariate,
  estimate,
  exactCall,
  experiment,
  geometricAsian,
  logLogSlope,
  mcVaR,
  normals,
  piDarts,
  quantileSeNormal,
  rhoSpot,
  straddlePayoff,
  type Chain,
  type TwoFactorBook,
} from "./montecarlo";
import { quantile } from "./normal";

const c: Chain = key.chain;

describe("E2 — the generator is the key's generator", () => {
  it("the first five normals of seed 1 agree to 1e-12", () => {
    const z = normals(1, 5);
    key.seeded.first_normals.forEach((v, i) => expect(z[i]).toBeCloseTo(v, 12));
  });
});

describe("E2 — the cloud wobbles", () => {
  it("every seeded re-roll (20 seeds × 2,000 dots) reproduces the key's price and SE", () => {
    for (const r of key.rerolls) {
      const e = experiment(c, r.seed, r.n);
      expect(e.mean).toBeCloseTo(r.price, 7);
      expect(e.se).toBeCloseTo(r.se, 7);
    }
  });
  it("19 of the 20 re-rolls land inside their own ±1.96 SE of the true 249.15", () => {
    const truth = black76({ F: c.F, K: c.K, r: c.r, sigma: c.sigma, T: c.T });
    expect(truth).toBeCloseTo(key.exact.call, 8);
    const inside = key.rerolls.filter((r) => Math.abs(experiment(c, r.seed, r.n).mean - truth) <= 1.96 * r.se).length;
    expect(inside).toBe(key.inside_95);
  });
  it("the exact payoff sd is 369.4, so 2,000 dots give ±8.3; the ladder's log-log slope is −0.5", () => {
    const ex = exactCall(c);
    expect(ex.mean).toBeCloseTo(key.exact.call, 3);
    expect(ex.sd).toBeCloseTo(key.exact.sd_payoff, 2);
    expect(ex.sd / Math.sqrt(2000)).toBeCloseTo(key.exact.se_2000, 3);
    const ses = key.ladder.map((l) => experiment(c, l.seed, l.n).se);
    key.ladder.forEach((l, i) => expect(ses[i]).toBeCloseTo(l.se, 6));
    const slope = logLogSlope(
      key.ladder.map((l) => l.n),
      ses,
    );
    expect(slope).toBeCloseTo(key.ladder_slope, 6);
    expect(Math.abs(slope + 0.5)).toBeLessThan(0.05);
  });
});

describe("E2 — the mirror and the control", () => {
  it("antithetic helps the call (ratio 1.8 exact, 2.0 at seed 1) and hurts the straddle (0.5)", () => {
    const ex = exactCall(c);
    expect(ex.antiRatio).toBeCloseTo(key.exact.anti_ratio_call, 3);
    expect(ex.straddleAntiRatio).toBeCloseTo(key.exact.anti_ratio_straddle, 3);
    expect(ex.straddleAntiRatio).toBeLessThan(1);
    const a = antithetic(c, 1, 2000);
    expect(a.mean).toBeCloseTo(key.seeded.antithetic.price, 7);
    expect(a.se).toBeCloseTo(key.seeded.antithetic.se, 7);
    expect(a.ratio).toBeCloseTo(key.seeded.antithetic.ratio, 7);
    const s = antithetic(c, 1, 2000, straddlePayoff);
    expect(s.ratio).toBeCloseTo(key.seeded.straddle.ratio, 7);
    expect(s.se).toBeCloseTo(key.seeded.straddle.anti_se, 7);
    expect(s.se).toBeGreaterThan(s.plainSe);
  });
  it("the stock as control variate removes 74 % of the variance at the money", () => {
    const ex = exactCall(c);
    expect(ex.rho).toBeCloseTo(key.exact.cv_rho, 3);
    expect(ex.rho ** 2).toBeCloseTo(key.exact.cv_rho2, 3);
    const cv = controlVariate(c, 1, 2000);
    expect(cv.mean).toBeCloseTo(key.seeded.control.price, 7);
    expect(cv.se).toBeCloseTo(key.seeded.control.se, 7);
    expect(cv.b).toBeCloseTo(key.seeded.control.b, 7);
    expect(cv.se).toBeLessThan(cv.plainSe * 0.55);
  });
  it("Glasserman Table 4.1 to the printed three decimals, and the chain's own fade with strike", () => {
    const g = key.glasserman41;
    g.rows.forEach((row, i) => {
      const rho = rhoSpot(g.S0, g.sigma, g.r, g.T, row.K);
      expect(rho).toBeCloseTo(row.rho, 4);
      expect(Math.abs(rho - g.book_rho[i])).toBeLessThanOrEqual(0.0011);
    });
    const r2 = key.chain_rho.map((x) => x.rho2);
    for (let i = 1; i < r2.length; i++) expect(r2[i]).toBeLessThan(r2[i - 1]);
  });
});

describe("E2 — the Asian what-if on the real dates", () => {
  const A = key.asian;
  it("seven real fixings, average 23,063.33, payoff 463.33; the geometric closed form 168.20", () => {
    expect(A.real_closes.length).toBe(7);
    const avg = A.real_closes.reduce((a, b) => a + b, 0) / 7;
    expect(avg).toBeCloseTo(A.real_avg, 8);
    expect(Math.max(avg - A.K, 0)).toBeCloseTo(A.real_payoff, 8);
    const g = geometricAsian(c, A.t);
    expect(g.price).toBeCloseTo(A.geo_closed, 8);
    expect(g.vG).toBeCloseTo(A.vG, 12);
  });
  it("the seeded 2,000-path run matches the key exactly; the control collapses the band; the Asian is cheaper than the call", () => {
    const run = asianPaths(c, A.t, A.seeded.seed, A.seeded.n);
    A.seeded.first_path.forEach((v, i) => expect(run.paths[0][i]).toBeCloseTo(v, 6));
    const a = estimate(run.payArith);
    expect(a.mean).toBeCloseTo(A.seeded.arith, 6);
    expect(a.se).toBeCloseTo(A.seeded.arith_se, 6);
    expect(estimate(run.payGeo).mean).toBeCloseTo(A.seeded.geo, 6);
    const cv = asianControl(run, A.geo_closed);
    expect(cv.b).toBeCloseTo(A.seeded.b, 6);
    expect(cv.mean).toBeCloseTo(A.seeded.cv, 6);
    expect(cv.se).toBeCloseTo(A.seeded.cv_se, 6);
    expect(cv.ratio).toBeGreaterThan(1e4);
    expect(Math.abs(cv.mean - A.reference.cv)).toBeLessThan(3 * Math.max(cv.se, A.reference.cv_se));
    expect(A.reference.arith).toBeLessThan(A.european);
    expect(estimate(run.arith).sd).toBeCloseTo(A.seeded.average_sd, 6);
    expect(estimate(run.arith).sd).toBeLessThan(A.seeded.endpoint_sd);
  });
});

describe("E2 — Hull §18.7 and the dartboard", () => {
  it("stratified values for n = 4; the twelve-uniform normal's kurtosis; π's standard error", () => {
    key.hull.stratified4.forEach((v, i) => expect(quantile((i + 0.5) / 4)).toBeCloseTo(v, 10));
    expect(key.hull.twelve_uniform.kurtosis).toBeCloseTo(2.9, 10);
    const d = piDarts(3, 10000);
    expect(Math.abs(d.estimate - Math.PI)).toBeLessThan(4 * key.pi.se_10k);
    expect(d.se).toBeCloseTo(key.pi.se_10k, 2);
  });
});

describe("E2 — Monte Carlo VaR on Raj's book", () => {
  const M = key.mcvar;
  const b: TwoFactorBook = { ...c, short: M.short, sigDay: M.sig_day, volRelSd: M.vol_rel_sd };
  it("the seeded 5,000-tomorrow runs reproduce the key's VaR and ES exactly, for every hedge and correlation", () => {
    for (const g of M.grid) {
      const v = mcVaR(b, g.seed, g.n, g.rho, g.h, g.vol_moves);
      expect(v.var).toBeCloseTo(g.var99, 4);
      expect(v.es).toBeCloseTo(g.es99, 4);
      g.first_pnl.forEach((p, i) => expect(v.pnl[i]).toBeCloseTo(p, 4));
    }
    const f = mcVaR(b, M.frozen.seed, M.frozen.n, 0, M.frozen.h, false);
    expect(f.var).toBeCloseTo(M.frozen.var99, 4);
  });
  it("the error bar on a 1 % quantile from 5,000 draws is about ±5 %; correlation moves the hedged book by a few percent only", () => {
    const v = mcVaR(b, M.corr.seed, M.corr.n, M.corr.rho, M.corr.h);
    const sd = bootstrapQuantileSd(v.pnl, 0.01, 11);
    expect(sd / v.var).toBeGreaterThan(0.025);
    expect(sd / v.var).toBeLessThan(0.08);
    expect(Math.abs(sd / v.var - M.corr.boot_rel)).toBeLessThan(0.02);
    const hedged = M.grid.filter((g) => g.h === M.hedge).map((g) => g.var99);
    expect((Math.max(...hedged) - Math.min(...hedged)) / Math.min(...hedged)).toBeLessThan(0.05);
    const naked = M.grid.filter((g) => g.h === 0);
    expect(naked[0].var99).toBeLessThan(naked[2].var99); // the unhedged short call feels the sign of the correlation
    // for a plain bell the 1 % quantile from 5,000 draws carries ±2.3 %; the book's quadratic tail roughly doubles it
    const bell = quantileSeNormal(1, 0.01, 5000) / quantile(0.99);
    expect(bell).toBeCloseTo(0.0227, 3);
    expect(sd / v.var).toBeGreaterThan(bell);
  });
});
