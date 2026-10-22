import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-A1.json";
import { betainc, lnGamma, lognormal, moments, onceInYears, studentT, tailTwoSidedNormal, tailTwoSidedT } from "./distributions";

const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

describe("lognormal", () => {
  it("pdf, cdf and moments match scipy", () => {
    for (const r of key.lognormal) {
      expect(close(lognormal.mean(r.mu, r.sigma), r.mean)).toBe(true);
      expect(close(lognormal.median(r.mu), r.median)).toBe(true);
      expect(close(lognormal.mode(r.mu, r.sigma), r.mode)).toBe(true);
      expect(close(lognormal.variance(r.mu, r.sigma), r.var, 1e-8)).toBe(true);
      expect(close(lognormal.skewness(r.sigma), r.skew, 1e-8)).toBe(true);
      for (const [y, v] of r.pdf) expect(close(lognormal.pdf(y, r.mu, r.sigma), v, 1e-9)).toBe(true);
      for (const [y, v] of r.cdf) expect(close(lognormal.cdf(y, r.mu, r.sigma), v, 1e-9)).toBe(true);
    }
  });
});

describe("special functions", () => {
  it("lnGamma and betainc match scipy", () => {
    for (const r of key.lngamma) expect(close(lnGamma(r.z), r.v, 1e-10)).toBe(true);
    for (const r of key.betainc) expect(close(betainc(r.a, r.b, r.x), r.v, 1e-9)).toBe(true);
  });
});

describe("Student-t", () => {
  it("pdf and cdf match scipy for nu in 1.5..30", () => {
    for (const r of key.t) {
      for (const [x, v] of r.pdf) expect(close(studentT.pdf(x, r.nu), v, 1e-9)).toBe(true);
      for (const [x, v] of r.cdf) expect(close(studentT.cdf(x, r.nu), v, 1e-8)).toBe(true);
      if (r.var !== null) expect(close(studentT.variance(r.nu), r.var)).toBe(true);
      else expect(studentT.variance(r.nu)).toBe(Infinity);
    }
  });
  it("k-sigma tail probabilities and once-in-N-years readings match", () => {
    for (const [k, r] of Object.entries(key.tails)) {
      const kk = Number(k);
      expect(close(tailTwoSidedNormal(kk), r.normal, 1e-8)).toBe(true);
      expect(close(onceInYears(tailTwoSidedNormal(kk)), r.normal_years, 1e-7)).toBe(true);
      for (const nu of [3, 4, 5, 10]) {
        expect(close(tailTwoSidedT(kk, nu), (r as Record<string, number>)[`t${nu}`], 1e-7)).toBe(true);
      }
    }
    // the headline numbers in the chapter
    expect(onceInYears(tailTwoSidedNormal(4))).toBeCloseTo(62.65, 1);
    expect(onceInYears(tailTwoSidedNormal(5))).toBeCloseTo(6921.7, 0);
  });
});

describe("volatility drag and sample moments", () => {
  it("±1% coin for 250 days: median factor 0.98758, mean 1", () => {
    expect(close(Math.pow(0.9999, 125), key.drag.median_factor)).toBe(true);
    expect(close(125 * Math.log(0.9999), key.drag.log_median)).toBe(true);
  });
  it("skewness and kurtosis match scipy's biased estimators", () => {
    const m = moments(key.moments.xs);
    expect(close(m.mean, key.moments.mean)).toBe(true);
    expect(close(m.sd, key.moments.sd)).toBe(true);
    expect(close(m.skewness, key.moments.skew, 1e-9)).toBe(true);
    expect(close(m.kurtosis, key.moments.kurt, 1e-9)).toBe(true);
  });
});

import { rng, tSample } from "./random";
describe("t sampler", () => {
  it("has roughly the right spread for nu = 5 and heavier tails than normal", () => {
    const r = rng(11);
    let s2 = 0;
    let big = 0;
    const n = 40000;
    for (let i = 0; i < n; i++) {
      const x = tSample(5, r);
      s2 += x * x;
      if (Math.abs(x) > 4) big++;
    }
    expect(Math.abs(s2 / n - 5 / 3)).toBeLessThan(0.1);
    expect(big / n).toBeGreaterThan(0.004); // normal would give ~6e-5 at 4 (t5 at x=4 standard ≈ 1%)
  });
});
