/**
 * Taylor polynomials for the chapter-0.1 function library.
 * Each function supplies its value and its n-th derivative at a point analytically,
 * so coefficients f^(k)(a)/k! are exact (no finite differences).
 */
import { bsCall } from "./blackscholes";

export interface TaylorFn {
  id: string;
  label: string;
  tex: string;
  /** n-th derivative at a (n = 0 is the value) */
  deriv(n: number, a: number): number;
  /** domain for plotting / validity */
  domain: [number, number];
  /** default expansion point */
  a0: number;
  /** radius of convergence about a, or Infinity */
  radius(a: number): number;
}

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));

export const FUNCTIONS: Record<string, TaylorFn> = {
  cos: {
    id: "cos",
    label: "cos x",
    tex: "\\cos x",
    deriv: (n, a) => [Math.cos(a), -Math.sin(a), -Math.cos(a), Math.sin(a)][n % 4],
    domain: [-4, 4],
    a0: 0,
    radius: () => Infinity,
  },
  exp: {
    id: "exp",
    label: "eˣ",
    tex: "e^{x}",
    deriv: (_n, a) => Math.exp(a),
    domain: [-3, 3],
    a0: 0,
    radius: () => Infinity,
  },
  ln: {
    id: "ln",
    label: "ln x",
    tex: "\\ln x",
    deriv: (n, a) => (n === 0 ? Math.log(a) : ((n - 1) % 2 === 0 ? 1 : -1) * factorial(n - 1) / Math.pow(a, n)),
    domain: [0.05, 4],
    a0: 1,
    radius: (a) => a,
  },
  sqrt1p: {
    id: "sqrt1p",
    label: "√(1 + x)",
    tex: "\\sqrt{1+x}",
    deriv: (n, a) => {
      let c = 1;
      for (let k = 0; k < n; k++) c *= 0.5 - k;
      return c * Math.pow(1 + a, 0.5 - n);
    },
    domain: [-0.99, 3],
    a0: 0,
    radius: (a) => 1 + a,
  },
};

/** A Black-Scholes call value as a function of S, with analytic derivatives to third order. */
export function bsCurve(K = 100, r = 0.05, sigma = 0.2, T = 1): TaylorFn {
  return {
    id: "bs",
    label: "option value V(S)",
    tex: "V(S)",
    deriv: (n, S) => {
      const c = bsCall({ S, K, r, sigma, T });
      if (n === 0) return c.price;
      if (n === 1) return c.delta;
      if (n === 2) return c.gamma;
      if (n === 3) return c.speed;
      throw new Error("bsCurve: derivatives above order 3 are not provided");
    },
    domain: [50, 160],
    a0: 100,
    radius: () => Infinity,
  };
}

/** k-th Taylor coefficient of f about a. */
export function coefficient(f: TaylorFn, k: number, a: number): number {
  return f.deriv(k, a) / factorial(k);
}

/** Coefficients c_0..c_n about a. */
export function coefficients(f: TaylorFn, n: number, a: number): number[] {
  const out: number[] = [];
  for (let k = 0; k <= n; k++) out.push(coefficient(f, k, a));
  return out;
}

/** Evaluate the degree-n Taylor polynomial of f about a, at x (Horner). */
export function taylor(f: TaylorFn, n: number, a: number, x: number): number {
  const c = coefficients(f, n, a);
  let acc = 0;
  const h = x - a;
  for (let k = n; k >= 0; k--) acc = acc * h + c[k];
  return acc;
}

/** Evaluate an arbitrary polynomial Σ c_k (x-a)^k. */
export function polyEval(c: number[], a: number, x: number): number {
  let acc = 0;
  const h = x - a;
  for (let k = c.length - 1; k >= 0; k--) acc = acc * h + c[k];
  return acc;
}

/** Partial sums S_0..S_n of the Taylor series of f about a, at x. */
export function partialSums(f: TaylorFn, n: number, a: number, x: number): number[] {
  const out: number[] = [];
  let acc = 0;
  const h = x - a;
  let hk = 1;
  for (let k = 0; k <= n; k++) {
    acc += coefficient(f, k, a) * hk;
    hk *= h;
    out.push(acc);
  }
  return out;
}

/** Sample y = g(x) on [x0, x1] with m points. */
export function sample(g: (x: number) => number, x0: number, x1: number, m = 200): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < m; i++) {
    const x = x0 + ((x1 - x0) * i) / (m - 1);
    pts.push([x, g(x)]);
  }
  return pts;
}

export { factorial };
