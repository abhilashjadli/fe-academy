/** Lognormal, Student-t, and sample moments (chapter A1). */
import { cdf as ncdf, pdf as npdf } from "./normal";

const SQRT_2PI = Math.sqrt(2 * Math.PI);

/* ---------- lognormal: Y = e^X, X ~ N(mu, sigma^2) ---------- */
export const lognormal = {
  pdf: (y: number, mu: number, sigma: number) => (y <= 0 ? 0 : Math.exp(-((Math.log(y) - mu) ** 2) / (2 * sigma * sigma)) / (y * sigma * SQRT_2PI)),
  cdf: (y: number, mu: number, sigma: number) => (y <= 0 ? 0 : ncdf((Math.log(y) - mu) / sigma)),
  mean: (mu: number, sigma: number) => Math.exp(mu + (sigma * sigma) / 2),
  median: (mu: number) => Math.exp(mu),
  mode: (mu: number, sigma: number) => Math.exp(mu - sigma * sigma),
  variance: (mu: number, sigma: number) => (Math.exp(sigma * sigma) - 1) * Math.exp(2 * mu + sigma * sigma),
  skewness: (sigma: number) => (Math.exp(sigma * sigma) + 2) * Math.sqrt(Math.exp(sigma * sigma) - 1),
};

/* ---------- gamma function (Lanczos) and regularised incomplete beta ---------- */
const LANCZOS = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
export function lnGamma(z: number): number {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < LANCZOS.length; i++) x += LANCZOS[i] / (z + i + 1);
  const t = z + LANCZOS.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/** Continued fraction for the incomplete beta (Numerical Recipes betacf). */
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 300,
    EPS = 3e-14,
    FPMIN = 1e-300;
  const qab = a + b,
    qap = a + 1,
    qam = a - 1;
  let c = 1,
    d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularised incomplete beta I_x(a, b). */
export function betainc(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/* ---------- Student-t with nu degrees of freedom (standard, scale 1) ---------- */
export const studentT = {
  pdf: (x: number, nu: number) => Math.exp(lnGamma((nu + 1) / 2) - lnGamma(nu / 2)) / Math.sqrt(nu * Math.PI) * Math.pow(1 + (x * x) / nu, -(nu + 1) / 2),
  cdf: (x: number, nu: number) => {
    const t2 = x * x;
    const ib = betainc(nu / 2, 0.5, nu / (nu + t2));
    return x >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
  },
  /** variance (Infinity for nu <= 2) */
  variance: (nu: number) => (nu > 2 ? nu / (nu - 2) : Infinity),
  /** excess kurtosis (Infinity for nu <= 4) */
  excessKurtosis: (nu: number) => (nu > 4 ? 6 / (nu - 4) : Infinity),
  /** scale factor c so that c·T has unit variance (nu > 2) */
  unitScale: (nu: number) => (nu > 2 ? Math.sqrt((nu - 2) / nu) : 1),
  /** inverse-cdf sample from two uniforms via a normal and a chi-square approximation is avoided; use ratio of normal to sqrt(chi2/nu) */
};

/** P(|X| >= k) under the standard normal, and the once-in-N-years reading at 252 days/year. */
export function tailTwoSidedNormal(k: number): number {
  return 2 * (1 - ncdf(k));
}
export function tailTwoSidedT(kSd: number, nu: number): number {
  // kSd is measured in standard deviations of the (unit-variance-scaled) t; convert to the standard t's x
  const c = studentT.unitScale(nu);
  const x = kSd / c;
  return 2 * (1 - studentT.cdf(x, nu));
}
export function onceInYears(p: number, daysPerYear = 252): number {
  return p <= 0 ? Infinity : 1 / (daysPerYear * p);
}

/* ---------- sample moments ---------- */
export function moments(xs: ArrayLike<number>) {
  const n = xs.length;
  let m = 0;
  for (let i = 0; i < n; i++) m += xs[i];
  m /= n;
  let m2 = 0,
    m3 = 0,
    m4 = 0;
  for (let i = 0; i < n; i++) {
    const d = xs[i] - m;
    m2 += d * d;
    m3 += d * d * d;
    m4 += d * d * d * d;
  }
  m2 /= n;
  m3 /= n;
  m4 /= n;
  const sd = Math.sqrt(m2);
  return { mean: m, sd, skewness: m2 > 0 ? m3 / Math.pow(m2, 1.5) : 0, kurtosis: m2 > 0 ? m4 / (m2 * m2) : 0 };
}

export { npdf, ncdf };
