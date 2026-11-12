import "./e3.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0Frontier } from "./figures/F0Frontier";
import { F1Axes } from "./figures/F1Axes";
import { F2Curve } from "./figures/F2Curve";

export function PortfolioChapter() {
  return (
    <article className="chapter e3">
      <header className="chapter-head">
        <p className="chapter-id">Chapter E3 · Portfolio theory and principal components</p>
        <h1>Less wobble for the same return — and the three ways a curve moves</h1>
        <p className="standfirst">
          Five assets, and one of them is plainly the worst: the same return as another at higher risk, the same risk as a third at lower return.
          Would you ever hold it? Markowitz's answer in 1952 was the one nobody expected — yes, if it zigs when the others zag — and the menu of
          best mixes turned out to be a single curve. The same matrix that draws that curve answers a second question about any cloud of correlated
          numbers: which directions does it actually move in? Ask it of ten government-bond yields moving every day and the answer is three — the
          curve shifts, it tilts, it bends — and almost nothing else. This page is both questions, asked of one object.
        </p>
        <p className="assumes">
          Assumes: the tilted cloud and correlation as a shear (A2), mean and width (0.2), and chapter E1's two-asset book. Each is restated where it
          is used. The five assets are a textbook example after Wilmott and are labelled so; the yield curve is Frye's US Treasury table from Hull,
          labelled textbook, until an Indian curve arrives.
        </p>
      </header>

      <F0Frontier />

      <div className="prose">
        <p>
          Mixing two assets does not trace a straight line between them unless they move in lockstep; it bows to the left, and the less they move
          together, the more it bows, until at perfect opposition it touches zero risk. That bow is diversification, and it is chapter A2's shear
          seen from the risk–reward side. With five assets the bows nest into one outer curve, the frontier, and the frontier holds the asset nobody
          would hold alone: at A's own 20 % risk it pays 16.6 % instead of A's 15 %, and the mix that does it is 16 % D, because D's correlations are
          the lowest in the table. The frontier is objective given the numbers; the point you choose on it is yours. And the numbers are the weak
          part — of the twenty a five-asset frontier needs (five returns, five widths, ten correlations), only the widths are measured with any confidence.
        </p>
      </div>

      <F1Axes />

      <div className="prose">
        <p>
          Now the second question. Take a tilted cloud and turn a line through it: the spread of the dots along the line is widest in one direction
          and narrowest at right angles to it. Those two directions are the cloud's own axes, and the two widths add up to the two original
          variances — nothing is lost, it is only turned. As the correlation rises the axes swing towards the diagonal and the short one shrinks
          towards nothing: at a correlation of one the cloud is a line and one series is the other. That is principal components, found by looking;
          the algebra (the arrows a matrix only stretches) is in the collapsed panel for those who want it. With ten series instead of two the
          picture cannot be drawn, but the arithmetic is the same.
        </p>
      </div>

      <F2Curve />

      <div className="prose">
        <p>
          Ten Treasury yields, six years of daily changes, and three axes carry almost 96 % of everything that happened: a shift, which is 83 % on its own; a
          tilt, short end against long; and a bend, ends against the middle. The shapes are not imposed — the matrix produced them — and they come
          out the same for almost any yield curve in any country. Rebuild a day's actual move from one factor and you get the shift and miss the
          twist; from three and you have the day. The practical point is Hull's book of five bonds: five exposures (forty, on a real desk) become two
          numbers, and for a book that is long the short end and short the long end the first of the two is nearly zero — a one-factor view would
          put its risk at a twentieth of what it is.
        </p>
      </div>

      <div className="prose">
        <h2>So what did the matrix say?</h2>
        <p>
          Asked for the least-wobble mix at each return, it draws the frontier, and the frontier holds assets nobody would hold alone. Asked for the
          directions it moves in, it names them by size, and for a yield curve three names cover nearly everything: level, slope, curvature. The
          frontier moves when the window moves, because the inputs are estimates; the three shapes barely move at all, which is why a rates desk
          reports its risk in them.
        </p>
        <details className="e3-more">
          <summary>The frontier's formula, the tangent line, beta, and eigenvectors — if you want them</summary>
          <M block tex="\sigma_P^2 = \sum_{i,j} W_i W_j\,\rho_{ij}\,\sigma_i\sigma_j, \qquad \Sigma\,e_i = \lambda_i e_i, \qquad \sum_i \lambda_i = \mathrm{trace}\,\Sigma" />
          <p>
            With short sales allowed the minimum-variance mix for a target return has a closed form (Merton's, Wilmott's spreadsheet reproduces it to
            six figures: a 30 % target on his four assets needs −146 % of the first). Add a riskless rate and the best mixes lie on the straight line
            from it that just touches the frontier; the touching point is the market portfolio, and an asset's beta is its slope against it — the
            single-index model, two lines in Wilmott and two here. Principal components are the eigenvectors of the covariance matrix: the directions
            it only stretches, ordered by how much; the eigenvalue is the variance along each, and the shares add to one because the eigenvalues add
            to the trace. Run it on <em>changes</em>, not levels. And it finds directions of variance, not causes — level, slope and curvature are
            names people gave to the shapes afterwards.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Every fund's risk budget is a point on a frontier. A rates desk's report shows a DV01 ladder and, beside it, exposure to PC1, PC2 and PC3 —
          and the day a DV01-flat book loses money is the day the curve twisted. Chapter E1's bond-book VaR is this collapse to two numbers; chapter
          E2's quasi-random paths are built on the Brownian covariance's own axes; chapter G2 meets the same axes again as the simplest thing a
          machine can learn from data without being told what to look for.
        </p>
        <p className="e3-last">One matrix, two questions: what mix wobbles least, and which way the wobble points.</p>
        <div className="e3-pull">
          <strong>The grid instead of the darts.</strong> Chapter E2 priced by throwing random tomorrows. There is an older way to price without a
          formula: lay a grid over price and time and let the equation fill it in.{" "}
          <a href="#/F1">F1 · Finite-difference solvers →</a>
        </div>
        <details className="prose e3-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num e3-code">
            {`five assets after Wilmott Figure 18.1 (returns and risks read from the figure; the correlations are ours, labelled textbook); frontier by the closed form, no-short envelope on a 2 % grid
two-asset cloud: a bivariate normal drawn on the page at the ρ you set; axes by Jacobi eigen-decomposition; widths = eigenvalues
yield curve: Frye's ten Treasury tenors, Hull Tables 16.3–16.5 (loadings, factor sds, the five-bond book) — textbook until CCIL's daily curve parameters arrive
// engine/portfolio.ts + engine/linalg.ts, tested against tests/answer-key/key_E3.py (Wilmott 18.4, Tsay 9.1, Hull 16.5 checks included)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
