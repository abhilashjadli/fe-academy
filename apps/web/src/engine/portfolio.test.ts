import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-E3.json";
import {
  bestMeanAtRisk,
  covFrom,
  factorExposure,
  frontierRisk,
  frontierWeights,
  globalMinimum,
  minVarWeight2,
  noShortEnvelope,
  nss,
  pca,
  portfolioMean,
  portfolioRisk,
  projectedVariance2,
  reconstruct,
  tangency,
  twoAsset,
} from "./portfolio";

const close = (a: number[], b: number[], d: number) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], d));

describe("E3 — two assets", () => {
  const { A, E } = key.two;
  it("the hyperbola, the straight line at ρ = 1, and the zero-risk weight at ρ = −1", () => {
    for (const r of key.two.rows) {
      const p = twoAsset(r.w, A, E, r.rho);
      expect(p.mu).toBeCloseTo(r.mu, 10);
      expect(p.sd).toBeCloseTo(r.sd, 10);
    }
    const w0 = key.two.zero_risk_weight_rho_minus1;
    expect(minVarWeight2(A, E, -1)).toBeCloseTo(w0, 10);
    expect(twoAsset(w0, A, E, -1).sd).toBeCloseTo(0, 6);
    expect(twoAsset(0.5, A, E, 1).sd).toBeCloseTo(0.5 * A.sd + 0.5 * E.sd, 12);
    for (const m of key.two.min_var) expect(minVarWeight2(A, E, m.rho)).toBeCloseTo(m.w, 10);
  });
});

describe("E3 — five assets after Wilmott Figure 18.1", () => {
  const F = key.five;
  const S = covFrom(F.sd, F.rho);
  it("the covariance, the frontier curve and the closed-form risk agree with the key", () => {
    close(S.flat(), F.S.flat(), 12);
    for (const p of F.curve) {
      const w = frontierWeights(F.mu, S, p.m);
      close(w, p.w, 8);
      expect(portfolioRisk(w, S)).toBeCloseTo(p.sd, 10);
      expect(frontierRisk(F.mu, S, p.m)).toBeCloseTo(p.sd, 10);
      expect(portfolioMean(w, F.mu)).toBeCloseTo(p.m, 10);
    }
  });
  it("the bet: at A's 20 % risk the frontier pays 16.6 %, holding the ruled-out D", () => {
    const b = bestMeanAtRisk(F.mu, S, 0.2);
    expect(b.m).toBeCloseTo(F.at_A_risk.m, 4);
    expect(b.m).toBeGreaterThan(F.mu[0]);
    expect(b.w[3]).toBeGreaterThan(0.1);
    close(b.w, F.at_A_risk.w, 3);
  });
  it("the no-short envelope on a 2 % grid: 16.4 % at 20 % risk, D at 12 %", () => {
    const env = noShortEnvelope(F.mu, S, F.noshort.step);
    const at = env.filter((p) => p.sd <= 0.2).reduce((a, b) => (b.m > a.m ? b : a));
    expect(at.m).toBeCloseTo(F.noshort.at_A_risk.m, 10);
    close(at.w, F.noshort.at_A_risk.w, 10);
    for (let i = 1; i < env.length; i++) expect(env[i].m).toBeGreaterThan(env[i - 1].m);
    for (const p of env) expect(p.sd).toBeGreaterThanOrEqual(frontierRisk(F.mu, S, p.m) - 1e-12); // inside the unconstrained frontier
  });
  it("tangency and the global minimum; no frontier point beats the tangency Sharpe", () => {
    const t = tangency(F.mu, S, F.tangency.rf);
    close(t.w, F.tangency.w, 8);
    expect(t.sharpe).toBeCloseTo(F.tangency.sharpe, 10);
    for (const p of F.curve) expect((p.m - F.tangency.rf) / p.sd).toBeLessThanOrEqual(t.sharpe + 1e-9);
    const g = globalMinimum(F.mu, S);
    close(g.w, F.global_min.w, 10);
    expect(g.sd).toBeCloseTo(F.global_min.sd, 10);
  });
});

describe("E3 — the books' numbers", () => {
  it("Wilmott Figure 18.4's spreadsheet point to six figures", () => {
    const W = key.wilmott184;
    const S = covFrom(W.sd, W.rho);
    const w = frontierWeights(W.mu, S, W.target);
    close(w, W.w, 8);
    close(w, W.book_w, 4);
    expect(portfolioRisk(w, S)).toBeCloseTo(W.book_sd, 3);
  });
  it("Hull 16.3: σ_P of the two-asset book", () => {
    const H = key.hull163;
    expect(portfolioRisk([1, 1], covFrom([H.sd1, H.sd2], [[1, H.rho], [H.rho, 1]]))).toBeCloseTo(H.book_sd_p, 0);
  });
});

describe("E3 — PCA", () => {
  it("Tsay Example 9.1 on the covariance and correlation matrices, to the printed digits", () => {
    const T = key.tsay;
    for (const [M, ref] of [
      [T.cov, T.cov_pca],
      [T.cor, T.cor_pca],
    ] as const) {
      const p = pca(M as number[][]);
      close(p.values, ref.values, 8);
      close(p.values, ref.book_values, 1);
      close(p.vectors[0], ref.vectors[0], 8);
      close(p.vectors[1], ref.vectors[1], 8);
      // the book's vectors come from a correlation matrix printed to two decimals: within 0.01 up to sign
      p.vectors[0].forEach((v, i) => expect(Math.abs(v - ref.book_e1[i])).toBeLessThan(0.01));
      const s = Math.sign(p.vectors[1][0] * ref.book_e2[0]) || 1;
      p.vectors[1].forEach((v, i) => expect(Math.abs(s * v - ref.book_e2[i])).toBeLessThan(0.01));
      close(p.shares, ref.prop, 8);
      expect(p.total).toBeCloseTo((M as number[][]).reduce((a, r, i) => a + r[i], 0), 8); // Σλ = trace
    }
  });
  it("Frye's Treasury factors: shares 83.1 / 93.1 / 95.9 %; one sd of PC1 moves the 3 m rate 3.67 bp", () => {
    const Fy = key.frye;
    close(Fy.shares.slice(0, 3), [0.8313, 0.0995, 0.0261], 3);
    expect(Fy.cum[1]).toBeCloseTo(0.9308, 3);
    expect(Fy.cum[2]).toBeCloseTo(0.9569, 3);
    expect(Fy.one_sd_pc1_bp[0]).toBeCloseTo(3.67, 2);
    // the three printed factors rebuild a covariance whose PCA returns them
    const S3 = Fy.tenors.map((_, i) => Fy.tenors.map((_, j) => Fy.sds[0] ** 2 * Fy.pc1[i] * Fy.pc1[j] + Fy.sds[1] ** 2 * Fy.pc2[i] * Fy.pc2[j] + Fy.sds[2] ** 2 * Fy.pc3[i] * Fy.pc3[j]));
    const p = pca(S3);
    close(p.values.slice(0, 3), Fy.sigma3_eigen.values, 6);
    close(p.vectors[0], Fy.sigma3_eigen.recovered_pc1, 6);
    const day = Fy.pc1.map((v, i) => 10 * v - 3 * Fy.pc2[i] + 2 * Fy.pc3[i]);
    const r1 = reconstruct(p, day, 1);
    const r3 = reconstruct(p, day, 3);
    expect(r3.error).toBeLessThan(1e-9);
    expect(r1.error).toBeGreaterThan(r3.error);
    // signs are the solver's (largest component positive), Hull's loadings are printed to two decimals: compare magnitudes within 0.05
    r3.scores.forEach((v, i) => expect(Math.abs(Math.abs(v) - [10, 3, 2][i])).toBeLessThan(0.05));
  });
  it("Hull Table 16.5: the steepener book's factor exposures −0.08 and −4.40, σ 26.66, VaR 62.12", () => {
    const Fy = key.frye;
    const idx = Fy.book.tenors.map((t) => Fy.tenors.indexOf(t));
    const L = [Fy.pc1, Fy.pc2].map((row) => idx.map((i) => row[i]));
    const e = factorExposure(Fy.book.exposures, L, Fy.sds.slice(0, 2));
    expect(e.f[0]).toBeCloseTo(Fy.book.book_f1, 6);
    expect(e.f[1]).toBeCloseTo(Fy.book.book_f2, 6);
    expect(e.sd).toBeCloseTo(Fy.book.book_sd, 2);
    expect(2.33 * e.sd).toBeCloseTo(Fy.book.book_var, 1);
    expect(Fy.book.one_factor_var).toBeLessThan(0.1 * Fy.book.var99); // one factor misses nearly all of it
  });
  it("turning a two-dimensional cloud: the projected variance peaks along the first eigenvector", () => {
    const S = [
      [4, 2.4],
      [2.4, 2.25],
    ];
    const p = pca(S);
    const best = Math.atan2(p.vectors[0][1], p.vectors[0][0]);
    expect(projectedVariance2(S, best)).toBeCloseTo(p.values[0], 10);
    expect(projectedVariance2(S, best + Math.PI / 2)).toBeCloseTo(p.values[1], 10);
    let mx = 0;
    for (let th = 0; th < Math.PI; th += 0.001) mx = Math.max(mx, projectedVariance2(S, th));
    expect(mx).toBeLessThanOrEqual(p.values[0] + 1e-6);
    expect(p.values[0] + p.values[1]).toBeCloseTo(S[0][0] + S[1][1], 12);
  });
  it("CCIL's Nelson–Siegel–Svensson curve for 2 Jan 2026 rebuilds the key's tenors and its two limits", () => {
    const N = key.nss;
    N.tenors.forEach((m, i) => expect(nss(m, N.params)).toBeCloseTo(N.rates[i], 10));
    expect(nss(1e-6, N.params)).toBeCloseTo(N.short_end_limit, 4);
    expect(nss(1e5, N.params)).toBeCloseTo(N.long_end_limit, 3);
    for (let i = 1; i < N.tenors.length; i++) expect(N.rates[i]).toBeGreaterThan(N.rates[i - 1]); // an upward-sloping Indian curve that day
  });
});
