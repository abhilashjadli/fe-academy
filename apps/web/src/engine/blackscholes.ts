import { cdf, pdf } from "./normal";

export interface BSParams {
  S: number;
  K: number;
  r: number;
  sigma: number;
  T: number;
}

export interface BSCall {
  d1: number;
  d2: number;
  price: number;
  delta: number;
  gamma: number;
  /** third derivative of price in S ("speed") */
  speed: number;
}

/** European call under Black-Scholes-Merton, no dividends. */
export function bsCall({ S, K, r, sigma, T }: BSParams): BSCall {
  const sq = sigma * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / sq;
  const d2 = d1 - sq;
  const Nd1 = cdf(d1);
  const price = S * Nd1 - K * Math.exp(-r * T) * cdf(d2);
  const gamma = pdf(d1) / (S * sq);
  const speed = (-gamma / S) * (1 + d1 / sq);
  return { d1, d2, price, delta: Nd1, gamma, speed };
}
