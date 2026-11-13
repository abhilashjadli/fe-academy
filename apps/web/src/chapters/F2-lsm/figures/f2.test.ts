import { describe, expect, it } from "vitest";
import key from "../../../engine/__fixtures__/key-F2.json";
import { FIT_RMS, NUS, RHOS, SURFACE, getBumps, getHullRun, getScaleRun, getTape, isValley, smileAt } from "./f2";

/** The F2 figures recompute a few things the key already holds; this pins the live values to the key cell by cell. */
describe("F2 figures — live values against key-F2", () => {
  it("Figure 2: the live SABR smile with α from the at-the-money vol scores the key's rms in every cell of the map", () => {
    RHOS.forEach((rho, i) =>
      NUS.forEach((nu, j) => {
        expect(smileAt(rho, nu).rms).toBeCloseTo(SURFACE[i][j], 6);
      }),
    );
    expect(FIT_RMS).toBeCloseTo(key.calib.rms_at_fit, 8);
  });
  it("Figure 2: the valley cells are the key's valley points, all within 0.05 vol points of the best cell", () => {
    let count = 0;
    RHOS.forEach((_, i) =>
      NUS.forEach((_, j) => {
        if (isValley(i, j)) {
          count++;
          expect(SURFACE[i][j] - key.calib.best_on_grid.rms).toBeLessThanOrEqual(0.05 + 1e-9);
        }
      }),
    );
    expect(count).toBe(key.calib.valley_points.length);
  });
  it("Figure 0: the live run on Hull's paths is the key's", () => {
    const r = getHullRun();
    expect(r.price).toBeCloseTo(key.hull209.price, 10);
    expect(r.rounds[0].exercise).toEqual(key.hull209.rounds[0].exercise);
    expect(r.rounds[1].exercise).toEqual(key.hull209.rounds[1].exercise);
  });
  it("Figure 1: the first run shown (2,000 paths, quadratic) is the key's seeded run", () => {
    const r = getScaleRun(key.lsm.seeded.n, "quad");
    expect(r.price).toBeCloseTo(key.lsm.seeded.price, 8);
    expect(r.se).toBeCloseTo(key.lsm.seeded.se, 8);
  });
  it("Figure 3: the tape's last node is the key's delta and the bump table's truncation branch is the key's", () => {
    expect(getTape("F").value).toBeCloseTo(key.ad.dual.delta, 12);
    expect(getTape("sigma").value).toBeCloseTo(key.ad.dual.vega, 8);
    getBumps()
      .filter((b) => b.rel >= 1e-6)
      .forEach((b, i) => expect(b.errCentral).toBeCloseTo(key.ad.bumps[i].err_central, 9));
  });
});
