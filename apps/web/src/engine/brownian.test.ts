import { describe, expect, it } from "vitest";
import nifty from "../data/nifty50-long.json";
import key from "./__fixtures__/key-B3.json";
import {
  bridgeMidpoint,
  brownianBridgeRefine,
  brownianBridgeRefineTimes,
  dials,
  driftEstimateSd,
  driftFromReturns,
  fractionBelow,
  gbmDiscretePath,
  gbmMode,
  gbmProbAbove,
  gbmStep,
  logLogSlope,
  logReturns,
  median,
  normalPeak,
  odometer,
  odometerExpected,
  ouEuler,
  ouEulerGapFactor,
  ouEulerStable,
  ouEulerStationarySd,
  ouHalfLife,
  ouMean,
  ouPath,
  ouStationarySd,
  ouVariance,
  realisedVolFromPrices,
  realisedVolFromReturns,
  scaledRandomWalk,
  scaledWalkBarHeight,
  scaledWalkProbability,
  scaledWalkQuadraticVariation,
  secantRatio,
  speedometer,
  speedometerTypical,
  squaresDial,
  stepRatios,
  volEstimateSd,
  wienerChange,
} from "./brownian";
import { brownianPath, gbmMean, gbmMedian, incrementSums, quadraticVariationSd } from "./ito";
import { rng } from "./random";

const T = 1;

describe("B3 Brownian engine vs Python key", () => {
  // ---------------------------------------------------------------- bridge refinement (Figure 1)
  it("bridge refinement keeps every original point exactly and doubles n", () => {
    const r = rng(1);
    const p0 = brownianPath(16, T, r);
    const p1 = brownianBridgeRefine(p0, r);
    expect(p1.t.length - 1).toBe(32);
    for (let i = 0; i <= 16; i++) {
      expect(p1.t[2 * i]).toBe(p0.t[i]);
      expect(p1.W[2 * i]).toBe(p0.W[i]);
    }
    const p3 = brownianBridgeRefineTimes(p0, 3, r);
    expect(p3.t.length - 1).toBe(128);
    for (let i = 0; i <= 16; i++) expect(p3.W[8 * i]).toBe(p0.W[i]);
    for (let i = 1; i < p3.t.length; i++) expect(p3.t[i] - p3.t[i - 1]).toBeCloseTo(1 / 128, 12);
  });

  it("bridge midpoint has variance Δt/4 around the average of the ends", () => {
    expect(bridgeMidpoint(1, 3, 0.5, 0)).toBe(2);
    expect(bridgeMidpoint(0, 0, key.bridge.dt, 1)).toBeCloseTo(Math.sqrt(key.bridge.midpoint_var), 12);
    const r = rng(2);
    const m = 20000;
    let s = 0,
      s2 = 0;
    for (let k = 0; k < m; k++) {
      const p = brownianBridgeRefine({ t: [0, 0.5], W: [0.2, 0.6] }, r);
      const d = p.W[1] - 0.4;
      s += d;
      s2 += d * d;
    }
    expect(s / m).toBeCloseTo(0, 2);
    expect(s2 / m).toBeCloseTo(key.bridge.midpoint_var, 2);
    // refined increments have the right variance at the finer level: Var(ΔW) = Δt/2 for the half-steps
    const p = brownianBridgeRefine(brownianPath(2048, T, r), r);
    expect(incrementSums(p.W, T).sumDW2).toBeCloseTo(T, 1);
  });

  it("squares dial on a refined path stays within sd √(2/n)·T of T at every level", () => {
    for (const seed of [3, 4, 5, 6]) {
      const r = rng(seed);
      let p = brownianPath(16, T, r);
      for (const n of key.qv.n) {
        expect(p.W.length - 1).toBe(n);
        const q = squaresDial(p.W, T);
        expect(Math.abs(q - T)).toBeLessThan(4 * quadraticVariationSd(n, T)); // note §6: |Q − 1| < 4√(2/n)
        p = brownianBridgeRefineTimes(p, 4, r);
      }
    }
    // and the typical deviation across many refined paths is about one sd
    const r = rng(7);
    const m = 300,
      n = 256;
    let acc = 0;
    for (let k = 0; k < m; k++) {
      const p = brownianBridgeRefineTimes(brownianPath(16, T, r), 4, r);
      acc += (squaresDial(p.W, T) - T) ** 2;
    }
    const sd = Math.sqrt(acc / m);
    expect(sd / quadraticVariationSd(n, T)).toBeGreaterThan(0.75);
    expect(sd / quadraticVariationSd(n, T)).toBeLessThan(1.25);
  });

  it("secant ratio: a Brownian path reads 1/√Δt and its log-log slope is ½; a smooth curve's is 1", () => {
    const r = rng(8);
    let p = brownianPath(16, T, r);
    const dts: number[] = [],
      moves: number[] = [];
    for (let level = 0; level < 10; level++) {
      const n = p.W.length - 1;
      let s = 0;
      for (let i = 0; i < n; i++) s += secantRatio(p, i, i + 1) ** 2;
      expect(Math.sqrt(s / n) / speedometerTypical(n, T)).toBeCloseTo(1, 0);
      dts.push(T / n);
      moves.push(Math.sqrt(s / n) * (T / n)); // rms |ΔW|
      p = brownianBridgeRefine(p, r);
    }
    expect(logLogSlope(dts, moves)).toBeCloseTo(0.5, 1);
    const cosMoves = dts.map((dt) => Math.abs(Math.cos(1 + dt) - Math.cos(1)));
    expect(logLogSlope(dts, cosMoves)).toBeCloseTo(1, 1);
  });

  // ---------------------------------------------------------------- Shreve §3.2
  it("Shreve 3.2.11: P{W⁽¹⁰⁰⁾(¼) = 0.1} = 0.154981, bar 0.7749, normal peak 0.7979", () => {
    const { n, t, x } = key.shreve;
    expect(scaledWalkProbability(n, t, x)).toBeCloseTo(key.shreve.prob, 9);
    expect(scaledWalkProbability(n, t, x)).toBeCloseTo(0.154981, 6);
    expect(scaledWalkBarHeight(n, t, x)).toBeCloseTo(key.shreve.bar_height, 9);
    expect(scaledWalkBarHeight(n, t, x)).toBeCloseTo(0.7749, 4);
    expect(normalPeak(t)).toBeCloseTo(key.shreve.normal_peak, 12);
    expect(normalPeak(t)).toBeCloseTo(0.7979, 4);
    expect(scaledWalkProbability(n, t, 0.11)).toBe(0); // not a reachable value
    expect(scaledWalkQuadraticVariation(100, 1.37)).toBeCloseTo(key.shreve.qv_at_1_37, 12);
    expect(scaledWalkQuadraticVariation(100, 1.37)).toBeCloseTo(1.37, 12);
  });

  it("scaled random walk: ±1/√n steps on the grid k/n, quadratic variation exactly t, variance ≈ t", () => {
    const r = rng(9);
    const p = scaledRandomWalk(100, 1.37, r);
    expect(p.t.length - 1).toBe(137);
    expect(p.t[137]).toBeCloseTo(1.37, 12);
    for (let i = 1; i < p.W.length; i++) expect(Math.abs(p.W[i] - p.W[i - 1])).toBeCloseTo(0.1, 12);
    expect(incrementSums(p.W, 1.37).sumDW2).toBeCloseTo(1.37, 9);
    let s2 = 0;
    const m = 4000;
    for (let k = 0; k < m; k++) s2 += scaledRandomWalk(100, 0.25, r).W[25] ** 2;
    expect(s2 / m).toBeCloseTo(0.25, 1);
  });

  // ---------------------------------------------------------------- the three dials (Figure 2)
  it("three dials at n = 16 … 65,536 on one bridge-refined path: speedometer blows up, odometer ~ √n, squares settle", () => {
    const r = rng(10);
    let p = brownianPath(16, T, r);
    let prevOdo = 0;
    for (const o of key.odometer) {
      expect(p.W.length - 1).toBe(o.n);
      const d = dials(p.W, T);
      expect(speedometerTypical(o.n, T)).toBeCloseTo(o.speedometer_rms, 12);
      expect(odometerExpected(o.n, T)).toBeCloseTo(o.expected, 12);
      expect(d.speedometer / o.speedometer_rms).toBeCloseTo(1, 0);
      expect(Math.abs(d.odometer - o.expected)).toBeLessThan(4 * o.mc_sd + 0.3);
      expect(d.odometer).toBeGreaterThan(prevOdo * 2.5); // ×4 per 16× refinement in expectation
      expect(Math.abs(d.squares - d.clock)).toBeLessThan(4 * quadraticVariationSd(o.n, T));
      expect(speedometer(p.W, T).mean / (o.speedometer_mean)).toBeCloseTo(1, 0);
      expect(odometer(p.W)).toBe(d.odometer);
      prevOdo = d.odometer;
      p = brownianBridgeRefineTimes(p, 4, r);
    }
    // odometer growth ~ √n over many fresh paths (key Monte Carlo)
    for (const o of key.odometer.slice(0, 3)) {
      const m = 200;
      let s = 0;
      for (let k = 0; k < m; k++) s += odometer(brownianPath(o.n, T, r).W);
      expect(s / m / o.mc_mean).toBeCloseTo(1, 1);
    }
  });

  it("the ledger: per-step ratios (ΔW)²/Δt are χ²₁ — 68 % below 1, median 0.455 — while their average is 1", () => {
    const r = rng(11);
    const { W } = brownianPath(65536, T, r);
    const ratios = stepRatios(W, T);
    expect(fractionBelow(ratios, 1)).toBeCloseTo(key.qv.ratio_below_1, 2);
    expect(median(ratios)).toBeCloseTo(key.qv.ratio_median, 1);
    expect(key.qv.ratio_below_1).toBeCloseTo(0.683, 3);
    expect(key.qv.ratio_median).toBeCloseTo(0.455, 3);
    expect(ratios.reduce((s, v) => s + v, 0) / ratios.length).toBeCloseTo(1, 1);
    for (let i = 0; i < key.qv.n.length; i++) expect(quadraticVariationSd(key.qv.n[i], key.qv.T)).toBeCloseTo(key.qv.sd[i], 12);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
  });

  // ---------------------------------------------------------------- Hull ch. 11
  it("Hull Ex. 11.1 (√5 = 2.236) and Ex. 11.2 (N(70, 30) at one year; 60, 21.21 at six months)", () => {
    expect(wienerChange(0, 1, key.hull.ex11_1.T).sd).toBeCloseTo(key.hull.ex11_1.sd, 12);
    expect(wienerChange(0, 1, 5).sd).toBeCloseTo(2.236, 3);
    const e = key.hull.ex11_2;
    const y = wienerChange(e.a, e.b, 1),
      h = wienerChange(e.a, e.b, 0.5);
    expect(e.x0 + y.mean).toBeCloseTo(e.one_year.mean, 12);
    expect(y.sd).toBeCloseTo(e.one_year.sd, 12);
    expect(e.x0 + h.mean).toBeCloseTo(e.six_months.mean, 12);
    expect(h.sd).toBeCloseTo(e.six_months.sd, 12);
    expect(h.sd).toBeCloseTo(21.21, 2);
  });

  it("Hull Ex. 11.3 (δS = 0.288 + 4.157ε) and Table 11.1 path from 20", () => {
    const e = key.hull.ex11_3;
    expect(gbmStep(e.S, e.mu, e.sigma, e.dt, 0) - e.S).toBeCloseTo(e.drift, 10);
    expect(gbmStep(e.S, e.mu, e.sigma, e.dt, 1) - e.S - e.drift).toBeCloseTo(e.diffusion, 10);
    expect(e.drift).toBeCloseTo(0.288, 3);
    expect(e.diffusion).toBeCloseTo(4.157, 3);
    const t = key.hull.table11_1;
    const path = gbmDiscretePath(t.S0, t.mu, t.sigma, t.dt, t.eps);
    path.forEach((S, i) => expect(S).toBeCloseTo(t.path[i], 10));
    expect(path[0]).toBeCloseTo(20.236, 3);
    expect(path[5]).toBeCloseTo(20.604, 3);
    expect(path[9]).toBeCloseTo(21.124, 3);
  });

  it("Hull Problem 11.16: P(S_T > 80) = 0.2253", () => {
    const p = key.hull.prob11_16;
    expect(gbmProbAbove(p.S0, p.mu, p.sigma, p.T, p.K)).toBeCloseTo(p.prob_above, 8);
    expect(gbmProbAbove(50, 0.12, 0.3, 2, 80)).toBeCloseTo(0.2253, 4);
    expect(p.z).toBeCloseTo(0.754, 3);
  });

  it("GBM fan numbers: 110.52 / 102.02 / 86.94 at one year, 271.83 / 122.14 / 24.66 at ten", () => {
    for (const g of key.gbm) {
      expect(gbmMean(g.S0, g.mu, g.t)).toBeCloseTo(g.mean, 8);
      expect(gbmMedian(g.S0, g.mu, g.sigma, g.t)).toBeCloseTo(g.median, 8);
      expect(gbmMode(g.S0, g.mu, g.sigma, g.t)).toBeCloseTo(g.mode, 8);
    }
    expect(gbmMode(100, 0.1, 0.4, 1)).toBeCloseTo(86.94, 2);
    expect(gbmMean(100, 0.1, 10)).toBeCloseTo(271.83, 2);
    expect(gbmMedian(100, 0.1, 0.4, 10)).toBeCloseTo(122.14, 2);
    expect(gbmMode(100, 0.1, 0.4, 10)).toBeCloseTo(24.66, 2);
  });

  // ---------------------------------------------------------------- OU (Figure 5)
  it("OU half-lives, stationary sd, mean and variance (θ = 4 %, σ = 1 %)", () => {
    const { theta, sigma } = key.ou;
    for (const c of key.ou.cases) {
      expect(ouHalfLife(c.kappa)).toBeCloseTo(c.half_life, 12);
      expect(ouStationarySd(c.kappa, sigma)).toBeCloseTo(c.stationary_sd, 12);
      expect(ouMean(0.06, c.kappa, theta, 1)).toBeCloseTo(c.mean_from_6pct.t1, 12);
      expect(ouMean(0.06, c.kappa, theta, 10)).toBeCloseTo(c.mean_from_6pct.t10, 12);
      expect(ouVariance(c.kappa, sigma, 1)).toBeCloseTo(c.var_t1, 14);
    }
    expect(ouHalfLife(0.5)).toBeCloseTo(1.3863, 4);
    expect(ouHalfLife(2)).toBeCloseTo(0.3466, 4);
    expect(ouHalfLife(10)).toBeCloseTo(0.0693, 4);
    expect(ouHalfLife(0.1)).toBeCloseTo(6.931, 3);
    expect(ouStationarySd(0.1, 0.01)).toBeCloseTo(0.02236, 5);
    expect(ouStationarySd(2, 0.01)).toBeCloseTo(0.005, 6);
    expect(ouMean(0.06, 0.1, 0.04, 1)).toBeCloseTo(0.0581, 4);
    expect(ouMean(0.06, 0.1, 0.04, 10)).toBeCloseTo(0.04736, 5);
    expect(ouMean(0.06, 2, 0.04, 1)).toBeCloseTo(0.04271, 5);
    // ouVariance → stationary variance as t → ∞
    expect(Math.sqrt(ouVariance(2, 0.01, 50))).toBeCloseTo(ouStationarySd(2, 0.01), 12);
  });

  it("Euler at κ = 2: stationary sd 0.527/0.577/0.707/1.000 % at Δ = 0.10/0.25/0.50/0.75, ∞ at 1.0 and 1.1", () => {
    for (const e of key.ou.euler) {
      expect(ouEulerGapFactor(e.kappa, e.dt)).toBeCloseTo(e.gap_factor, 12);
      expect(ouEulerStable(e.kappa, e.dt)).toBe(e.stable);
      if (e.stationary_sd === null) expect(ouEulerStationarySd(e.kappa, key.ou.sigma, e.dt)).toBe(Infinity);
      else expect(ouEulerStationarySd(e.kappa, key.ou.sigma, e.dt)).toBeCloseTo(e.stationary_sd, 12);
      expect(Math.exp(-e.kappa * e.dt)).toBeCloseTo(e.exact_step_factor, 12);
    }
    expect(ouEulerStationarySd(2, 0.01, 0.1)).toBeCloseTo(0.00527, 5);
    expect(ouEulerStationarySd(2, 0.01, 0.25)).toBeCloseTo(0.00577, 5);
    expect(ouEulerStationarySd(2, 0.01, 0.5)).toBeCloseTo(0.00707, 5);
    expect(ouEulerStationarySd(2, 0.01, 0.75)).toBeCloseTo(0.01, 10);
    expect(ouEulerStationarySd(2, 0.01, 1.0)).toBe(Infinity);
    expect(ouEulerStationarySd(2, 0.01, 1.1)).toBe(Infinity);
  });

  it("Euler vs exact, deterministic part (σ = 0): Δ = 0.5 forgets the start in one step, Δ = 1 flips sign, Δ = 1.1 grows", () => {
    for (const d of key.ou.euler_deterministic) {
      const zero = () => 0.5; // normalSample(0.5, 0.5) = √(−2 ln 0.5)·cos(π) ≠ 0, so use σ = 0 instead
      const ex = ouPath(d.x0, d.kappa, key.ou.theta, 0, 8, 8 * d.dt, zero);
      const eu = ouEuler(d.x0, d.kappa, key.ou.theta, 0, 8, d.dt, zero);
      for (const k of d.k) {
        expect(ex.W[k]).toBeCloseTo(d.exact[k], 12);
        expect(eu.W[k]).toBeCloseTo(d.euler[k], 12);
        expect(ex.t[k]).toBeCloseTo(k * d.dt, 12);
        expect(eu.t[k]).toBeCloseTo(k * d.dt, 12);
      }
    }
    const theta = key.ou.theta;
    const z = () => 0.5;
    expect(ouEuler(0.06, 2, theta, 0, 1, 0.5, z).W[1]).toBeCloseTo(theta, 12); // one step: gone
    expect(ouEuler(0.06, 2, theta, 0, 1, 1.0, z).W[1]).toBeCloseTo(theta - 0.02, 12); // flips to 2 %
    expect(Math.abs(ouEuler(0.06, 2, theta, 0, 8, 1.1, z).W[8] - theta)).toBeGreaterThan(0.02 * 4); // (−1.2)⁸ = 4.3
    expect(Math.abs(ouPath(0.06, 2, theta, 0, 8, 8.8, z).W[8] - theta)).toBeLessThan(1e-8); // exact sits home
  });

  it("Euler vs exact with the same random numbers: at Δ = 0.5 Euler's spread is 0.707 %, exact's 0.500 %; at Δ = 1.1 Euler explodes", () => {
    const { theta, sigma } = key.ou;
    const m = 3000,
      steps = 300;
    let se = 0,
      sx = 0;
    for (let k = 0; k < m; k++) {
      const a = ouEuler(theta, 2, theta, sigma, steps, 0.5, rng(100 + k)).W[steps] - theta;
      const b = ouPath(theta, 2, theta, sigma, steps, steps * 0.5, rng(100 + k)).W[steps] - theta;
      se += a * a;
      sx += b * b;
    }
    expect(Math.sqrt(se / m) / key.ou.euler_mc_sd_dt_0_5).toBeCloseTo(1, 1);
    expect(Math.sqrt(sx / m) / key.ou.exact_mc_sd_dt_0_5).toBeCloseTo(1, 1);
    expect(Math.sqrt(se / m)).toBeCloseTo(0.00707, 3);
    expect(Math.sqrt(sx / m)).toBeCloseTo(0.005, 3);
    // same seed → same jostles: first increments share the sign of Z
    const r1 = rng(5),
      r2 = rng(5);
    const e1 = ouEuler(theta, 2, theta, sigma, 1, 0.1, r1).W[1] - theta,
      x1 = ouPath(theta, 2, theta, sigma, 1, 0.1, r2).W[1] - theta;
    expect(Math.sign(e1)).toBe(Math.sign(x1));
    expect(e1 / x1).toBeCloseTo((sigma * Math.sqrt(0.1)) / (sigma * Math.sqrt((1 - Math.exp(-0.4)) / 4)), 10);
    // Δ = 1.1: blow-up
    const boom = ouEuler(theta, 2, theta, sigma, 200, 1.1, rng(1));
    expect(Math.abs(boom.W[200] - theta)).toBeGreaterThan(1);
  });

  // ---------------------------------------------------------------- Figure 3: realised vol on the real index
  it("NIFTY 50 realised vol (Shreve 3.4.16): whole file and 2020, from the returns field and from prices", () => {
    const rAll = nifty.returns.map((q) => q.r);
    const r2020 = nifty.returns.filter((q) => q.d.startsWith("2020")).map((q) => q.r);
    expect(rAll.length).toBe(key.nifty.n_all);
    expect(r2020.length).toBe(key.nifty.n_2020);
    expect(realisedVolFromReturns(rAll)).toBeCloseTo(key.nifty.rv_all, 12);
    expect(realisedVolFromReturns(r2020)).toBeCloseTo(key.nifty.rv_2020, 12);
    expect(realisedVolFromReturns(rAll)).toBeCloseTo(0.162, 3); // ≈ 16.2 %/yr (storyboard)
    expect(realisedVolFromReturns(r2020)).toBeCloseTo(0.317, 3);
    expect(driftFromReturns(rAll)).toBeCloseTo(key.nifty.drift_ann_all, 12);
    expect(driftFromReturns(r2020)).toBeCloseTo(key.nifty.drift_ann_2020, 12);
    const closes = nifty.rows.map((q) => q.c);
    const lr = logReturns(closes);
    expect(lr.length).toBe(closes.length - 1);
    expect(lr[0]).toBeCloseTo(rAll[0], 6);
    const whole = realisedVolFromPrices(closes, closes.length - 1);
    expect(whole.length).toBe(1);
    expect(whole[0]).toBeCloseTo(key.nifty.rv_all_from_prices, 10);
    const rolling = realisedVolFromPrices(closes, 252);
    expect(rolling.length).toBe(closes.length - 252);
    expect(rolling[0]).toBeCloseTo(key.nifty.first_window_252, 10);
    expect(rolling[rolling.length - 1]).toBeCloseTo(key.nifty.last_window_252, 10);
    expect(Math.max(...rolling)).toBeGreaterThan(0.3); // the window covering March 2020 lights up
    expect(realisedVolFromPrices(closes, 0)).toEqual([]);
    expect(realisedVolFromPrices(closes, closes.length)).toEqual([]);
  });

  it("which can you measure: drift sd σ/√T = 6.32 % over ten years; vol sd σ/√(2n) = 0.28 % from 2,500 returns", () => {
    const m = key.measure;
    expect(driftEstimateSd(m.sigma, m.T)).toBeCloseTo(m.drift_sd, 12);
    expect(volEstimateSd(m.sigma, m.n)).toBeCloseTo(m.vol_sd, 12);
    expect(driftEstimateSd(0.2, 10)).toBeCloseTo(0.0632, 4);
    expect(volEstimateSd(0.2, 2500)).toBeCloseTo(0.00283, 5);
    // Monte Carlo: n = 2,500 daily GBM returns over 10 years — the vol estimate is tight, the drift estimate is not
    const r = rng(12);
    const sigma = 0.2,
      mu = 0.1,
      n = 2500,
      dt = 10 / n;
    const m2 = 400;
    let sMu = 0,
      sMu2 = 0,
      sV = 0,
      sV2 = 0;
    for (let k = 0; k < m2; k++) {
      const { W } = brownianPath(n, 10, r);
      const rets: number[] = [];
      for (let i = 0; i < n; i++) rets.push((mu - 0.5 * sigma * sigma) * dt + sigma * (W[i + 1] - W[i]));
      const muHat = driftFromReturns(rets, n / 10) + 0.5 * sigma * sigma;
      const vHat = realisedVolFromReturns(rets, n / 10);
      sMu += muHat;
      sMu2 += muHat * muHat;
      sV += vHat;
      sV2 += vHat * vHat;
    }
    const sdMu = Math.sqrt(sMu2 / m2 - (sMu / m2) ** 2),
      sdV = Math.sqrt(sV2 / m2 - (sV / m2) ** 2);
    expect(sdMu / m.drift_sd).toBeCloseTo(1, 0);
    expect(sdV / m.vol_sd).toBeCloseTo(1, 0);
    expect(sdMu / sdV).toBeGreaterThan(10);
  });
});
