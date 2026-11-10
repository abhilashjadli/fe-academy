/**
 * Figure 4's second-expiry beat. Until the 24 Nov monthly NIFTY chain (as seen on 23 Oct, D2's standing data ask) arrives, the
 * textbook rows are Gatheral Table 3.1's real SPX at-the-money variance skews (key-D3.json `term_structure`). When a real second row
 * exists, fill `REAL_SECOND_EXPIRY` and the figure replaces the textbook rows with it and relabels the panel "real".
 *
 * Expected shape: the at-the-money variance skew d(σ²_BS)/dk at k = 0 for each real expiry, from the same forward convention as the
 * chain (C1's implied forward per expiry), with the days to expiry and a label; the fitted stories' predictions at those T come from
 * the engine (hestonSmile / mertonSmile at T), not from here.
 */
export interface SecondExpiryRow {
  /** years to expiry */
  T: number;
  /** e.g. "3 Nov" and "24 Nov" */
  label: string;
  /** d(σ²_BS)/dk at k = 0, over ±1 % in log-moneyness, from the real chain at that expiry */
  varSkew: number;
  /** at-the-money implied vol at that expiry (for the caption) */
  atmVol: number;
}
export interface SecondExpiry {
  source: string; // e.g. "NSE NIFTY, 23 Oct 2026: 3 Nov weekly and 24 Nov monthly"
  rows: SecondExpiryRow[]; // at least two rows, the chain's own expiry first
}

export const REAL_SECOND_EXPIRY: SecondExpiry | null = null;
