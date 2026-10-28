import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-A3.json";
import { acf, diff, ols, ols2, randomWalk, vif } from "./regression";
import { rng } from "./random";

describe("A3 regression engine vs statsmodels key", () => {
  for (const name of ["honest", "funnel", "echo"] as const) {
    it(`${name}: slope, R², naive / White / Newey–West SEs, DW, residual ACF`, () => {
      const k = key[name];
      const f = ols(k.x, k.y, name === "honest" ? 2 : 4);
      expect(f.slope).toBeCloseTo(k.slope, 8);
      expect(f.intercept).toBeCloseTo(k.intercept, 8);
      expect(f.r2).toBeCloseTo(k.r2, 8);
      expect(f.se).toBeCloseTo(k.se, 8);
      expect(f.seHC).toBeCloseTo(k.seHC, 8);
      expect(f.seHAC).toBeCloseTo(k.seHAC, 6);
      expect(f.dw).toBeCloseTo(k.dw, 8);
      const a = acf(f.resid, 5);
      for (let i = 0; i < 5; i++) expect(a[i]).toBeCloseTo(k.acf[i], 6);
      for (let i = 0; i < 5; i++) expect(f.resid[i]).toBeCloseTo(k.resid_first5[i], 8);
    });
  }

  it("echo: the honest (HAC) standard error is about double the naive one", () => {
    const f = ols(key.echo.x, key.echo.y, 4);
    expect(f.seHAC / f.se).toBeGreaterThan(1.8);
    expect(f.dw).toBeLessThan(0.5);
  });

  it("twins: two-regressor OLS, exploding SEs, VIF", () => {
    const k = key.twins;
    const f = ols2(k.x1, k.x2, k.y);
    for (let i = 0; i < 3; i++) {
      expect(f.coef[i]).toBeCloseTo(k.coef[i], 5);
      expect(f.se[i]).toBeCloseTo(k.se[i], 5);
    }
    expect(f.r2).toBeCloseTo(k.r2, 8);
    expect(vif(k.x1, k.x2)).toBeCloseTo(k.vif, 3);
    expect(f.se[1]).toBeGreaterThan(1);
  });

  it("drunks: the fixed pair's spurious R², DW and the differenced R²", () => {
    const k = key.drunks_fixed;
    const f = ols(k.a, k.b);
    expect(f.r2).toBeCloseTo(k.r2, 8);
    expect(f.dw).toBeCloseTo(k.dw, 8);
    expect(f.slope / f.se).toBeCloseTo(k.t, 6);
    expect(ols(diff(k.a), diff(k.b)).r2).toBeCloseTo(k.r2_diff, 8);
  });

  it("drunks: spurious-regression frequencies reproduce (Monte Carlo, loose)", () => {
    for (const c of key.drunks) {
      const r = rng(c.steps);
      const m = 600;
      let over = 0,
        tover = 0;
      for (let i = 0; i < m; i++) {
        const f = ols(randomWalk(c.steps, r), randomWalk(c.steps, r));
        if (f.r2 > 0.5) over++;
        if (Math.abs(f.slope / f.se) > 2) tover++;
      }
      expect(Math.abs(over / m - c.p_r2_over_half)).toBeLessThan(0.06);
      expect(Math.abs(tover / m - c.p_t_over_2)).toBeLessThan(0.08);
    }
  });
});
