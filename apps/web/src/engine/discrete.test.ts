import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-0.2.json";
import { binomialPmf, choose, die, normalTailAtLeast, pascalRow, pmfMean, pmfTailAtLeast, pmfVariance, standardise, sumOf } from "./discrete";
import { rng, sampleIndex } from "./random";
import { cdf } from "./normal";

const close = (a: number, b: number, tol = 1e-10) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

describe("counting", () => {
  it("choose and Pascal rows match the answer key", () => {
    for (const r of key.choose) expect(close(choose(r.n, r.k), r.v, 1e-12)).toBe(true);
    for (const [n, row] of Object.entries(key.pascal)) expect(pascalRow(Number(n))).toEqual(row);
  });
});

describe("binomial", () => {
  it("pmf, mean and variance match", () => {
    for (const r of key.binomial) {
      const pmf = binomialPmf(r.n, r.p);
      pmf.forEach((v, k) => expect(close(v, r.pmf[k], 1e-9)).toBe(true));
      const d = { x0: 0, p: pmf };
      expect(close(pmfMean(d), r.mean, 1e-9)).toBe(true);
      expect(close(pmfVariance(d), r.var, 1e-9)).toBe(true);
    }
  });
  it("coins n=100: P(k ≥ 60) exact 2.84% vs normal 2.87%", () => {
    const d = { x0: 0, p: binomialPmf(100, 0.5) };
    expect(close(pmfTailAtLeast(d, 60), key.coins100.p_ge_60_exact, 1e-9)).toBe(true);
    expect(close(normalTailAtLeast(60, 50, 5), key.coins100.p_ge_60_normal_cc, 1e-9)).toBe(true);
  });
});

describe("sums of dice", () => {
  const fair = die([1, 1, 1, 1, 1, 1]);
  const skew = die([6, 5, 4, 3, 2, 1]);
  it("convolution matches the key for fair and skewed dice, n = 1..50", () => {
    for (const r of key.dice) {
      const s = sumOf(r.die === "fair" ? fair : skew, r.n);
      expect(s.x0).toBe(r.x0);
      expect(s.p.length).toBe(r.p.length);
      s.p.forEach((v, i) => expect(close(v, r.p[i], 1e-9)).toBe(true));
      expect(close(pmfMean(s), r.mean, 1e-9)).toBe(true);
      expect(close(pmfVariance(s), r.var, 1e-9)).toBe(true);
    }
  });
  it("100 fair dice: mean 350, sd 17.08, P(>400) ≈ 0.16%, 95% band holds ≈ 95% of mass", () => {
    const s = sumOf(fair, 100);
    expect(close(pmfMean(s), 350, 1e-9)).toBe(true);
    expect(close(Math.sqrt(pmfVariance(s)), key.dice100.sd, 1e-9)).toBe(true);
    expect(close(pmfTailAtLeast(s, 401), key.dice100.p_gt_400_exact, 1e-9)).toBe(true);
    expect(close(normalTailAtLeast(401, 350, key.dice100.sd), key.dice100.p_gt_400_normal_cc, 1e-9)).toBe(true);
    expect(close(key.dice100.mass_in_band, 0.95, 0.01)).toBe(true);
  });
  it("standardised sums converge to the standard normal density", () => {
    const s = sumOf(skew, 50);
    const bars = standardise(s);
    const near0 = bars.reduce((best, b) => (Math.abs(b.z) < Math.abs(best.z) ? b : best));
    expect(Math.abs(near0.density - 0.3989)).toBeLessThan(0.01);
  });
  it("68–95–99.7", () => {
    [1, 2, 3].forEach((z, i) => expect(close(2 * cdf(z) - 1, key.rule[i], 1e-9)).toBe(true));
  });
});

describe("seeded rng", () => {
  it("is deterministic and roughly uniform", () => {
    const a = rng(42),
      b = rng(42);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
    const r = rng(7);
    let s = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) s += r();
    expect(Math.abs(s / n - 0.5)).toBeLessThan(0.01);
  });
  it("sampleIndex follows the weights", () => {
    const r = rng(3);
    const counts = [0, 0, 0];
    for (let i = 0; i < 30000; i++) counts[sampleIndex([1, 2, 7], r())]++;
    expect(Math.abs(counts[2] / 30000 - 0.7)).toBeLessThan(0.01);
  });
});
