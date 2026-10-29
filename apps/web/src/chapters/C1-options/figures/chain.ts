/**
 * Chapter C1 — the real NSE NIFTY option chain of 23 October 2026, read straight from the tested answer key
 * (src/engine/__fixtures__/key-C1C2.json, `nse` section), so every number a figure prints is one the engine
 * tests check. The day's spot and expiry are not in the crop: the index is inferred from the chain (≈ 22,603).
 */
import key from "../../../engine/__fixtures__/key-C1C2.json";
import type { ChainRow } from "../../../engine/options";

const nse = key.nse;

export const rows: ChainRow[] = nse.strikes.map((K, i) => ({ K, call: nse.calls[i], put: nse.puts[i] }));
export const LOT: number = nse.lot;
export const ATM_K: number = nse.atm.K;
/** the forward the chain implies, rounded as the storyboard quotes it (median of C − P + K over the rows is 22,603.75) */
export const SPOT_INFERRED: number = nse.F;
export const PICK_STRIKES: number[] = nse.pick.strikes;
export const BREAK_IT = nse.break_it;

export const CHAIN_IMG = {
  src: import.meta.env.BASE_URL + "artefacts/nse-nifty-chain-2026-10-23.png",
  width: 1910,
  height: 917,
  alt: "NSE NIFTY option chain, 23 October 2026: calls on the left, puts on the right, strikes 22,250 to 23,050 down the middle",
};

export function rowAt(K: number): ChainRow {
  const r = rows.find((x) => x.K === K);
  if (!r) throw new Error("no such strike " + K);
  return r;
}

/** 2 dp with thousands separators: 22,603.85 */
export const n2 = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** integer with thousands separators: 22,600 */
export const n0 = (v: number) => Math.round(v).toLocaleString("en-US", { maximumFractionDigits: 0 });
/** rupees, 2 dp: ₹16,194.75 */
export const rs = (v: number) => (v < 0 ? "−₹" : "₹") + n2(Math.abs(v));
/** signed 2 dp: +15.55 / −15.55 */
export const s2 = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "") + n2(Math.abs(v));
