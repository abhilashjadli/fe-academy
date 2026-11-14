import "./g2.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0SortDays } from "./figures/F0SortDays";
import { F1HowMany } from "./figures/F1HowMany";
import { F2TwentyDays } from "./figures/F2TwentyDays";
import { F3Autoencoder } from "./figures/F3Autoencoder";

export function UnsupervisedChapter() {
  return (
    <article className="chapter g2">
      <header className="chapter-head">
        <p className="chapter-id">Chapter G2 · Unsupervised: clustering, PCA, autoencoders</p>
        <h1>Nothing to predict</h1>
        <p className="standfirst">
          You cannot take the whole wardrobe. You pack the few things that cover most occasions and judge the packing by how little you miss.
          That is unsupervised learning: no label, nothing to predict, nothing to score against — only the question of what to keep. This page
          sorts ten years of NIFTY days into piles with no instructions beyond "make the piles tight", and the machine finds March 2020 by
          itself; then it compresses twenty days of market history into two numbers and finds chapter E3's level, slope and curvature again;
          then a small network learns to do the same compression and arrives, slowly, exactly where PCA started. Every answer depends on a
          choice — the features, their units, how many piles — that the algorithm cannot make for you.
        </p>
        <p className="assumes">
          Assumes: realised volatility (A5), PCA and the three shapes of a yield curve's wobble (E3), and that a model is judged on days it never
          saw (G1). Each is restated where it is used. Every figure runs on the real NIFTY record; the one textbook number is Tsay's, in a
          caption, labelled.
        </p>
      </header>

      <F0SortDays />

      <div className="prose">
        <p>
          Two numbers a day — how far the index moved, and how rough the previous twenty days had been — and an instruction with no answer in
          it: make two piles, and make them tight. The procedure is older than the phrase machine learning. Drop two centres at random; let
          every day join the nearer one; move each centre to the middle of its pile; repeat until nothing moves. Twenty-one rounds later the
          machine has put 36 days in one pile and 2,627 in the other, and the 36 run from 13 March to 8 May 2020 with nothing else among them.
          Nobody told it about a pandemic. Ask for three piles and it splits the calm pile into calm and choppy. Now flip the toggle, which
          only changes the units — it measures both axes in standard deviations instead of per cent — and ask for three piles again: they are
          up days, down days, and the pandemic. Same days, same procedure. The piles were never in the data alone; they were in the data and
          your choice of ruler.
        </p>
      </div>

      <F1HowMany />

      <div className="prose">
        <p>
          How many piles, then? Chapter G1 would hold some days back and score the answer on them, but there is nothing to score: no day
          carries a label saying which pile it belongs to. What remains are two heuristics. The within-pile spread always falls as k grows —
          seven piles are tighter than two — so you look for the elbow where it stops falling fast, and on this cloud that is somewhere between
          three and five. The silhouette asks each day whether it sits closer to its own pile than to the nearest other, and it is emphatic:
          two piles score 0.89, three 0.63, and it falls from there. Two answers, neither a test. The starting centres are the other worry —
          the procedure can settle in a poor arrangement if it starts badly — and here, for once, the worry is idle: three different starts
          reach the same spread at every k, usually by different numbers of rounds. The page says so because on another cloud it would not.
        </p>
      </div>

      <F2TwentyDays />

      <div className="prose">
        <p>
          The second thing a machine can do without a label is compress. Take each day's last twenty move sizes as a list of twenty numbers —
          2,663 such lists — and ask chapter E3's question: which directions carry the variation? The first is flat, every one of the twenty
          days weighted alike: the <em>level</em> of volatility, 28 per cent of the variance. The second rises from the oldest day to the
          newest: volatility rising or falling, the <em>slope</em>, 7 per cent. The third bends: <em>curvature</em>. They are the three shapes
          E3 found in the yield curve, found again on a different object by the same arithmetic. The window ending 23 March 2020 has the
          most negative slope score in ten years — volatility exploding — and the one ending 20 April 2020 the most positive: volatility
          collapsing. Keep two components and the error of rebuilding every window is 0.37 against 0.57 for keeping none; keep ten and it is
          0.17. Most of a day's move size is its own, which is why the first component carries 28 per cent here and 49 on Tsay's five stocks.
        </p>
      </div>

      <F3Autoencoder />

      <div className="prose">
        <p>
          The third thing is to rebuild. A network with twenty inputs, two neurons in the middle and twenty outputs is asked to reproduce
          whatever it is shown; the two middle neurons are the bottleneck, and whatever gets through them is what the network decided to keep.
          Train it by gradient descent from random weights and watch the error fall: 0.56 at the start, 0.40 after a hundred rounds, 0.3697
          after three thousand — which is, to four digits, the error of keeping two principal components. It did not learn something new; it
          learned PCA, slowly. Put a bend in the middle neurons — a tanh, which is what makes a network nonlinear — and after the same three
          thousand rounds the error is 0.39, worse. Nonlinearity pays when the data has a bend to find, and twenty days of move sizes have
          none that two neurons could use. The lesson is not that autoencoders are weak; it is that a method's extra power is only worth its
          extra cost when the data has the structure it is built to find — and nothing but trying will tell you.
        </p>
      </div>

      <div className="prose">
        <h2>So what is unsupervised learning?</h2>
        <p>
          Sort, compress, rebuild — with no label and therefore no score. Sorting is k-means: assign, recentre, repeat; the piles are the
          tightest for the features and units you chose. Compressing is PCA: keep the directions that carry the variance; the error you make
          is exactly the eigenvalues you dropped. Rebuilding is an autoencoder: a network that reproduces its input through a bottleneck —
          linear, it is PCA; nonlinear, it can do more when there is more to do. Because nothing is predicted, nothing can be held out: k, the
          units, the window, the components are judgments, and the silhouette and the elbow are aids to judgment, not tests.
        </p>
        <details className="g2-more">
          <summary>The dropped eigenvalues, Lloyd's steps, the silhouette, why a linear autoencoder is PCA — if you want them</summary>
          <M block tex="\text{error with } k \text{ components} \;=\; \frac{1}{W}\sum_{j>k}\lambda_j" />
          <p>
            Lloyd's algorithm: given k centres, assign each point to the nearest (squared Euclidean distance); replace each centre by the mean of
            its points; stop when no centre moves. Each step lowers the within-pile spread, so it converges — to a local minimum that depends
            on the start, which is why one runs it from several. Silhouette of a point: (b − a)/max(a, b), a the mean distance to its own
            pile, b the smallest mean distance to another pile; average over points. A two-layer linear autoencoder with k hidden units,
            trained to minimise squared reconstruction error, has its minima exactly on the subspace of the first k principal components
            (Baldi and Hornik, 1989) — gradient descent finds that subspace, not the components themselves, which is why the two hidden numbers
            are a rotation of the two PC scores. The gap statistic compares the spread curve to the same curve on uniform noise; hierarchical
            clustering builds a tree by merging the two closest piles repeatedly, and is what a desk uses on a correlation matrix of assets.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          The "regime" flag on a morning risk report is Figure 0's pile, and the right question about it is "regime according to which
          features, in which units?". PCA of a volatility surface is how a desk risks it — level, slope and curvature of the smile are the same
          three shapes a third time. And clustering a correlation matrix of assets before allocating among them is hierarchical risk parity,
          the method that replaced the inverse of the covariance tile in chapter E3 with a tree.
        </p>
        <p className="g2-last">With nothing to predict, the machine can only choose what to keep — and you chose the ruler.</p>
        <div className="g2-pull">
          <strong>And the moment you trade on the piles?</strong> A regime used to size tomorrow's position is a prediction after all — and
          chapter G1's rules return, with a trap of their own: the future leaking into the past.{" "}
          <a href="#/G3">G3 · Forecasting with ML: leakage, walk-forward, backtest overfitting →</a>
        </div>
        <details className="prose g2-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num g2-code">
            {`Data: the real NIFTY 50 record, 2,663 days from 2 Feb 2016 to 3 Nov 2026. Figures 0–1: x = today's move (%), y = the previous 20 days' realised vol (% a year); k-means by Lloyd's algorithm from seeded random starts (seeds 1–3)
Figures 2–3: each day's last 20 move sizes (|return| in %) as a 20-vector; PCA of the 2,663 vectors (covariance, 1/n); autoencoder 20 → 2 → 20 by full-batch gradient descent from a seeded start, 3,000 rounds (linear: rate 0.2; tanh: rate 0.5)
// engine/unsupervised.ts, tested against tests/answer-key/key_G2.py (the RNG is ported bit for bit, so every run on the page is a tested number; 10 tests)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
