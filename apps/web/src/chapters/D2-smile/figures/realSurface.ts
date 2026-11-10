/**
 * Figure 4's real NIFTY surface: the NSE bhavcopy close of 23 Oct 2026, four expiries by D2's five featured strikes, each cell the
 * out-of-the-money side's implied vol (puts below the forward, calls above) from the settlement price, Black-76 on the parity
 * forward of that expiry. Built by tests/answer-key/key_surface.py -> src/data/nifty-surface-2026-10-23.json, tested in
 * engine/surface.test.ts. The 3 Nov row is the running chain's own expiry at the close, so it differs a little from the
 * screenshot the chapter opens with (22,600 call 239.85 at the close against 249.15 on the screen).
 */
import surface from "../../../data/nifty-surface-2026-10-23.json";

export interface RealSurface {
  label: string;
  F: number[];
  strikes: number[];
  expiries: string[];
  T: number[];
  /** percent, one row per expiry, one column per strike */
  vols: number[][];
  /** at-the-money implied vol (the fitted a), as a fraction, per expiry */
  atmVol: number[];
}

export const REAL_SURFACE: RealSurface = {
  label: "NSE NIFTY at the close of 23 Oct 2026, implied vol % (real)",
  F: surface.expiries.map((e) => e.F),
  strikes: surface.gridStrikes,
  expiries: surface.expiries.map((e) => `${e.label} (${e.days} d)`),
  T: surface.expiries.map((e) => e.T),
  vols: surface.expiries.map((e) => e.gridVol.map((v) => 100 * v)),
  atmVol: surface.expiries.map((e) => e.atmVol),
};
