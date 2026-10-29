import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-C1C2.json";
import {
  americanDominates,
  beliefDemonstrator,
  binomialSum,
  binomialTree,
  bsPrice,
  convergence,
  crrParameters,
  crrPrice,
  crrTree,
  earlyExercisePremium,
  hedgeMeter,
  impliedDiscountRate,
  mispricingProfit,
  noArbitrageOk,
  oddEvenAverage,
  oneStep,
  realWorldProbability,
  terminalProbabilities,
} from "./binomial";
import { putCallParity } from "./options";

const k = key as typeof key;
const hull = { S0: 20, u: 1.1, d: 0.9, K: 21, r: 0.12, T: 0.25 };

describe("C2 one-step replication vs key (Hull pp. 201–205)", () => {
  it("Δ = 0.25, portfolio 4.5, PV 4.367, f = 0.633, p = 0.6523", () => {
    const o = k.one_step;
    const s = oneStep(hull);
    expect(s.delta).toBeCloseTo(o.delta, 12);
    expect(s.portfolio).toBeCloseTo(o.portfolio, 12);
    expect(s.pv).toBeCloseTo(o.pv, 12);
    expect(s.f).toBeCloseTo(o.f, 12);
    expect(s.p).toBeCloseTo(o.p, 12);
    expect(s.fRiskNeutral).toBeCloseTo(s.f, 12);
    expect(s.delta).toBe(0.25);
    expect(s.portfolio).toBe(4.5);
    expect(s.pv).toBeCloseTo(4.367, 3);
    expect(s.f).toBeCloseTo(0.633, 3);
    expect(s.p).toBeCloseTo(0.6523, 4);
    expect(1 - s.p).toBeCloseTo(0.3477, 4);
    expect(s.expectedStockUnderP).toBeCloseTo(o.E_ST_under_p, 12);
    expect(s.expectedStockUnderP).toBeCloseTo(20 * Math.exp(0.03), 12);
  });

  it("real world: q = 0.7041 at 16 %, the option's implied discount rate 42.6 %; selling at 0.70 pockets 0.067", () => {
    const o = k.one_step;
    const s = oneStep(hull);
    const q = realWorldProbability(hull.u, hull.d, o.mu, hull.T);
    expect(q).toBeCloseTo(o.q, 12);
    expect(q).toBeCloseTo(0.7041, 4);
    const r = impliedDiscountRate(s, q, hull.T);
    expect(r.expectedPayoff).toBeCloseTo(o.expected_payoff_real, 12);
    expect(r.rate).toBeCloseTo(o.implied_rate, 12);
    expect(r.rate).toBeCloseTo(0.426, 3);
    expect(mispricingProfit(s, 0.7).profit).toBeCloseTo(o.arbitrage, 12);
    expect(mispricingProfit(s, 0.7).action).toBe("sell the option");
    expect(mispricingProfit(s, 0.7).profit).toBeCloseTo(0.067, 3);
  });

  it("price does not depend on p: the replication price is the same number at every belief; the naive number is not", () => {
    const o = k.one_step;
    const rows = beliefDemonstrator(hull, o.beliefs);
    rows.forEach((row, i) => {
      expect(row.replication).toBe(rows[0].replication);
      expect(row.replication).toBeCloseTo(o.f, 12);
      expect(row.naive).toBeCloseTo(o.naive_prices[i], 12);
    });
    expect(Math.max(...rows.map((r) => r.naive)) - Math.min(...rows.map((r) => r.naive))).toBeGreaterThan(0.5);
    // only the risk-neutral belief makes the naive number agree
    const agree = rows.filter((r) => Math.abs(r.naive - r.replication) < 1e-4);
    expect(agree.length).toBe(1);
    expect(agree[0].belief).toBeCloseTo(0.6523, 4);
  });

  it("hedge meter: Δ shares and −PV cash reproduce the payoff in both states; 0.5 shares does not", () => {
    const h = k.hedge_meter;
    const m = hedgeMeter(hull, h.h, h.cash);
    expect(m.up).toBeCloseTo(h.up, 10);
    expect(m.down).toBeCloseTo(h.down, 10);
    expect(m.gapUp).toBeCloseTo(0, 10);
    expect(m.gapDown).toBeCloseTo(0, 10);
    expect(m.cost).toBeCloseTo(h.cost, 10);
    expect(m.cost).toBeCloseTo(0.633, 3);
    const w = hedgeMeter(hull, h.wrong.h, h.wrong.cash);
    expect(w.up).toBeCloseTo(h.wrong.up, 10);
    expect(w.down).toBeCloseTo(h.wrong.down, 10);
    expect(w.spread).toBeGreaterThan(0.5);
  });

  it("the range toggle 23/17: Δ = 1/3, f = 1.168; and the tree must satisfy d < e^{rT} < u", () => {
    const rt = k.one_step.range_23_17;
    const s = oneStep({ ...hull, u: rt.u, d: rt.d });
    expect(s.delta).toBeCloseTo(rt.delta, 12);
    expect(s.f).toBeCloseTo(rt.f, 12);
    expect(Math.abs(s.f - 1.168)).toBeLessThan(1e-3);
    expect(noArbitrageOk(1.1, 0.9, 0.12, 0.25)).toBe(true);
    expect(noArbitrageOk(1.02, 0.9, 0.12, 0.25)).toBe(false);
    expect(() => oneStep({ ...hull, u: 1.02 })).toThrow(/arbitrage/);
  });

  it("Wilmott's one day (pp. 263–274): r = 0 gives Δ = ½, value ½; r = 0.1 gives p′ = 0.5198, value 0.5196", () => {
    const w = k.one_step.wilmott;
    const s0 = oneStep({ S0: 100, u: 1.01, d: 0.99, K: 100, r: 0, T: w.dt });
    expect(s0.delta).toBeCloseTo(0.5, 12);
    expect(s0.f).toBeCloseTo(0.5, 12);
    expect(s0.p).toBeCloseTo(0.5, 12);
    expect(w.p_prime).toBeCloseTo(0.51984, 3);
    expect(w.value).toBeCloseTo(0.51963, 3);
    const s1 = oneStep({ S0: 100, u: 1.01, d: 0.99, K: 100, r: 0.1, T: w.dt });
    expect(s1.p).toBeCloseTo(w.p_prime, 3);
    expect(s1.f).toBeCloseTo(w.value, 3);
  });
});

describe("C2 two-step trees vs key (Hull pp. 206–209)", () => {
  it("call: terminal 3.2/0/0, node B 2.0257, A 1.2823 (book) — exact 2.0256 / 1.2822; Δ 0.5064; 0.7273 / 0", () => {
    const c = k.two_step.call;
    const t = binomialTree({ S0: 20, K: 21, r: 0.12, dt: 0.25, steps: 2, u: 1.1, d: 0.9 });
    expect(t.p).toBeCloseTo(c.p, 12);
    t.V[2].forEach((v, j) => expect(v).toBeCloseTo(c.V[2][j], 12));
    expect(t.V[1][0]).toBeCloseTo(c.V[1][0], 12);
    expect(t.V[0][0]).toBeCloseTo(c.V[0][0], 12);
    expect(t.V[1][0]).toBeCloseTo(k.two_step.hull_printed.call_B, 3);
    expect(t.price).toBeCloseTo(k.two_step.hull_printed.call_A, 3);
    expect(t.delta[0][0]).toBeCloseTo(c.delta[0][0], 12);
    expect(t.delta[0][0]).toBeCloseTo(0.5064, 4);
    expect(t.delta[1][0]).toBeCloseTo(0.7273, 4);
    expect(t.delta[1][1]).toBe(0);
    // the binomial sum (10.8) gives the same root; terminal probabilities 0.4255 / 0.4536 / 0.1209
    expect(binomialSum(t, 0.12)).toBeCloseTo(t.price, 12);
    terminalProbabilities(t.p, 2).forEach((p, j) => expect(p).toBeCloseTo(c.terminal_probs[j], 12));
    expect(terminalProbabilities(t.p, 2)[0]).toBeCloseTo(0.4255, 4);
    expect(terminalProbabilities(t.p, 2).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });

  it("put S = 50, K = 52, ±20 %, r = 5 %: p = 0.6282; B 1.4147; C 9.4636; root 4.1923", () => {
    const p = k.two_step.put;
    const t = binomialTree({ S0: 50, K: 52, r: 0.05, dt: 1, steps: 2, u: 1.2, d: 0.8, kind: "put" });
    expect(t.p).toBeCloseTo(p.p, 12);
    expect(t.p).toBeCloseTo(0.6282, 4);
    t.V[2].forEach((v, j) => expect(v).toBeCloseTo(p.V[2][j], 12));
    [0, 4, 20].forEach((v, j) => expect(t.V[2][j]).toBeCloseTo(v, 12));
    expect(t.V[1][0]).toBeCloseTo(p.V[1][0], 12);
    expect(t.V[1][1]).toBeCloseTo(p.V[1][1], 12);
    expect(t.price).toBeCloseTo(p.price, 12);
    expect(t.V[1][0]).toBeCloseTo(k.two_step.hull_printed.put_B, 3);
    expect(t.V[1][1]).toBeCloseTo(k.two_step.hull_printed.put_C, 3);
    expect(t.price).toBeCloseTo(k.two_step.hull_printed.put_root, 3);
    expect(Math.abs(t.delta[0][0] - -0.4024)).toBeLessThan(1e-3); // book rounds node values before differencing
    expect(t.delta[1][0]).toBeCloseTo(-0.1667, 4);
    expect(t.delta[1][1]).toBeCloseTo(-1, 12);
  });

  it("American put: node C exercised at 12; root 5.0894; American ≥ European at every node", () => {
    const a = k.two_step.american_put;
    const t = binomialTree({ S0: 50, K: 52, r: 0.05, dt: 1, steps: 2, u: 1.2, d: 0.8, kind: "put", american: true });
    expect(t.V[1][1]).toBe(12);
    expect(t.exercised[1][1]).toBe(true);
    expect(t.exercised[1][0]).toBe(false);
    expect(t.continuation[1][1]).toBeCloseTo(k.two_step.put.V[1][1], 12);
    expect(t.price).toBeCloseTo(a.price, 12);
    expect(t.price).toBeCloseTo(k.two_step.hull_printed.american_root, 3);
    const eu = binomialTree({ S0: 50, K: 52, r: 0.05, dt: 1, steps: 2, u: 1.2, d: 0.8, kind: "put" });
    for (let i = 0; i < 3; i++) for (let j = 0; j <= i; j++) expect(t.V[i][j]).toBeGreaterThanOrEqual(eu.V[i][j]);
  });

  it("drwong's fixed example: p = 0.5689; call 1.6351; put 1.3759; American put 1.6456", () => {
    const d = k.two_step.drwong;
    const base = { S0: 50, K: 51, r: 0.05, dt: 0.25, steps: 2, u: 1.06, d: 0.95 };
    expect(binomialTree(base).p).toBeCloseTo(d.p, 12);
    expect(binomialTree(base).price).toBeCloseTo(d.call, 12);
    expect(binomialTree({ ...base, kind: "put" }).price).toBeCloseTo(d.put, 12);
    expect(binomialTree({ ...base, kind: "put", american: true }).price).toBeCloseTo(d.american_put, 12);
    expect(binomialTree(base).price).toBeCloseTo(1.6351, 4);
    expect(binomialTree({ ...base, kind: "put", american: true }).price).toBeCloseTo(1.6456, 4);
  });
});

describe("C2 CRR and convergence vs key (Hull pp. 211–215; Leisen–Reimer)", () => {
  const atm = { S: 100, K: 100, r: 0.05, sigma: 0.2, T: 1 };

  it("u = 1.1052, d = 0.9048 at σ = 20 %, δt = 0.25; p = 0.5075 at n = 100", () => {
    const c = crrParameters(0.2, 0.05, 0.25);
    expect(c.u).toBeCloseTo(k.crr_params.u, 12);
    expect(c.d).toBeCloseTo(k.crr_params.d, 12);
    expect(c.u).toBeCloseTo(1.1052, 4);
    expect(c.d).toBeCloseTo(0.9048, 4);
    expect(crrTree({ ...atm, n: 100 }).p).toBeCloseTo(k.convergence.p_at_100, 12);
    expect(crrTree({ ...atm, n: 100 }).p).toBeCloseTo(0.5075, 4);
  });

  it("S = K = 100: BS 10.4506 (put 5.5735); n = 5 10.8059, 10 10.2534, 50 10.4107, 100 10.4306, 500 10.4466, 1000 10.4486", () => {
    const c = k.convergence;
    expect(bsPrice(atm.S, atm.K, atm.r, atm.sigma, atm.T)).toBeCloseTo(c.bs_call, 8);
    expect(bsPrice(atm.S, atm.K, atm.r, atm.sigma, atm.T, "put")).toBeCloseTo(c.bs_put, 8);
    expect(c.bs_call).toBeCloseTo(10.4506, 4);
    expect(c.bs_put).toBeCloseTo(5.5735, 4);
    c.n.forEach((n, i) => {
      expect(crrPrice({ ...atm, n })).toBeCloseTo(c.call[i], 9);
      expect(crrPrice({ ...atm, n, kind: "put" })).toBeCloseTo(c.put[i], 9);
    });
    const printed: Record<number, number> = { 1: 12.1623, 2: 9.5405, 5: 10.8059, 10: 10.2534, 11: 10.6112, 20: 10.3513, 21: 10.5344, 50: 10.4107, 100: 10.4306, 500: 10.4466, 1000: 10.4486 };
    for (const [n, v] of Object.entries(printed)) expect(crrPrice({ ...atm, n: Number(n) })).toBeCloseTo(v, 4);
    // the tree's price and the price-only routine agree
    expect(crrTree({ ...atm, n: 50 }).price).toBeCloseTo(crrPrice({ ...atm, n: 50 }), 12);
  });

  it("the sawtooth: odd n above BS, even n below; relative error < 0.3/n for n ≥ 10; the n / n + 1 average 10.4493 at 100/101", () => {
    const { bs, points } = convergence(atm, k.convergence.n);
    for (const p of points) {
      if (p.n % 2) expect(p.error).toBeGreaterThan(0);
      else expect(p.error).toBeLessThan(0);
      if (p.n >= 10) expect(Math.abs(p.error) / bs).toBeLessThan(0.3 / p.n);
    }
    expect(bs).toBeCloseTo(k.convergence.bs_call, 8);
    expect(oddEvenAverage(atm, 100)).toBeCloseTo(k.convergence.avg_100_101, 9);
    expect(oddEvenAverage(atm, 100)).toBeCloseTo(10.4493, 4);
    expect(oddEvenAverage(atm, 10)).toBeCloseTo(k.convergence.avg_10_11, 9);
    expect(oddEvenAverage(atm, 50)).toBeCloseTo(k.convergence.avg_50_51, 9);
  });

  it("off-node strike K = 110, σ = 30 %: BS 10.0201; n = 5 / 6 / 7 → 9.9644 / 10.4200 / 9.8053", () => {
    const o = k.off_node;
    const prm = { S: o.S, K: o.K, r: o.r, sigma: o.sigma, T: o.T };
    expect(bsPrice(o.S, o.K, o.r, o.sigma, o.T)).toBeCloseTo(o.bs_call, 8);
    expect(o.bs_call).toBeCloseTo(10.0201, 4);
    o.n.forEach((n, i) => expect(crrPrice({ ...prm, n })).toBeCloseTo(o.call[i], 9));
    expect(crrPrice({ ...prm, n: 5 })).toBeCloseTo(9.9644, 4);
    expect(crrPrice({ ...prm, n: 6 })).toBeCloseTo(10.42, 4);
    expect(crrPrice({ ...prm, n: 7 })).toBeCloseTo(9.8053, 4);
  });

  it("Problem 10.19: two steps u = 1.1618, d = 0.8607, p = 0.4959, call 3.3739; n = 5 / 50 / 100 / 500 → 3.9229 / 3.7394 / 3.7478 / 3.7545", () => {
    const p = k.problem_10_19;
    const prm = { S: p.S, K: p.K, r: p.r, sigma: p.sigma, T: p.T };
    const two = crrTree({ ...prm, n: 2 });
    expect(two.u).toBeCloseTo(1.1618, 4);
    expect(two.d).toBeCloseTo(0.8607, 4);
    expect(two.p).toBeCloseTo(0.4959, 4);
    expect(two.price).toBeCloseTo(3.3739, 4);
    p.n.forEach((n, i) => expect(crrPrice({ ...prm, n })).toBeCloseTo(p.call[i], 9));
    expect(crrPrice({ ...prm, n: 500 })).toBeCloseTo(3.7545, 4);
    expect(bsPrice(p.S, p.K, p.r, p.sigma, p.T)).toBeCloseTo(3.7562, 4);
  });

  it("Leisen–Reimer Table 1 (n = 25): K = 100 CRR 10.21317 vs true 10.13377; K = 110 6.01218 vs 5.94946", () => {
    const l = k.leisen_reimer;
    expect(crrPrice({ S: l.S, K: 100, r: l.r, sigma: l.sigma, T: l.T, n: 25 })).toBeCloseTo(10.21317, 4);
    expect(crrPrice({ S: l.S, K: 110, r: l.r, sigma: l.sigma, T: l.T, n: 25 })).toBeCloseTo(6.01218, 4);
    expect(bsPrice(l.S, 100, l.r, l.sigma, l.T)).toBeCloseTo(10.13377, 4);
    expect(bsPrice(l.S, 110, l.r, l.sigma, l.T)).toBeCloseTo(5.94946, 4);
  });

  it("riskhub's American put: n = 6 5.9546; n = 100 6.0824; European 5.5536; early-exercise premium ≈ 0.52; American ≥ European at every node", () => {
    const a = k.american_put;
    const prm = { S: a.S, K: a.K, r: a.r, sigma: a.sigma, T: a.T, kind: "put" as const };
    a.n.forEach((n, i) => expect(crrPrice({ ...prm, n, american: true })).toBeCloseTo(a.price[i], 9));
    expect(crrPrice({ ...prm, n: 100, american: true })).toBeCloseTo(a.riskhub_100, 4);
    expect(crrPrice({ ...prm, n: 6, american: true })).toBeCloseTo(5.9546, 4);
    const e = earlyExercisePremium({ ...prm, n: 100 });
    expect(e.european).toBeCloseTo(a.european_100, 9);
    expect(e.european).toBeCloseTo(5.5536, 4);
    expect(e.premium).toBeCloseTo(0.52, 1);
    expect(americanDominates({ ...prm, n: 30 })).toBe(true);
    expect(americanDominates({ ...prm, n: 30, kind: "call" })).toBe(true);
    // no dividends: the American call is never exercised early, so it equals the European call
    expect(crrPrice({ ...prm, n: 100, kind: "call", american: true })).toBeCloseTo(crrPrice({ ...prm, n: 100, kind: "call" }), 10);
  });

  it("ryanoconnell's two-step: u 1.1052, d 0.9048, p 0.5378; call 4.8352; put 7.2428; American put 7.8381", () => {
    const r = k.ryanoconnell;
    const prm = { S: r.S, K: r.K, r: r.r, sigma: r.sigma, T: r.T, n: 2 };
    expect(crrTree(prm).p).toBeCloseTo(0.5378, 4);
    expect(crrPrice(prm)).toBeCloseTo(r.call, 9);
    expect(crrPrice(prm)).toBeCloseTo(4.8352, 4);
    expect(crrPrice({ ...prm, kind: "put" })).toBeCloseTo(7.2428, 4);
    expect(crrPrice({ ...prm, kind: "put", american: true })).toBeCloseTo(7.8381, 4);
  });

  it("call and put from one tree satisfy put–call parity (C1's law, free) at every n", () => {
    for (const n of [1, 2, 7, 50, 201]) {
      const c = crrPrice({ ...atm, n });
      const p = crrPrice({ ...atm, n, kind: "put" });
      expect(putCallParity(c, p, atm.S, atm.K, atm.r, atm.T, 1e-9).holds).toBe(true);
    }
  });

  it("Hull's BS example (handover to B6/C3): S = 42, K = 40, r = 10 %, σ = 20 %, T = 0.5 → call 4.76, put 0.81", () => {
    const h = k.hull_bs;
    expect(bsPrice(h.S, h.K, h.r, h.sigma, h.T)).toBeCloseTo(h.call, 8);
    expect(bsPrice(h.S, h.K, h.r, h.sigma, h.T, "put")).toBeCloseTo(h.put, 8);
    expect(h.call).toBeCloseTo(4.76, 2);
    expect(h.put).toBeCloseTo(0.81, 2);
  });
});
