/**
 * Figure 4's slot for a real NIFTY surface. Vite cannot guard a static JSON import, so the real block is a typed constant:
 * when the second expiry arrives (data ask in research/storyboards/D2.md — the 24 Nov 2026 monthly chain as seen on 23 Oct,
 * or any day with two expiries captured together), fill this in from a tested answer key and the figure renders it above the
 * textbook grid, labelled real. Until then it is null and only Hull's Table 15.2 is shown.
 *
 * Expected shape:
 *   {
 *     label: "NSE NIFTY, 23 Oct 2026, two expiries (real)",
 *     F: [22603, 22650],                // the forward of each expiry
 *     strikes: [22250, 22500, 22600, 22700, 23050],   // in index points (the cells read ln(K/F) per row at render)
 *     expiries: ["3 Nov", "24 Nov"],
 *     T: [11 / 365, 32 / 365],
 *     vols: [[...], [...]],             // percent, one row per expiry, one column per strike, from the engine's impliedVolFwd
 *   }
 */
export interface RealSurface {
  label: string;
  F: number[];
  strikes: number[];
  expiries: string[];
  T: number[];
  vols: number[][];
}

export const REAL_SURFACE: RealSurface | null = null;
