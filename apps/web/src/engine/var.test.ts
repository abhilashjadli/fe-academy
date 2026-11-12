import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-E1.json";
import nifty from "../data/nifty50-long.json";
import {
  backtest,
  binomialTail,
  bookGreeks,
  bookPnl,
  cornishFisher,
  cornishFisherQuantile,
  historicalVaR,
  kupiec,
  linearVaR,
  normalES,
  normalVaR,
  pnlFromReturns,
  quadVaR,
  rollingFences,
  sd0,
  subadditivityExample,
  type Book,
} from "./var";

const returns = nifty.returns.map((x) => x.r);
const dates = nifty.returns.map((x) => x.d);
const pnl = pnlFromReturns(returns, key.record.notional);
const loss = Float64Array.from(pnl, (v) => -v);
const K = key.record;

describe("E1 — the record: ₹1 crore long NIFTY", () => {
  it("historical VaR and ES at 99 % and 95 % are the key's to the rupee", () => {
    expect(pnl.length).toBe(K.n);
    const h99 = historicalVaR(loss, 0.01);
    const h95 = historicalVaR(loss, 0.05);
    expect(h99.k).toBe(K.k99);
    expect(h99.var).toBeCloseTo(K.hist_var99, 4);
    expect(h99.es).toBeCloseTo(K.hist_es99, 4);
    expect(h95.k).toBe(K.k95);
    expect(h95.var).toBeCloseTo(K.hist_var95, 4);
    expect(h95.es).toBeCloseTo(K.hist_es95, 4);
    expect(h99.es).toBeGreaterThan(h99.var);
    expect(h99.var).toBeGreaterThan(h95.var);
    expect(dates[h99.worst[0]]).toBe(K.worst[0].date);
    expect(loss[h99.worst[0]]).toBeCloseTo(K.worst[0].loss, 4);
  });
  it("the normal model: VaR = z σ and ES = σ φ(z)/p", () => {
    const s = sd0(pnl);
    expect(s).toBeCloseTo(K.sd, 4);
    expect(normalVaR(s, 0.01)).toBeCloseTo(K.param_var99, 3);
    expect(normalVaR(s, 0.05)).toBeCloseTo(K.param_var95, 3);
    expect(normalES(s, 0.01)).toBeCloseTo(K.param_es99, 3);
    expect(normalES(s, 0.05)).toBeCloseTo(K.param_es95, 3);
  });
  it("the bell's 1 % line leaves more real days beyond it than its own 1 %", () => {
    const line = normalVaR(sd0(pnl), 0.01);
    let beyond = 0;
    for (const l of loss) if (l > line) beyond++;
    expect(beyond).toBe(K.beyond_bell_99);
    expect(beyond).toBeGreaterThan(K.k99);
  });
});

describe("E1 — the backtest on a 500-day window", () => {
  const f = rollingFences(pnl, key.backtest.window);
  const testLoss = loss.subarray(f.start);
  const testDates = dates.slice(f.start);
  it("the three fences match the key day by day", () => {
    expect(f.historical.length).toBe(key.backtest.T);
    for (let i = 0; i < f.historical.length; i += 7) {
      expect(f.historical[i]).toBeCloseTo(key.fences.historical[i], 4);
      expect(f.normal[i]).toBeCloseTo(key.fences.normal[i], 3);
      expect(f.ewma[i]).toBeCloseTo(key.fences.ewma[i], 3);
    }
  });
  it("25 / 41 / 43 exceptions against an expected 21.8; the historical fence passes Kupiec, the bells do not", () => {
    const h = backtest(testLoss, f.historical);
    const n = backtest(testLoss, f.normal);
    const e = backtest(testLoss, f.ewma);
    expect(h.exceptions).toBe(key.backtest.historical.exceptions);
    expect(n.exceptions).toBe(key.backtest.normal.exceptions);
    expect(e.exceptions).toBe(key.backtest.ewma.exceptions);
    expect(h.at.map((i) => testDates[i])).toEqual(key.backtest.historical.dates);
    expect(h.kupiecLR).toBeCloseTo(key.backtest.historical.kupiec_lr, 8);
    expect(h.kupiecLR).toBeLessThan(key.backtest.kupiec_crit);
    expect(n.kupiecLR).toBeGreaterThan(key.backtest.kupiec_crit);
    expect(e.kupiecLR).toBeGreaterThan(key.backtest.kupiec_crit);
    expect(kupiec(0, 250, 0.01)).toBeCloseTo(-2 * 250 * Math.log(0.99), 10);
    expect(binomialTail(h.exceptions, key.backtest.T, 0.01)).toBeCloseTo(key.backtest.historical.p_at_least, 6);
  });
  it("March 2020: the fence read ₹3.71 lakh on 20 Mar; 23 Mar lost 3.5 times that; six exceptions in the month", () => {
    const i = testDates.indexOf("2020-03-23");
    expect(f.historical[i]).toBeCloseTo(key.backtest.march2020.fence_on_20mar, 4);
    expect(testLoss[i] / f.historical[i]).toBeCloseTo(key.backtest.march2020.ratio, 6);
    const h = backtest(testLoss, f.historical);
    expect(h.at.filter((j) => testDates[j].startsWith("2020-03")).length).toBe(key.backtest.march2020.exceptions_in_month);
  });
  it("the ghost: the fence falls by a third in March 2022 while the 2020 cluster leaves the window", () => {
    const g = key.backtest.ghost;
    const a = testDates.indexOf(g.start);
    const b = testDates.indexOf(g.end);
    expect(f.historical[a]).toBeCloseTo(g.before, 4);
    expect(f.historical[b]).toBeCloseTo(g.after, 4);
    expect(1 - f.historical[b] / f.historical[a]).toBeGreaterThan(0.3);
  });
});

const R = key.raj;
const book: Book = { F: R.F, K: R.K, r: R.r, T: R.T, sigma: R.sigma, short: R.short, sigDay: R.sig_day };

describe("E1 — Raj's book", () => {
  it("Greeks and theta per day agree with the key (and D1)", () => {
    const g = bookGreeks(book);
    expect(g.call).toBeCloseTo(R.call, 6);
    expect(g.delta).toBeCloseTo(R.delta, 8);
    expect(g.gamma).toBeCloseTo(R.gamma, 10);
    expect(g.thetaDay).toBeCloseTo(R.theta_day, 4);
    expect(sd0(returns)).toBeCloseTo(R.sig_day, 10);
  });
  it("the linear model says ₹144; full revaluation on the real days says ₹10.3 lakh; the bend on a bell ₹7.35 lakh", () => {
    expect(linearVaR(book, R.hedge)).toBeCloseTo(R.linear_var99, 4);
    expect(linearVaR(book, R.hedge)).toBeLessThan(200);
    const full = bookPnl(book, R.hedge, returns);
    const h = historicalVaR(Float64Array.from(full, (v) => -v), 0.01);
    expect(h.var).toBeCloseTo(R.full_var99, 3);
    expect(h.es).toBeCloseTo(R.full_es99, 3);
    expect(Math.max(...full)).toBeCloseTo(R.full_best, 3);
    expect(Math.max(...full)).toBeCloseTo(R.theta_day, 0); // the best day is the clock
    expect(quadVaR(book, R.hedge)).toBeCloseTo(R.quad_var99, 2);
  });
  it("Cornish–Fisher: on Raj's skew of −2.9 it lands within a tenth of the exact quadratic quantile; on Hull's −0.4 it gives 5.976", () => {
    const cf = cornishFisher(book, R.hedge);
    expect(cf.skew).toBeCloseTo(R.cornish_fisher.skew, 6);
    expect(cf.var).toBeCloseTo(R.cornish_fisher.var99, 2);
    expect(Math.abs(cf.var / R.quad_var99 - 1)).toBeLessThan(0.1);
    const h = key.hull.ex16_2;
    expect(cornishFisherQuantile(h.mu, h.sd, h.skew, -2.33)).toBeCloseTo(h.cf, 6);
    expect(cornishFisherQuantile(h.mu, h.sd, h.skew, -2.33)).toBeCloseTo(h.book_cf, 3);
    expect(h.mu - 2.33 * h.sd).toBeCloseTo(h.book_normal, 3);
  });
  it("the hedge dial: linear, full and quadratic VaR at every stop", () => {
    for (const d of R.dial) {
      expect(linearVaR(book, d.h)).toBeCloseTo(d.linear, 3);
      expect(quadVaR(book, d.h)).toBeCloseTo(d.quad, 1);
      const full = bookPnl(book, d.h, returns);
      expect(historicalVaR(Float64Array.from(full, (v) => -v), 0.01).var).toBeCloseTo(d.full, 3);
    }
    const lin = R.dial.map((d: { linear: number }) => d.linear);
    expect(Math.min(...lin)).toBe(R.linear_var99); // the linear model bottoms out exactly where the hedger sits
  });
});

describe("E1 — the books' numbers", () => {
  it("Hull Ch. 16: Microsoft, AT&T, together, the benefit, Example 16.1", () => {
    const H = key.hull;
    expect(H.msft.var10).toBeCloseTo(H.msft.book_var10, 0);
    expect(H.att.var10).toBeCloseTo(H.att.book_var10, 0);
    expect(H.both.var10).toBeCloseTo(H.both.book_var10, 0);
    expect(H.both.benefit).toBeCloseTo(H.both.book_benefit, -1);
    expect(H.ex16_1.var).toBeCloseTo(H.ex16_1.book_var, 0);
    expect(Math.sqrt(200000 ** 2 + 50000 ** 2 + 2 * 0.3 * 200000 * 50000)).toBeCloseTo(H.both.sd, 6);
  });
  it("Wilmott Table 19.1 and Tsay Example 7.2", () => {
    const vals = Object.values(key.wilmott.table19_1) as number[];
    vals.forEach((v, i) => expect(v).toBeCloseTo(key.wilmott.book[i], 4));
    expect(normalVaR(1, 0.01)).toBeCloseTo(key.wilmott.book[0], 4);
    // Tsay prints 0.03025 and 0.04265 for the quantiles; 1.6449 × √0.000336 = 0.030152 — his printed variance is rounded, so 0.5 %
    expect(Math.abs(key.tsay.var05 / key.tsay.book[0] - 1)).toBeLessThan(0.005);
    expect(Math.abs(key.tsay.var01 / key.tsay.book[1] - 1)).toBeLessThan(0.005);
  });
  it("VaR is not sub-additive; ES is", () => {
    const s = subadditivityExample(100, 0.04, 0.05);
    expect(s.eachVaR).toBe(key.subadditivity.each_var95);
    expect(s.jointVaR).toBe(key.subadditivity.joint_var95);
    expect(s.jointVaR).toBeGreaterThan(2 * s.eachVaR);
    expect(s.eachES).toBeCloseTo(key.subadditivity.each_es95, 10);
    expect(s.jointES).toBeCloseTo(key.subadditivity.joint_es95, 10);
    expect(s.jointES).toBeLessThanOrEqual(2 * s.eachES);
  });
});
