import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-A4.json";
import { ar1, ar1Acf, ar1Stationary, dickeyFuller, forecastAr1, halfLife, sampleAcf, DF_CRIT_5 } from "./timeseries";
import { rng } from "./random";

describe("A4 time-series engine vs statsmodels key", () => {
  it("AR(1) stationary mean and variance (QuantEcon check: 1.0 and 1.316)", () => {
    for (const c of key.stationary) {
      const s = ar1Stationary(c.phi, c.sigma, c.c)!;
      expect(s.mean).toBeCloseTo(c.mean, 10);
      expect(s.variance).toBeCloseTo(c.variance, 10);
    }
    expect(ar1Stationary(0.9, 0.5, 0.1)!.variance).toBeCloseTo(1.316, 3);
    expect(ar1Stationary(1, 1)).toBeNull();
  });

  it("theoretical ACF φ^k and half-life", () => {
    const a = ar1Acf(key.acf_theory.phi, 10);
    for (let i = 0; i < 10; i++) expect(a[i]).toBeCloseTo(key.acf_theory.acf[i], 12);
    expect(halfLife(0.8)).toBeCloseTo(key.acf_theory.half_life, 10);
  });

  it("sample ACF matches statsmodels on a fixed series", () => {
    const a = sampleAcf(key.sample.x, 10);
    for (let i = 0; i < 10; i++) expect(a[i]).toBeCloseTo(key.sample.acf[i], 6);
  });

  it("Dickey–Fuller regression: γ, t and the critical value", () => {
    for (const name of ["df_mr", "df_rw", "df_near"] as const) {
      const k = key[name];
      const d = dickeyFuller(k.y);
      expect(d.gamma).toBeCloseTo(k.gamma, 8);
      expect(d.t).toBeCloseTo(k.t, 6);
      expect(d.t).toBeCloseTo(k.adf_stat, 6);
      expect(d.a).toBeCloseTo(k.a, 8);
    }
    expect(Math.abs(DF_CRIT_5 - key.df_rw.crit["5%"])).toBeLessThan(0.02);
    // the verdicts: the bowl is rejected as a random walk, the walk is not, the near-unit-root case fools the test too
    expect(dickeyFuller(key.df_mr.y).t).toBeLessThan(DF_CRIT_5);
    expect(dickeyFuller(key.df_rw.y).t).toBeGreaterThan(DF_CRIT_5);
    expect(dickeyFuller(key.df_near.y).t).toBeGreaterThan(DF_CRIT_5);
  });

  it("forecasts: AR(1) decays toward the mean; random walk stays put", () => {
    const f = forecastAr1(key.forecast.last, key.forecast.phi, key.forecast.c, key.forecast.h);
    for (let i = 0; i < 5; i++) expect(f[i]).toBeCloseTo(key.forecast.ar1[i], 10);
    const rw = forecastAr1(2, 1, 0, 5);
    for (const v of rw) expect(v).toBe(2);
  });

  it("simulated AR(1) has the right stationary spread", () => {
    const x = ar1(20000, 0.9, 1, rng(3));
    const m = x.reduce((s, v) => s + v, 0) / x.length;
    const v = x.reduce((s, q) => s + (q - m) ** 2, 0) / x.length;
    expect(v).toBeCloseTo(1 / (1 - 0.81), 0);
  });
});
