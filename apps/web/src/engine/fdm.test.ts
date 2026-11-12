import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-F1.json";
import { black76 } from "./bs";
import { explicitLimit, explicitWeights, hullGrid, logSlope, neighbourRule, solveForward, thomas, wilmottExplicit, type Grid, type HullParams, type Scheme } from "./fdm";

const g: Grid = key.chain;
const TRUTH = key.chain.truth;

describe("F1 — the rod relaxes into the formula", () => {
  it("Thomas solves a tridiagonal system", () => {
    const sub = Float64Array.from([0, -1, -1, -1]);
    const dia = Float64Array.from([4, 4, 4, 4]);
    const sup = Float64Array.from([-1, -1, -1, 0]);
    const x = thomas(sub, dia, sup, Float64Array.from([1, 2, 3, 4]));
    const back = [4 * x[0] - x[1], -x[0] + 4 * x[1] - x[2], -x[1] + 4 * x[2] - x[3], -x[2] + 4 * x[3]];
    back.forEach((v, i) => expect(v).toBeCloseTo(i + 1, 10));
  });
  it("Crank–Nicolson on 800 × 88 with a Rannacher start gives 249.146 against the formula's 249.150; the snapshots are the key's rod", () => {
    const sol = solveForward(g, 800, 88, "cn", { rannacher: 1, keep: [8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88] });
    expect(sol.value).toBeCloseTo(key.rod.value_at_F0, 6);
    expect(Math.abs(sol.value - TRUTH)).toBeLessThan(0.01);
    expect(black76({ F: g.F, K: g.K, r: g.r, sigma: g.sigma, T: g.T })).toBeCloseTo(TRUTH, 6);
    key.rod.rows.slice(1).forEach((row, d) => {
      const snap = sol.snaps.get(8 * (d + 1))!;
      for (let i = 0; i < row.length; i += 10) expect(snap[8 * i]).toBeCloseTo(row[i], 6);
    });
    // at 11 days the dots lie on the formula
    const last = key.rod.rows[key.rod.rows.length - 1];
    last.forEach((v, i) => expect(Math.abs(v - key.rod.formula_row[i])).toBeLessThan(0.05));
  });
  it("the neighbour rule at the dot nearest the strike", () => {
    const e = key.rod.rule_example;
    const dF = key.rod.F[1] - key.rod.F[0];
    const r = neighbourRule(g, e.F, dF, e.Vm, e.V, e.Vp);
    expect(r.avg).toBeCloseTo(e.avg, 8);
    expect(r.weight).toBeCloseTo(e.weight, 6);
    expect(r.pull).toBeCloseTo(e.pull_per_year, 4);
    expect(r.pull).toBeGreaterThan(0); // the corner is pulled up toward its neighbours' average
  });
  it("put–call parity holds on the grid to 1e-5 (the deep-in boundary is the discounted intrinsic)", () => {
    const c = solveForward(g, 400, 44, "cn", { rannacher: 1 });
    const p = solveForward(g, 400, 44, "cn", { rannacher: 1, call: false });
    let worst = 0;
    for (let j = 0; j <= 400; j++) worst = Math.max(worst, Math.abs(c.V[j] - p.V[j] - Math.exp(-g.r * g.T) * (c.Fg[j] - g.K)));
    expect(worst).toBeLessThan(1e-5);
    expect(p.value).toBeCloseTo(key.parity.put, 6);
  });
});

describe("F1 — too big a step", () => {
  for (const name of ["grid100", "grid50"] as const) {
    const d = key.dial[name];
    it(`${name}: the limit is ${d.limit_days.toFixed(3)} days; under it the price is right, over it the grid explodes`, () => {
      expect(explicitLimit(g, d.M)).toBeCloseTo(d.limit_years, 12);
      for (const row of d.rows) {
        const sol = solveForward(g, d.M, row.N, "explicit");
        if (Math.abs(row.price) < 1e6) expect(sol.value).toBeCloseTo(row.price, 4);
        else expect(Math.abs(sol.value)).toBeGreaterThan(1e6);
        expect(Math.abs(sol.maxAbs / row.max_abs - 1)).toBeLessThan(1e-5);
        expect(sol.dt <= d.limit_years * (1 + 1e-9)).toBe(row.stable);
      }
      if (name === "grid100") expect(Math.abs(d.rows.find((r) => r.step_days === 1)!.price)).toBeGreaterThan(1e8);
      const small = d.rows.find((r) => r.step_days === 0.1)!;
      expect(Math.abs(small.price - TRUTH)).toBeLessThan(name === "grid100" ? 0.5 : 3); // the 50-point grid is coarse: δF = 200, 3 nodes per sd
    });
  }
  it("the middle weight at the top node crosses zero exactly at the limit (Hull's trinomial reading)", () => {
    const d = key.dial.grid100;
    for (const w of d.weights_at) {
      const e = explicitWeights(g, d.M, w.step_days / 365);
      expect(e.down).toBeCloseTo(w.down, 10);
      expect(e.stay).toBeCloseTo(w.stay, 10);
    }
    const atLimit = explicitWeights(g, d.M, d.limit_years);
    expect(atLimit.stay).toBeCloseTo(-g.r * d.limit_years, 12); // 1 − 2a·dt = 0 there; only the tiny −r·dt remains
  });
});

describe("F1 — three schemes, one answer", () => {
  it("the price ladders for all three schemes match the key and converge to the formula", () => {
    for (const s of ["explicit", "implicit", "cn"] as Scheme[]) {
      const rows = key.schemes[s];
      for (const row of rows) {
        const sol = solveForward(g, row.M, row.N, s, { rannacher: s === "cn" ? 1 : 0 });
        expect(sol.value).toBeCloseTo(row.price, 5);
      }
      expect(Math.abs(rows[rows.length - 1].error)).toBeLessThan(Math.abs(rows[0].error) / 20);
    }
    expect(Math.abs(key.schemes.cn[5].error)).toBeLessThan(0.01);
  });
  it("error against grid spacing falls like the square (or faster); against the time step implicit is first order, Crank–Nicolson faster", () => {
    const sl = key.slopes;
    expect(logSlope(key.err_dF.cn.map((e) => e.M), key.err_dF.cn.map((e) => e.error))).toBeCloseTo(sl.dF.cn, 8);
    expect(sl.dF.cn).toBeLessThan(-1.9);
    expect(sl.dF.implicit).toBeLessThan(-1.4);
    expect(sl.dt.implicit).toBeCloseTo(-1, 0);
    expect(sl.dt.cn_rannacher).toBeLessThan(sl.dt.implicit - 0.4); // faster than first order, short of two because of the corner
    // Crank–Nicolson without the Rannacher start rings at the corner: 27 points off with two steps, under one with it
    expect(Math.abs(key.err_dt.cn[0].error)).toBeGreaterThan(20);
    expect(Math.abs(key.err_dt.cn_rannacher[0].error)).toBeLessThan(1);
    const two = solveForward(g, 800, 2, "cn");
    expect(two.value - TRUTH).toBeCloseTo(key.err_dt.cn[0].error, 4);
  });
});

describe("F1 — Hull Example 18.1 on Hull's stencil", () => {
  const p: HullParams = key.hull.params;
  it("Table 18.1 (implicit): 4.07 American, 3.91 European, Black–Scholes 4.08, control variate 4.24; every cell to the cent", () => {
    const am = hullGrid(p, "implicit", true);
    const eu = hullGrid(p, "implicit", false);
    expect(am.atS0).toBeCloseTo(key.hull.implicit_american.at_S0, 8);
    expect(am.atS0).toBeCloseTo(key.hull.book.implicit_american, 2);
    expect(eu.atS0).toBeCloseTo(key.hull.book.implicit_european, 2);
    expect(key.hull.bs_european).toBeCloseTo(key.hull.book.bs, 2);
    expect(key.hull.control_variate).toBeCloseTo(key.hull.book.control_variate, 1);
    key.hull.implicit_american.grid.forEach((row, i) => row.forEach((v, j) => expect(am.grid[i][j]).toBeCloseTo(v, 8)));
    expect(am.boundary).toEqual(key.hull.implicit_american.boundary);
    for (let i = 1; i < am.boundary.length; i++) expect(am.boundary[i]).toBeGreaterThanOrEqual(am.boundary[i - 1]); // exercise earlier as expiry nears
  });
  it("Table 18.2 (explicit): 4.26 with Hull's negative cells 0.06, −0.11, 0.28, −0.13 at S = 95–80 and five months", () => {
    const ex = hullGrid(p, "explicit", true);
    expect(ex.atS0).toBeCloseTo(key.hull.book.explicit_american, 2);
    const top = [19, 18, 17, 16].map((j) => ex.grid[0][j]);
    top.forEach((v, i) => expect(v).toBeCloseTo(key.hull.book.table18_2_top_left[i], 2));
    expect(top[1]).toBeLessThan(0);
    expect(key.hull.negative_weight_from_j).toBe(13);
  });
  it("Crank–Nicolson on Hull's grid gives 4.16; the converged American put is 4.28, above the European 4.08", () => {
    expect(hullGrid(p, "cn", true).atS0).toBeCloseTo(key.hull.cn_american, 8);
    const fine = hullGrid({ ...p, M: 400, N: 3200 }, "cn", true).atS0;
    expect(fine).toBeCloseTo(key.hull.converged_american, 6);
    expect(fine).toBeGreaterThan(key.hull.bs_european + 0.15);
  });
});

describe("F1 — Wilmott Tables 77.1 and 77.2", () => {
  it("his explicit loop reproduces the printed call and put rows to three decimals", () => {
    const c = wilmottExplicit(true);
    const pu = wilmottExplicit(false);
    expect(c.NTS).toBe(key.wilmott.call.NTS);
    key.wilmott.book_call.forEach((v, i) => expect(c.V[6 + i]).toBeCloseTo(v, 3));
    key.wilmott.book_put.forEach((v, i) => expect(pu.V[6 + i]).toBeCloseTo(v, 3));
  });
});
