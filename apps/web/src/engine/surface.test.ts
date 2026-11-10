import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-surface.json";
import slim from "../data/nifty-surface-2026-10-23.json";
import { impliedVolFwd } from "./bs";
import { fitSmile, forwardVol } from "./smile";

/** The real NIFTY surface of 23 Oct 2026 (bhavcopy close) against tests/answer-key/key_surface.py. */
const EXP = Object.values(key.expiries);

describe("real surface, 23 Oct 2026", () => {
  it("implied vols from the settlement prices match the key at every strike, both sides", () => {
    for (const e of EXP) {
      e.strikes.forEach((K, i) => {
        const c = impliedVolFwd(e.call_settle[i], { F: e.forward, K, r: key.r, T: e.T }, "call");
        const p = impliedVolFwd(e.put_settle[i], { F: e.forward, K, r: key.r, T: e.T }, "put");
        expect(c.ok).toBe(true);
        expect(p.ok).toBe(true);
        expect(c.sigma).toBeCloseTo(e.call_iv[i], 7);
        expect(p.sigma).toBeCloseTo(e.put_iv[i], 7);
      });
    }
  });

  it("the quadratic fit of each expiry reproduces a, b, c and the at-the-money variance skew 2ab", () => {
    for (const e of EXP) {
      const fit = fitSmile(e.forward, [...e.strikes, ...e.strikes], [...e.call_iv, ...e.put_iv]);
      expect(fit.a).toBeCloseTo(e.fit.a, 8);
      expect(fit.b).toBeCloseTo(e.fit.b, 7);
      expect(fit.c).toBeCloseTo(e.fit.c, 5);
      expect(fit.rmsVolPts).toBeCloseTo(e.fit.rms_vol_pts, 6);
      expect(2 * fit.a * fit.b).toBeCloseTo(e.var_skew, 8);
      expect(e.var_skew_fd_1pct).toBeCloseTo(e.var_skew, 2);
    }
  });

  it("the figures' slice is the key's: forwards, ATM vols, skews, grid cells (OTM side)", () => {
    expect(slim.expiries.map((e) => e.label)).toEqual(EXP.map((e) => e.label));
    slim.expiries.forEach((s, i) => {
      const e = EXP[i];
      expect(s.F).toBe(e.forward);
      expect(s.T).toBe(e.T);
      expect(s.atmVol).toBe(e.atm_vol);
      expect(s.varSkew).toBe(e.var_skew);
      expect(s.gridVol).toEqual(e.grid_vol);
      slim.gridStrikes.forEach((K, j) => {
        const at = e.strikes.indexOf(K);
        expect(s.gridVol[j]).toBe(K < e.forward ? e.put_iv[at] : e.call_iv[at]);
      });
    });
  });

  it("the parity forward sits within a few points of the futures settlement where a future exists", () => {
    for (const e of EXP) if (e.futures_settle) expect(Math.abs(e.forward - e.futures_settle)).toBeLessThan(10);
  });

  it("forward vol between the chain and the monthly: variances add", () => {
    const f = key.forward_var_3nov_23nov;
    expect(forwardVol(f.v1, f.T1, f.v2, f.T2)).toBeCloseTo(f.forward_vol, 10);
    expect(f.forward_vol).toBeGreaterThan(Math.max(f.v1, f.v2)); // the 20 days between carry more than either print
  });
});
