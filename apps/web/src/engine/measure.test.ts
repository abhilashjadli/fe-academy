import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-B5B6.json";
import {
  brownianFromPrice,
  exactMeans,
  finiteTilt,
  finiteTiltFromReturn,
  girsanovDrift,
  girsanovShift,
  lognormalQuantiles,
  marketPriceOfRisk,
  priceUnderEveryBelief,
  radonNikodym,
  reweight,
  tailProbabilities,
  tiltWeight,
  tiltWeightParams,
  type GBMWorld,
} from "./measure";
import { oneStep } from "./binomial";

const k = key as typeof key;
const hull = { S0: 20, u: 1.1, d: 0.9, K: 21, r: 0.12, T: 0.25 };
const world: GBMWorld = { S0: 100, mu: 0.09, sigma: 0.2, r: 0.04, T: 1 };

describe("B5 the finite tilt on Hull's tree vs key (Shreve (5.2.4)–(5.2.5))", () => {
  it("Z(up) = 0.9265, Z(down) = 1.1750, E_q[Z] = 1, and e^{−rT}E_q[Z·payoff] = 0.633", () => {
    const f = k.finite_tilt;
    const t = finiteTiltFromReturn(hull, f.mu);
    expect(t.p).toBeCloseTo(f.p, 12);
    expect(t.q).toBeCloseTo(f.q, 12);
    expect(t.Zup).toBeCloseTo(f.Z_up, 12);
    expect(t.Zdown).toBeCloseTo(f.Z_down, 12);
    expect(t.Zup).toBeCloseTo(0.9265, 4);
    expect(t.Zdown).toBeCloseTo(1.175, 4);
    expect(t.EqZ).toBeCloseTo(1, 12);
    expect(t.priceViaZ).toBeCloseTo(f.f_via_Z, 12);
    expect(t.priceViaZ).toBeCloseTo(t.price, 12);
    expect(t.priceViaZ).toBeCloseTo(0.633, 3);
    // Hull's one-step numbers come through unchanged
    const s = oneStep(hull);
    expect(s.delta).toBe(f.delta);
    expect(s.portfolio).toBe(f.portfolio);
    expect(s.pv).toBeCloseTo(f.pv, 12);
  });

  it("the price is the same for every belief in (0, 1)", () => {
    const prices = priceUnderEveryBelief(hull, k.finite_tilt.beliefs);
    for (const p of prices) expect(p).toBeCloseTo(k.finite_tilt.f, 12);
    for (const q of [0.01, 0.2, 0.5, 0.99]) {
      const t = finiteTilt(hull, q);
      expect(t.EqZ).toBeCloseTo(1, 12);
      expect(t.priceViaZ).toBeCloseTo(t.price, 12);
    }
  });

  it("range toggle 23/17: Δ = 1/3, f = 1.168 — the range, not the belief, moved the price", () => {
    const r = k.finite_tilt.range_23_17;
    const s = oneStep({ ...hull, u: 1.15, d: 0.85 });
    expect(s.delta).toBeCloseTo(r.delta, 12);
    expect(s.f).toBeCloseTo(r.f, 12);
    expect(Math.abs(s.f - 1.168)).toBeLessThan(1e-3);
  });

  it("riskhub's tree 100 → 125/80, r = 4 %: q = 0.53514, call 12.854 (Q) vs 15.613 (p = 0.65), put 8.933 vs 6.726", () => {
    const rt = k.riskhub_tree;
    const call = oneStep({ S0: 100, u: 1.25, d: 0.8, K: 100, r: 0.04, T: 1 });
    expect(call.p).toBeCloseTo(rt.q, 12);
    expect(call.p).toBeCloseTo(0.53514, 5);
    expect(call.f).toBeCloseTo(rt.call_Q, 12);
    expect(call.f).toBeCloseTo(12.854, 3);
    const put = oneStep({ S0: 100, u: 1.25, d: 0.8, K: 100, r: 0.04, T: 1, kind: "put" });
    expect(put.f).toBeCloseTo(rt.put_Q, 12);
    expect(put.f).toBeCloseTo(8.933, 3);
    const naiveCall = Math.exp(-0.04) * (rt.p_real * call.fu + (1 - rt.p_real) * call.fd);
    const naivePut = Math.exp(-0.04) * (rt.p_real * put.fu + (1 - rt.p_real) * put.fd);
    expect(naiveCall).toBeCloseTo(rt.call_P, 12);
    expect(naiveCall).toBeCloseTo(15.613, 3);
    expect(naivePut).toBeCloseTo(6.726, 3);
    // and the finite tilt at p = 0.65 brings the naive numbers back to the Q prices
    expect(finiteTilt({ S0: 100, u: 1.25, d: 0.8, K: 100, r: 0.04, T: 1 }, rt.p_real).priceViaZ).toBeCloseTo(call.f, 12);
  });

  it("Wilmott: 100 → 103/98 gives Δ = 0.6, price 1.2; 100 → 101/99 gives ½, ½ (r = 0)", () => {
    const a = oneStep({ S0: 100, u: 1.03, d: 0.98, K: 100, r: 0, T: 1 });
    expect(a.delta).toBeCloseTo(k.wilmott.a.delta, 12);
    expect(a.f).toBeCloseTo(k.wilmott.a.price, 12);
    expect(a.f).toBeCloseTo(1.2, 10);
    const b = oneStep({ S0: 100, u: 1.01, d: 0.99, K: 100, r: 0, T: 1 });
    expect(b.delta).toBeCloseTo(0.5, 12);
    expect(b.f).toBeCloseTo(0.5, 12);
  });
});

describe("B5 the continuous tilt vs key (riskhub: S0 = 100, μ = 9 %, σ = 20 %, r = 4 %, T = 1)", () => {
  it("θ = 0.25; weight 1.0579 · (S_T/100)^{−1.25}: 1.40 at 80, 1.06 at 100, 0.80 at 125", () => {
    const c = k.continuous;
    const theta = marketPriceOfRisk(world);
    expect(theta).toBeCloseTo(c.theta, 12);
    expect(theta).toBeCloseTo(0.25, 12);
    const prm = tiltWeightParams(world, theta);
    expect(prm.c).toBeCloseTo(c.weight_const, 12);
    expect(prm.c).toBeCloseTo(1.0579, 4);
    expect(prm.exponent).toBeCloseTo(-1.25, 12);
    for (const w of c.weight_at) expect(tiltWeight(world, theta, w.S)).toBeCloseTo(w.w, 12);
    expect(tiltWeight(world, theta, 80)).toBeCloseTo(1.4, 2);
    expect(tiltWeight(world, theta, 100)).toBeCloseTo(1.06, 2);
    expect(tiltWeight(world, theta, 125)).toBeCloseTo(0.8, 2);
    // the weight is the same Z = exp(−θW_T − ½θ²T) written in S_T
    for (const S of [60, 80, 100, 125, 160]) expect(tiltWeight(world, theta, S)).toBeCloseTo(radonNikodym(theta, brownianFromPrice(world, S), world.T), 12);
  });

  it("closed forms: E_P[e^{−rT}S_T] = 105.13, E_Q = 100; call 13.33 (P) vs 9.925 (Q = BS); P(S_T < 80) 7.14 % vs 11.20 %", () => {
    const c = k.continuous;
    const m = exactMeans(world, 100);
    expect(m.discountedMeanP).toBeCloseTo(c.E_P_disc, 10);
    expect(m.discountedMeanP).toBeCloseTo(105.13, 2);
    expect(m.discountedMeanQ).toBe(100);
    expect(m.callQ).toBeCloseTo(c.bs_call, 8);
    expect(m.callQ).toBeCloseTo(9.925, 3);
    expect(m.callP).toBeCloseTo(c.call_P_disc, 8);
    expect(m.callP).toBeCloseTo(13.33, 2);
    const t = tailProbabilities(world, 80);
    expect(t.P).toBeCloseTo(c.P_below_80, 8);
    expect(t.Q).toBeCloseTo(c.Q_below_80, 8);
    expect(t.P).toBeCloseTo(0.0714, 4);
    expect(t.Q).toBeCloseTo(0.112, 3);
  });

  it("2,000 equally likely futures: the exact lognormal quantiles match the key", () => {
    const q = k.quantiles;
    const f = lognormalQuantiles(world, q.n);
    expect(f.length).toBe(2000);
    q.first5.forEach((v, i) => expect(f[i]).toBeCloseTo(v, 6));
    q.last5.forEach((v, i) => expect(f[1995 + i]).toBeCloseTo(v, 6));
    expect((f[999] + f[1000]) / 2).toBeCloseTo(q.median, 6);
    for (let i = 1; i < f.length; i++) expect(f[i]).toBeGreaterThan(f[i - 1]);
  });

  it("same futures, different weights: needle 105.13 at θ = 0 → 100.00 at θ = 0.25; call 13.33 → 9.93; P(S_T < 80) 7.15 % → 11.22 %; spread stays 0.20", () => {
    const f = lognormalQuantiles(world, k.quantiles.n);
    for (const row of k.quantiles.rows) {
      const r = reweight(world, f, row.theta, 100, 80);
      let sum = 0;
      for (const w of r.weights) sum += w;
      expect(sum).toBeCloseTo(1, 12);
      expect(r.rawMean).toBeCloseTo(row.raw_mean_weight, 8);
      expect(r.rawMean).toBeCloseTo(1, 3);
      expect(r.discountedMean).toBeCloseTo(row.disc_mean, 6);
      expect(r.call).toBeCloseTo(row.call, 6);
      expect(r.pBelow).toBeCloseTo(row.p_below_80, 8);
      expect(r.logSd).toBeCloseTo(row.log_sd, 8);
      expect(r.logSd).toBeCloseTo(0.2, 2);
      expect(r.impliedDrift).toBeCloseTo(girsanovDrift(world.mu, world.sigma, row.theta), 3);
    }
    const at0 = reweight(world, f, 0, 100, 80);
    expect(at0.discountedMean).toBeCloseTo(105.13, 2);
    expect(at0.call).toBeCloseTo(13.33, 2);
    const at025 = reweight(world, f, 0.25, 100, 80);
    expect(at025.discountedMean).toBeCloseTo(100, 2);
    expect(at025.call).toBeCloseTo(9.925, 2);
    expect(at025.call).toBeCloseTo(exactMeans(world, 100).callQ, 2);
    expect(at025.pBelow).toBeCloseTo(0.112, 2);
    // θ = 0.25 is the only θ on a fine sweep where the needle sits on 100 (a fair bet)
    let best = 0,
      bestGap = Infinity;
    for (let th = 0; th <= 0.5; th += 0.01) {
      const gap = Math.abs(reweight(world, f, th, 100).discountedMean - 100);
      if (gap < bestGap) {
        bestGap = gap;
        best = th;
      }
    }
    expect(best).toBeCloseTo(0.25, 10);
  });

  it("Girsanov: the drift goes μ → μ − σθ (r at θ = 0.25); W̃ = W + θt; Z_T at W_T", () => {
    const g = k.girsanov;
    g.thetas.forEach((th, i) => expect(girsanovDrift(g.mu, g.sigma, th)).toBeCloseTo(g.drifts[i], 12));
    expect(girsanovDrift(0.09, 0.2, 0.25)).toBeCloseTo(0.04, 12);
    girsanovShift(g.t, g.W, 0.25).forEach((v, i) => expect(v).toBeCloseTo(g.W_tilde_025[i], 12));
    g.thetas.forEach((th, i) => expect(radonNikodym(th, g.W[g.W.length - 1], 1)).toBeCloseTo(g.Z_T_at_W1[i], 12));
  });
});
