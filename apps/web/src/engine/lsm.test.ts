import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-F2.json";
import kd3 from "./__fixtures__/key-D3.json";
import { black76Greeks } from "./bs";
import { adGreek, alphaForAtm, black76Plain, bumpDelta, lsmPrice, lsmSmall, lstsq, mcDelta, rmsVolPts, seededPaths, type LsmModel } from "./lsm";
import { sabrSmile } from "./volmodels";

describe("F2 — Hull's eight paths", () => {
  const H = key.hull209;
  it("the two regressions, the exercise decisions and the price 0.1144 reproduce Hull Tables 20.1–20.4", () => {
    const r = lsmSmall(H.paths, H.K, Math.exp(-H.r));
    expect(r.price).toBeCloseTo(H.price, 10);
    expect(r.price).toBeCloseTo(H.book_price, 4);
    expect(r.price).toBeGreaterThan(H.immediate);
    r.rounds.forEach((round, i) => {
      const k = H.rounds[i];
      expect(round.t).toBe(k.t);
      expect(round.paths).toEqual(k.paths);
      round.coef.forEach((c, j) => expect(c).toBeCloseTo(k.coef[j], 8));
      round.continuation.forEach((c, j) => expect(c).toBeCloseTo(k.continuation[j], 8));
      expect(round.exercise).toEqual(k.exercise);
    });
    // Hull's printed coefficients (3 d.p.) and his exercise sets
    const t2 = r.rounds[0];
    t2.coef.forEach((c, j) => expect(Math.abs(c - H.book.t2.coef[j])).toBeLessThan(0.0015));
    expect(t2.paths.filter((_, j) => t2.exercise[j])).toEqual(H.book.t2.exercise);
    const t1 = r.rounds[1];
    t1.coef.forEach((c, j) => expect(Math.abs(c - H.book.t1.coef[j])).toBeLessThan(0.0015));
    expect(t1.paths.filter((_, j) => t1.exercise[j])).toEqual(H.book.t1.exercise);
    r.cash.forEach((row, i) => row.slice(1).forEach((v, j) => expect(v).toBeCloseTo(H.cash[i][j], 10)));
  });
  it("least squares on a tiny design agrees with the normal equations", () => {
    const x = [1, 2, 3, 4];
    const y = [2.1, 3.9, 6.2, 7.8];
    const c = lstsq([x.map(() => 1), x], y);
    expect(c[1]).toBeCloseTo(1.94, 10);
    expect(c[0]).toBeCloseTo(0.15, 10);
  });
});

describe("F2 — LSM at scale against F1's grid", () => {
  const L = key.lsm;
  const m: LsmModel = { S0: L.S0, K: L.K, r: L.r, sigma: L.sigma, T: L.T, steps: L.steps };
  it("the seeded 2,000-path run is the key's exactly: price, SE, boundary, European on the same paths", () => {
    const paths = seededPaths(m, L.seeded.seed, L.seeded.n);
    L.seeded.first_path.forEach((v, i) => expect(paths[i]).toBeCloseTo(v, 8));
    const r = lsmPrice(m, paths, L.seeded.n);
    expect(r.price).toBeCloseTo(L.seeded.price, 8);
    expect(r.se).toBeCloseTo(L.seeded.se, 8);
    expect(r.european).toBeCloseTo(L.seeded.european_same_paths, 8);
    expect(r.boundary.length).toBe(L.seeded.boundary.length);
    r.boundary.forEach((b, i) => expect(b).toBeCloseTo(L.seeded.boundary[i], 8));
  });
  it("the reference sits within two standard errors of the grid's 4.284 and above the European 4.076", () => {
    const R = L.reference;
    expect(Math.abs(R.price - L.truth_grid)).toBeLessThan(2 * R.se);
    expect(R.price).toBeGreaterThan(L.european_bs + 0.15);
    expect(Math.abs(R.cubic_price - R.price)).toBeLessThan(R.se);
    expect(L.ladder[0].price).toBeGreaterThan(L.truth_grid + 0.1); // optimistic at 1,000 paths
    expect(Math.abs(L.ladder[L.ladder.length - 1].price - L.truth_grid)).toBeLessThan(0.02);
  });
});

describe("F2 — the calibration valley", () => {
  const C = key.calib;
  it("D3's SABR fit scores its own rms on the 34 dots; ρ = 0 and a flat smile score three times worse", () => {
    const fit = C.fit;
    const model = sabrSmile(C.F, C.T, { alpha: fit.alpha, beta: 1, rho: fit.rho, nu: fit.nu }, C.strikes);
    expect(rmsVolPts(model, C.ivs)).toBeCloseTo(C.rms_at_fit, 8);
    expect(C.rms_at_fit).toBeCloseTo(kd3.fits.sabr.rms_vol_pts, 6);
    expect(C.rms_at_rho0).toBeGreaterThan(2.5 * C.rms_at_fit);
    expect(C.rms_flat).toBeGreaterThan(2.5 * C.rms_at_fit);
  });
  it("the surface with α set by the at-the-money vol reproduces the key, and the valley is long in ν", () => {
    for (let i = 0; i < C.rhos.length; i += 6)
      for (let j = 0; j < C.nus.length; j += 6) {
        const a = alphaForAtm(C.atm_iv, C.rhos[i], C.nus[j], C.T);
        const model = sabrSmile(C.F, C.T, { alpha: a, beta: 1, rho: C.rhos[i], nu: C.nus[j] }, C.strikes);
        expect(rmsVolPts(model, C.ivs)).toBeCloseTo(C.surface_alpha_atm[i][j], 6);
      }
    expect(C.valley_nu_range[1] - C.valley_nu_range[0]).toBeGreaterThan(2);
    expect(C.valley_rho_range[1] - C.valley_rho_range[0]).toBeLessThan(0.3);
    expect(C.best_on_grid.rms).toBeGreaterThanOrEqual(C.rms_at_fit - 1e-9);
  });
});

describe("F2 — automatic differentiation", () => {
  const A = key.ad;
  const p = A.chain;
  it("dual numbers through Black-76 give delta, vega, theta, rho equal to the closed forms", () => {
    expect(black76Plain(p)).toBeCloseTo(A.price, 10);
    const g = black76Greeks({ F: p.F, K: p.K, r: p.r, T: p.T, sigma: p.sigma });
    const d = adGreek(p, "F");
    expect(d.value).toBeCloseTo(A.dual.delta, 12);
    expect(d.value).toBeCloseTo(g.delta, 12);
    expect(adGreek(p, "sigma").value).toBeCloseTo(A.dual.vega, 8);
    expect(adGreek(p, "T").value).toBeCloseTo(A.dual.theta, 6);
    expect(adGreek(p, "r").value).toBeCloseTo(A.dual.rho, 8);
    d.tape.forEach((n, i) => {
      expect(n.value).toBeCloseTo(A.tape[i].value, 10);
      expect(n.d).toBeCloseTo(A.tape[i].dF, 10);
    });
  });
  it("bump-and-revalue: the V — truncation down to about 1e−6, round-off up from there", () => {
    const errs = A.bumps.map((b) => {
      const d = bumpDelta(p, b.rel);
      if (b.rel >= 1e-6) {
        // the truncation regime is deterministic; below it round-off differs between Python's and JS's libm, so only the order is compared
        expect(d.central - A.dual.delta).toBeCloseTo(b.err_central, 9);
        expect(d.forward - A.dual.delta).toBeCloseTo(b.err_forward, 9);
      } else {
        expect(Math.log10(Math.abs(d.central - A.dual.delta) + 1e-16)).toBeCloseTo(Math.log10(Math.abs(b.err_central) + 1e-16), -1);
      }
      return Math.abs(d.central - A.dual.delta);
    });
    const best = errs.indexOf(Math.min(...errs));
    expect(A.bumps[best].rel).toBeLessThanOrEqual(1e-5);
    expect(A.bumps[best].rel).toBeGreaterThanOrEqual(1e-7);
    expect(errs[errs.length - 1]).toBeGreaterThan(errs[best] * 1e3); // round-off at 1e−12
    expect(Math.abs(A.bumps[0].err_forward)).toBeGreaterThan(10 * Math.abs(A.bumps[0].err_central));
  });
  it("Monte Carlo delta: pathwise and common-random-number bumps agree with the exact delta; fresh-number bumps are noise", () => {
    const M = A.mc;
    const r = mcDelta(p, M.seed, M.seed_indep, M.n, M.bump_rel);
    expect(r.pathwise.mean).toBeCloseTo(M.pathwise.mean, 8);
    expect(r.bumpCrn.mean).toBeCloseTo(M.bump_crn.mean, 8);
    expect(r.bumpIndep.mean).toBeCloseTo(M.bump_indep.mean, 8);
    expect(Math.abs(r.pathwise.mean - A.dual.delta)).toBeLessThan(2 * r.pathwise.se);
    expect(r.bumpIndep.se).toBeGreaterThan(4 * r.bumpCrn.se);
  });
});
