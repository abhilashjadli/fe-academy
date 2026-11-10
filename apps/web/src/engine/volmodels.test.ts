import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-D3.json";
import { black76 } from "./bs";
import {
  CHAIN,
  FITS,
  cloudMean,
  hestonPrice,
  hestonSkew321,
  hestonSmile,
  impliedSmileFromCloud,
  localVolFromSmile,
  mertonPrice,
  mertonSmile,
  poissonWeights,
  rmsToDots,
  sabrSmile,
  sabrVol,
  simulateStory,
  type HestonModel,
} from "./volmodels";

const { F, r, T } = CHAIN;
const lv = key.heston_lewis;
const lewis: HestonModel = { F: lv.F, r: lv.r, T: lv.T, v0: lv.v0, kappa: lv.kappa, theta: lv.theta, eta: lv.eta, rho: lv.rho };
const std = key.heston_standard;
const standard: HestonModel = { F: 100, r: 0, T: 1, v0: std.v0, kappa: std.kappa, theta: std.theta, eta: std.eta, rho: std.rho };

describe("D3 — Heston by the Lewis integral", () => {
  it("reproduces QuantLib's Alan Lewis references to 1e-6 (the Python key holds them to 1e-9)", () => {
    let worst = 0;
    for (const row of lv.rows) {
      const c = hestonPrice({ ...lewis, K: row.K }, "call");
      const p = hestonPrice({ ...lewis, K: row.K }, "put");
      worst = Math.max(worst, Math.abs(c - row.call_ref), Math.abs(p - row.put_ref));
      expect(c).toBeCloseTo(row.call_ref, 6);
      expect(p).toBeCloseTo(row.put_ref, 6);
      expect(c).toBeCloseTo(row.call, 9); // same rule as the key
    }
    expect(worst).toBeLessThan(1e-6);
    expect(lv.max_abs_err).toBeLessThan(1e-9);
  });
  it("the chapter's standard set: calls and implied vols as in the key; ATM vol falls when η rises (Feller broken at 0.5)", () => {
    const ivs = hestonSmile(standard, std.K);
    std.K.forEach((K, i) => {
      expect(hestonPrice({ ...standard, K })).toBeCloseTo(std.calls[i], 8);
      expect(ivs[i]).toBeCloseTo(std.iv[i], 8);
    });
    expect(hestonPrice({ ...standard, K: 100 })).toBeCloseTo(7.6157, 4);
    expect(hestonPrice({ ...standard, eta: 0.5, K: 100 })).toBeCloseTo(std.eta_0_5.calls[2], 8);
    expect(hestonPrice({ ...standard, eta: 0.5, K: 100 })).toBeLessThan(hestonPrice({ ...standard, K: 100 }));
    expect(hestonPrice({ ...standard, eta: 0.5, K: 120 })).toBeLessThan(hestonPrice({ ...standard, K: 120 }));
  });
  it("Heston → Black–Scholes as η → 0 (first order in η; exact at η = 0)", () => {
    const bs = black76({ F: 100, K: 100, r: 0, sigma: 0.2, T: 1 });
    expect(bs).toBeCloseTo(std.eta_to_0.bs_20pct, 10);
    expect(Math.abs(hestonPrice({ ...standard, eta: 1e-4, K: 100 }) - bs)).toBeLessThan(1e-4);
    expect(hestonPrice({ ...standard, eta: 0, K: 100 })).toBeCloseTo(bs, 10);
    let prev = Infinity;
    for (const [eta, call] of std.eta_to_0.ladder as [number, number][]) {
      const d = Math.abs(hestonPrice({ ...standard, eta, K: 100 }) - bs);
      expect(d).toBeCloseTo(Math.abs(call - bs), 5); // η = 1e-4 is ill-conditioned (2/η² × log): TS and numpy differ by ~2e-6 there
      expect(d).toBeLessThan(prev);
      prev = d;
    }
  });
  it("Gatheral Table 3.2: ATM vols 13.19 / 13.27 / 14.23 % and the (3.21) skew approximation", () => {
    const g = key.heston_gatheral_3_2;
    const m: HestonModel = { F: 1, r: 0, T: 1, v0: g.v0, kappa: g.kappa, theta: g.theta, eta: g.eta, rho: g.rho };
    for (const row of g.rows) {
      const [lo, at, hi] = hestonSmile({ ...m, T: row.T }, [Math.exp(-0.05), 1, Math.exp(0.05)]);
      expect(at).toBeCloseTo(row.atm_vol, 8);
      expect((hi * hi - lo * lo) / 0.1).toBeCloseTo(row.var_skew_fd, 7);
      expect(hestonSkew321(row.T, g.kappa, g.eta, g.rho)).toBeCloseTo(row.var_skew_321, 10);
    }
    expect(g.rows[0].atm_vol).toBeCloseTo(0.1319, 4);
    expect(g.rows[2].atm_vol).toBeCloseTo(0.1423, 4);
  });
  it("prices a 65-strike smile in under 100 ms", () => {
    const strikes = FITS.grid;
    expect(strikes.length).toBe(65);
    hestonSmile(FITS.heston, strikes); // warm up
    const t0 = performance.now();
    const ivs = hestonSmile(FITS.heston, strikes);
    const ms = performance.now() - t0;
    expect(ivs.every((v) => Number.isFinite(v))).toBe(true);
    expect(ms).toBeLessThan(100);
  });
});

describe("D3 — put–call parity under every model", () => {
  it("call − put = e^{-rT}(F − K) for Heston, Merton and SABR-priced options", () => {
    const D = Math.exp(-r * T);
    for (const K of [22000, 22600, 23300]) {
      expect(hestonPrice({ ...FITS.heston, K }, "call") - hestonPrice({ ...FITS.heston, K }, "put")).toBeCloseTo(D * (F - K), 8);
      expect(mertonPrice({ ...FITS.merton, K }, "call") - mertonPrice({ ...FITS.merton, K }, "put")).toBeCloseTo(D * (F - K), 8);
      const s = sabrVol(F, K, T, FITS.sabr);
      expect(black76({ F, K, r, sigma: s, T }, "call") - black76({ F, K, r, sigma: s, T }, "put")).toBeCloseTo(D * (F - K), 8);
    }
    expect(hestonPrice({ ...lewis, K: 100 }, "call") - hestonPrice({ ...lewis, K: 100 }, "put")).toBeCloseTo(Math.exp(-lv.r * lv.T) * (lv.F - 100), 9);
  });
});

describe("D3 — Merton's series", () => {
  it("the metricgate short row: 2.8176 (Black–Scholes 2.5066) to 4 d.p.; λ = 0 is Black–Scholes exactly", () => {
    const m = key.merton_metricgate;
    const Fm = m.S * Math.exp(m.r * m.T);
    const p = { F: Fm, K: m.K, r: m.r, T: m.T, sigma: m.sigma, lam: m.lam, muJ: m.muJ, sJ: m.sJ };
    expect(mertonPrice(p)).toBeCloseTo(2.8176, 4);
    expect(mertonPrice(p)).toBeCloseTo(m.call, 10);
    expect(mertonPrice(p, "put")).toBeCloseTo(m.put, 10);
    const bs = black76({ F: Fm, K: m.K, r: m.r, sigma: m.sigma, T: m.T });
    expect(bs).toBeCloseTo(2.5066, 4);
    expect(mertonPrice({ ...p, lam: 0 })).toBeCloseTo(bs, 12);
  });
  it("Gatheral Table 5.2: calls 18.4007 … 0.1315 and vols 25.22 → 21.14 %", () => {
    const g = key.merton_gatheral_5_2;
    const model = { F: 100, r: 0, T: g.T, sigma: g.sigma, lam: g.lam, muJ: g.muJ, sJ: g.sJ };
    const ivs = mertonSmile(model, g.K);
    g.K.forEach((K, i) => {
      expect(mertonPrice({ ...model, K })).toBeCloseTo(g.calls[i], 9);
      expect(ivs[i]).toBeCloseTo(g.iv[i], 8);
    });
    expect(g.calls[0]).toBeCloseTo(18.4007, 4);
    expect(g.calls[4]).toBeCloseTo(0.1315, 4);
    expect(ivs[0]).toBeGreaterThan(ivs[4]);
  });
  it("Poisson weights: 97.0 / 2.9 / 0.04 % at one jump a year and 11 days; 86.0 / 13.0 / 1.0 % at five", () => {
    for (const lam of [1, 5]) {
      const row = key.poisson_weights[String(lam.toFixed(1)) as "1.0" | "5.0"];
      const w = poissonWeights(lam, T, 6);
      row.weights.forEach((v, i) => expect(w[i]).toBeCloseTo(v, 12));
      expect(1 - w[0]).toBeCloseTo(row.p_at_least_one, 12);
    }
    const w1 = poissonWeights(1, T, 3);
    expect(w1[0]).toBeCloseTo(0.9703, 4);
    expect(w1[1]).toBeCloseTo(0.0292, 4);
    expect(w1[2]).toBeCloseTo(0.0004, 4);
    expect(poissonWeights(1, T).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });
});

describe("D3 — SABR (Hagan) as the ruler", () => {
  it("quantt's example: 26.52 / 22.87 / 20.47 / 19.22 / 18.88 % at K = 2–4 %", () => {
    const q = key.sabr_quantt;
    const v = sabrSmile(q.F, q.T, { alpha: q.alpha, beta: q.beta, rho: q.rho, nu: q.nu }, q.K);
    q.ref.forEach((ref, i) => {
      expect(Math.abs(v[i] - ref)).toBeLessThan(5e-5);
      expect(v[i]).toBeCloseTo(q.vol[i], 10);
    });
  });
  it("β = 1 ATM equals Gatheral (7.7): 20.1107 % to 1e-4 (in fact to 1e-12)", () => {
    const g = key.sabr_beta1_atm;
    const v = sabrVol(g.F, g.F, g.T, { alpha: g.alpha, beta: 1, rho: g.rho, nu: g.nu });
    expect(Math.abs(v - g.gatheral_7_7)).toBeLessThan(1e-12);
    expect(v).toBeCloseTo(0.201107, 4);
  });
});

describe("D3 — the three fits to the real chain", () => {
  const grid = FITS.grid;
  const check = (name: keyof typeof key.fits, curve: number[], volAt: (K: number) => number) => {
    const f = key.fits[name];
    f.curve.forEach((v, i) => expect(Math.abs(curve[i] - v)).toBeLessThan(1e-6));
    const rms = rmsToDots(volAt);
    expect(rms).toBeCloseTo(f.rms_vol_pts, 5);
    expect(rms).toBeLessThan(0.17);
    expect(volAt(22000)).toBeCloseTo(f.wing_22000, 6);
    expect(volAt(23300)).toBeCloseTo(f.wing_23300, 6);
    return rms;
  };
  it("SABR β = 1: α 0.1573, ρ −0.309, ν 2.71, rms 0.160", () => {
    check("sabr", sabrSmile(F, T, FITS.sabr, grid), (K) => sabrVol(F, K, T, FITS.sabr));
    expect(FITS.sabr.alpha).toBeCloseTo(0.1573, 3);
    expect(FITS.sabr.rho).toBeCloseTo(-0.309, 2);
    expect(FITS.sabr.nu).toBeCloseTo(2.71, 1);
  });
  it("Heston κ = 2, θ = v₀: v₀ 0.0273, ρ −0.311, η 0.87, rms 0.162 — and κ = 20 draws the same curve (η 1.09)", () => {
    const h = hestonSmile(FITS.heston, grid);
    check("heston", h, (K) => hestonSmile(FITS.heston, [K])[0]);
    const h20 = hestonSmile(FITS.hestonK20, grid);
    check("heston_k20", h20, (K) => hestonSmile(FITS.hestonK20, [K])[0]);
    expect(FITS.heston.v0).toBeCloseTo(0.0273, 3);
    expect(FITS.heston.rho).toBeCloseTo(-0.311, 2);
    expect(FITS.heston.eta).toBeCloseTo(0.87, 2);
    expect(FITS.hestonK20.eta).toBeCloseTo(1.09, 2);
    let worst = 0;
    grid.forEach((K, i) => {
      if (K >= 22250 && K <= 23050) worst = Math.max(worst, Math.abs(h[i] - h20[i]));
    });
    expect(100 * worst).toBeLessThan(0.02);
    expect(key.heston_kappa_unidentifiable_max_diff_vol_pts.full_grid).toBeLessThan(0.06);
  });
  it("Merton λ = 1: σ 14.4 %, μ_J −8.9 %, σ_J 6.1 %, rms 0.155; λ = 5: 13.6 %, −2.7 %, 3.7 %, rms 0.157", () => {
    check("merton", mertonSmile(FITS.merton, grid), (K) => mertonSmile(FITS.merton, [K])[0]);
    check("merton_l5", mertonSmile(FITS.mertonL5, grid), (K) => mertonSmile(FITS.mertonL5, [K])[0]);
    expect(FITS.merton.sigma).toBeCloseTo(0.144, 3);
    expect(FITS.merton.muJ).toBeCloseTo(-0.089, 3);
    expect(FITS.merton.sJ).toBeCloseTo(0.061, 3);
    expect(FITS.mertonL5.sigma).toBeCloseTo(0.136, 3);
    expect(FITS.mertonL5.muJ).toBeCloseTo(-0.027, 3);
    expect(FITS.mertonL5.sJ).toBeCloseTo(0.037, 3);
  });
  it("the quadratic from D2 scores 0.159 and the three stories 0.155–0.162: the chain does not choose", () => {
    const q = FITS.quadratic;
    expect(rmsToDots((K) => q.a + q.b * Math.log(K / F) + q.c * Math.log(K / F) ** 2)).toBeCloseTo(key.fits.quadratic.rms_vol_pts, 6);
    const r_ = FITS.rmsVolPts;
    expect(r_.quadratic).toBeCloseTo(0.159, 3);
    expect(Math.max(r_.sabr, r_.heston, r_.merton)).toBeLessThan(0.165);
    expect(Math.min(r_.sabr, r_.heston, r_.merton)).toBeGreaterThan(0.15);
    // the fan-out at 22,000: Merton 17.9, Heston 17.4, SABR 17.5 %
    expect(key.fits.merton.wing_22000).toBeGreaterThan(key.fits.sabr.wing_22000);
    expect(key.fits.sabr.wing_22000).toBeGreaterThan(key.fits.heston.wing_22000);
  });
});

describe("D3 — local vol painted from D2's smile", () => {
  const map = localVolFromSmile(FITS.quadratic, F, T);
  it("the strip matches the key: 19.2 % at 22,000, a 14.7 % floor near 23,050, 14.9 % at 23,300; local ATM slope −0.77 vs implied −0.42", () => {
    const k = key.local_vol;
    k.grid.forEach((K, i) => {
      expect(map.sigma(K, T)).toBeCloseTo(k.sigma_loc[i], 10);
      expect(map.sigma(K, 1e-8)).toBeCloseTo(k.sigma_loc_t0[i], 10);
    });
    expect(map.sigma(22000, T)).toBeCloseTo(k.at_22000, 10);
    expect(map.sigma(23300, T)).toBeCloseTo(k.at_23300, 10);
    expect(k.at_22000).toBeCloseTo(0.192, 3);
    expect(k.min_sigma_loc).toBeCloseTo(0.147, 3);
    expect(k.at_23300).toBeCloseTo(0.149, 3);
    const h = 1e-3;
    expect((map.sigma(F * Math.exp(h), T) - map.sigma(F * Math.exp(-h), T)) / (2 * h)).toBeCloseTo(k.atm_slope_local, 8);
    expect(k.atm_slope_local / k.atm_slope_implied).toBeGreaterThan(1.5);
    // held constant beyond the painted range
    expect(map.sigma(21000, T)).toBe(map.sigma(21800, T));
    expect(map.sigma(24000, T)).toBe(map.sigma(23400, T));
    // the formula agrees with price-based Dupire in the key
    for (const d of k.dupire_price_check) expect(Math.abs(d.formula - d.price_fd)).toBeLessThan(1e-5);
  });
  it("a cloud grown on the strip reprices the smoothed smile within 0.1 vol point across 22,250–23,050", () => {
    const c = key.local_vol_check;
    const cloud = simulateStory({ story: "local", map, F, T }, 200_000, 22, 7);
    const ivs = impliedSmileFromCloud(cloud, c.strikes, r, T, F);
    let worst = 0;
    ivs.forEach((v, i) => (worst = Math.max(worst, Math.abs(v - c.smile[i]))));
    expect(100 * worst).toBeLessThan(0.1);
    expect(c.mc.max_err_vol_pts).toBeLessThan(0.1);
    expect(c.pde_max_err_vol_pts).toBeLessThan(0.05);
    expect(c.pde_T_slice_held_constant.max_err_vol_pts).toBeGreaterThan(0.25); // the T-slice alone would not
  });
});

describe("D3 — the −5 % day and the second expiry", () => {
  const day = key.day_minus_5pct;
  const F1 = day.F_after;
  it("local vol flattens; Heston and Merton slide with the forward (same smile in log-moneyness)", () => {
    expect(day.local_vol.verdict).toBe("flattens");
    expect(day.heston.verdict).toBe("slides");
    expect(day.merton.verdict).toBe("slides");
    expect(Math.abs(day.local_vol.after.slope)).toBeLessThan(0.5 * Math.abs(day.local_vol.before.slope));
    // the pricers are homogeneous in (F, K): the smile at F' is the smile at F read at the same k
    const ks = [-0.02, -0.01, 0, 0.01, 0.02];
    const at = (Fx: number) => ks.map((k) => Fx * Math.exp(k));
    const h0 = hestonSmile(FITS.heston, at(F)), h1 = hestonSmile({ ...FITS.heston, F: F1 }, at(F1));
    const m0 = mertonSmile(FITS.merton, at(F)), m1 = mertonSmile({ ...FITS.merton, F: F1 }, at(F1));
    ks.forEach((_, i) => {
      expect(h1[i]).toBeCloseTo(h0[i], 9);
      expect(m1[i]).toBeCloseTo(m0[i], 9);
    });
    expect(h0[2]).toBeCloseTo(day.heston.after.atm_vol, 8);
    expect(m0[2]).toBeCloseTo(day.merton.after.atm_vol, 8);
    // at the same absolute strikes the sliding smiles read lower after the drop; the local-vol smile reads higher
    const i600 = day.strikes.indexOf(22600);
    expect(day.heston.after.iv_at_strikes[i600]).toBeLessThan(day.heston.before.iv_at_strikes[i600]);
    expect(day.merton.after.iv_at_strikes[i600]).toBeLessThan(day.merton.before.iv_at_strikes[i600]);
    expect(day.local_vol.after.iv_at_strikes[i600]).toBeGreaterThan(day.local_vol.before.iv_at_strikes[i600]);
  });
  it("the sticky-local cloud grown from the new forward agrees with the key's PDE panel", () => {
    const map = localVolFromSmile(FITS.quadratic, F, T);
    const cloud = simulateStory({ story: "local", map, F: F1, T }, 100_000, 22, 3);
    const h = 0.01;
    const [lo, at, hi] = impliedSmileFromCloud(cloud, [F1 * Math.exp(-h), F1, F1 * Math.exp(h)], r, T, F1);
    expect(Math.abs(at - day.local_vol.after.atm_vol)).toBeLessThan(0.003);
    const slope = (hi - lo) / (2 * h);
    expect(Math.abs(slope - day.local_vol.after.slope)).toBeLessThan(0.15);
    expect(Math.abs(slope)).toBeLessThan(0.5 * Math.abs(day.local_vol.before.slope));
  });
  it("Gatheral Table 3.1 SPX skews against each fitted story: Heston fades like 1/T, Merton dies out, local vol n/a", () => {
    const ts = key.term_structure;
    expect(ts.rows.map((x) => x.spx_var_skew)).toEqual([-0.0955, -0.1601, -0.0594]);
    for (const row of ts.rows) {
      const hk = hestonSmile({ ...FITS.heston, F: 1, T: row.T }, [Math.exp(-0.01), 1, Math.exp(0.01)]);
      expect((hk[2] * hk[2] - hk[0] * hk[0]) / 0.02).toBeCloseTo(row.heston_var_skew, 6);
      const mk = mertonSmile({ ...FITS.merton, F: 1, T: row.T }, [Math.exp(-0.01), 1, Math.exp(0.01)]);
      expect((mk[2] * mk[2] - mk[0] * mk[0]) / 0.02).toBeCloseTo(row.merton_var_skew, 6);
      expect(hestonSkew321(row.T, FITS.heston.kappa, FITS.heston.eta, FITS.heston.rho)).toBeCloseTo(row.heston_321, 10);
      expect(row.local_vol).toMatch(/n\/a/);
    }
    const [d1, m1, m21] = ts.rows;
    expect(Math.abs(m21.heston_var_skew)).toBeLessThan(Math.abs(m1.heston_var_skew));
    expect(Math.abs(m21.merton_var_skew)).toBeLessThan(0.2 * Math.abs(m1.merton_var_skew));
    expect(Math.abs(d1.merton_var_skew)).toBeGreaterThan(Math.abs(m1.merton_var_skew));
  });
});

describe("D3 — the breathing clouds", () => {
  it("each story's terminal mean is the forward within 3 s.e. at 20k paths, and a seed replays", () => {
    const map = localVolFromSmile(FITS.quadratic, F, T);
    const clouds = [
      simulateStory({ story: "local", map, F, T }, 20_000, 22, 11),
      simulateStory({ story: "heston", model: FITS.heston }, 20_000, 22, 11),
      simulateStory({ story: "merton", model: FITS.merton }, 20_000, 22, 11),
    ];
    for (const c of clouds) {
      expect(c.length).toBe(20_000);
      const { mean, se } = cloudMean(c);
      expect(Math.abs(mean - F)).toBeLessThan(3 * se);
      expect(se).toBeLessThan(F * 0.002);
    }
    const again = simulateStory({ story: "heston", model: FITS.heston }, 20_000, 22, 11);
    expect(again[123]).toBe(clouds[1][123]);
    expect(simulateStory({ story: "heston", model: FITS.heston }, 20_000, 22, 12)[123]).not.toBe(clouds[1][123]);
  });
  it("the Heston and Merton clouds trace smiles that tilt the right way and sit near the pricers", () => {
    const strikes = [22250, 22600, 23050];
    const h = impliedSmileFromCloud(simulateStory({ story: "heston", model: FITS.heston }, 100_000, 44, 5), strikes, r, T, F);
    const hx = hestonSmile(FITS.heston, strikes);
    const m = impliedSmileFromCloud(simulateStory({ story: "merton", model: FITS.merton }, 100_000, 22, 5), strikes, r, T, F);
    const mx = mertonSmile(FITS.merton, strikes);
    strikes.forEach((_, i) => {
      expect(Math.abs(h[i] - hx[i])).toBeLessThan(0.004);
      expect(Math.abs(m[i] - mx[i])).toBeLessThan(0.004);
    });
    expect(h[0]).toBeGreaterThan(h[2]);
    expect(m[0]).toBeGreaterThan(m[2]);
  });
});
