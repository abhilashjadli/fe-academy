import { describe, expect, it } from "vitest";
import key from "./__fixtures__/key-A2.json";
import { cholesky, corrFromCov, correlation, covMatrix, invLower, matMul, projectionVariance, symEigen, transpose } from "./linalg";

const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const closeMat = (A: number[][], B: number[][], tol = 1e-9) => A.every((r, i) => r.every((v, j) => close(v, B[i][j], tol)));

describe("linear algebra", () => {
  it("Cholesky, its inverse and L Lᵀ = S match numpy", () => {
    for (const m of key.matrices) {
      const L = cholesky(m.S);
      expect(closeMat(L, m.L)).toBe(true);
      expect(closeMat(invLower(L), m.Linv)).toBe(true);
      expect(closeMat(matMul(L, transpose(L)), m.S)).toBe(true);
    }
  });
  it("symmetric eigen-decomposition matches numpy (values descending, sign convention)", () => {
    for (const m of key.matrices) {
      const e = symEigen(m.S);
      e.values.forEach((v, i) => expect(close(v, m.eigvals[i], 1e-9)).toBe(true));
      e.vectors.forEach((v, i) => v.forEach((x, j) => expect(close(x, m.eigvecs[i][j], 1e-7)).toBe(true)));
      if (m.proj_var_1_1 !== null) expect(close(projectionVariance(m.S, [Math.SQRT1_2, Math.SQRT1_2]), m.proj_var_1_1)).toBe(true);
    }
  });
  it("covariance matrix and correlation of a small dataset", () => {
    const C = covMatrix(key.sample.X);
    expect(closeMat(C, key.sample.cov)).toBe(true);
    const xs = key.sample.X.map((r) => r[0]),
      ys = key.sample.X.map((r) => r[1]);
    expect(close(correlation(xs, ys), key.sample.corr)).toBe(true);
    expect(close(corrFromCov(C)[0][1], key.sample.corr)).toBe(true);
  });
  it("ρ = 0.6: L = [[1,0],[0.6,0.8]], eigenvalues 1.6 and 0.4, PC1 along (1,1)", () => {
    const L = cholesky([
      [1, 0.6],
      [0.6, 1],
    ]);
    expect(L[1][0]).toBeCloseTo(0.6, 12);
    expect(L[1][1]).toBeCloseTo(0.8, 12);
    const e = symEigen([
      [1, 0.6],
      [0.6, 1],
    ]);
    expect(e.values[0]).toBeCloseTo(1.6, 12);
    expect(e.values[1]).toBeCloseTo(0.4, 12);
    expect(Math.abs(e.vectors[0][0] - e.vectors[0][1])).toBeLessThan(1e-9);
  });
});
