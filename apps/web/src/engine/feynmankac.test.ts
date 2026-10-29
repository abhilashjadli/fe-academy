import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-B5B6.json";
import {
  backwardGrid,
  bracketWidth,
  bsTarget,
  curvatureArrows,
  forwardGridDefect,
  forwardValue,
  gridColumn,
  heatExact,
  heatGrid,
  heatMonteCarlo,
  insideBracket,
  monteCarloOption,
  oneFuture,
  optionGrid,
  secondDifference,
  signChanges,
  stencil,
  stepTooFar,
  upWeights,
} from "./feynmankac";
import { binomialTree, crrPrice, crrTree } from "./binomial";
import { rng } from "./random";

const k = key as typeof key;
const hull = { S: 42, K: 40, r: 0.1, sigma: 0.2, T: 0.5 };

describe("B6 the backward grid vs key (Hull's example S = 42, K = 40, r = 10 %, σ = 20 %, T = 0.5)", () => {
  it("Black–Scholes 4.7594 / 0.8086; d1 0.7693, d2 0.6278", () => {
    const h = k.hull_bs;
    expect(bsTarget(h.S, h.K, h.r, h.sigma, h.T)).toBeCloseTo(h.call, 8);
    expect(bsTarget(h.S, h.K, h.r, h.sigma, h.T, "put")).toBeCloseTo(h.put, 8);
    expect(h.call).toBeCloseTo(4.7594, 4);
    expect(h.put).toBeCloseTo(0.8086, 4);
    expect(h.d1).toBeCloseTo(0.7693, 4);
    expect(h.d2).toBeCloseTo(0.6278, 4);
  });

  it("explicit FD in ln S with δx = σ√δt: n = 10 / 100 / 500 → 4.7968 / 4.7615 / 4.7593; the middle weight is 0", () => {
    const g = k.grid;
    g.fd_n.forEach((n, i) => {
      const grid = optionGrid({ ...hull, n });
      expect(grid.phi.mid).toBeCloseTo(0, 12);
      expect(grid.phi.up + grid.phi.down).toBeCloseTo(1, 12);
      expect(grid.stable).toBe(true);
      expect(grid.courant).toBeCloseTo(1, 12);
      expect(grid.value).toBeCloseTo(g.fd_call[i], 9);
      expect(optionGrid({ ...hull, n, kind: "put" }).value).toBeCloseTo(g.fd_put[i], 9);
    });
    expect(optionGrid({ ...hull, n: 10 }).value).toBeCloseTo(4.7968, 4);
    expect(optionGrid({ ...hull, n: 100 }).value).toBeCloseTo(4.7615, 4);
    expect(optionGrid({ ...hull, n: 500 }).value).toBeCloseTo(4.7593, 4);
    expect(optionGrid({ ...hull, n: 10 }).phi.up).toBeCloseTo(g.p_fd_at_10, 12);
  });

  it("the CRR tree on the same inputs: n = 1 / 2 / 10 / 100 / 500 → 5.1446 / 4.7992 / 4.8003 / 4.7618 / 4.7593", () => {
    const g = k.grid;
    g.n.forEach((n, i) => {
      expect(crrPrice({ ...hull, n })).toBeCloseTo(g.crr_call[i], 9);
      expect(crrPrice({ ...hull, n, kind: "put" })).toBeCloseTo(g.crr_put[i], 9);
    });
    expect(crrPrice({ ...hull, n: 10 })).toBeCloseTo(4.8003, 4);
    expect(crrPrice({ ...hull, n: 500 })).toBeCloseTo(4.7593, 4);
  });

  it("tree = explicit FD: within 5e−3 at n = 10 (the O(δt) difference in p), 1e−4 at n = 500; both within 1e−3 of BS at n = 500", () => {
    const bs = bsTarget(hull.S, hull.K, hull.r, hull.sigma, hull.T);
    expect(Math.abs(optionGrid({ ...hull, n: 10 }).value - crrPrice({ ...hull, n: 10 }))).toBeLessThan(5e-3);
    expect(Math.abs(optionGrid({ ...hull, n: 500 }).value - crrPrice({ ...hull, n: 500 }))).toBeLessThan(1e-4);
    expect(Math.abs(optionGrid({ ...hull, n: 500 }).value - bs)).toBeLessThan(1e-3);
    expect(Math.abs(crrPrice({ ...hull, n: 500 }) - bs)).toBeLessThan(1e-3);
    expect(Math.abs(optionGrid({ ...hull, n: 500, kind: "put" }).value - bsTarget(hull.S, hull.K, hull.r, hull.sigma, hull.T, "put"))).toBeLessThan(1e-3);
    // p_FD and p_CRR differ at O(δt)
    const w10 = upWeights(hull.r, hull.sigma, hull.T / 10);
    const w500 = upWeights(hull.r, hull.sigma, hull.T / 500);
    expect(w10.fd).toBeCloseTo(k.grid.p_fd_at_10, 12);
    expect(w10.crr).toBeCloseTo(k.grid.p_crr_at_10, 12);
    expect(Math.abs(w500.fd - w500.crr)).toBeLessThan(Math.abs(w10.fd - w10.crr) / 40);
  });

  it("with the CRR up-weight the trinomial grid is C2's binomial tree, node for node", () => {
    for (const n of [2, 10, 50]) {
      const grid = optionGrid({ ...hull, n, probabilities: "crr" });
      const tree = crrTree({ ...hull, n });
      expect(grid.value).toBeCloseTo(tree.price, 10);
      for (let kk = 0; kk <= n; kk++)
        for (let j = 0; j <= kk; j++) {
          // tree node (kk, j down-moves) sits at grid layer kk, node 2(kk − j)
          expect(grid.layers[kk][2 * (kk - j)]).toBeCloseTo(tree.V[kk][j], 10);
          expect(grid.S(kk, 2 * (kk - j))).toBeCloseTo(tree.S[kk][j], 8);
        }
    }
  });

  it("three doors: every cell is the discounted average of its children; Hull's two-step 2.0257 / 1.2823 with door weights 0.4255 / 0.4536 / 0.1209", () => {
    const d = k.three_doors;
    const t = binomialTree({ S0: 20, K: 21, r: 0.12, dt: 0.25, steps: 2, u: 1.1, d: 0.9 });
    expect(t.V[1][0]).toBeCloseTo(d.B, 12);
    expect(t.price).toBeCloseTo(d.A, 12);
    expect(t.V[1][0]).toBeCloseTo(2.0257, 3);
    expect(t.price).toBeCloseTo(1.2823, 3);
    const probs = [t.p * t.p, 2 * t.p * (1 - t.p), (1 - t.p) * (1 - t.p)];
    probs.forEach((p, i) => expect(p).toBeCloseTo(d.terminal_probs[i], 12));
    expect(probs[0]).toBeCloseTo(0.4255, 4);
    expect(probs[1]).toBeCloseTo(0.4536, 4);
    expect(probs[2]).toBeCloseTo(0.1209, 4);
    // and on the grid: pick a cell, recompute it from its three children by hand
    const g = optionGrid({ ...hull, n: 20 });
    const disc = Math.exp(-hull.r * g.dt);
    for (const [kk, j] of [
      [5, 3],
      [10, 10],
      [19, 25],
    ]) {
      const next = g.layers[kk + 1];
      expect(g.layers[kk][j]).toBeCloseTo(disc * (g.phi.up * next[j + 2] + g.phi.mid * next[j + 1] + g.phi.down * next[j]), 12);
    }
    const col = gridColumn(g, 20);
    expect(col.x.length).toBe(41);
    expect(col.v[20]).toBe(Math.max(42 - 40, 0));
  });

  it("the forward payoff S − K returns S − Ke^{−r(T−t)}: exactly with the CRR weight, to O(δt) with the FD stencil", () => {
    expect(forwardValue(42, 40, 0.1, 0.5)).toBeCloseTo(k.grid.forward_exact, 12);
    expect(forwardGridDefect({ ...hull, n: 50, probabilities: "crr" })).toBeLessThan(1e-10);
    const e10 = forwardGridDefect({ ...hull, n: 10 });
    const e100 = forwardGridDefect({ ...hull, n: 100 });
    const e500 = forwardGridDefect({ ...hull, n: 500 });
    expect(e10).toBeLessThan(0.01);
    expect(e100).toBeLessThan(e10 / 8);
    expect(e500).toBeLessThan(e100 / 4);
    k.grid.fd_n.forEach((n, i) => expect(optionGrid({ ...hull, n, kind: "forward" }).value).toBeCloseTo(k.grid.fd_forward[i], 9));
  });
});

describe("B6 the walkers (Monte Carlo) vs the grid", () => {
  it("N = 1,000 / 10,000 / 100,000: the bracket shrinks like 1/√N (sd ≈ 4.96) and holds the grid's number", () => {
    const grid = optionGrid({ ...hull, n: 500 }).value;
    for (const run of k.monte_carlo.runs) {
      const mc = monteCarloOption(hull.S, hull.K, hull.r, hull.sigma, hull.T, run.N, rng(1));
      expect(mc.N).toBe(run.N);
      expect(mc.sd).toBeCloseTo(k.monte_carlo.payoff_sd, 0);
      expect(Math.abs(mc.se - bracketWidth(k.monte_carlo.payoff_sd, run.N)) / mc.se).toBeLessThan(0.1);
      expect(mc.se).toBeCloseTo(run.se, 2);
      expect(insideBracket(mc, grid, 3)).toBe(true);
      expect(mc.hi - mc.lo).toBeCloseTo(2 * mc.se, 12);
      // numpy's own run with the same N sits inside its bracket too
      expect(Math.abs(run.mean - grid)).toBeLessThan(3 * run.se);
    }
    // the note's own runs (4.985 ± 0.158 / 4.747 ± 0.050 / 4.771 ± 0.016) all hold 4.7594
    for (const run of k.monte_carlo.note_runs) expect(Math.abs(run.mean - k.hull_bs.call)).toBeLessThan(3 * run.se);
    // 1/√N: ten times the walkers, bracket √10 narrower
    const a = monteCarloOption(hull.S, hull.K, hull.r, hull.sigma, hull.T, 1000, rng(7)).se;
    const b = monteCarloOption(hull.S, hull.K, hull.r, hull.sigma, hull.T, 10000, rng(7)).se;
    expect(a / b).toBeCloseTo(Math.sqrt(10), 0);
  });

  it("one future is one number: the median path pays 3.53, a bad one pays 0", () => {
    expect(oneFuture(hull.S, hull.K, hull.r, hull.sigma, hull.T, 0)).toBeCloseTo(k.monte_carlo.one_future.value, 10);
    expect(oneFuture(hull.S, hull.K, hull.r, hull.sigma, hull.T, -3)).toBe(0);
  });
});

describe("B6 the x² exact check and the heat rod", () => {
  it("u = x² + (T − t): exact 1.25 at x = 0.5, τ = 1; the grid is exact to 1e−6 at any resolution and any λ ≤ ½", () => {
    const h = k.heat;
    expect(heatExact(h.x, h.tau)).toBe(h.exact);
    expect(h.exact).toBe(1.25);
    for (const g of h.grid) {
      const grid = heatGrid(h.x, h.tau, g.n, g.lam);
      expect(grid.lambda).toBeCloseTo(g.lam, 12);
      expect(grid.value).toBeCloseTo(g.value, 10);
      expect(Math.abs(grid.value - h.exact)).toBeLessThan(1e-6);
      // every cell, not just the probe: layer k at x equals x² + (T − t_k)
      for (let kk = 0; kk <= g.n; kk++) for (let j = 0; j < grid.layers[kk].length; j++) expect(grid.layers[kk][j]).toBeCloseTo(grid.xAt(kk, j) ** 2 + (g.n - kk) * grid.dt, 6);
    }
    for (const n of [3, 17, 128]) expect(Math.abs(heatGrid(0.5, 1, n).value - 1.25)).toBeLessThan(1e-6);
  });

  it("walkers for x²: 20,000 paths → mean within 3 SE of 1.25, SE ≈ 0.0124 (sd √(2τ² + 4x²τ) = √3)", () => {
    const h = k.heat;
    expect(h.mc_se).toBeCloseTo(0.0124, 3);
    expect(Math.abs(h.mc_mean - 1.25)).toBeLessThan(3 * h.mc_se);
    expect(Math.abs(h.note_mc.mean - 1.25)).toBeLessThan(3 * h.note_mc.se);
    const mc = heatMonteCarlo(0.5, 1, 20000, rng(3));
    expect(mc.sdExact).toBeCloseTo(h.mc_sd_exact, 12);
    expect(mc.sdExact).toBeCloseTo(Math.sqrt(3), 12);
    expect(mc.se).toBeCloseTo(0.0124, 2);
    expect(insideBracket(mc, 1.25, 3)).toBe(true);
  });

  it("curvature arrows: second differences of the hockey stick are 0 except at the kink", () => {
    const c = k.curvature;
    const sd = secondDifference(c.V);
    c.second_diff.forEach((v, i) => expect(sd[i + 1]).toBeCloseTo(v, 12));
    expect(sd[2]).toBe(2);
    expect(sd[1]).toBe(0);
    expect(sd[3]).toBe(0);
    expect(sd[0]).toBe(0);
    expect(sd[6]).toBe(0);
    // under pure diffusion a cell moves by D·δt·(second difference)/δx²: only the kink moves
    const arrows = curvatureArrows(c.V, c.dx, 0.1, 8);
    expect(arrows[2]).toBeCloseTo((8 * 0.1 * 2) / 4, 12);
    arrows.forEach((a, i) => i !== 2 && expect(a).toBe(0));
    // and with D = ½σ²S² per node the arrow scales with S²
    const arrows2 = curvatureArrows(c.V, c.dx, 0.1, c.S.map((s) => 0.5 * 0.04 * s * s));
    expect(arrows2[2]).toBeCloseTo((0.5 * 0.04 * 1600 * 0.1 * 2) / 4, 12);
  });

  it("the step too far: λ > ½ gives a negative middle weight, the engine refuses it, and if forced the rod oscillates", () => {
    const u = k.heat.unstable;
    expect(stencil(0, 1, 1 / u.n, Math.sqrt(0.5 / u.n / u.lam_bad)).mid).toBeCloseTo(u.middle_weight_bad, 10);
    expect(() => heatGrid(0, 1, u.n, u.lam_bad)).toThrow(/step too far/);
    expect(() => heatGrid(0, 1, u.n, u.lam_ok)).not.toThrow();
    const s = stepTooFar(u.n, u.lam_ok, u.lam_bad);
    expect(s.ok.stable).toBe(true);
    expect(s.bad.stable).toBe(false);
    expect(s.bad.phi.mid).toBeCloseTo(-0.5, 10);
    s.okProfile.forEach((v, i) => expect(v).toBeCloseTo(u.profile_ok[i], 8));
    s.badProfile.forEach((v, i) => expect(v).toBeCloseTo(u.profile_bad[i], 4));
    expect(s.okSignChanges).toBe(u.sign_changes_ok);
    expect(s.badSignChanges).toBe(u.sign_changes_bad);
    expect(s.okSignChanges).toBe(1);
    expect(s.badSignChanges).toBeGreaterThan(20);
    expect(Math.max(...s.badProfile.map(Math.abs))).toBeCloseTo(u.max_abs_bad, 2);
    expect(Math.max(...s.okProfile.map(Math.abs))).toBeCloseTo(u.max_abs_ok, 8);
    // the generic grid refuses too, and the same spec with allowUnstable runs
    const spec = { drift: 0, vol: 1, rate: 0, x0: 0, T: 1, steps: 10, dx: 0.2, payoff: Math.abs };
    expect(() => backwardGrid(spec)).toThrow();
    expect(backwardGrid({ ...spec, allowUnstable: true }).stable).toBe(false);
    expect(signChanges([0, 1, 2, 3])).toBe(0);
    expect(signChanges([3, 2, 1, 2, 3])).toBe(1);
    expect(signChanges([0, 1, 0, 1, 0])).toBe(3);
  });
});
