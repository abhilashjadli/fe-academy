import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-C1C2.json";
import {
  americanPutRange,
  breakEven,
  bsCallAndPut,
  callFloorArbitrage,
  callPayoff,
  conversionLedger,
  expectedValuePrice,
  impliedCall,
  impliedForward,
  impliedForwardPerRow,
  impliedPut,
  intrinsicValue,
  legPayoff,
  lotCost,
  maxPutGap,
  moneyness,
  netDebit,
  noArbitrageBounds,
  optionPayoff,
  parityLedger,
  parityLedgerAtExpiry,
  positionPayoff,
  positionProfit,
  predictedCalls,
  predictedPuts,
  profitCurve,
  putCallParity,
  putFloorArbitrage,
  putPayoff,
  strategies,
  timeValue,
  type ChainRow,
  type Leg,
  type OptionKind,
} from "./options";

const k = key as typeof key;

describe("C1 payoffs and strategies vs key (Hull ch. 1, 9; Natenberg)", () => {
  it("long/short call and put payoffs at ten index levels", () => {
    for (const s of k.payoffs.levels) {
      expect(callPayoff(s, 60)).toBe(Math.max(s - 60, 0));
      expect(putPayoff(s, 90)).toBe(Math.max(90 - s, 0));
      expect(optionPayoff("call", "short", s, 60)).toBeCloseTo(Math.min(60 - s, 0), 12);
      expect(optionPayoff("put", "short", s, 90)).toBeCloseTo(Math.min(s - 90, 0), 12);
    }
  });

  it("Hull's Microsoft call and IBM put profit curves (p. 7–8)", () => {
    const mc = k.payoffs.microsoft_call;
    const curve = profitCurve(strategies.longCall(mc.K, mc.premium), k.payoffs.levels);
    curve.forEach((v, i) => expect(v).toBeCloseTo(mc.profit[i], 12));
    expect(curve[k.payoffs.levels.indexOf(75)]).toBe(10);
    expect(curve[k.payoffs.levels.indexOf(62)]).toBe(-3);
    const ip = k.payoffs.ibm_put;
    const pc = profitCurve(strategies.longPut(ip.K, ip.premium), k.payoffs.levels);
    pc.forEach((v, i) => expect(v).toBeCloseTo(ip.profit[i], 12));
    expect(pc[k.payoffs.levels.indexOf(75)]).toBe(8);
    expect(breakEven("call", 60, 5)).toBe(65);
    expect(breakEven("put", 90, 7)).toBe(83);
  });

  it("straddle (p. 194), bull spread (Ex. 9.1), covered call, protective put: stacked legs sum pointwise", () => {
    const st = k.payoffs.straddle;
    const legs = strategies.straddle(st.K, st.c, st.p);
    expect(netDebit(legs)).toBe(7);
    profitCurve(legs, k.payoffs.levels).forEach((v, i) => expect(v).toBeCloseTo(st.profit[i], 12));
    expect(positionProfit(legs, 69)).toBe(-6);
    expect(positionProfit(legs, 70)).toBe(-7);
    expect(positionProfit(legs, 90)).toBe(13);
    expect(positionProfit(legs, 55)).toBe(8);
    for (const be of st.breakevens) expect(positionProfit(legs, be)).toBeCloseTo(0, 12);
    const bs = k.payoffs.bull_spread;
    const bl = strategies.bullSpread(bs.K1, bs.c1, bs.K2, bs.c2);
    expect(netDebit(bl)).toBe(bs.cost);
    profitCurve(bl, bs.levels).forEach((v, i) => expect(v).toBeCloseTo(bs.profit[i], 12));
    expect(positionProfit(bl, 40)).toBe(3);
    expect(positionProfit(bl, 25)).toBe(-2);
    const cc = k.payoffs.covered_call;
    profitCurve(strategies.coveredCall(cc.S0, cc.K, cc.c), cc.levels).forEach((v, i) => expect(v).toBeCloseTo(cc.profit[i], 12));
    const pp = k.payoffs.protective_put;
    profitCurve(strategies.protectivePut(pp.S0, pp.K, pp.p), pp.levels).forEach((v, i) => expect(v).toBeCloseTo(pp.profit[i], 12));
    // stacking is pointwise: every leg's payoff summed
    for (const s of k.payoffs.levels) {
      const all: Leg[] = [...legs, ...bl];
      expect(positionPayoff(all, s)).toBeCloseTo(legs.reduce((a, l) => a + legPayoff(l, s), 0) + bl.reduce((a, l) => a + legPayoff(l, s), 0), 12);
    }
  });

  it("a forward is a call minus a put at the same strike", () => {
    const f = k.payoffs.forward_as_call_minus_put;
    f.levels.forEach((s, i) => expect(positionPayoff(strategies.syntheticForward(f.K, 0, 0), s)).toBe(f.payoff[i]));
  });

  it("Natenberg's +1 95c / −3 105c position (pp. 24–25)", () => {
    const n = k.payoffs.natenberg_position;
    const legs: Leg[] = n.legs.map(([qty, K, premium]) => ({ kind: "call" as const, qty, K, premium }));
    expect(netDebit(legs)).toBeCloseTo(n.debit, 10);
    expect(positionProfit(legs, 95)).toBeCloseTo(n.at95, 10);
    expect(positionProfit(legs, 105)).toBeCloseTo(n.at105, 10);
    expect(positionProfit(legs, 110) - positionProfit(legs, 105)).toBeCloseTo(5 * n.slope_above_105, 10);
  });

  it("intrinsic value, time value, moneyness", () => {
    for (const c of k.intrinsic) {
      const kind = c.kind as OptionKind;
      expect(intrinsicValue(kind, c.S, c.K)).toBeCloseTo(c.intrinsic, 10);
      expect(timeValue(kind, c.S, c.K, c.price)).toBeCloseTo(c.time, 10);
      expect(moneyness(kind, c.S, c.K)).toBe(c.moneyness);
    }
  });

  it("Natenberg's expected-value model (pp. 40–41): 6.00 → 5.88; 4.00 → 3.92", () => {
    const e = k.expected_value;
    const flat = expectedValuePrice(e.prices, [0.2, 0.2, 0.2, 0.2, 0.2], 100, 0.02);
    expect(flat.ev).toBeCloseTo(6, 10);
    expect(flat.pv).toBeCloseTo(e.flat.pv, 10);
    expect(flat.pv).toBeCloseTo(5.88, 2);
    const pk = expectedValuePrice(e.prices, [0.1, 0.2, 0.4, 0.2, 0.1], 100, 0.02);
    expect(pk.ev).toBeCloseTo(4, 10);
    expect(pk.pv).toBeCloseTo(3.92, 2);
  });
});

describe("C1 bounds vs key (Hull §8.3)", () => {
  it("call floor 3.71 (p. 172), Example 8.1 3.91, put floor 2.01 (p. 173), Example 8.2 1.01", () => {
    const cf = k.bounds.call_floor;
    const b = noArbitrageBounds(cf.S, cf.K, cf.r, cf.T);
    expect(b.callLower).toBeCloseTo(cf.call_lower, 10);
    expect(b.callLower).toBeCloseTo(3.71, 2);
    expect(b.callUpper).toBe(20);
    expect(noArbitrageBounds(k.bounds.ex81.S, k.bounds.ex81.K, k.bounds.ex81.r, k.bounds.ex81.T).callLower).toBeCloseTo(3.91, 2);
    const pf = k.bounds.put_floor;
    const pb = noArbitrageBounds(pf.S, pf.K, pf.r, pf.T);
    expect(pb.putLower).toBeCloseTo(pf.put_lower, 10);
    expect(pb.putLower).toBeCloseTo(2.01, 2);
    expect(pb.putUpperEuropean).toBeCloseTo(pf.pvK, 10);
    expect(pb.putUpperAmerican).toBe(40);
    expect(noArbitrageBounds(k.bounds.ex82.S, k.bounds.ex82.K, k.bounds.ex82.r, k.bounds.ex82.T).putLower).toBeCloseTo(1.01, 2);
  });

  it("Hull's arbitrage tables: call at 3 → 18.79 → profits 0.79 / 1.79; put at 1 → 38.96 → 1.04 / 3.04", () => {
    const cf = k.bounds.call_floor;
    const a = callFloorArbitrage(cf.S, cf.K, cf.r, cf.T, cf.call_price, cf.S_T_low);
    expect(a.growsTo).toBeCloseTo(cf.grows_to, 10);
    expect(a.growsTo).toBeCloseTo(18.79, 2);
    expect(a.profitExercise).toBeCloseTo(0.79, 2);
    expect(a.profitLow).toBeCloseTo(1.79, 2);
    const pf = k.bounds.put_floor;
    const p = putFloorArbitrage(pf.S, pf.K, pf.r, pf.T, pf.put_price, pf.S_T_high);
    expect(p.repay).toBeCloseTo(pf.repay, 10);
    expect(p.repay).toBeCloseTo(38.96, 2);
    expect(p.profitExercise).toBeCloseTo(1.04, 2);
    expect(p.profitHigh).toBeCloseTo(3.04, 2);
  });

  it("Example 8.3 (p. 175): American put between 1.68 and 2.50", () => {
    const e = k.bounds.ex83;
    const r = americanPutRange(e.S, e.K, e.r, e.T, e.C);
    expect(r.pLow).toBeCloseTo(e.P_lo, 10);
    expect(r.pHigh).toBeCloseTo(e.P_hi, 10);
    expect(r.pLow).toBeCloseTo(1.68, 2);
    expect(r.pHigh).toBeCloseTo(2.5, 2);
  });
});

describe("C1 put–call parity and the ledger vs key (Hull pp. 174–175)", () => {
  it("32.26 vs 33.25 → 1.02; with p = 1: 32.00 → 0.27; profit is the same at every S_T", () => {
    const a = k.parity.hull_a;
    const par = putCallParity(a.c, a.p, a.S, a.K, a.r, a.T);
    expect(par.left).toBeCloseTo(a.left, 10);
    expect(par.right).toBeCloseTo(a.right, 10);
    expect(par.left).toBeCloseTo(32.26, 2);
    expect(par.holds).toBe(false);
    const la = parityLedger(a.c, a.p, a.S, a.K, a.r, a.T);
    expect(la.sell).toBe("put side");
    expect(la.cashNow).toBeCloseTo(30.25, 10);
    expect(la.grown).toBeCloseTo(a.grown, 10);
    expect(la.grown).toBeCloseTo(31.02, 2);
    expect(la.profit).toBeCloseTo(a.profit, 10);
    expect(la.profit).toBeCloseTo(1.02, 2);
    for (const ST of [20, 30, 40]) expect(parityLedgerAtExpiry(la, ST, a.K)).toBeCloseTo(la.profit, 10);
    const b = k.parity.hull_b;
    const lb = parityLedger(b.c, b.p, b.S, b.K, b.r, b.T);
    expect(lb.sell).toBe("call side");
    expect(lb.cashNow).toBeCloseTo(-29, 10);
    expect(lb.grown).toBeCloseTo(b.grown, 10);
    expect(lb.profit).toBeCloseTo(b.profit, 10);
    expect(lb.profit).toBeCloseTo(0.27, 2);
    for (const ST of [20, 30, 40]) expect(parityLedgerAtExpiry(lb, ST, b.K)).toBeCloseTo(lb.profit, 10);
  });

  it("parity holds for Black–Scholes prices (Fig. 8.1/8.2: 7.116 / 4.677) and the quantt example (p = 7.90)", () => {
    const f = k.parity.fig81;
    const { call, put } = bsCallAndPut(f.S, f.K, f.r, f.sigma, f.T);
    expect(call).toBeCloseTo(f.call, 6);
    expect(put).toBeCloseTo(f.put, 6);
    expect(call).toBeCloseTo(7.116, 3);
    expect(put).toBeCloseTo(4.677, 3);
    expect(putCallParity(call, put, f.S, f.K, f.r, f.T).holds).toBe(true);
    const q = k.parity.quantt;
    expect(impliedPut(q.c, q.S, q.K, q.r, q.T)).toBeCloseTo(q.p, 10);
    expect(impliedPut(q.c, q.S, q.K, q.r, q.T)).toBeCloseTo(7.9, 2);
    expect(impliedCall(q.p, q.S, q.K, q.r, q.T)).toBeCloseTo(q.c, 10);
  });

  it("Natenberg's chain (p. 13): C − P within 0.10 of F − K; conversion (p. 217) locks 0.25", () => {
    const n = k.parity.natenberg_chain;
    const rows: ChainRow[] = n.K.map((K, i) => ({ K, call: n.c_minus_p[i] + 20, put: 20 }));
    impliedForwardPerRow(rows).forEach((f) => expect(Math.abs(f - n.F)).toBeLessThanOrEqual(0.1 + 1e-12));
    const c = k.parity.natenberg_conversion;
    const led = conversionLedger({ K: c.K, call: c.c, put: c.p }, c.F);
    expect(led.perUnit).toBeCloseTo(c.lock, 10);
    expect(led.perUnit).toBeCloseTo(0.25, 10);
  });
});

describe("C1 the NSE NIFTY chain (23 Oct 2026) vs key", () => {
  const rows: ChainRow[] = k.nse.strikes.map((K, i) => ({ K, call: k.nse.calls[i], put: k.nse.puts[i] }));

  it("C − P + K per row matches the storyboard's seventeen numbers; median 22,603.75; all within ±13", () => {
    const f = impliedForward(rows);
    f.perRow.forEach((v, i) => expect(v).toBeCloseTo(k.nse.implied_forward[i], 8));
    expect(f.perRow[0]).toBeCloseTo(22603.85, 2);
    expect(f.perRow[7]).toBeCloseTo(22599.55, 2);
    expect(f.F).toBeCloseTo(k.nse.median, 8);
    expect(Math.round(f.F)).toBe(22604);
    expect(f.min).toBeCloseTo(22596.6, 2);
    expect(f.max).toBeCloseTo(22609.3, 2);
    for (const v of f.perRow) expect(Math.abs(v - f.F)).toBeLessThan(13);
  });

  it("puts predicted from the call column at F = 22,603: 123.30 / 204.75 / 246.15 / 299.00 / 355.55 / 491.40 / 530.45; max gap 6.40", () => {
    const pred = predictedPuts(rows, k.nse.F);
    pred.forEach((v, i) => expect(v).toBeCloseTo(k.nse.predicted_puts[i], 8));
    k.nse.pick.strikes.forEach((K, i) => {
      const j = k.nse.strikes.indexOf(K);
      expect(pred[j]).toBeCloseTo(k.nse.pick.predicted[i], 8);
      expect(Math.abs(pred[j] - k.nse.pick.real[i])).toBeLessThanOrEqual(6.4 + 1e-9);
    });
    expect(pred[0]).toBeCloseTo(123.3, 2);
    expect(pred[k.nse.strikes.indexOf(22800)]).toBeCloseTo(355.55, 2);
    expect(maxPutGap(rows, k.nse.F)).toBeCloseTo(k.nse.max_gap, 8);
    expect(maxPutGap(rows, k.nse.F)).toBeCloseTo(6.4, 2);
    // and the calls from the puts, round trip
    const pc = predictedCalls(rows, k.nse.F);
    rows.forEach((r, i) => expect(pc[i] - r.call).toBeCloseTo(r.put - pred[i], 8));
  });

  it("the 22,600 call: break-even 22,849.15; one lot of 65 costs ₹16,194.75", () => {
    expect(breakEven("call", k.nse.atm.K, k.nse.atm.call)).toBeCloseTo(k.nse.atm.breakeven, 8);
    expect(lotCost(k.nse.atm.call, k.nse.lot)).toBeCloseTo(k.nse.atm.per_lot, 8);
    expect(lotCost(k.nse.atm.call, k.nse.lot)).toBeCloseTo(16194.75, 2);
  });

  it("break it: the 22,800 put typed at 340 → +15.55 per unit, ₹1,010.75 per lot, identical at S_T = 22,000 / 22,600 / 23,200", () => {
    const b = k.nse.break_it;
    const led = conversionLedger({ K: b.K, call: b.call, put: b.put_typed }, k.nse.F, k.nse.lot);
    expect(led.perUnit).toBeCloseTo(b.per_unit, 8);
    expect(led.perUnit).toBeCloseTo(15.55, 2);
    expect(led.perLot).toBeCloseTo(b.per_lot, 8);
    expect(Math.round(led.perLot)).toBe(1011);
    for (const ST of b.check_levels) expect(led.atExpiry(ST)).toBeCloseTo(led.perUnit, 8);
    // at the real price the ledger shows the real gap (negative: the real put is dear relative to the call)
    const real = conversionLedger(rows[k.nse.strikes.indexOf(22800)], k.nse.F, k.nse.lot);
    expect(real.perUnit).toBeCloseTo(-6.4, 8);
  });
});
