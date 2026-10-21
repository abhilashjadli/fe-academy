import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-0.1.json";
import { cdf, pdf, quantile } from "./normal";
import { bsCall } from "./blackscholes";
import { FUNCTIONS, bsCurve, partialSums, taylor } from "./taylor";

const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

describe("normal", () => {
  it("matches the Python answer key", () => {
    for (const row of key.normal) {
      expect(close(pdf(row.x), row.pdf, 1e-12)).toBe(true);
      expect(close(cdf(row.x), row.cdf, 1e-12)).toBe(true);
    }
  });
  it("quantile inverts cdf", () => {
    for (const p of [0.001, 0.025, 0.1, 0.5, 0.8413, 0.975, 0.999]) expect(close(cdf(quantile(p)), p, 1e-10)).toBe(true);
  });
});

describe("Black-Scholes call", () => {
  it("matches the answer key (incl. Hull's S=42 K=40 example ≈ 4.76)", () => {
    for (const row of key.bs) {
      const c = bsCall({ S: row.S, K: row.K, r: row.r, sigma: row.sigma, T: row.T });
      expect(close(c.price, row.price, 1e-10)).toBe(true);
      expect(close(c.delta, row.delta, 1e-10)).toBe(true);
      expect(close(c.gamma, row.gamma, 1e-10)).toBe(true);
      expect(close(c.speed, row.speed, 1e-9)).toBe(true);
    }
    const hull = bsCall({ S: 42, K: 40, r: 0.1, sigma: 0.2, T: 0.5 });
    expect(hull.price).toBeCloseTo(4.76, 2);
  });
  it("analytic Greeks agree with finite differences", () => {
    const p = { S: 100, K: 100, r: 0.05, sigma: 0.2, T: 1 };
    const h = 1e-3;
    const f = (S: number) => bsCall({ ...p, S }).price;
    const c = bsCall(p);
    expect(close((f(100 + h) - f(100 - h)) / (2 * h), c.delta, 1e-6)).toBe(true);
    expect(close((f(100 + h) - 2 * f(100) + f(100 - h)) / (h * h), c.gamma, 1e-4)).toBe(true);
    const g = (S: number) => bsCall({ ...p, S }).gamma;
    expect(close((g(100 + h) - g(100 - h)) / (2 * h), c.speed, 1e-5)).toBe(true);
  });
  it("is non-decreasing in volatility and bounded below by intrinsic value", () => {
    let last = -Infinity;
    for (const sigma of [0.05, 0.1, 0.2, 0.4, 0.8]) {
      const v = bsCall({ S: 100, K: 100, r: 0.05, sigma, T: 1 }).price;
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
    expect(bsCall({ S: 150, K: 100, r: 0.05, sigma: 0.2, T: 1 }).price).toBeGreaterThan(50);
  });
});

describe("Taylor polynomials", () => {
  it("match the answer key for cos, exp, ln, sqrt(1+x) at several centres", () => {
    for (const row of key.taylor) {
      const f = FUNCTIONS[row.fn];
      expect(close(taylor(f, row.n, row.a, row.x), row.value, 1e-10)).toBe(true);
    }
  });
  it("cos(0.1) ≈ 1 − 0.005 with P2", () => {
    expect(taylor(FUNCTIONS.cos, 2, 0, 0.1)).toBeCloseTo(0.995, 12);
    expect(Math.abs(Math.cos(0.1) - 0.995)).toBeLessThan(5e-6);
  });
  it("partial sums of e at x=1 match", () => {
    const s = partialSums(FUNCTIONS.exp, 9, 0, 1);
    key.exp_partial_sums_at_1.forEach((v, i) => expect(close(s[i], v, 1e-12)).toBe(true));
  });
  it("ln series converges at 1.5 and diverges at 2.5", () => {
    const s15 = partialSums(FUNCTIONS.ln, 12, 1, 1.5);
    const s25 = partialSums(FUNCTIONS.ln, 12, 1, 2.5);
    key.ln_partial_sums["1.5"].forEach((v, i) => expect(close(s15[i + 1], v, 1e-10)).toBe(true));
    key.ln_partial_sums["2.5"].forEach((v, i) => expect(close(s25[i + 1], v, 1e-10)).toBe(true));
    expect(Math.abs(s15[12] - Math.log(1.5))).toBeLessThan(2e-3);
    expect(Math.abs(s25[12] - Math.log(2.5))).toBeGreaterThan(1);
  });
  it("error of P_n scales like (x-a)^(n+1) for exp", () => {
    const f = FUNCTIONS.exp;
    for (const n of [0, 1, 2]) {
      const e1 = Math.abs(Math.exp(0.2) - taylor(f, n, 0, 0.2));
      const e2 = Math.abs(Math.exp(0.1) - taylor(f, n, 0, 0.1));
      const slope = Math.log(e1 / e2) / Math.log(2);
      expect(Math.abs(slope - (n + 1))).toBeLessThan(0.15);
    }
  });
  it("Black-Scholes ladder: Δ-only, Δ+½Γ, +speed, exact", () => {
    const f = bsCurve();
    for (const row of key.bs_ladder) {
      expect(close(taylor(f, 1, 100, 100 + row.dS) - f.deriv(0, 100), row.first, 1e-9)).toBe(true);
      expect(close(taylor(f, 2, 100, 100 + row.dS) - f.deriv(0, 100), row.second, 1e-9)).toBe(true);
      expect(close(taylor(f, 3, 100, 100 + row.dS) - f.deriv(0, 100), row.third, 1e-9)).toBe(true);
      expect(close(f.deriv(0, 100 + row.dS) - f.deriv(0, 100), row.exact, 1e-9)).toBe(true);
    }
  });
});
