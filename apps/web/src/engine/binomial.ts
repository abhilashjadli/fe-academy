/**
 * Chapter C2: one-step replication, the multi-step CRR tree with European/American backward induction, convergence to
 * Black–Scholes, the hedge meter and the "price does not depend on p" demonstrator. Hull ch. 10 (pp. 201–215); Wilmott ch. 15.
 * The stock lattice and the risk-neutral probability come from martingale.ts's riskNeutralTree (Shreve's tree with simple
 * interest 1 + r per step); Hull's continuous compounding is passed in as 1 + r = e^{rδt}.
 */
import { bsCall } from "./blackscholes";
import { riskNeutralTree } from "./martingale";
import type { OptionKind } from "./options";

// ---------------------------------------------------------------- one step (Hull §10.1, pp. 201–205)

export interface OneStepInput {
  S0: number;
  u: number;
  d: number;
  K: number;
  r: number;
  T: number;
  kind?: OptionKind;
}

export interface OneStep {
  Su: number;
  Sd: number;
  fu: number;
  fd: number;
  /** shares per option that make the portfolio riskless: (f_u − f_d)/(S_u − S_d) */
  delta: number;
  /** value of the riskless portfolio Δ·S − f at T (the same in both states) */
  portfolio: number;
  /** that value discounted to today */
  pv: number;
  /** the option today: S0·Δ − pv */
  f: number;
  /** risk-neutral probability (e^{rT} − d)/(u − d) */
  p: number;
  /** the same price written as e^{−rT}[p f_u + (1 − p) f_d] */
  fRiskNeutral: number;
  /** E_p[S_T] = S0 e^{rT} */
  expectedStockUnderP: number;
  /** cash position of the replicating portfolio: −pv (borrowed) */
  cash: number;
}

export function payoff(kind: OptionKind, S: number, K: number): number {
  return kind === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0);
}

/** Requires d < e^{rT} < u, else the tree itself is an arbitrage. */
export function noArbitrageOk(u: number, d: number, r: number, dt: number): boolean {
  const g = Math.exp(r * dt);
  return d < g && g < u;
}

export function oneStep({ S0, u, d, K, r, T, kind = "call" }: OneStepInput): OneStep {
  if (!noArbitrageOk(u, d, r, T)) throw new Error(`arbitrage: need d < e^{rT} < u (d = ${d}, e^{rT} = ${Math.exp(r * T)}, u = ${u})`);
  const Su = S0 * u,
    Sd = S0 * d;
  const fu = payoff(kind, Su, K),
    fd = payoff(kind, Sd, K);
  const delta = (fu - fd) / (Su - Sd);
  const portfolio = Su * delta - fu;
  const pv = portfolio * Math.exp(-r * T);
  const f = S0 * delta - pv;
  const p = (Math.exp(r * T) - d) / (u - d);
  const fRiskNeutral = Math.exp(-r * T) * (p * fu + (1 - p) * fd);
  return { Su, Sd, fu, fd, delta, portfolio, pv, f, p, fRiskNeutral, expectedStockUnderP: p * Su + (1 - p) * Sd, cash: -pv };
}

/** Real-world probability of the up move when the stock's expected return is μ: q = (e^{μT} − d)/(u − d) (Hull p. 205). */
export function realWorldProbability(u: number, d: number, mu: number, T: number): number {
  return (Math.exp(mu * T) - d) / (u - d);
}

/**
 * Hull p. 205: the real-world expected payoff discounted at the (unknown) rate R equals the no-arbitrage price.
 * Returns the expected payoff under q and the R that makes e^{−RT}·E_q[payoff] = f (42.6 % in Hull's example).
 */
export function impliedDiscountRate(step: OneStep, q: number, T: number): { expectedPayoff: number; rate: number } {
  const expectedPayoff = q * step.fu + (1 - q) * step.fd;
  return { expectedPayoff, rate: Math.log(expectedPayoff / step.f) / T };
}

/**
 * "The price does not depend on p": for each belief b about the up move, the replication price (constant) next to the
 * naive number "discount my expected payoff at r" (moves with b). Only one belief — the risk-neutral p — makes them agree.
 */
export function beliefDemonstrator(input: OneStepInput, beliefs: number[]): { belief: number; replication: number; naive: number; delta: number }[] {
  const s = oneStep(input);
  return beliefs.map((b) => ({ belief: b, replication: s.f, naive: Math.exp(-input.r * input.T) * (b * s.fu + (1 - b) * s.fd), delta: s.delta }));
}

/** If the option trades at `market` instead of f, the riskless profit per option from selling (or buying) it and hedging. */
export function mispricingProfit(step: OneStep, market: number): { profit: number; action: "sell the option" | "buy the option" | "nothing" } {
  const diff = market - step.f;
  if (Math.abs(diff) < 1e-12) return { profit: 0, action: "nothing" };
  return { profit: Math.abs(diff), action: diff > 0 ? "sell the option" : "buy the option" };
}

/**
 * Hedge meter (C2 F1): hold h shares and `cash` today (negative = borrowed at r). What is the book worth in the up and down
 * state at T, and how far is it from the option's payoff in each? Perfect hedge ⇔ both gaps are 0 ⇔ h = Δ, cash = −pv.
 */
export function hedgeMeter(input: OneStepInput, h: number, cash: number): { up: number; down: number; gapUp: number; gapDown: number; cost: number; spread: number } {
  const s = oneStep(input);
  const g = Math.exp(input.r * input.T);
  const up = h * s.Su + cash * g;
  const down = h * s.Sd + cash * g;
  return { up, down, gapUp: up - s.fu, gapDown: down - s.fd, cost: h * input.S0 + cash, spread: Math.abs(up - s.fu - (down - s.fd)) };
}

// ---------------------------------------------------------------- multi-step trees

export interface TreeInput {
  S0: number;
  K: number;
  r: number;
  /** time step length */
  dt: number;
  steps: number;
  u: number;
  d: number;
  kind?: OptionKind;
  american?: boolean;
}

export interface TreeResult {
  p: number;
  u: number;
  d: number;
  dt: number;
  /** S[i][j]: stock after i steps with j down-moves (most up first) */
  S: number[][];
  /** V[i][j]: option value at that node (after any early-exercise decision) */
  V: number[][];
  /** continuation value before the early-exercise comparison (equals V when European) */
  continuation: number[][];
  /** whether the node was exercised early (American only) */
  exercised: boolean[][];
  /** delta at every non-terminal node: (V_up − V_down)/(S_up − S_down) */
  delta: number[][];
  price: number;
}

/** Backward induction on a recombining tree; nodes are the discounted p-mean of their children, with an early-exercise floor if American. */
export function binomialTree({ S0, K, r, dt, steps, u, d, kind = "call", american = false }: TreeInput): TreeResult {
  if (!noArbitrageOk(u, d, r, dt)) throw new Error(`arbitrage: need d < e^{rδt} < u (d = ${d}, e^{rδt} = ${Math.exp(r * dt)}, u = ${u})`);
  const lattice = riskNeutralTree(S0, u, d, Math.exp(r * dt) - 1, steps);
  const p = lattice.pTilde;
  const S = lattice.prices;
  const disc = Math.exp(-r * dt);
  const V: number[][] = new Array(steps + 1);
  const continuation: number[][] = new Array(steps + 1);
  const exercised: boolean[][] = new Array(steps + 1);
  V[steps] = S[steps].map((s) => payoff(kind, s, K));
  continuation[steps] = V[steps].slice();
  exercised[steps] = V[steps].map(() => false);
  for (let i = steps - 1; i >= 0; i--) {
    const row: number[] = new Array(i + 1);
    const cont: number[] = new Array(i + 1);
    const ex: boolean[] = new Array(i + 1);
    for (let j = 0; j <= i; j++) {
      const c = disc * (p * V[i + 1][j] + (1 - p) * V[i + 1][j + 1]);
      cont[j] = c;
      if (american) {
        const intrinsic = payoff(kind, S[i][j], K);
        ex[j] = intrinsic > c;
        row[j] = Math.max(c, intrinsic);
      } else {
        ex[j] = false;
        row[j] = c;
      }
    }
    V[i] = row;
    continuation[i] = cont;
    exercised[i] = ex;
  }
  const delta: number[][] = [];
  for (let i = 0; i < steps; i++) {
    const row: number[] = [];
    for (let j = 0; j <= i; j++) row.push((V[i + 1][j] - V[i + 1][j + 1]) / (S[i + 1][j] - S[i + 1][j + 1]));
    delta.push(row);
  }
  return { p, u, d, dt, S, V, continuation, exercised, delta, price: V[0][0] };
}

/** Probability of ending at node j (j down-moves) after n steps: C(n, j) p^{n−j} (1 − p)^j — the 0.2 binomial. */
export function terminalProbabilities(p: number, n: number): number[] {
  const out: number[] = new Array(n + 1);
  let c = 1;
  for (let j = 0; j <= n; j++) {
    out[j] = c * Math.pow(p, n - j) * Math.pow(1 - p, j);
    c = (c * (n - j)) / (j + 1);
  }
  return out;
}

/** The two-step price written as a sum over terminal nodes (Hull 10.8): Σ C(n,k) p^k (1−p)^{n−k} payoff, discounted. */
export function binomialSum(t: TreeResult, r: number): number {
  const n = t.S.length - 1;
  const probs = terminalProbabilities(t.p, n);
  let s = 0;
  for (let j = 0; j <= n; j++) s += probs[j] * t.V[n][j];
  return Math.exp(-r * n * t.dt) * s;
}

// ---------------------------------------------------------------- CRR (Hull 10.11–10.13; pp. 211–213)

export interface CRRParams {
  S: number;
  K: number;
  r: number;
  sigma: number;
  T: number;
  n: number;
  kind?: OptionKind;
  american?: boolean;
}

/** u = e^{σ√δt}, d = 1/u, p = (e^{rδt} − d)/(u − d). */
export function crrParameters(sigma: number, r: number, dt: number): { u: number; d: number; p: number } {
  const u = Math.exp(sigma * Math.sqrt(dt));
  const d = 1 / u;
  return { u, d, p: (Math.exp(r * dt) - d) / (u - d) };
}

export function crrTree({ S, K, r, sigma, T, n, kind = "call", american = false }: CRRParams): TreeResult {
  const dt = T / n;
  const { u, d } = crrParameters(sigma, r, dt);
  return binomialTree({ S0: S, K, r, dt, steps: n, u, d, kind, american });
}

/** Price only, without building the node arrays: O(n) memory, fine for n in the thousands. */
export function crrPrice({ S, K, r, sigma, T, n, kind = "call", american = false }: CRRParams): number {
  const dt = T / n;
  const { u, d, p } = crrParameters(sigma, r, dt);
  if (!noArbitrageOk(u, d, r, dt)) throw new Error("arbitrage: need d < e^{rδt} < u");
  const disc = Math.exp(-r * dt);
  let V = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) V[j] = payoff(kind, S * Math.pow(u, n - j) * Math.pow(d, j), K);
  for (let i = n - 1; i >= 0; i--) {
    const next = new Array<number>(i + 1);
    for (let j = 0; j <= i; j++) {
      let c = disc * (p * V[j] + (1 - p) * V[j + 1]);
      if (american) c = Math.max(c, payoff(kind, S * Math.pow(u, i - j) * Math.pow(d, j), K));
      next[j] = c;
    }
    V = next;
  }
  return V[0];
}

/** Black–Scholes call or (by parity) put for the convergence target. */
export function bsPrice(S: number, K: number, r: number, sigma: number, T: number, kind: OptionKind = "call"): number {
  const c = bsCall({ S, K, r, sigma, T }).price;
  return kind === "call" ? c : c + K * Math.exp(-r * T) - S;
}

export interface ConvergencePoint {
  n: number;
  price: number;
  error: number;
  /** odd/even label for the sawtooth */
  parity: "odd" | "even";
}

/** CRR price against Black–Scholes for a list of step counts: the sawtooth. */
export function convergence(params: Omit<CRRParams, "n">, ns: number[]): { bs: number; points: ConvergencePoint[] } {
  const target = bsPrice(params.S, params.K, params.r, params.sigma, params.T, params.kind ?? "call");
  const points = ns.map((n) => {
    const price = crrPrice({ ...params, n });
    return { n, price, error: price - target, parity: n % 2 ? ("odd" as const) : ("even" as const) };
  });
  return { bs: target, points };
}

/** The n / n + 1 average that kills most of the sawtooth (10.4493 at 100/101). */
export function oddEvenAverage(params: Omit<CRRParams, "n">, n: number): number {
  return (crrPrice({ ...params, n }) + crrPrice({ ...params, n: n + 1 })) / 2;
}

/** Early-exercise premium: American minus European from the same tree. */
export function earlyExercisePremium(params: CRRParams): { american: number; european: number; premium: number } {
  const american = crrPrice({ ...params, american: true });
  const european = crrPrice({ ...params, american: false });
  return { american, european, premium: american - european };
}

/** Largest American − European shortfall over all nodes (must be ≥ 0 everywhere). */
export function americanDominates(params: CRRParams): boolean {
  const am = crrTree({ ...params, american: true });
  const eu = crrTree({ ...params, american: false });
  for (let i = 0; i < am.V.length; i++) for (let j = 0; j < am.V[i].length; j++) if (am.V[i][j] < eu.V[i][j] - 1e-12) return false;
  return true;
}
