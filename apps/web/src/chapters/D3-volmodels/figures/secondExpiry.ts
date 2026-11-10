/**
 * Figure 4's second-expiry beat: the real at-the-money variance skews of the NSE NIFTY surface at the close of 23 Oct 2026 (bhavcopy),
 * one row per expiry, from the same forward convention as the chain (parity forward per expiry) and the same quadratic fit as
 * D2 (a + b k + c k² in log-moneyness on both sides' implied vols; the skew at k = 0 is 2ab). Built by tests/answer-key/key_surface.py
 * -> src/data/nifty-surface-2026-10-23.json, tested in engine/surface.test.ts. The fitted stories' predictions at these T come from
 * the engine (hestonSmile / mertonSmile), not from here.
 */
import surface from "../../../data/nifty-surface-2026-10-23.json";

export interface SecondExpiryRow {
  /** years to expiry */
  T: number;
  label: string;
  /** d(σ²_BS)/dk at k = 0 from the real chain at that expiry */
  varSkew: number;
  /** at-the-money implied vol at that expiry */
  atmVol: number;
}
export interface SecondExpiry {
  source: string;
  rows: SecondExpiryRow[]; // the chain's own expiry is the second row (3 Nov); 27 Oct is the nearer weekly
}

export const REAL_SECOND_EXPIRY: SecondExpiry = {
  source: "real: NSE NIFTY at the close of 23 Oct 2026 — 27 Oct and 3 Nov weeklies, 23 Nov monthly, 29 Dec quarterly",
  rows: surface.expiries.map((e) => ({ T: e.T, label: e.label, varSkew: e.varSkew, atmVol: e.atmVol })),
};
