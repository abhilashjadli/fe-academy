/**
 * The real row as a one-step board (C2 Figures 0 and 1): C1's 22,600 call on the NSE NIFTY chain of 23 Oct 2026. Inputs come from the
 * tested answer key (key-C1C2.json, `c2_real`): today's level 22,559 — the stock whose 11-day forward is the chain's 22,603 — strike 22,600, the row's implied wobble
 * σ = 0.15853, 11 days, 6.5 %. The up and down nodes are CRR-sized from the wobble (u = e^{σ√T}, d = 1/u) by the engine, so every number
 * the figures print is the engine's and is checked in binomial.test.ts.
 */
import { format } from "d3-format";
import key from "../../../engine/__fixtures__/key-C1C2.json";
import { crrParameters, oneStep, type OneStepInput } from "../../../engine/binomial";

const c = key.c2_real;
const crr = crrParameters(c.sigma, c.r, c.T);

export const REAL: OneStepInput = { S0: c.S0, u: crr.u, d: crr.d, K: c.K, r: c.r, T: c.T };
/** the chain's forward for expiry day (C1), = S0 grown at r for 11 days */
export const REAL_FORWARD: number = c.F;
export const REAL_SIGMA: number = c.sigma;
export const REAL_DAYS: number = Math.round(c.T * 365);
export const LOT: number = key.nse.lot;
/** the screen's own price for this ticket, the 22,600 call's LTP */
export const SCREEN_CALL: number = key.nse.atm.call;
/** a round number above the one-step price, for the break-it preset */
export const SELL_AT = 330;

export const realStep = () => oneStep(REAL);

/** 22,603 */
export const n0 = format(",.0f");
/** 23,233.69 */
export const n2 = format(",.2f");
/** 0.5093 */
export const f4 = format(".4f");
/** 65 % */
export const pct = format(".0%");
/** 6.5 % */
export const pct1 = format(".1%");
/** 15.85 % */
export const pct2 = format(".2%");
