import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-D1.json";
import data from "../data/nifty50-long.json";
import { black76Greeks } from "./bs";
import { edgePerDay, hedgeLedger, realisedVol, simulateHedge, summarise, wilmottMarker } from "./hedge";

const K = 22600, r = 0.065, sigma = key.realised.sold, units = -6500, lot = 65;
const closes = (data as { rows: { d: string; c: number }[] }).rows.filter((x) => x.d >= "2026-10-23" && x.d <= "2026-11-03");

describe("D1 — the real week in Raj's ledger", () => {
  const rows = hedgeLedger({ closes, expiry: "2026-11-03", K, r, sigma, units, lot, carry: 22603 / 22600 });
  it("reproduces the key row by row", () => {
    expect(rows.length).toBe(key.ledger.length);
    rows.forEach((row, i) => {
      const k = key.ledger[i];
      expect(row.daysLeft).toBe(k.days_left);
      expect(row.value).toBeCloseTo(k.value, 6);
      expect(row.delta).toBeCloseTo(k.delta, 8);
      expect(row.hedgeUnits).toBeCloseTo(k.hedge_units, 4);
      expect(row.tradeLots).toBeCloseTo(k.trade_lots, 4);
      expect(row.clock).toBeCloseTo(k.clock, 2);
      expect(row.bend).toBeCloseTo(k.bend, 2);
      expect(row.exactDay).toBeCloseTo(k.exact_day, 2);
      expect(row.book).toBeCloseTo(k.book, 2);
    });
  });
  it("the first day: half a lot per call, ₹16.2 lakh in", () => {
    expect(rows[0].hedgeUnits).toBeCloseTo(3291.7, 0);
    expect(rows[0].cash).toBeCloseTo(key.position.premium, 2);
  });
  it("the day's split is within 2 % of the move of the exact re-price, and the book is cash plus the mark", () => {
    for (const row of rows.slice(1)) {
      expect(Math.abs(row.clock + row.bend - row.exactDay)).toBeLessThan(0.1 * Math.abs(row.exactDay) + 2 * Math.abs(row.dS) * 65);
      expect(row.book).toBeCloseTo(row.cash + units * row.value, 6);
    }
  });
  it("the hedger's realised wobble so far", () => {
    expect(realisedVol(closes.map((c) => c.c))).toBeCloseTo(key.realised.realised_vol, 10);
  });
});

describe("D1 — the referee's card and the week run many times", () => {
  const g0 = black76Greeks({ F: 22603, K, r, sigma, T: 11 / 365 });
  it("edge per day ties at the sold wobble and matches the key", () => {
    for (const [s, v] of Object.entries(key.edge_vs_realised)) expect(edgePerDay(g0, 22603, units, Number(s), sigma)).toBeCloseTo(v.per_day, 3);
    expect(edgePerDay(g0, 22603, units, sigma, sigma)).toBeCloseTo(0, 8);
  });
  it("a dead heat on average when the index wobbles at the sold vol; the spread halves as the frequency quadruples", () => {
    const base = { F0: 22603, K, r, sigmaSold: sigma, sigmaReal: sigma, days: 11, units, paths: 2000 };
    const premium = key.histogram_notes.premium;
    const once = summarise(simulateHedge({ ...base, stepsPerDay: 1 / 11, seed: 1 }));
    const daily = summarise(simulateHedge({ ...base, stepsPerDay: 1, seed: 2 }));
    const four = summarise(simulateHedge({ ...base, stepsPerDay: 4, seed: 3 }));
    for (const s of [once, daily, four]) expect(Math.abs(s.mean)).toBeLessThan(3.5 * s.se);
    expect(daily.sd / four.sd).toBeGreaterThan(1.6);
    expect(daily.sd / four.sd).toBeLessThan(2.4);
    expect(once.sd / premium).toBeCloseTo(key.histogram.expiry_only["0.1585"].sd_over_premium, 1);
    expect(daily.sd / premium).toBeCloseTo(key.histogram.daily["0.1585"].sd_over_premium, 1);
  });
  it("the mean moves with the vol gap and sits on Wilmott's marker", () => {
    const low = summarise(simulateHedge({ F0: 22603, K, r, sigmaSold: sigma, sigmaReal: 0.1, days: 11, stepsPerDay: 4, units, paths: 2000, seed: 5 }));
    const marker = wilmottMarker({ F: 22603, K, r, T: 11 / 365 }, sigma, 0.1, units);
    expect(marker).toBeCloseTo(key.histogram_notes.wilmott_marker["0.1000"], 2);
    expect(Math.abs(low.mean - marker)).toBeLessThan(4 * low.se + 0.02 * Math.abs(marker));
    expect(low.mean).toBeGreaterThan(0);
  });
});

describe("D1 — Hull's bank (tests only)", () => {
  it("the key's 20,000-path reproduction of Table 14.4 is within the book's standard error", () => {
    const book = key.hull.table_14_4_book;
    book.dt_weeks.forEach((w, i) => {
      const sim = (key.hull.table_14_4_sim as Record<string, { perf: number }>)[String(w)].perf;
      expect(Math.abs(sim - book.perf[i])).toBeLessThan(0.03);
    });
    expect(key.hull.value_100k).toBeCloseTo(240053, 0);
    expect(key.hull.delta0).toBeCloseTo(0.522, 3);
    expect(key.natenberg_ledger.total).toBeCloseTo(62.81, 2);
  });
});
