import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-D2.json";
import c1 from "./__fixtures__/key-C1C2.json";
import c3 from "./__fixtures__/key-C3C4.json";
import data from "../data/nifty50-long.json";
import { butterfly, density, fitSmile, forwardVol, interpolateSurface, smileVol, tailBelow, tailCounts, tentProbability } from "./smile";

const F = 22603, r = 0.065, T = 11 / 365;
const strikes = c1.nse.strikes as number[];
const calls = c1.nse.calls as number[];
const fit = fitSmile(F, [...strikes, ...strikes], [...c3.strip.call_iv, ...c3.strip.put_iv]);

describe("D2 — the smile fitted in log-moneyness", () => {
  it("matches the key's quadratic and sits within 0.4 vol points of every dot", () => {
    expect(fit.a).toBeCloseTo(key.fit.a, 8);
    expect(fit.b).toBeCloseTo(key.fit.b, 6);
    expect(fit.c).toBeCloseTo(key.fit.c, 4);
    expect(fit.rmsVolPts).toBeCloseTo(key.fit.rms_vol_pts, 6);
    expect(key.fit.max_abs_vol_pts).toBeLessThan(0.5);
    expect(smileVol(fit, F, 22250)).toBeCloseTo(key.fit.sigma_22250, 8);
    expect(smileVol(fit, F, 23050)).toBeCloseTo(key.fit.sigma_23050, 8);
    expect(smileVol(fit, F, 22250)).toBeGreaterThan(smileVol(fit, F, 23050));
  });
});

describe("D2 — butterflies as probabilities", () => {
  it("the raw screen: six of fifteen call tents priced below zero; the 22,550/22,600/22,650 tent costs ₹3.70", () => {
    let neg = 0;
    key.raw_butterflies.rows.forEach((row, i) => {
      const fly = butterfly(calls[i], calls[i + 1], calls[i + 2]);
      expect(fly).toBeCloseTo(row.call_fly, 8);
      if (fly < 0) neg++;
      expect(tentProbability(fly, 50, r, T)).toBeCloseTo(row.prob_within_25, 8);
    });
    expect(neg).toBe(key.raw_butterflies.negative_calls);
    expect(neg).toBe(6);
    expect(key.raw_butterflies.tent_22600.cost).toBeCloseTo(3.7, 6);
  });
  it("the smoothed density is non-negative, integrates to about one, and matches the key point by point", () => {
    for (let K = 22000; K <= 23200; K += 10) expect(density(fit, { F, K, r, T })).toBeGreaterThanOrEqual(0);
    for (const [K, v] of Object.entries(key.density_points)) {
      expect(density(fit, { F, K: Number(K), r, T }) * 50).toBeCloseTo(v.smile, 8);
      expect(density(fit, { F, K: Number(K), r, T }, 5, key.density.flat_sigma) * 50).toBeCloseTo(v.bell, 8);
    }
    let total = 0;
    for (let K = 18000; K < 28000; K += 2) total += density(fit, { F, K, r, T }) * 2;
    expect(total).toBeCloseTo(key.mass.total_18000_28000, 6);
    expect(Math.abs(total - 1)).toBeLessThan(0.02);
    expect(density(fit, { F, K: 22600, r, T }) * 100).toBeCloseTo(key.mass.tent_22600_smile, 8);
  });
  it("tails from the put curve: the smile and the flat bell", () => {
    for (const [K, v] of Object.entries(key.tails)) {
      expect(tailBelow(fit, { F, K: Number(K), r, T })).toBeCloseTo(v.smile, 8);
      expect(tailBelow(fit, { F, K: Number(K), r, T }, 5, key.density.flat_sigma)).toBeCloseTo(v.bell, 8);
    }
    expect(key.tails["21500"].smile).toBeGreaterThan(key.tails["21500"].bell);
    expect(key.tails["22000"].put_smile).toBeGreaterThan(key.tails["22000"].put_bell);
  });
  it("the kink dial: the 22,600/22,650/22,700 tent costs zero at C(22,650) = 225.575", () => {
    const [lo, hi] = key.kink.neighbours;
    expect(butterfly(lo, key.kink.zero_at, hi)).toBeCloseTo(0, 10);
    // the printed screen already has the kink: at 226.55 the tent costs −1.95 (stale LTPs); below 225.58 it is green again
    expect(butterfly(lo, key.kink.screen, hi)).toBeLessThan(0);
    expect(butterfly(lo, 224, hi)).toBeGreaterThan(0);
  });
});

describe("D2 — the record and the textbook", () => {
  it("NIFTY's daily moves: the tails the bell does not have", () => {
    const rs = (data as { returns: { r: number }[] }).returns.map((x) => x.r);
    for (const z of [2, 3, 4]) {
      const t = tailCounts(rs, z);
      const k = (key.record.tails as Record<string, { down: number; up: number; bell_each: number }>)[String(z)];
      expect(t.down).toBe(k.down);
      expect(t.up).toBe(k.up);
      expect(t.bellEach).toBeCloseTo(k.bell_each, 6);
    }
    expect(tailCounts(rs, 4).down + tailCounts(rs, 4).up).toBeGreaterThan(10);
  });
  it("Hull: Example 15.1, Table 15.3's frown, Table 15.2's interpolation, variances add", () => {
    expect(key.hull_15_1.iv_call).toBeCloseTo(0.145, 3);
    expect(key.hull_15_1.iv_put).toBeCloseTo(key.hull_15_1.iv_call, 8);
    key.hull_15_3.iv.forEach((v, i) => expect(100 * v).toBeCloseTo(key.hull_15_3.book_iv[i], i === 0 ? 0 : 1));
    const h = key.hull_15_2;
    expect(interpolateSurface(h.strikes, h.T, h.vols, 1.05, 0.75)).toBeCloseTo(13.7, 1);
    expect(forwardVol(0.12, 1 / 12, 0.12, 0.25)).toBeCloseTo(0.12, 10);
    expect(forwardVol(0.142, 1 / 12, 0.14, 0.25)).toBeLessThan(0.14);
  });
});
