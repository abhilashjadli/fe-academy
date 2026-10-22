import { M } from "../../ui/Math";
import { F0Stalls } from "./figures/F0Stalls";
import { F1Cloud } from "./figures/F1Cloud";
import { F2Cholesky } from "./figures/F2Cholesky";
import { F3PCA } from "./figures/F3PCA";
import { F4Assets } from "./figures/F4Assets";
import { F5Copula } from "./figures/F5Copula";
import { F6Break } from "./figures/F6Break";

export function DependenceChapter() {
  return (
    <article className="chapter">
      <header className="chapter-head">
        <p className="chapter-id">Chapter A2 · Probability &amp; statistics for finance</p>
        <h1>Dependence: correlation is a shear</h1>
        <p className="standfirst">
          Two things that move together make a cloud with a direction. This chapter builds such clouds on purpose, names the shear that makes them
          (Cholesky), finds their own axes (principal components), and ends with the two ways one number can mislead you about a cloud.
        </p>
        <p className="assumes">Assumes: vectors, matrices and matrix multiplication, eigenvalues (mechanically), variance. Covariance, correlation, Cholesky and PCA are taught here.</p>
      </header>

      <F0Stalls />

      <div className="prose">
        <p>
          Everything in chapters 0.2 and A1 was about one quantity at a time. Put two side by side and a new thing appears that neither has alone: a
          direction. The stalls' cloud runs downhill because one hidden cause — the weather — pushes the two takings in opposite directions. That hints at
          how to manufacture a tilted cloud: start with independent noise and let the second variable borrow some of the first.
        </p>
      </div>

      <F1Cloud />

      <div className="prose">
        <p>
          The recipe in Figure 1 is a matrix in disguise. Writing it as one gives the construction a name, makes it work in any number of dimensions, and —
          run backwards — turns real data into the independent surprises underneath it.
        </p>
      </div>

      <F2Cholesky />

      <div className="prose">
        <p>
          Cholesky answers "how do I make a cloud with this covariance". The opposite question — "what is the shape of this cloud" — has a different
          answer, and it starts with a line you drag.
        </p>
      </div>

      <F3PCA />

      <div className="prose">
        <p>
          Two variables make a picture; sixty do not. The reason PCA matters is that it finds the same axes in sixty dimensions, where no one can draw the
          ellipse, and reports how much of the whole cloud each axis carries. Here it is on six.
        </p>
      </div>

      <F4Assets />

      <div className="prose">
        <p>
          Correlation, Cholesky and PCA all live inside the covariance matrix, and the covariance matrix is a statement about the <em>middle</em> of a cloud.
          Chapter A1 ended on tails; here is what tails do to dependence.
        </p>
      </div>

      <F5Copula />

      <div className="prose">
        <p>Two last cautions before the number goes into a report.</p>
      </div>

      <F6Break />

      <div className="ending">
        <p>
          Correlation is a shear: a round cloud of independent noise, tilted, and the tilt is ρ. Cholesky writes the shear as a lower-triangular matrix L
          with <M tex="\Sigma = LL^{\mathsf T}" />, so correlated worlds can be built from independent ones and, by <M tex="L^{-1}" />, taken apart into
          surprises. The ellipse's own axes are the eigenvectors of Σ — the principal components — and the eigenvalues say how much of the cloud each
          carries. And ρ describes the centre of the cloud only: the same ρ can hide a Gaussian's quiet corners or a t-copula's crowded ones, can be zero
          for a perfect curve, and can be manufactured by a single day.
        </p>
        <details className="prose" style={{ marginTop: "1rem" }}>
          <summary className="links" style={{ cursor: "pointer" }}>
            Where you will meet this again
          </summary>
          <p className="footnote" style={{ marginTop: "0.6em" }}>
            E3 turns uᵀΣu into the variance of a portfolio and the efficient frontier, and runs PCA on a yield curve (level, slope, curvature). E2
            uses Cholesky inside every correlated Monte Carlo. A3 is this same cloud read as a regression — projection onto one axis rather than the
            best one. E1 is where the corners of Figure 5 become losses. G2 treats PCA as unsupervised learning.
          </p>
        </details>
        <details className="prose" style={{ marginTop: "0.5rem" }}>
          <summary className="links" style={{ cursor: "pointer" }}>
            What computes the figures on this page
          </summary>
          <pre className="num" style={{ fontSize: "0.8rem", lineHeight: 1.5, overflowX: "auto" }}>
            {`// shear two independent normals into correlation rho
x = z1 ;  y = rho*z1 + sqrt(1 - rho²)*z2

// Cholesky: S = L Lᵀ, L lower-triangular
L[i][j] = (S[i][j] - Σ_k L[i][k] L[j][k]) / L[j][j]   (i > j),  L[i][i] = sqrt(S[i][i] - Σ_k L[i][k]²)

// symmetric eigen-decomposition by Jacobi rotations; projection variance uᵀ S u
// t-copula: (Z1, Z2) correlated normals divided by one shared sqrt(chi²_ν / ν)
// all tested against a numpy answer key (engine/linalg.test.ts)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
