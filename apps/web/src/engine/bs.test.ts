import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-C3C4.json";
import {
  bisectionPath,
  black76,
  black76Greeks,
  breakEvenMove,
  bsGreeks,
  bsPrice,
  cloud,
  cloudStats,
  impliedVolFwd,
  impliedVolSpot,
  pdeResidualFwd,
  pdeResidualSpot,
  priceRangeFwd,
  riskLine,
  shareAbove,
  taylorSplit,
} from "./bs";

const row = key.row;
const fwd = { F: row.F, K: row.K, r: row.r, T: row.T };
const atm = key.atm;

describe("C3 — the real row, forward form", () => {
  it("prices the 22,600 call at its implied vol and splits it into the two areas", () => {
    const g = black76Greeks({ ...fwd, sigma: atm.iv });
    expect(g.price).toBeCloseTo(249.15, 6);
    expect(g.Nd1).toBeCloseTo(atm.Nd1, 8);
    expect(g.Nd2).toBeCloseTo(atm.Nd2, 8);
    expect(row.F * g.Nd1).toBeCloseTo(atm.F_Nd1, 4);
    expect(row.K * g.Nd2).toBeCloseTo(atm.K_Nd2, 4);
    expect(Math.exp(-row.r * row.T)).toBeCloseTo(atm.discount, 10);
  });
  it("implied vol of the row: Newton from 30 % lands in two steps on 15.853 %", () => {
    const iv = impliedVolFwd(249.15, fwd, "call", 0.3);
    expect(iv.ok).toBe(true);
    expect(iv.sigma).toBeCloseTo(atm.iv, 8);
    expect(iv.path[1]).toBeCloseTo(key.newton.path[1], 6);
    expect(iv.path[2]).toBeCloseTo(key.newton.path[2], 6);
    expect(impliedVolFwd(249.6, fwd, "put").sigma).toBeCloseTo(atm.put_iv, 8);
  });
  it("the price only ever goes up with the dial, and the dial is almost a ruler", () => {
    const sigmas = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4];
    const prices = sigmas.map((s) => black76({ ...fwd, sigma: s }));
    for (let i = 1; i < prices.length; i++) expect(prices[i]).toBeGreaterThan(prices[i - 1]);
    for (const s of sigmas) expect(black76({ ...fwd, sigma: s })).toBeCloseTo((atm.price_vs_sigma as Record<string, number>)[String(s)], 6);
    expect((prices[3] - prices[1]) / 10).toBeCloseTo(atm.rupees_per_vol_pt, 6);
  });
  it("the σ → 0 limit is the discounted forward minus strike", () => {
    expect(black76({ ...fwd, sigma: 1e-4 })).toBeCloseTo(atm.sigma_to_zero, 3);
    const [lo, hi] = priceRangeFwd(fwd);
    expect(lo).toBeCloseTo(atm.sigma_to_zero, 8);
    expect(hi).toBeCloseTo(Math.exp(-row.r * row.T) * row.F, 8);
    expect(impliedVolFwd(lo - 1, fwd).ok).toBe(false);
  });
  it("rounds: every real row solves to the key's vol, in at most 3 Newton steps from 30 %", () => {
    for (const rd of key.rounds) {
      const iv = impliedVolFwd(rd.price, { ...fwd, K: rd.K }, rd.kind as "call" | "put", 0.3);
      expect(iv.sigma).toBeCloseTo(rd.iv, 8);
    }
    key.strip.strikes.forEach((K, i) => {
      const c = impliedVolFwd(key.rounds.find((r) => r.K === K && r.kind === "call")?.price ?? NaN, { ...fwd, K }, "call", 0.3);
      if (c.ok) expect(c.steps).toBeLessThanOrEqual(key.newton.max_steps_all_rows + 1);
      expect(impliedVolFwd(black76({ ...fwd, K, sigma: key.strip.call_iv[i] }), { ...fwd, K }, "call", 0.3).sigma).toBeCloseTo(key.strip.call_iv[i], 8);
      expect(impliedVolFwd(black76({ ...fwd, K, sigma: key.strip.put_iv[i] }, "put"), { ...fwd, K }, "put", 0.3).sigma).toBeCloseTo(key.strip.put_iv[i], 8);
    });
  });
  it("the skew is real: 17.0 % at 22,250 sloping to 15.5 % at 23,050", () => {
    const iv = key.strip.call_iv;
    expect(iv[0]).toBeCloseTo(0.17, 2);
    expect(iv[iv.length - 1]).toBeCloseTo(0.155, 2);
    expect(iv[0]).toBeGreaterThan(iv[iv.length - 1]);
  });
  it("bisection, Hull's way, matches the key step by step", () => {
    const path = bisectionPath(249.15, fwd, 0.1, 0.3, 6);
    path.forEach((s, i) => {
      expect(s.sigma).toBeCloseTo(key.bisection[i].sigma, 10);
      expect(s.price).toBeCloseTo(key.bisection[i].price, 6);
    });
  });
});

describe("C3 — the cloud of 2,000 futures", () => {
  it("has the forward as its mean and prices the call like the formula", () => {
    const c = cloud(row.F, atm.iv, row.T, 2000);
    const st = cloudStats(c, row.K, row.r, row.T);
    expect(c[0]).toBeCloseTo(key.cloud.first5[0], 4);
    expect(c[1999]).toBeCloseTo(key.cloud.last5[4], 4);
    expect(st.mean).toBeCloseTo(key.cloud.mean, 3);
    expect(st.shareLit).toBeCloseTo(key.cloud.share_lit, 10);
    expect(st.avgLitPayoff).toBeCloseTo(key.cloud.avg_lit_payoff, 4);
    expect(st.price).toBeCloseTo(key.cloud.price, 4);
    expect(Math.abs(st.price - key.cloud.price_exact)).toBeLessThan(0.5);
  });
  it("widening the wobble lowers the share above the strike while the price doubles (the bet)", () => {
    expect(shareAbove(row.F, row.K, 0.16, row.T)).toBeCloseTo(atm.share_above_16, 8);
    expect(shareAbove(row.F, row.K, 0.3, row.T)).toBeCloseTo(atm.share_above_30, 8);
    expect(shareAbove(row.F, row.K, 0.3, row.T)).toBeLessThan(shareAbove(row.F, row.K, 0.16, row.T));
    expect(black76({ ...fwd, sigma: 0.3 }) / black76({ ...fwd, sigma: 0.16 })).toBeGreaterThan(1.8);
  });
});

describe("C3 — NSE's own IV column decoded", () => {
  const n = key.nse_iv;
  it("spot Black–Scholes at S = 22,600, r = 10 %, 11 days reproduces the printed IVs to ₹0.05 rms", () => {
    key.strip.strikes.forEach((K, i) => {
      const c = bsPrice({ S: n.S, K, r: n.r, T: n.T, sigma: n.call_iv_printed[i] / 100 });
      const p = bsPrice({ S: n.S, K, r: n.r, T: n.T, sigma: n.put_iv_printed[i] / 100 }, "put");
      expect(c).toBeCloseTo(n.reproduced_calls[i], 6);
      expect(p).toBeCloseTo(n.reproduced_puts[i], 6);
    });
    expect(n.rms).toBeLessThan(0.05);
    expect(impliedVolSpot(249.15, { S: n.S, K: row.K, r: n.r, T: n.T })).toBeCloseTo(0.1366, 3);
    expect(impliedVolSpot(249.6, { S: n.S, K: row.K, r: n.r, T: n.T }, "put")).toBeCloseTo(0.1806, 3);
  });
  it("feed the formula NSE's 10 % forward and you get its two columns; feed it the chain's forward and they meet", () => {
    for (const [Ff, v] of Object.entries(n.fed_forward)) {
      const F = Number(Ff);
      expect(impliedVolFwd(249.15, { ...fwd, F }).sigma).toBeCloseTo(v.call_iv, 8);
      expect(impliedVolFwd(249.6, { ...fwd, F }, "put").sigma).toBeCloseTo(v.put_iv, 8);
    }
    expect(n.nse_forward).toBeCloseTo(22668.2, 1);
    const at = n.fed_forward["22668"];
    expect(at.call_iv).toBeCloseTo(0.1365, 3);
    expect(at.put_iv).toBeCloseTo(0.1804, 3);
    expect(Math.abs(n.forward_where_equal - 22603)).toBeLessThan(5);
  });
});

describe("C3/C4 — textbook checks", () => {
  it("Hull Example 12.7 and §12.11", () => {
    const h = key.hull_12_7;
    const g = bsGreeks({ S: 42, K: 40, r: 0.1, sigma: 0.2, T: 0.5 });
    expect(g.d1).toBeCloseTo(0.7693, 4);
    expect(g.d2).toBeCloseTo(0.6278, 4);
    expect(g.price).toBeCloseTo(4.76, 2);
    expect(g.price).toBeCloseTo(h.price, 8);
    expect(bsPrice({ S: 42, K: 40, r: 0.1, sigma: 0.2, T: 0.5 }, "put")).toBeCloseTo(0.81, 2);
    expect(impliedVolSpot(1.875, { S: 21, K: 20, r: 0.1, T: 0.25 })).toBeCloseTo(key.hull_12_11.iv, 6);
    expect(key.hull_12_11.iv).toBeCloseTo(0.235, 3);
    expect(impliedVolSpot(5.5, { S: 100, K: 105, r: 0.05, T: 0.5 })).toBeCloseTo(key.brenndoerfer.iv, 6);
    expect(key.brenndoerfer.iv).toBeCloseTo(0.2327, 4);
  });
  it("Hull's bank (S = 49) and the riskhub ATM case, with the PDE identity", () => {
    const b = bsGreeks({ S: 49, K: 50, r: 0.05, sigma: 0.2, T: 20 / 52 });
    expect(b.price * 100000).toBeCloseTo(240053, 0);
    expect(b.delta).toBeCloseTo(0.522, 3);
    expect(b.gamma).toBeCloseTo(key.hull_14_1.gamma, 8);
    expect(b.vega).toBeCloseTo(key.hull_14_1.vega, 6);
    expect(b.thetaYr).toBeCloseTo(key.hull_14_1.theta_yr, 6);
    expect(b.rho).toBeCloseTo(key.hull_14_1.rho, 6);
    expect(pdeResidualSpot({ S: 49, K: 50, r: 0.05, sigma: 0.2, T: 20 / 52 })).toBeCloseTo(0, 9);
    const a = bsGreeks({ S: 100, K: 100, r: 0.05, sigma: 0.2, T: 1 });
    expect(a.price).toBeCloseTo(10.4506, 4);
    expect(a.delta).toBeCloseTo(0.636831, 6);
    expect(a.gamma).toBeCloseTo(0.018762, 6);
    expect(a.thetaYr / 365).toBeCloseTo(-0.01757, 5);
    const od = key.riskhub.one_day;
    const t = taylorSplit(a, 2, 1);
    expect(t.taylor).toBeCloseTo(od.taylor, 6);
    expect(Math.abs(t.taylor - od.exact)).toBeLessThan(2e-3);
  });
});

describe("C4 — the risk line, the surface and the real day", () => {
  const g = black76Greeks({ ...fwd, sigma: atm.iv });
  it("the risk line for −100 lots", () => {
    const rl = riskLine(g, -100 * row.lot, row.lot);
    expect(rl.premium).toBeCloseTo(key.risk_line.premium, 2);
    expect(rl.deltaUnits).toBeCloseTo(key.risk_line.delta_units, 4);
    expect(rl.thetaDay).toBeCloseTo(key.risk_line.theta_day, 4);
    expect(rl.vegaPerPt).toBeCloseTo(key.risk_line.vega_per_pt, 4);
    expect(rl.gammaPerLotPer100).toBeCloseTo(key.risk_line.gamma_per_lot_per_100, 6);
    expect(rl.deltaUnits).toBeCloseTo(-3292, 0);
    expect(rl.thetaDay).toBeCloseTo(72875.5, 0);
  });
  it("the ridge and the last days: delta becomes a step, gamma and theta explode together", () => {
    for (const [d, v] of Object.entries(key.ridge)) {
      const gd = black76Greeks({ ...fwd, T: Number(d) / 365, sigma: atm.iv });
      expect(gd.price).toBeCloseTo(v.price, 6);
      expect(gd.gamma).toBeCloseTo(v.gamma, 10);
      expect(gd.thetaYr).toBeCloseTo(v.theta_yr, 6);
    }
    const oneHour = 1 / 24 / 365;
    expect(black76Greeks({ ...fwd, F: 22700, T: oneHour, sigma: atm.iv }).delta).toBeGreaterThan(0.99);
    expect(black76Greeks({ ...fwd, F: 22500, T: oneHour, sigma: atm.iv }).delta).toBeLessThan(0.01);
    expect(black76Greeks({ ...fwd, F: 22700, T: 1 / 365, sigma: atm.iv }).delta).toBeCloseTo(0.704, 3);
    const g1 = black76Greeks({ ...fwd, T: 1 / 365, sigma: atm.iv });
    expect(g1.gamma / g.gamma).toBeGreaterThan(3);
    expect(g1.thetaYr / g.thetaYr).toBeGreaterThan(3);
  });
  it("the real Fri → Mon day splits into slope, bend and three days of clock", () => {
    const rd = key.real_day;
    const t = taylorSplit(g, rd.dS, rd.days);
    expect(t.deltaTerm).toBeCloseTo(rd.delta_term, 6);
    expect(t.gammaTerm).toBeCloseTo(rd.gamma_term, 6);
    expect(t.thetaTerm).toBeCloseTo(rd.theta_term, 6);
    const exact = black76({ ...fwd, F: row.F + rd.dS, T: (11 - rd.days) / 365, sigma: atm.iv }) - g.price;
    expect(exact).toBeCloseTo(rd.exact, 6);
    expect(Math.abs(t.taylor - exact)).toBeLessThan(0.02 * rd.dS);
    expect(-100 * row.lot * exact).toBeCloseTo(rd.position_pnl, 2);
  });
  it("the bend pays for the clock at a one-wobble day, and the PDE holds everywhere", () => {
    expect(breakEvenMove(g)).toBeCloseTo(key.break_even.move, 6);
    expect(Math.abs(breakEvenMove(g) / key.break_even.one_sigma_day - 1)).toBeLessThan(0.005);
    for (const c of key.pde_random) {
      expect(pdeResidualFwd({ F: c.F, K: row.K, r: row.r, sigma: c.sigma, T: c.T })).toBeCloseTo(0, 6);
      expect(pdeResidualFwd({ F: c.F, K: row.K, r: row.r, sigma: c.sigma, T: c.T }, "put")).toBeCloseTo(0, 6);
      const gc = black76Greeks({ F: c.F, K: row.K, r: row.r, sigma: c.sigma, T: c.T });
      const gp = black76Greeks({ F: c.F, K: row.K, r: row.r, sigma: c.sigma, T: c.T }, "put");
      expect(gc.gamma).toBeCloseTo(gp.gamma, 10);
      expect(gc.vega).toBeCloseTo(gp.vega, 8);
      expect(gc.delta - gp.delta).toBeCloseTo(Math.exp(-row.r * c.T), 10);
    }
  });
  it("vega: turning the wobble inflates the price like time", () => {
    for (const [s, v] of Object.entries(key.vega_inflate)) expect(black76({ ...fwd, sigma: Number(s) })).toBeCloseTo(v, 6);
  });
});
