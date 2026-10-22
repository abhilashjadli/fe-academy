/** Small dense linear algebra for chapters A2/E3: covariance, Cholesky, symmetric eigen-decomposition. */

export type Mat = number[][];

export function covariance(xs: ArrayLike<number>, ys: ArrayLike<number>): number {
  const n = xs.length;
  let mx = 0,
    my = 0;
  for (let i = 0; i < n; i++) {
    mx += xs[i];
    my += ys[i];
  }
  mx /= n;
  my /= n;
  let c = 0;
  for (let i = 0; i < n; i++) c += (xs[i] - mx) * (ys[i] - my);
  return c / n;
}

export function correlation(xs: ArrayLike<number>, ys: ArrayLike<number>): number {
  const c = covariance(xs, ys);
  const sx = Math.sqrt(covariance(xs, xs)),
    sy = Math.sqrt(covariance(ys, ys));
  return sx > 0 && sy > 0 ? c / (sx * sy) : 0;
}

/** Covariance matrix of columns (data[i] is observation i, a row of k values). */
export function covMatrix(data: number[][]): Mat {
  const n = data.length,
    k = data[0].length;
  const mean = new Array(k).fill(0);
  for (const row of data) for (let j = 0; j < k; j++) mean[j] += row[j] / n;
  const S: Mat = Array.from({ length: k }, () => new Array(k).fill(0));
  for (const row of data)
    for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) S[a][b] += ((row[a] - mean[a]) * (row[b] - mean[b])) / n;
  return S;
}

export function corrFromCov(S: Mat): Mat {
  return S.map((row, a) => row.map((v, b) => v / Math.sqrt(S[a][a] * S[b][b])));
}

/** Cholesky factor L (lower-triangular) with S = L Lᵀ. Throws if S is not positive definite. */
export function cholesky(S: Mat): Mat {
  const n = S.length;
  const L: Mat = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = S[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) {
        if (s <= 0) throw new Error("cholesky: matrix is not positive definite");
        L[i][i] = Math.sqrt(s);
      } else L[i][j] = s / L[j][j];
    }
  }
  return L;
}

export function matVec(A: Mat, v: number[]): number[] {
  return A.map((row) => row.reduce((s, a, j) => s + a * v[j], 0));
}
export function matMul(A: Mat, B: Mat): Mat {
  return A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => s + a * B[k][j], 0)));
}
export function transpose(A: Mat): Mat {
  return A[0].map((_, j) => A.map((row) => row[j]));
}
/** Inverse of a lower-triangular matrix by forward substitution. */
export function invLower(L: Mat): Mat {
  const n = L.length;
  const X: Mat = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let j = 0; j < n; j++) {
    X[j][j] = 1 / L[j][j];
    for (let i = j + 1; i < n; i++) {
      let s = 0;
      for (let k = j; k < i; k++) s += L[i][k] * X[k][j];
      X[i][j] = -s / L[i][i];
    }
  }
  return X;
}

/** Eigen-decomposition of a symmetric matrix by cyclic Jacobi rotations. Returns values descending and unit vectors (columns). */
export function symEigen(S: Mat): { values: number[]; vectors: number[][] } {
  const n = S.length;
  const A = S.map((r) => r.slice());
  const V: Mat = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
    if (off < 1e-22) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1),
          s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = A[k][p],
            akq = A[k][q];
          A[k][p] = c * akp - s * akq;
          A[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p][k],
            aqk = A[q][k];
          A[p][k] = c * apk - s * aqk;
          A[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p],
            vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq;
          V[k][q] = s * vkp + c * vkq;
        }
      }
    }
  }
  const order = A.map((_, i) => i).sort((a, b) => A[b][b] - A[a][a]);
  const values = order.map((i) => A[i][i]);
  const vectors = order.map((i) => {
    const v = V.map((row) => row[i]);
    // sign convention: largest-magnitude component positive
    const m = v.reduce((best, x) => (Math.abs(x) > Math.abs(best) ? x : best), 0);
    return m < 0 ? v.map((x) => -x) : v;
  });
  return { values, vectors };
}

/** Variance of the projection of a cloud with covariance S onto unit direction u. */
export function projectionVariance(S: Mat, u: number[]): number {
  const Su = matVec(S, u);
  return u.reduce((s, ui, i) => s + ui * Su[i], 0);
}
