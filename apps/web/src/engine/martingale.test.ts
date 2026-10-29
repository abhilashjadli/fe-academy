import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-B2.json";
import {
  ROULETTE_P,
  allPaths,
  betOnStreaks,
  conditionalForecasts,
  customRule,
  doubling,
  doublingCycles,
  fairCoinGame,
  firstHitBelow,
  fixedBet,
  gamblersRuin,
  habitRule,
  histogram,
  isStoppingTime,
  martingaleDefect,
  optionalStoppingCheck,
  peek,
  peekFor,
  playGame,
  quitAt,
  quitUpByOneStats,
  quitWhenAhead,
  riskNeutralTree,
  shreveRho,
  simulatePlayers,
  spreadAfter,
  stoppedMean,
  twoSidedQuit,
  unitBetEdge,
  type Strategy,
} from "./martingale";
import { rng } from "./random";

describe("B2 closed forms vs key", () => {
  it("gambler's ruin: P(reach N) = K/N, E[T] = K(N − K): (1, 10) → 0.1, 9; (50, 100) → 0.5, 2,500", () => {
    for (const c of key.ruin) {
      const r = gamblersRuin(c.K, c.N);
      expect(r.pWin).toBeCloseTo(c.p_win, 12);
      expect(r.expectedDuration).toBe(c.duration);
    }
    expect(gamblersRuin(1, 10)).toEqual({ pWin: 0.1, expectedDuration: 9 });
    expect(gamblersRuin(50, 100)).toEqual({ pWin: 0.5, expectedDuration: 2500 });
    const ts = twoSidedQuit(5, 20);
    expect(ts.pUpFirst).toBeCloseTo(0.8, 12);
    expect(ts.expectedDuration).toBe(100);
    expect(ts.mean).toBeCloseTo(0, 12);
    expect(spreadAfter(200)).toBeCloseTo(14.142136, 6);
    expect(spreadAfter(200)).toBeCloseTo(key.spread.sd, 12);
  });

  it("the honest wheel: unit bet −0.027 per toss; k = 10 doubling −0.306 per cycle, P(streak) = 0.00128", () => {
    expect(unitBetEdge(ROULETTE_P)).toBeCloseTo(-1 / 37, 12);
    expect(unitBetEdge(ROULETTE_P)).toBeCloseTo(key.roulette.unit_bet_mean_per_toss, 12);
    expect(unitBetEdge(0.5)).toBe(0);
    const d = doublingCycles(10, 1, 10, rng(1), ROULETTE_P);
    expect(d.meanPerCycleFormula).toBeCloseTo(key.roulette.k10_mean_per_cycle, 12);
    expect(d.meanPerCycleFormula).toBeCloseTo(-0.306, 3);
    expect(d.pRuinPerCycle).toBeCloseTo(key.roulette.k10_p_streak, 12);
    const fair10 = doublingCycles(10, 700, 10, rng(1));
    expect(fair10.pAtLeastOneRuinFormula).toBeCloseTo(key.doubling_k10.p_at_least_one_streak, 12);
    expect(fair10.pAtLeastOneRuinFormula).toBeCloseTo(0.495, 3);
    expect(fair10.meanPerCycleFormula).toBeCloseTo(0, 12);
  });
});

describe("B2 Shreve's discounted tree (Figs 8.2.2–8.2.3) and the information diary", () => {
  it("S₀ = 4, u = 2, d = ½, r = ¼: p̃ = ½; 4 → 6.40 / 1.60 → 10.24 / 2.56 / 0.64; every node the mean of its children to 1e−12", () => {
    const tree = riskNeutralTree(4, 2, 0.5, 0.25, 2);
    expect(tree.pTilde).toBeCloseTo(0.5, 12);
    expect(tree.pTilde).toBeCloseTo(key.tree.p_tilde, 12);
    const want = [[4], [6.4, 1.6], [10.24, 2.56, 0.64]];
    for (let n = 0; n < 3; n++)
      for (let i = 0; i <= n; i++) {
        expect(tree.levels[n][i]).toBeCloseTo(want[n][i], 12);
        expect(tree.levels[n][i]).toBeCloseTo(key.tree.levels[n][i], 12);
        expect(tree.prices[n][i]).toBeCloseTo(key.tree.undiscounted[n][i], 12);
      }
    expect(martingaleDefect(tree)).toBeLessThan(1e-12);
    expect(martingaleDefect(riskNeutralTree(100, 1.1, 0.9, 0.03, 6))).toBeLessThan(1e-12);
    // the wrong probability breaks the martingale
    const bad = { ...tree, pTilde: 0.6 };
    expect(martingaleDefect(bad)).toBeGreaterThan(0.1);
  });

  it("a stopped martingale is a martingale: E M_{2∧τ} = 4 for genuine stopping times; Shreve's ρ gives 2.56 exactly", () => {
    const tree = riskNeutralTree(4, 2, 0.5, 0.25, 2);
    expect(stoppedMean(tree, () => 0)).toBeCloseTo(4, 12);
    expect(stoppedMean(tree, () => 2)).toBeCloseTo(4, 12);
    expect(stoppedMean(tree, () => 1)).toBeCloseTo(4, 12);
    const hit = firstHitBelow(tree, 1.6);
    expect(isStoppingTime(2, hit)).toBe(true);
    expect(stoppedMean(tree, hit)).toBeCloseTo(4, 12);
    expect(isStoppingTime(2, shreveRho)).toBe(false);
    expect(stoppedMean(tree, shreveRho)).toBeCloseTo(2.56, 12);
    expect(stoppedMean(tree, shreveRho)).toBeCloseTo(key.tree.rho_stopped_mean, 12);
    expect(allPaths(2)).toEqual([
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]);
  });

  it("the diary's forecasts of S₃ at p = q = ½: 7.8125; 12.5 / 3.125; 20 / 5 / 1.25; 32 / 8 / 2 / 0.5", () => {
    const f = conditionalForecasts(4, 2, 0.5, 0.5, 3);
    const want = [[7.8125], [12.5, 3.125], [20, 5, 1.25], [32, 8, 2, 0.5]];
    for (let n = 0; n <= 3; n++)
      for (let i = 0; i <= n; i++) {
        expect(f[n][i]).toBeCloseTo(want[n][i], 12);
        expect(f[n][i]).toBeCloseTo(key.diary.forecasts[n][i], 12);
      }
    // each page's forecast is the mean of the next page's two
    for (let n = 0; n < 3; n++) for (let i = 0; i <= n; i++) expect(f[n][i]).toBeCloseTo(0.5 * f[n + 1][i] + 0.5 * f[n + 1][i + 1], 12);
  });
});

describe("B2 the table: game mechanics", () => {
  it("fairCoinGame: ±1 steps, starts at 0, length n + 1", () => {
    const w = fairCoinGame(200, rng(5));
    expect(w.length).toBe(201);
    expect(w[0]).toBe(0);
    for (let t = 1; t <= 200; t++) expect(Math.abs(w[t] - w[t - 1])).toBe(1);
  });

  it("quitWhenAhead leaves at the target and the path stays flat afterwards", () => {
    const g = playGame(quitWhenAhead(1, 100), 100, rng(3));
    if (g.final === 1) {
      const k = g.wealth.indexOf(1);
      for (let t = k; t <= 100; t++) expect(g.wealth[t]).toBe(1);
      expect(g.played).toBe(k);
    } else expect(g.played).toBe(100);
  });

  it("doubling: 1, lose; 2, lose; 4, win lands on +1; five losses at limit 31 cost −31 and restart at 1", () => {
    // scripted tosses via a custom rng: u < 0.5 → heads (win on a positive bet)
    const script = [0.9, 0.9, 0.1, 0.9, 0.9, 0.9, 0.9, 0.9, 0.1];
    let i = 0;
    const next = () => script[i++ % script.length];
    const g = playGame(doubling(31), 9, next);
    expect(g.bets.slice(0, 3)).toEqual([1, 2, 4]);
    expect(g.wealth[3]).toBe(1);
    expect(g.bets.slice(3, 8)).toEqual([1, 2, 4, 8, 16]);
    expect(g.wealth[8]).toBe(1 - 31);
    expect(g.bets[8]).toBe(1); // the cycle is abandoned at the limit
    expect(g.wealth[9]).toBe(1 - 31 + 1);
  });

  it("betOnStreaks bets big with the streak; customRule and habitRule are honest rules of the past", () => {
    const script = [0.1, 0.1, 0.1, 0.9];
    let i = 0;
    const g = playGame(betOnStreaks(3, 2), 4, () => script[i++]);
    expect(g.bets).toEqual([1, 1, 1, 2]);
    expect(g.wealth[4]).toBe(3 - 2);
    const c = playGame(
      customRule((h) => (h.t % 2 ? 2 : 1)),
      4,
      rng(1),
    );
    expect(c.bets).toEqual([1, 2, 1, 2]);
    const hb = playGame(habitRule(1, 2, 3, 3), 50, rng(9));
    expect(Math.abs(hb.final)).toBeLessThanOrEqual(4);
  });
});

describe("B2 the meter that will not move (Monte Carlo)", () => {
  const n = 10_000,
    T = 200;
  const strategies: Strategy[] = [
    fixedBet(1),
    fixedBet(3),
    quitWhenAhead(1, T),
    quitWhenAhead(5, T),
    quitAt(5, 20),
    doubling(31),
    betOnStreaks(3, 2),
    customRule((h) => (h.streak < 0 ? 2 : h.w > 10 ? 0 : 1), "bet 2 after a loss, leave at +10"),
    habitRule(1, 3, 8, 12),
  ];
  strategies.forEach((s, i) => {
    it(`${s.name}: mean of ${n} players over ${T} tosses within 2 standard errors of 0`, () => {
      const r = simulatePlayers(s, n, T, rng(1000 + i));
      expect(Math.abs(r.mean)).toBeLessThanOrEqual(2 * r.se);
      expect(optionalStoppingCheck(r, 2).ok).toBe(true);
      expect(r.finals.length).toBe(n);
    });
  });

  it("fixed bet: the fan's spread after 200 tosses ≈ √200 = 14.1 and matches the numpy replay", () => {
    const r = simulatePlayers(fixedBet(1), n, T, rng(200));
    expect(Math.abs(r.sd - 14.142)).toBeLessThan(0.5);
    expect(Math.abs(r.sd - key.meter.strategies[0].sd)).toBeLessThan(0.5);
    expect(Math.abs(key.meter.strategies[0].mean)).toBeLessThanOrEqual(2 * key.meter.strategies[0].se);
  });

  it("the peek moves the meter: +1.00 per peeked toss; peeking for 20 tosses then playing honestly gains ≈ 20", () => {
    const r = simulatePlayers(peek(), 1000, T, rng(1));
    expect(r.mean).toBeCloseTo(T, 12);
    expect(r.sd).toBe(0);
    expect(r.mean / T).toBeGreaterThan(0.9);
    expect(r.mean / T).toBeCloseTo(key.peek.mean_gain_per_toss, 12);
    const p20 = simulatePlayers(peekFor(20), n, T, rng(2));
    expect(Math.abs(p20.mean - 20)).toBeLessThanOrEqual(3 * p20.se);
    expect(optionalStoppingCheck(p20, 3).ok).toBe(false);
  });
});

describe("B2 strategies vs the numpy key", () => {
  it("quit when up 1: P(hit within 100) ≈ 0.921 (±0.01), mean loss given miss ≈ −11.6; within 1,000 ≈ 0.975, ≈ −38", () => {
    const k100 = key.quit_up_1[0],
      k1000 = key.quit_up_1[1];
    expect(Math.abs(k100.p_hit - 0.921)).toBeLessThan(0.005);
    expect(Math.abs(k1000.p_hit - 0.975)).toBeLessThan(0.005);
    expect(Math.abs(k100.mean_loss_given_miss + 11.6)).toBeLessThan(0.5);
    expect(Math.abs(k1000.mean_loss_given_miss + 38)).toBeLessThan(2);
    expect(Math.abs(k100.mean)).toBeLessThan(0.05);
    expect(Math.abs(k1000.mean)).toBeLessThan(0.1);

    const s100 = quitUpByOneStats(20_000, 100, rng(100));
    expect(Math.abs(s100.pHit - 0.921)).toBeLessThan(0.01);
    expect(s100.pHitFormula).toBeCloseTo(k100.p_hit_formula, 12);
    expect(Math.abs(s100.meanLossGivenMiss + 11.6)).toBeLessThan(1.5);
    expect(Math.abs(s100.mean)).toBeLessThan(0.3);
    const s1000 = quitUpByOneStats(10_000, 1000, rng(1000));
    expect(Math.abs(s1000.pHit - 0.975)).toBeLessThan(0.01);
    expect(Math.abs(s1000.meanLossGivenMiss + 38)).toBeLessThan(6);
    expect(s1000.worst).toBeLessThan(-40);
    // histogram spike at +1 within ±0.01 of 0.921
    const r = simulatePlayers(quitWhenAhead(1, 100), 20_000, 100, rng(101));
    const bars = histogram(r.finals, -100, 1);
    expect(Math.abs(bars[101] / 20_000 - 0.921)).toBeLessThan(0.01);
  });

  it("two-sided quit (up 5 or down 20): 80 % leave at +5, mean 0", () => {
    const r = simulatePlayers(quitAt(5, 20), 10_000, 2000, rng(52));
    const up = r.finals.filter((v) => v === 5).length / 10_000;
    expect(Math.abs(up - 0.8)).toBeLessThan(0.015);
    expect(Math.abs(r.mean)).toBeLessThanOrEqual(3 * r.se);
    expect(Math.abs(key.two_sided.p_up_first - 0.8)).toBeLessThan(0.01);
    expect(Math.abs(key.two_sided.mean_duration - 100)).toBeLessThan(2);
  });

  it("doubling, k = 5 (bankroll 31), 100 cycles: mean 0, median +4, 62 % ahead, P(≥ 1 ruin) = 0.958", () => {
    const k = key.doubling_k5;
    expect(k.p_ruin_cycle).toBeCloseTo(1 / 32, 12);
    expect(k.mean_cycle_formula).toBeCloseTo(0, 12);
    expect(k.p_at_least_one_ruin_formula).toBeCloseTo(0.958, 3);
    expect(k.median).toBe(4);
    expect(Math.abs(k.p_ahead - 0.62)).toBeLessThan(0.01);
    expect(Math.abs(k.mean)).toBeLessThanOrEqual(3 * k.sd / Math.sqrt(k.players));
    expect(Math.abs(k.p_at_least_one_ruin - 0.958)).toBeLessThan(0.005);

    const d = doublingCycles(5, 100, 10_000, rng(31));
    expect(d.pRuinPerCycle).toBeCloseTo(1 / 32, 12);
    expect(d.meanPerCycleFormula).toBeCloseTo(0, 12);
    expect(d.pAtLeastOneRuinFormula).toBeCloseTo(0.958, 3);
    expect(Math.abs(d.mean)).toBeLessThanOrEqual(3 * d.se);
    expect(d.median).toBe(4);
    expect(Math.abs(d.pAhead - 0.62)).toBeLessThan(0.02);
    expect(Math.abs(d.pAtLeastOneRuin - 0.958)).toBeLessThan(0.01);
  });

  it("the honest wheel tilts every meter negative, doubling fastest", () => {
    const wheel = (s: Strategy): Strategy => ({ ...s, pHeads: ROULETTE_P });
    const unit = simulatePlayers(wheel(fixedBet(1)), 10_000, 100, rng(37));
    expect(Math.abs(unit.mean - 100 * unitBetEdge(ROULETTE_P))).toBeLessThanOrEqual(3 * unit.se);
    const dbl = simulatePlayers(wheel(doubling(31)), 10_000, 100, rng(38));
    expect(dbl.mean).toBeLessThan(unit.mean);
    expect(dbl.mean + 3 * dbl.se).toBeLessThan(0);
  });
});
