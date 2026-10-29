import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-B1.json";
import {
  countBars,
  countsPerWindow,
  distributionPath,
  expectedHoldingTime,
  exponentialSample,
  exponentialWaitingTimeParadox,
  fitChain,
  invalidRow,
  isPeriodic2,
  isStochastic,
  lotteryArrivals,
  matrixPower,
  meanRunLength,
  memoryVarianceRatio,
  nStepDistribution,
  occupancy,
  period,
  poissonArrivals,
  poissonCdf,
  poissonPmf,
  poissonPmfTable,
  noArrivalProbability,
  randomWalk,
  runLengths,
  runningFraction,
  secondEigenvalue2,
  simulateChain,
  stationary,
  stationaryByPower,
  superposedRate,
  twoStateLaw,
  waitFrom,
  waitingTimeParadox,
  walkPmf,
  walkSd,
  walkWithin,
  walkerCloud,
} from "./markov";
import { rng } from "./random";

const close = (a: number[], b: number[], digits: number) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], digits));

describe("B1 Markov chains vs numpy key", () => {
  it("QuantEcon two-state chain: ψ* = (0.25, 0.75), the law from (1, 0), the second eigenvalue 0.2", () => {
    const P = key.qe.P;
    close(stationary(P), [0.25, 0.75], 12);
    close(stationary(P), key.qe.stationary, 12);
    const path = distributionPath(P, [1, 0], 5);
    const expected = [
      [1, 0],
      [0.4, 0.6],
      [0.28, 0.72],
      [0.256, 0.744],
      [0.2512, 0.7488],
      [0.25024, 0.74976],
    ];
    for (let t = 0; t <= 5; t++) {
      close(path[t], expected[t], 12);
      close(path[t], key.qe.psi_from_0[t], 12);
      close(nStepDistribution(P, [1, 0], t), expected[t], 12);
      close(twoStateLaw(P, [1, 0], t), expected[t], 12);
    }
    expect(secondEigenvalue2(P)).toBeCloseTo(0.2, 12);
    expect(secondEigenvalue2(P)).toBeCloseTo(key.qe.eigenvalues[1], 12);
    const pw = stationaryByPower(P);
    close(pw.psi, [0.25, 0.75], 10);
    expect(matrixPower(P, 100)[0][0]).toBeCloseTo(0.25, 12);
  });

  it("QuantEcon million-step sample: the running fraction of time in state 0 is within ±0.005 of 0.25", () => {
    const x = simulateChain(key.qe.P, 1_000_000, 1, rng(1));
    const frac = occupancy(x, 2);
    expect(Math.abs(frac[0] - 0.25)).toBeLessThan(0.005);
    expect(Math.abs(key.qe.mc_frac_state0 - 0.25)).toBeLessThan(0.005);
    const rf = runningFraction(x.slice(0, 100_000), 2);
    expect(Math.abs(rf[rf.length - 1][0] - 0.25)).toBeLessThan(0.01);
  });

  it("sticky chain: ψ_t(R) = ½ + ½·0.8^t, holding time 10 days vs 2 for the coin", () => {
    const P = key.sticky.P;
    close(stationary(P), [0.5, 0.5], 12);
    key.sticky.t.forEach((t, i) => {
      const psi = nStepDistribution(P, [0, 1], t);
      expect(psi[1]).toBeCloseTo(0.5 + 0.5 * Math.pow(0.8, t), 12);
      expect(psi[1]).toBeCloseTo(key.sticky.psiR[i], 12);
    });
    expect(nStepDistribution(P, [0, 1], 5)[1]).toBeCloseTo(0.66384, 12);
    expect(nStepDistribution(P, [0, 1], 10)[1]).toBeCloseTo(0.553687, 6);
    expect(nStepDistribution(P, [0, 1], 20)[1]).toBeCloseTo(0.505765, 6);
    expect(expectedHoldingTime(P, 0)).toBeCloseTo(10, 12);
    expect(expectedHoldingTime([[0.5, 0.5], [0.5, 0.5]], 0)).toBeCloseTo(2, 12);
    expect(secondEigenvalue2(P)).toBeCloseTo(0.8, 12);
  });

  it("sticky chain: measured mean run length ≈ 10 (coin ≈ 2) over 10⁵ steps", () => {
    const r = rng(7);
    const x = simulateChain(key.sticky.P, 100_000, 0, r);
    expect(Math.abs(meanRunLength(x) - 10)).toBeLessThan(0.5);
    const coin = simulateChain([[0.5, 0.5], [0.5, 0.5]], 100_000, 0, r);
    expect(Math.abs(meanRunLength(coin) - 2)).toBeLessThan(0.1);
    expect(Math.abs(key.sticky.mc_mean_run - 10)).toBeLessThan(0.5);
  });

  it("Hamilton's three-state chain: ψ* = (0.8128, 0.1626, 0.0246), row 0 of P⁶, every corner spirals in", () => {
    const P = key.hamilton.P;
    const s = stationary(P);
    close(s, [0.8128, 0.16256, 0.02464], 5);
    close(s, key.hamilton.stationary, 12);
    close(matrixPower(P, 6)[0], [0.883197, 0.10455, 0.012253], 6);
    close(matrixPower(P, 6)[0], key.hamilton.P6_row0, 12);
    close(stationaryByPower(P).psi, s, 10);
    for (let c = 0; c < 3; c++) {
      const e = [0, 0, 0];
      e[c] = 1;
      close(nStepDistribution(P, e, 30), key.hamilton.psi_from_each_corner_t30[c], 12);
      close(nStepDistribution(P, e, 400), s, 10);
    }
    expect(period(P)).toBe(1);
  });

  it("periodic chain: ψ* = (½, ½) by linear algebra, the law alternates, power iteration never settles, time average → ½", () => {
    const P = key.periodic.P;
    expect(isPeriodic2(P)).toBe(true);
    expect(isPeriodic2(key.qe.P)).toBe(false);
    expect(period(P)).toBe(2);
    close(stationary(P), [0.5, 0.5], 12);
    for (let t = 0; t < 6; t++) close(nStepDistribution(P, [1, 0], t), t % 2 ? [0, 1] : [1, 0], 12);
    const path = distributionPath(P, [1, 0], 999);
    const avg = path.reduce((s, psi) => s + psi[0], 0) / path.length;
    expect(avg).toBeCloseTo(key.periodic.time_average_t1000, 12);
    expect(avg).toBeCloseTo(0.5, 12);
    // and the sampled fraction of time also → ½
    const x = simulateChain(P, 1000, 0, rng(3));
    expect(occupancy(x, 2)[0]).toBeCloseTo(0.5, 2);
  });

  it("validation: a row not summing to 1 (±1e−9) is rejected", () => {
    expect(isStochastic(key.qe.P)).toBe(true);
    expect(invalidRow([[0.5, 0.5], [0.3, 0.6]])).toBe(1);
    expect(invalidRow([[0.5, 0.5 + 2e-9], [0.5, 0.5]])).toBe(0);
    expect(invalidRow([[0.5, 0.5 + 1e-10], [0.5, 0.5]])).toBe(-1);
    expect(invalidRow([[1.2, -0.2], [0.5, 0.5]])).toBe(0);
    expect(() => simulateChain([[0.5, 0.5], [0.3, 0.6]], 10, 0, rng(1))).toThrow();
  });

  it("fitChain: the ledger of a short strip (counts, fractions, Laplace) matches numpy; a long strip recovers P", () => {
    const f = fitChain(key.fit_small.states, 3);
    expect(f.counts).toEqual(key.fit_small.counts);
    f.P.forEach((row, i) => close(row, key.fit_small.P[i], 12));
    fitChain(key.fit_small.states, 3, 1).P.forEach((row, i) => close(row, key.fit_small.P_laplace1[i], 12));
    f.P.forEach((row) => expect(row.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 12));
    expect(meanRunLength(key.fit_small.states)).toBeCloseTo(key.fit_small.mean_run, 12);
    expect(runLengths(key.fit_small.states).length).toBe(key.fit_small.n_runs);
    expect(runLengths([0, 0, 0, 1, 1, 0, 2])).toEqual([3, 2, 1, 1]);

    const x = simulateChain(key.fit_long.P_true, 200_000, 0, rng(11));
    const fl = fitChain(x, 3);
    let worst = 0;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) worst = Math.max(worst, Math.abs(fl.P[i][j] - key.fit_long.P_true[i][j]));
    expect(worst).toBeLessThan(0.01);
    const occ = occupancy(x, 3);
    for (let i = 0; i < 3; i++) expect(Math.abs(occ[i] - key.fit_long.stationary[i])).toBeLessThan(0.01);
    expect(key.fit_long.max_abs_err).toBeLessThan(0.01);
  });
});

describe("B1 random walk (Shreve §3.2)", () => {
  it("exact pmf: P(M₁₀ = 2) = 0.205078, P(M₁₀ = 0) = 0.246094, P(|M₁₀₀| ≤ 10) = 0.728747, Shreve (3.2.11) = 0.154981", () => {
    expect(walkPmf(10, 2)).toBeCloseTo(0.205078125, 12);
    expect(walkPmf(10, 2)).toBeCloseTo(key.walk.p_M10_eq_2, 12);
    expect(walkPmf(10, 0)).toBeCloseTo(key.walk.p_M10_eq_0, 12);
    expect(walkPmf(10, 1)).toBe(0);
    expect(walkWithin(100, 10)).toBeCloseTo(0.728747, 6);
    expect(walkWithin(100, 10)).toBeCloseTo(key.walk.p_abs_M100_le_10, 10);
    expect(walkPmf(25, 1)).toBeCloseTo(key.walk.shreve_3_2_11, 10);
    expect(walkPmf(25, 1)).toBeCloseTo(0.154981, 6);
    expect(walkSd(100)).toBe(10);
    expect(walkSd(400)).toBe(20);
    expect(walkSd(5)).toBeCloseTo(key.walk.hull_sd_5y, 12);
    expect(walkSd(5)).toBeCloseTo(2.23607, 5);
  });

  it("10,000 walkers × 400 steps: mean(x²)/t within ±3 % at t = 100, 200, 400; count bars sum to the walker count", () => {
    const cloud = walkerCloud(10_000, 400, rng(42));
    for (const t of [100, 200, 400]) expect(Math.abs(cloud.meanSquare(t) / t - 1)).toBeLessThan(0.03);
    for (const t of [1, 30, 100, 400]) {
      const bars = countBars(cloud.positions[t], 400);
      expect(bars.reduce((s, b) => s + b, 0)).toBe(10_000);
    }
    const M = randomWalk(50, rng(1));
    expect(M[0]).toBe(0);
    for (let t = 1; t <= 50; t++) expect(Math.abs(M[t] - M[t - 1])).toBe(1);
  });

  it("memory toggle at p = 0.75: measured Var(M_t)/t ≈ 3 (formula (1 + ρ)/(1 − ρ)), not 1", () => {
    expect(memoryVarianceRatio(0.75)).toBeCloseTo(3, 12);
    expect(memoryVarianceRatio(0.5)).toBeCloseTo(1, 12);
    const cloud = walkerCloud(10_000, 400, rng(99), 0.75);
    for (const t of [200, 400]) expect(Math.abs(cloud.meanSquare(t) / t - 3)).toBeLessThan(0.25);
    for (const t of ["200", "400"] as const) expect(Math.abs(key.memory.mc_ratio[t] - 3)).toBeLessThan(0.25);
  });
});

describe("B1 Poisson process (Shreve §11.2), λ = 6 per hour", () => {
  it("P{N(1 h) = k} table, cdf, e^{−1} = 0.367879, P(≥ 2 in 10 min) = 0.264241", () => {
    const table = poissonPmfTable(6, 12);
    const note = [0.0025, 0.0149, 0.0446, 0.0892, 0.1339, 0.1606, 0.1606, 0.1377, 0.1033, 0.0688, 0.0413, 0.0225, 0.0113];
    close(table, note, 4);
    close(table, key.poisson.pmf_1h, 12);
    for (let k = 0; k <= 12; k++) expect(poissonCdf(6, k)).toBeCloseTo(key.poisson.cdf_1h[k], 12);
    expect(poissonPmf(6, -1)).toBe(0);
    expect(noArrivalProbability(6, 1 / 6)).toBeCloseTo(0.367879, 6);
    expect(noArrivalProbability(6, 1 / 6)).toBeCloseTo(key.poisson.p_none_10min, 12);
    expect(noArrivalProbability(6, 1 / 3)).toBeCloseTo(0.135335, 6);
    expect(noArrivalProbability(6, 0.5)).toBeCloseTo(0.049787, 6);
    expect(1 - poissonCdf(1, 1)).toBeCloseTo(0.264241, 6);
    expect(1 - poissonCdf(1, 1)).toBeCloseTo(key.poisson.p_at_least_2_in_10min, 12);
    expect(superposedRate([6, 4])).toBe(10);
  });

  it("waiting-time paradox: observed gap E[X²]/E[X] = 20 min, mean wait 10 min, timetabled 5", () => {
    const r = exponentialWaitingTimeParadox(6);
    expect(r.observedGapMean * 60).toBeCloseTo(key.poisson.waiting_paradox_observed_gap_min, 12);
    expect(r.meanWait * 60).toBeCloseTo(10, 12);
    expect(r.timetabledWait * 60).toBeCloseTo(5, 12);
    // a deterministic timetable (variance 0): the observed gap is the plain gap
    expect(waitingTimeParadox(10, 0).observedGapMean).toBeCloseTo(10, 12);
    expect(waitingTimeParadox(10, 0).meanWait).toBeCloseTo(5, 12);
  });

  it("10,000 simulated hours: fraction with exactly 6 arrivals within ±0.01 of 0.1606; mean gap within ±0.3 min of 10", () => {
    const r = rng(2024);
    const times = poissonArrivals(6, 10_000, r);
    const counts = countsPerWindow(times, 10_000);
    const frac6 = counts.filter((c) => c === 6).length / 10_000;
    expect(Math.abs(frac6 - 0.1606)).toBeLessThan(0.01);
    expect(Math.abs(key.poisson.mc_frac_exactly_6 - 0.1606)).toBeLessThan(0.01);
    let gap = 0;
    for (let i = 1; i < times.length; i++) gap += times[i] - times[i - 1];
    expect(Math.abs((gap / (times.length - 1)) * 60 - 10)).toBeLessThan(0.3);
    // exponential sampler mean
    let s = 0;
    for (let i = 0; i < 100_000; i++) s += exponentialSample(6, r);
    expect(Math.abs((s / 100_000) * 60 - 10)).toBeLessThan(0.2);
  });

  it("the inspector: mean wait from a random arrival over 1,000 drops reads 10.0 ± 0.6 min (not 5)", () => {
    const r = rng(77);
    let s = 0;
    for (let i = 0; i < 1000; i++) {
      const ev = poissonArrivals(6, 4, r);
      const at = r() * 1;
      s += waitFrom(ev, at);
    }
    expect(Math.abs((s / 1000) * 60 - 10)).toBeLessThan(0.6);
    expect(Math.abs(key.poisson.mc_mean_wait_min_1000_drops - 10)).toBeLessThan(0.6);
    expect(waitFrom([0.5, 1.5], 2)).toBeNaN();
  });

  it("the lottery (a ticket each second at 1 in 600) reproduces the Poisson counts and the 10-minute gap", () => {
    const r = rng(600);
    const times = lotteryArrivals(6, 2000, 1 / 3600, r);
    const counts = countsPerWindow(times, 2000);
    const mean = counts.reduce((s, c) => s + c, 0) / 2000;
    expect(Math.abs(mean - 6)).toBeLessThan(0.2);
    const frac6 = counts.filter((c) => c === 6).length / 2000;
    expect(Math.abs(frac6 - 0.1606)).toBeLessThan(0.03);
  });
});
