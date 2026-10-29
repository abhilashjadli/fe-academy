/**
 * Chapter C1: option payoffs and strategies, intrinsic/time value, no-arbitrage bounds, put–call parity and its
 * arbitrage ledger, and the "half the chain implies the other half" helpers for the NSE NIFTY option chain.
 * Hull chapters 1, 8, 9; Natenberg chapters 1–2, 11. No dividends unless stated; r continuously compounded.
 */
import { bsCall } from "./blackscholes";

export type OptionKind = "call" | "put";
export type Side = "long" | "short";

/** One leg of a position: an option or the underlying/forward, with a signed quantity and the premium paid per unit (0 for a forward). */
export interface Leg {
  kind: OptionKind | "underlying" | "forward";
  /** +n long, −n short */
  qty: number;
  /** strike (options) or the forward price (so a forward's payoff is S_T − K); for the underlying, its price today */
  K: number;
  /** premium paid today per unit, positive (an option); the underlying's premium is its price (its payoff is S_T), a forward's is 0 */
  premium?: number;
}

// ---------------------------------------------------------------- payoffs (Hull pp. 9–10)

export function callPayoff(ST: number, K: number): number {
  return Math.max(ST - K, 0);
}

export function putPayoff(ST: number, K: number): number {
  return Math.max(K - ST, 0);
}

/** Payoff of one unit of a leg at expiry (long sign); the premium is ignored here. */
export function legPayoff(leg: Leg, ST: number): number {
  switch (leg.kind) {
    case "call":
      return leg.qty * callPayoff(ST, leg.K);
    case "put":
      return leg.qty * putPayoff(ST, leg.K);
    case "underlying":
      // the stock itself is worth S_T; what was paid for it is its premium
      return leg.qty * ST;
    default:
      return leg.qty * (ST - leg.K);
  }
}

/** Payoff of a long or short option at expiry: short call = min(K − S_T, 0), short put = min(S_T − K, 0). */
export function optionPayoff(kind: OptionKind, side: Side, ST: number, K: number): number {
  const v = kind === "call" ? callPayoff(ST, K) : putPayoff(ST, K);
  return side === "long" ? v : -v;
}

/** Net premium paid today for a position (positive = debit). */
export function netDebit(legs: Leg[]): number {
  let s = 0;
  for (const l of legs) s += l.qty * (l.premium ?? 0);
  return s;
}

/** Position payoff at expiry: legs summed pointwise. */
export function positionPayoff(legs: Leg[], ST: number): number {
  let s = 0;
  for (const l of legs) s += legPayoff(l, ST);
  return s;
}

/** Profit = payoff − premium paid, ignoring the time value of money (Hull p. 185). */
export function positionProfit(legs: Leg[], ST: number): number {
  return positionPayoff(legs, ST) - netDebit(legs);
}

/** Profit curve over an array of index levels. */
export function profitCurve(legs: Leg[], levels: number[]): number[] {
  return levels.map((s) => positionProfit(legs, s));
}

/** Break-even of a single long option: K + c for a call, K − p for a put. */
export function breakEven(kind: OptionKind, K: number, premium: number): number {
  return kind === "call" ? K + premium : K - premium;
}

// ---------------------------------------------------------------- the strategy shelf (Hull ch. 9; Natenberg)

export const strategies = {
  longCall: (K: number, c: number): Leg[] => [{ kind: "call", qty: 1, K, premium: c }],
  longPut: (K: number, p: number): Leg[] => [{ kind: "put", qty: 1, K, premium: p }],
  shortCall: (K: number, c: number): Leg[] => [{ kind: "call", qty: -1, K, premium: c }],
  shortPut: (K: number, p: number): Leg[] => [{ kind: "put", qty: -1, K, premium: p }],
  /** long stock at S0 plus a short call */
  coveredCall: (S0: number, K: number, c: number): Leg[] => [
    { kind: "underlying", qty: 1, K: S0, premium: S0 },
    { kind: "call", qty: -1, K, premium: c },
  ],
  /** long stock at S0 plus a long put */
  protectivePut: (S0: number, K: number, p: number): Leg[] => [
    { kind: "underlying", qty: 1, K: S0, premium: S0 },
    { kind: "put", qty: 1, K, premium: p },
  ],
  straddle: (K: number, c: number, p: number): Leg[] => [
    { kind: "call", qty: 1, K, premium: c },
    { kind: "put", qty: 1, K, premium: p },
  ],
  /** bull spread with calls: buy K1, sell K2 > K1 */
  bullSpread: (K1: number, c1: number, K2: number, c2: number): Leg[] => [
    { kind: "call", qty: 1, K: K1, premium: c1 },
    { kind: "call", qty: -1, K: K2, premium: c2 },
  ],
  /** a forward at K is a long call minus a short put at the same strike: payoff S_T − K */
  syntheticForward: (K: number, c: number, p: number): Leg[] => [
    { kind: "call", qty: 1, K, premium: c },
    { kind: "put", qty: -1, K, premium: p },
  ],
};

/** Profit of a stock position bought at S0 at price S_T, minus a premium paid for cover. Convenience for the shelf. */
export function stockProfit(S0: number, ST: number): number {
  return ST - S0;
}

// ---------------------------------------------------------------- intrinsic / time value, moneyness (Natenberg pp. 6–7)

export type Moneyness = "ITM" | "ATM" | "OTM";

export function intrinsicValue(kind: OptionKind, S: number, K: number): number {
  return kind === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0);
}

export function timeValue(kind: OptionKind, S: number, K: number, price: number): number {
  return price - intrinsicValue(kind, S, K);
}

export function moneyness(kind: OptionKind, S: number, K: number, atmBand = 0): Moneyness {
  if (Math.abs(S - K) <= atmBand) return "ATM";
  if (kind === "call") return S > K ? "ITM" : "OTM";
  return S < K ? "ITM" : "OTM";
}

// ---------------------------------------------------------------- bounds (Hull §8.3)

export interface Bounds {
  pvK: number;
  /** c ≥ max(S − Ke^{−rT}, 0) (8.1) */
  callLower: number;
  /** c ≤ S, C ≤ S */
  callUpper: number;
  /** p ≥ max(Ke^{−rT} − S, 0) (8.2) */
  putLower: number;
  /** p ≤ Ke^{−rT} (European) */
  putUpperEuropean: number;
  /** P ≤ K (American) */
  putUpperAmerican: number;
}

export function noArbitrageBounds(S: number, K: number, r: number, T: number): Bounds {
  const pvK = K * Math.exp(-r * T);
  return { pvK, callLower: Math.max(S - pvK, 0), callUpper: S, putLower: Math.max(pvK - S, 0), putUpperEuropean: pvK, putUpperAmerican: K };
}

/** American put–call relation (8.4): S − K ≤ C − P ≤ S − Ke^{−rT}; with C known, the interval for P. */
export function americanPutRange(S: number, K: number, r: number, T: number, C: number): { cpLow: number; cpHigh: number; pLow: number; pHigh: number } {
  const cpLow = S - K;
  const cpHigh = S - K * Math.exp(-r * T);
  return { cpLow, cpHigh, pLow: C - cpHigh, pHigh: C - cpLow };
}

/**
 * Hull's table for a call below its floor (p. 172): short the stock, buy the call, invest the rest at r.
 * Returns the profit when S_T ≥ K (exercise) and when S_T = `STLow` < K (buy back in the market).
 */
export function callFloorArbitrage(S: number, K: number, r: number, T: number, callPrice: number, STLow: number): { invested: number; growsTo: number; profitExercise: number; profitLow: number } {
  const invested = S - callPrice;
  const growsTo = invested * Math.exp(r * T);
  return { invested, growsTo, profitExercise: growsTo - K, profitLow: growsTo - STLow };
}

/**
 * Hull's table for a put below its floor (p. 173): borrow S + p, buy the stock and the put; repay at T.
 * Profit when S_T ≤ K (exercise) and when S_T = `STHigh` > K (sell the stock).
 */
export function putFloorArbitrage(S: number, K: number, r: number, T: number, putPrice: number, STHigh: number): { borrowed: number; repay: number; profitExercise: number; profitHigh: number } {
  const borrowed = S + putPrice;
  const repay = borrowed * Math.exp(r * T);
  return { borrowed, repay, profitExercise: K - repay, profitHigh: STHigh - repay };
}

// ---------------------------------------------------------------- put–call parity (Hull 8.3) and its arbitrage ledger

export interface Parity {
  /** c + Ke^{−rT} */
  left: number;
  /** p + S */
  right: number;
  /** right − left: positive when the put side is rich */
  gap: number;
  holds: boolean;
}

export function putCallParity(c: number, p: number, S: number, K: number, r: number, T: number, tol = 1e-9): Parity {
  const left = c + K * Math.exp(-r * T);
  const right = p + S;
  return { left, right, gap: right - left, holds: Math.abs(right - left) <= tol };
}

/** The put implied by the call (and vice versa) under European parity. */
export function impliedPut(c: number, S: number, K: number, r: number, T: number): number {
  return c + K * Math.exp(-r * T) - S;
}
export function impliedCall(p: number, S: number, K: number, r: number, T: number): number {
  return p + S - K * Math.exp(-r * T);
}

export interface ParityLedger extends Parity {
  /** which portfolio is sold: the rich one */
  sell: "put side" | "call side";
  /** the three trades, in words, with their cash today (positive = received) */
  trades: { what: string; cash: number }[];
  /** net cash today (positive = received and invested, negative = borrowed) */
  cashNow: number;
  /** that cash at T */
  grown: number;
  /** cash at T after settling the strike: the riskless profit, whatever S_T */
  profit: number;
}

/**
 * Hull pp. 174–175: if p + S > c + Ke^{−rT}, buy the call, short the put and the stock, invest; at T pay K whatever happens.
 * If the call side is rich, short the call, buy the put and the stock with borrowed money; at T receive K.
 */
export function parityLedger(c: number, p: number, S: number, K: number, r: number, T: number): ParityLedger {
  const par = putCallParity(c, p, S, K, r, T);
  if (par.gap > 0) {
    const trades = [
      { what: "buy the call", cash: -c },
      { what: "sell the put", cash: p },
      { what: "sell the stock short", cash: S },
    ];
    const cashNow = -c + p + S;
    const grown = cashNow * Math.exp(r * T);
    return { ...par, sell: "put side", trades, cashNow, grown, profit: grown - K };
  }
  const trades = [
    { what: "sell the call", cash: c },
    { what: "buy the put", cash: -p },
    { what: "buy the stock", cash: -S },
  ];
  const cashNow = c - p - S;
  const grown = cashNow * Math.exp(r * T);
  return { ...par, sell: "call side", trades, cashNow, grown, profit: K + grown };
}

/** Payoff at T of the parity ledger's position, to show it is the same number at every S_T (the ledger is riskless). */
export function parityLedgerAtExpiry(ledger: ParityLedger, S_T: number, K: number): number {
  const sign = ledger.sell === "put side" ? 1 : -1;
  // put side sold: +call −put −stock = (S_T − K) − S_T = −K ; call side sold: −call +put +stock = +K
  const position = sign * (callPayoff(S_T, K) - putPayoff(S_T, K) - S_T);
  return ledger.grown + position;
}

/** Black–Scholes call and the parity put (for C1's Figure 8.1/8.2 curves). */
export function bsCallAndPut(S: number, K: number, r: number, sigma: number, T: number): { call: number; put: number } {
  const call = bsCall({ S, K, r, sigma, T }).price;
  return { call, put: impliedPut(call, S, K, r, T) };
}

// ---------------------------------------------------------------- the chain: C − P + K vs the forward, no discounting (Natenberg p. 220)

export interface ChainRow {
  K: number;
  call: number;
  put: number;
}

/** The forward each row implies: C − P + K (futures-style parity, no interest between today and expiry). */
export function impliedForwardPerRow(rows: ChainRow[]): number[] {
  return rows.map((r) => r.call - r.put + r.K);
}

export function median(xs: number[]): number {
  const s = xs.slice().sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

/** One forward for the whole chain: the median of the rows' C − P + K (robust to a stale print). */
export function impliedForward(rows: ChainRow[]): { F: number; perRow: number[]; min: number; max: number } {
  const perRow = impliedForwardPerRow(rows);
  return { F: median(perRow), perRow, min: Math.min(...perRow), max: Math.max(...perRow) };
}

/** Puts predicted from the call column alone at forward F: P = C − (F − K). */
export function predictedPuts(rows: ChainRow[], F: number): number[] {
  return rows.map((r) => r.call - (F - r.K));
}

/** Calls predicted from the put column alone: C = P + (F − K). */
export function predictedCalls(rows: ChainRow[], F: number): number[] {
  return rows.map((r) => r.put + (F - r.K));
}

/** Largest |predicted − real| put over the chain. */
export function maxPutGap(rows: ChainRow[], F: number): number {
  const pred = predictedPuts(rows, F);
  let worst = 0;
  rows.forEach((r, i) => (worst = Math.max(worst, Math.abs(pred[i] - r.put))));
  return worst;
}

export interface ConversionLedger {
  /** C − P − (F − K): per unit, locked in whatever S_T does; positive when the put is cheap */
  perUnit: number;
  perLot: number;
  trades: { what: string; cash: number }[];
  /** the position's value at expiry at any index level, including the cash: always = perUnit */
  atExpiry: (ST: number) => number;
}

/**
 * The conversion / reversal (Natenberg p. 217): if a put is cheap relative to C − (F − K), buy the put, sell the call and buy the forward at F.
 * Payoff at T: (K − S_T)+ − (S_T − K)+ + (S_T − F) = K − F whatever S_T; cash today C − P. Locked profit per unit = C − P + K − F.
 */
export function conversionLedger(row: ChainRow, F: number, lot = 1): ConversionLedger {
  const perUnit = row.call - row.put + row.K - F;
  const trades = [
    { what: `buy the ${row.K} put`, cash: -row.put },
    { what: `sell the ${row.K} call`, cash: row.call },
    { what: `buy the index forward at ${F}`, cash: 0 },
  ];
  return {
    perUnit,
    perLot: perUnit * lot,
    trades,
    atExpiry: (ST) => row.call - row.put + putPayoff(ST, row.K) - callPayoff(ST, row.K) + (ST - F),
  };
}

/** Cost of one lot at a premium. */
export function lotCost(premium: number, lot: number): number {
  return premium * lot;
}

/** The forward price of the index with carry: F = S e^{rT} (Natenberg p. 42). */
export function forwardPrice(S: number, r: number, T: number): number {
  return S * Math.exp(r * T);
}

/** Natenberg's expected-value model (pp. 40–41): Σ pᵢ · payoffᵢ, then discounted by one period of simple carry. */
export function expectedValuePrice(prices: number[], probs: number[], K: number, carry: number, kind: OptionKind = "call"): { ev: number; pv: number } {
  let ev = 0;
  for (let i = 0; i < prices.length; i++) ev += probs[i] * (kind === "call" ? callPayoff(prices[i], K) : putPayoff(prices[i], K));
  return { ev, pv: ev / (1 + carry) };
}
