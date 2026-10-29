import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-A5.json";
import nifty from "../data/nifty50-long.json";
import { rng } from "./random";
import {
  acf,
  chi2Cdf,
  ewmaStep,
  ewmaVariance,
  ewmaWeights,
  ewmaWindow,
  garchFit,
  garchForecast,
  garchLogLikelihood,
  garchLongRun,
  garchStep,
  garchTermStructure,
  garchVariance,
  garchWeights,
  halfLife,
  likelihoodTerm,
  ljungBox,
  meanSquare,
  realisedVariance,
  shuffle,
  standardise,
} from "./volatility";

const niftyReturns: number[] = (nifty as { returns: Array<{ d: string; r: number }> }).returns.map((x) => x.r);
const sim: number[] = key.sim.returns;

describe("A5 volatility engine vs Hull worked examples", () => {
  it("Example 17.1 (p. 375): EWMA step λ = 0.90, 1 %, 2 % → 0.00013, σ = 1.14 %", () => {
    const k = key.hull_17_1;
    const s2 = ewmaStep(k.sigma_prev ** 2, k.u_prev, k.lam);
    expect(s2).toBeCloseTo(k.sigma2, 12);
    expect(s2).toBeCloseTo(0.00013, 12);
    expect(Math.sqrt(s2)).toBeCloseTo(k.sigma_text, 4);
  });

  it("acadifi check: λ = 0.94, 0.000324, −2.3 % → 0.000337 (1.835 %)", () => {
    const k = key.ewma_acadifi;
    const s2 = ewmaStep(k.sigma2_prev, k.u_prev, k.lam);
    expect(s2).toBeCloseTo(k.sigma2, 12);
    expect(Math.sqrt(s2)).toBeCloseTo(0.01835, 4);
  });

  it("EWMA half-life 11.20 d at 0.94, 22.76 d at 0.97; effective window 16.7; weights sum to 1", () => {
    for (const r of key.ewma_half_life) {
      expect(halfLife(r.lam)).toBeCloseTo(r.half_life, 10);
      expect(ewmaWindow(r.lam)).toBeCloseTo(r.window, 10);
    }
    expect(halfLife(0.94)).toBeCloseTo(11.2, 1);
    expect(halfLife(0.97)).toBeCloseTo(22.76, 1);
    expect(ewmaWindow(0.94)).toBeCloseTo(16.67, 1);
    const w = ewmaWeights(0.94, 2000);
    expect(w[0]).toBeCloseTo(0.06, 12);
    expect(w.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 10);
  });

  it("Example 17.2 (pp. 376–377): γ = 0.01, V_L = 0.0002 (1.4 %), step → 0.00023516, σ = 1.53 %", () => {
    const k = key.hull_17_2;
    expect(1 - k.alpha - k.beta).toBeCloseTo(k.gamma, 10);
    const VL = garchLongRun(k.omega, k.alpha, k.beta);
    expect(VL).toBeCloseTo(k.VL, 12);
    expect(VL).toBeCloseTo(0.0002, 10);
    expect(Math.sqrt(VL)).toBeCloseTo(k.VL_vol_text, 3);
    const s2 = garchStep(k.sigma_prev ** 2, k.u_prev, k.omega, k.alpha, k.beta);
    expect(s2).toBeCloseTo(k.sigma2, 14);
    expect(s2).toBeCloseTo(0.00023516, 10);
    expect(Math.sqrt(s2)).toBeCloseTo(k.sigma_text, 3);
  });

  it("O'Connell check: ω = 2e-6, α = 0.08, β = 0.90, σ² = 0.0004, r = −3 % → 0.000434 (2.08 %); V_L = 0.0001; half-life 34.3 d", () => {
    const k = key.garch_oconnell;
    const s2 = garchStep(k.sigma2_prev, k.u_prev, k.omega, k.alpha, k.beta);
    expect(s2).toBeCloseTo(k.sigma2, 14);
    expect(s2).toBeCloseTo(0.000434, 6);
    expect(Math.sqrt(s2)).toBeCloseTo(0.0208, 3);
    expect(garchLongRun(k.omega, k.alpha, k.beta)).toBeCloseTo(k.VL, 12);
    expect(halfLife(k.alpha + k.beta)).toBeCloseTo(k.half_life, 10);
    expect(halfLife(0.98)).toBeCloseTo(34.3, 1);
    // GARCH weights α β^{i−1} (p. 377)
    const w = garchWeights(0.08, 0.9, 3);
    expect(w).toEqual([0.08, 0.08 * 0.9, 0.08 * 0.9 * 0.9]);
  });

  it("Tsay eq. 3.18 (p. 118): unconditional variance from the coefficients (book prints 0.00314)", () => {
    const k = key.tsay_3_18;
    const VL = garchLongRun(k.omega, k.alpha, k.beta);
    expect(VL).toBeCloseTo(k.VL, 12);
    expect(Math.abs(VL - 0.00314)).toBeLessThan(0.00002);
  });

  it("Table 17.1 (p. 380): per-day likelihood term −ln v − u²/v on the seven printed rows", () => {
    for (const r of key.hull_table_17_1) {
      const t = likelihoodTerm(r.u, r.v);
      expect(t).toBeCloseTo(r.term, 12);
      expect(t).toBeCloseTo(r.term_text, 3);
    }
  });

  it("Yen optimum (p. 380): V_L = 0.00004422, 0.665 %/day", () => {
    const k = key.hull_yen_optimum;
    const VL = garchLongRun(k.omega, k.alpha, k.beta);
    expect(VL).toBeCloseTo(k.VL, 14);
    expect(VL).toBeCloseTo(k.VL_text, 8);
    expect(Math.sqrt(VL)).toBeCloseTo(k.vol_daily_text, 5);
  });

  it("Forecast (p. 383): σ_n² = 0.00006 → 0.00005473 at 10 d (0.74 %), 0.00004449 at 100 d (0.67 %)", () => {
    const k = key.hull_forecast;
    const f = garchForecast(k.sigma2_now, k.omega, k.alpha, k.beta, 100);
    expect(f[0]).toBeCloseTo(k.h1, 14);
    expect(f[9]).toBeCloseTo(k.h10, 14);
    expect(f[99]).toBeCloseTo(k.h100, 14);
    expect(f[9]).toBeCloseTo(k.h10_text, 8);
    expect(f[99]).toBeCloseTo(k.h100_text, 8);
    expect(Math.sqrt(f[9])).toBeCloseTo(k.vol10_text, 4);
    expect(Math.sqrt(f[99])).toBeCloseTo(k.vol100_text, 4);
  });

  it("Table 17.3 (p. 384): term structure 10/30/50/100/500 d → 12.03/11.61/11.35/11.01/10.65 %; 10-day average 0.00005745", () => {
    const k = key.hull_table_17_3;
    const f = key.hull_forecast;
    const ts = garchTermStructure(f.sigma2_now, f.omega, f.alpha, f.beta, [10, 30, 50, 100, 500]);
    ts.forEach((row, i) => {
      expect(row.days).toBe(k.rows[i].days);
      expect(row.avgVariance).toBeCloseTo(k.rows[i].avg_variance, 14);
      expect(row.volAnnual).toBeCloseTo(k.rows[i].vol_annual, 12);
      expect(row.volAnnual).toBeCloseTo(k.vol_text[i], 4);
    });
    expect(ts[0].avgVariance).toBeCloseTo(k.avg10_text, 8);
  });

  it("Table 17.4 (p. 385): after 12.30 → 13.30 %, 10-day average 0.00006597 → 12.89 %; increases 0.86/0.64/0.48/0.28/0.06 %", () => {
    const k = key.hull_table_17_4;
    const f = key.hull_forecast;
    const base = garchTermStructure(f.sigma2_now, f.omega, f.alpha, f.beta, [10, 30, 50, 100, 500]);
    const up = garchTermStructure(k.sigma2_up, f.omega, f.alpha, f.beta, [10, 30, 50, 100, 500]);
    expect(up[0].avgVariance).toBeCloseTo(k.avg10_text, 8);
    expect(up[0].volAnnual).toBeCloseTo(k.vol10_text, 4);
    up.forEach((row, i) => {
      const inc = row.volAnnual - base[i].volAnnual;
      expect(inc).toBeCloseTo(k.increase[i], 12);
      expect(Math.abs(inc - k.increase_text[i])).toBeLessThan(0.0001);
    });
  });
});

describe("A5 volatility engine vs the simulated GARCH key (ω = 2e-6, α = 0.08, β = 0.90, T = 2000)", () => {
  const k = key.sim;

  it("EWMA path (λ = 0.94): seed, first 10 values and last value exact", () => {
    const e = ewmaVariance(sim, k.ewma_lambda);
    expect(e.length).toBe(sim.length + 1);
    expect(e[0]).toBeCloseTo(k.ewma_seed, 16);
    expect(meanSquare(sim)).toBeCloseTo(k.ewma_seed, 16);
    for (let i = 0; i < 10; i++) expect(e[i]).toBeCloseTo(k.ewma_first10[i], 16);
    expect(e[e.length - 1]).toBeCloseTo(k.ewma_last, 16);
  });

  it("GARCH path at the true parameters: first 10 values and last value exact", () => {
    const g = garchVariance(sim, k.omega, k.alpha, k.beta);
    for (let i = 0; i < 10; i++) expect(g[i]).toBeCloseTo(k.garch_first10[i], 16);
    expect(g[g.length - 1]).toBeCloseTo(k.garch_last, 16);
  });

  it("log-likelihood at the true parameters, long-run variance and vol", () => {
    expect(garchLogLikelihood(sim, k.omega, k.alpha, k.beta)).toBeCloseTo(k.ll_true, 6);
    const VL = garchLongRun(k.omega, k.alpha, k.beta);
    expect(VL).toBeCloseTo(k.VL, 14);
    expect(Math.sqrt(VL)).toBeCloseTo(k.VL_vol_daily, 12);
    expect(Math.sqrt(252 * VL)).toBeCloseTo(k.VL_vol_annual, 12);
  });

  it("forecasts at h = 1, 10, 100 and the term structure for 10/30/50/100/500 days", () => {
    const f = garchForecast(k.forecast.sigma2_now, k.omega, k.alpha, k.beta, 100);
    expect(f[0]).toBeCloseTo(k.forecast.h1, 16);
    expect(f[9]).toBeCloseTo(k.forecast.h10, 16);
    expect(f[99]).toBeCloseTo(k.forecast.h100, 16);
    const ts = garchTermStructure(k.forecast.sigma2_now, k.omega, k.alpha, k.beta, [10, 30, 50, 100, 500]);
    ts.forEach((row, i) => {
      expect(row.avgVariance).toBeCloseTo(k.term_structure[i].avg_variance, 16);
      expect(row.volAnnual).toBeCloseTo(k.term_structure[i].vol_annual, 14);
    });
  });

  it("realised 25-day variance matches numpy's rolling mean of squares", () => {
    const rv = realisedVariance(sim, 25);
    expect(Number.isNaN(rv[23])).toBe(true);
    expect(rv[24]).toBeCloseTo(k.realised25.first, 16);
    expect(rv[100]).toBeCloseTo(k.realised25.at100, 16);
    expect(rv[rv.length - 1]).toBeCloseTo(k.realised25.last, 16);
  });

  it("garchFit recovers the parameters (±0.03, storyboard) and matches the scipy optimum under the same convention", () => {
    const fit = garchFit(sim);
    expect(Math.abs(fit.alpha - k.alpha)).toBeLessThan(0.03);
    expect(Math.abs(fit.beta - k.beta)).toBeLessThan(0.03);
    expect(fit.logLikelihood).toBeGreaterThanOrEqual(k.ll_true);
    // same convention as scipy's Nelder–Mead: tight
    expect(fit.logLikelihood).toBeCloseTo(k.fit_own.ll, 2);
    expect(Math.abs(fit.alpha / k.fit_own.alpha - 1)).toBeLessThan(0.02);
    expect(Math.abs(fit.beta / k.fit_own.beta - 1)).toBeLessThan(0.02);
    expect(Math.abs(fit.omega / k.fit_own.omega - 1)).toBeLessThan(0.05);
    // arch package (different backcast): 20 % relative
    expect(Math.abs(fit.alpha / k.fit_arch.alpha - 1)).toBeLessThan(0.2);
    expect(Math.abs(fit.beta / k.fit_arch.beta - 1)).toBeLessThan(0.2);
    expect(Math.abs(fit.omega / k.fit_arch.omega - 1)).toBeLessThan(0.2);
  });
});

describe("A5 volatility engine on the real NIFTY 50 returns (2016 → Oct 2026)", () => {
  const k = key.nifty;

  it("2,679 returns; sd 1.02 %/day", () => {
    expect(niftyReturns.length).toBe(k.n);
    expect(niftyReturns.length).toBe(2679);
    expect(meanSquare(niftyReturns)).toBeCloseTo(k.mean_sq, 16);
    expect(k.sd_daily).toBeCloseTo(0.0102, 3);
  });

  it("autocorrelation of r and r² at lags 1..5 (lag-1: −0.034 vs 0.199)", () => {
    const ar = acf(niftyReturns, 5);
    const ar2 = acf(niftyReturns.map((v) => v * v), 5);
    for (let i = 0; i < 5; i++) {
      expect(ar[i]).toBeCloseTo(k.acf_r[i], 10);
      expect(ar2[i]).toBeCloseTo(k.acf_r2[i], 10);
    }
    expect(ar[0]).toBeCloseTo(-0.034, 3);
    expect(ar2[0]).toBeCloseTo(0.199, 3);
  });

  it("Ljung–Box at 20 lags on r and on r² match statsmodels; r² is an order of magnitude larger", () => {
    const lb = ljungBox(niftyReturns, 20);
    const lb2 = ljungBox(niftyReturns.map((v) => v * v), 20);
    expect(lb.stat).toBeCloseTo(k.ljung_box_r.stat, 8);
    expect(lb2.stat).toBeCloseTo(k.ljung_box_r2.stat, 6);
    expect(lb.pValue).toBeCloseTo(k.ljung_box_r.p, 12);
    expect(lb2.pValue).toBeCloseTo(k.ljung_box_r2.p, 12);
    expect(lb2.stat / lb.stat).toBeGreaterThan(10);
  });

  it("EWMA(0.94) and GARCH paths on NIFTY: last and peak values", () => {
    const e = ewmaVariance(niftyReturns, 0.94);
    expect(e[e.length - 1]).toBeCloseTo(k.ewma94_last, 16);
    expect(Math.max(...e)).toBeCloseTo(k.ewma94_max, 16);
    expect(Math.sqrt(k.ewma94_max)).toBeCloseTo(0.0488, 3); // storyboard: EWMA peak 4.88 % (23 Mar 2020)
    const g = garchVariance(niftyReturns, k.fit_own.omega, k.fit_own.alpha, k.fit_own.beta);
    expect(g[g.length - 1]).toBeCloseTo(k.garch_last, 16);
    expect(Math.max(...g)).toBeCloseTo(k.garch_max, 16);
    const rv = realisedVariance(niftyReturns, 250);
    expect(rv[rv.length - 1]).toBeCloseTo(k.realised250_last, 16);
  });

  it("garchFit on NIFTY: within 20 % of arch and LL within 0.5 of the key's optimum (actually far tighter)", () => {
    const fit = garchFit(niftyReturns);
    expect(fit.logLikelihood).toBeGreaterThanOrEqual(k.ll_at_arch_params - 0.5);
    expect(fit.logLikelihood).toBeGreaterThanOrEqual(k.fit_own.ll - 0.5);
    expect(fit.logLikelihood).toBeCloseTo(k.fit_own.ll, 2);
    for (const p of ["omega", "alpha", "beta"] as const) {
      expect(Math.abs(fit[p] / k.fit_arch[p] - 1)).toBeLessThan(0.2);
      expect(Math.abs(fit[p] / k.fit_own[p] - 1)).toBeLessThan(0.02);
    }
    expect(garchLogLikelihood(niftyReturns, k.fit_arch.omega, k.fit_arch.alpha, k.fit_arch.beta)).toBeCloseTo(k.ll_at_arch_params, 6);
    expect(Math.sqrt(252 * fit.longRunVariance)).toBeCloseTo(k.VL_vol_annual, 2);
    expect(fit.alpha + fit.beta).toBeLessThan(1);
  });

  it("standardised squares pass Ljung–Box after the fit (Hull p. 382 pattern: 1937 → ~23, cut-off 31.4 at 20 lags)", () => {
    const g = garchVariance(niftyReturns, k.fit_own.omega, k.fit_own.alpha, k.fit_own.beta);
    const z = standardise(niftyReturns, g);
    const lb = ljungBox(z.map((v) => v * v), 20);
    expect(lb.stat).toBeCloseTo(k.ljung_box_std2.stat, 6);
    expect(lb.pValue).toBeCloseTo(k.ljung_box_std2.p, 8);
    expect(lb.stat).toBeLessThan(31.41);
    expect(chi2Cdf(31.41, 20)).toBeCloseTo(0.95, 3);
    expect(chi2Cdf(25.0, 15)).toBeCloseTo(0.95, 2); // Hull's 95 % cut-off "25" at k = 15
  });

  it("shuffle: Fisher–Yates is deterministic with the project rng, keeps the multiset, and kills the clustering", () => {
    const a = shuffle(niftyReturns, rng(7));
    const b = shuffle(niftyReturns, rng(7));
    expect(a).toEqual(b);
    expect(a).not.toEqual(niftyReturns);
    expect(a.length).toBe(niftyReturns.length);
    expect([...a].sort()).toEqual([...niftyReturns].sort());
    expect(meanSquare(a)).toBeCloseTo(meanSquare(niftyReturns), 14);
    const lb2 = ljungBox(a.map((v) => v * v), 20);
    expect(lb2.stat).toBeLessThan(60); // real: ~1937
    expect(shuffle([1, 2, 3], rng(1))).toHaveLength(3);
  });
});
