import "./a2.css";
import { F0Stalls } from "./figures/F0Stalls";
import { F1Cloud } from "./figures/F1Cloud";
import { F2Cholesky } from "./figures/F2Cholesky";
import { F3PCA } from "./figures/F3PCA";
import { F4Assets } from "./figures/F4Assets";
import { F5Copula } from "./figures/F5Copula";
import { F6Break } from "./figures/F6Break";

export function DependenceChapter() {
  return (
    <article className="chapter a2">
      <header className="chapter-head">
        <p className="chapter-id">
          Chapter A2 · Probability &amp; statistics for finance
        </p>
        <h1>Dependence: correlation is a shear</h1>
        <p className="standfirst">
          Two stalls on one street, and their takings move in opposite
          directions. Put two numbers side by side and something appears that
          neither has alone: a tilt. This page is about that tilt — how to make
          it on purpose, how to read it back, and the two ways one number can
          lie about it. At the firm, every risk number for a book of many
          positions starts here.
        </p>
        <p className="assumes">
          Assumes: you can multiply two small tables of numbers (matrices) and
          you know what a variance is. That is all.
        </p>
      </header>

      <F0Stalls />

      <div className="prose">
        <p>
          One hidden cause — the weather — pushes both tills, in opposite
          directions, and the cloud leans. That is the whole trick for making a
          tilted cloud on purpose: start with plain noise and let the second
          number borrow some of the first. Here is the machine.
        </p>
      </div>

      <F1Cloud />

      <div className="prose">
        <p>
          The recipe in Figure 1 is a small table of numbers in disguise.
          Writing it as one gives it a name, makes it work for sixty stocks as
          easily as two, and — run backwards — takes real data apart into the
          surprises underneath. Follow one dot through it.
        </p>
      </div>

      <F2Cholesky />

      <div className="prose">
        <p>
          That was "how do I make a cloud with this tilt". The opposite question
          — "what shape is this cloud" — has a different answer, and it starts
          with a line you drag.
        </p>
      </div>

      <F3PCA />

      <div className="prose">
        <p>
          Two stocks make a picture; sixty do not. The reason the long axis
          matters is that the same recipe finds it in sixty dimensions, where
          nobody can draw the cloud, and says how much of the whole each axis
          holds. Here it is on six.
        </p>
      </div>

      <F4Assets />

      <div className="prose">
        <p>
          Everything so far lives in the covariance table, and the covariance
          table describes the <em>middle</em> of a cloud. The last chapter ended
          on tails. Here is what tails do to dependence.
        </p>
      </div>

      <F5Copula />

      <div className="prose">
        <p>Two last cautions before the number goes into a report.</p>
      </div>

      <F6Break />

      <div className="ending">
        <p>
          Correlation is a shear: a round cloud of plain noise, pushed sideways,
          and the tilt is the number. The push has a recipe, so a desk can build
          correlated worlds from independent ones. A cloud has its own axes; the
          first usually holds most of the story. The number describes the middle
          only: it can miss a crowded corner, read zero on a curve, and be made
          by one day.
        </p>
        <p>
          The sentence to take to the desk:{" "}
          <strong>
            the correlation tells you how the middle of the cloud leans; it says
            nothing about the corner where everything falls together.
          </strong>
        </p>

        <div className="a2-next">
          <span className="k">Next problem</span>
          <span className="q">
            A book of forty positions loses money when they all fall together.
            How bad can one day get — and how often?{" "}
            <a href="#/E1">E1 · VaR and Expected Shortfall</a>
          </span>
        </div>

        <details className="a2-more">
          <summary>
            also meets this: E2 (building correlated paths), E3 (a yield curve's
            own axes), A3 (the cloud read as a regression)
          </summary>
          <p className="footnote" style={{ marginTop: "0.6em" }}>
            E2 uses the shear of Figure 2 inside every correlated Monte Carlo.
            E3 turns "spread along a line" into the variance of a portfolio and
            runs Figure 4's reading on a yield curve, where the three directions
            come out as level, slope and curvature. A3 is Figure 3's cloud with
            the line fixed to one axis instead of the best one. G2 treats the
            same reading as unsupervised learning.
          </p>
        </details>
        <details className="a2-more">
          <summary>what computes the figures on this page</summary>
          <pre
            className="num"
            style={{ fontSize: "0.8rem", lineHeight: 1.5, overflowX: "auto" }}
          >
            {`// shear two independent normals into correlation rho
x = z1 ;  y = rho*z1 + sqrt(1 - rho²)*z2

// Cholesky: S = L Lᵀ, L lower-triangular
L[i][j] = (S[i][j] - Σ_k L[i][k] L[j][k]) / L[j][j]   (i > j),  L[i][i] = sqrt(S[i][i] - Σ_k L[i][k]²)

// symmetric eigen-decomposition by Jacobi rotations; projection variance uᵀ S u
// t-copula: (Z1, Z2) correlated normals divided by one shared sqrt(chi²_ν / ν), ν = 4
// all tested against a numpy answer key (engine/linalg.test.ts)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
