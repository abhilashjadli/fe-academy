import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-C5.json";
import c3 from "./__fixtures__/key-C3C4.json";
import { deltaDrift, greeks2Fwd, greeks2Spot, plane, pnlGrid } from "./greeks2";

const F = 22603, r = 0.065, T = 11 / 365;
const strip = Object.fromEntries(c3.strip.strikes.map((K, i) => [K, c3.strip.call_iv[i]])) as Record<string, number>;

describe("C5 — higher Greeks, textbook rows (spot form, verified by finite differences in the key)", () => {
  for (const [name, row] of Object.entries(key.textbook)) {
    it(`${name}: vanna, volga, charm, speed, zomma, color, veta`, () => {
      const g = greeks2Spot(row.inputs);
      expect(g.vanna).toBeCloseTo(row.vanna, 8);
      expect(g.volga).toBeCloseTo(row.volga, 6);
      expect(g.charm).toBeCloseTo(row.charm, 8);
      expect(g.speed).toBeCloseTo(row.speed, 10);
      expect(g.zomma).toBeCloseTo(row.zomma, 8);
      expect(g.color).toBeCloseTo(row.color, 8);
      expect(g.veta).toBeCloseTo(row.veta, 6);
      expect(g.vanna).toBeCloseTo(row.fd.vanna_dDelta_dsigma, 4);
      expect(g.vanna).toBeCloseTo(row.fd.vanna_dVega_dS, 4);
    });
  }
  it("the printed values of the research note", () => {
    const g = greeks2Spot({ S: 100, K: 100, r: 0.05, sigma: 0.2, T: 1 });
    expect(g.vanna).toBeCloseTo(-0.2814, 4);
    expect(g.volga).toBeCloseTo(9.85, 2);
    expect(g.charm).toBeCloseTo(-0.06567, 5);
    expect(g.color).toBeCloseTo(0.01053, 5); // calendar time: ATM gamma grows as expiry nears
    const h = greeks2Spot({ S: 49, K: 50, r: 0.05, sigma: 0.2, T: 20 / 52 });
    expect(h.vanna).toBeCloseTo(0.1391, 4);
    expect(h.volga).toBeCloseTo(-0.2291, 4);
  });
  it("sign rules: vanna = −sign(d₂); volga = sign(d₁d₂) with a thin negative band near the money", () => {
    for (const [K, v] of Object.entries(key.sign_rows.T1)) {
      const g = greeks2Spot({ S: 100, K: Number(K), r: 0.05, sigma: 0.2, T: 1 });
      expect(g.vanna).toBeCloseTo(v.vanna, 8);
      expect(g.volga).toBeCloseTo(v.volga, 6);
      expect(Math.sign(g.vanna)).toBe(-Math.sign(g.d2));
      expect(Math.sign(g.volga)).toBe(Math.sign(g.d1 * g.d2));
    }
    expect(key.sign_rows.T1["105"].volga).toBeLessThan(0);
    expect(key.sign_rows.T1["90"].volga).toBeGreaterThan(0);
  });
  it("Natenberg's hook: delta 0.25 → 0.32 when the wobble goes 31.8 → 41.8 %", () => {
    expect(key.natenberg.delta_low).toBeCloseTo(0.25, 2);
    expect(key.natenberg.delta_high).toBeCloseTo(0.316, 3);
  });
});

describe("C5 — the real chain (forward form)", () => {
  it("the three rounds: short after a vol jump (OTM), long after a vol jump (ITM), long after a quiet week (OTM)", () => {
    for (const rd of key.rounds) {
      const g0 = greeks2Fwd({ F, K: rd.K, r, sigma: rd.iv, T });
      expect(g0.delta).toBeCloseTo(rd.delta0, 10);
      expect(g0.vanna).toBeCloseTo(rd.vanna, 8);
      expect(g0.charm).toBeCloseTo(rd.charm, 6);
    }
    expect(key.rounds[0].book_delta_after).toBeLessThan(-20);
    expect(key.rounds[1].book_delta_after).toBeGreaterThan(15);
    expect(key.rounds[2].book_delta_after).toBeGreaterThan(30);
    expect(Math.abs(key.atm_control.delta_vol_up - key.atm_control.delta0)).toBeLessThan(0.005);
  });
  it("vanna and charm vanish at the money and have mirror signs either side; their planes match the key", () => {
    const v = key.plane_values_11d;
    expect(Math.abs(v.vanna["22600"])).toBeLessThan(0.05);
    expect(v.vanna["22250"]).toBeLessThan(0);
    expect(v.vanna["23050"]).toBeGreaterThan(0);
    expect(v.charm["22250"]).toBeGreaterThan(0);
    expect(v.charm["23050"]).toBeLessThan(0);
    const pl = plane("vanna", F, r, key.planes.sigma, key.planes.strikes, key.planes.days);
    pl.forEach((row, i) => row.forEach((x, j) => expect(x).toBeCloseTo(key.planes.vanna[i][j], 8)));
    const pc = plane("charm", F, r, key.planes.sigma, key.planes.strikes, key.planes.days);
    pc.forEach((row, i) => row.forEach((x, j) => expect(x).toBeCloseTo(key.planes.charm[i][j], 5)));
    const pco = plane("color", F, r, key.planes.sigma, key.planes.strikes, key.planes.days);
    pco.forEach((row, i) => row.forEach((x, j) => expect(Math.abs(x - key.planes.color[i][j])).toBeLessThan(1e-6 + 1e-4 * Math.abs(x))));
  });
  it("the delta drift line reproduces round 1 and round 3 from the Greeks", () => {
    const g = greeks2Fwd({ F, K: 23050, r, sigma: strip["23050"], T });
    const vol = deltaDrift(g, 0, 0.1, 0);
    expect(Math.sign(vol.total)).toBe(1);
    const week = deltaDrift(g, 0, 0, 7 / 365);
    expect(Math.sign(week.total)).toBe(-1);
  });
  it("Raj's book on the spot × wobble grid: zero at the centre, −7.5 lakh in the double-trouble corner", () => {
    const g = pnlGrid({ F, K: 22600, r, sigma: key.planes.sigma, T }, key.grid.units, key.grid.vols, key.grid.moves);
    expect(g.hedgeUnits).toBeCloseTo(key.grid.hedge_units, 4);
    g.pnl.forEach((row, i) => row.forEach((x, j) => expect(x).toBeCloseTo(key.grid.pnl[i][j], 2)));
    expect(g.pnl[1][2]).toBeCloseTo(0, 6);
    expect(g.pnl[2][0] / 1e5).toBeCloseTo(-7.49, 2);
    expect(g.pnl[0][2]).toBeGreaterThan(0);
  });
});
