import "./g1.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0FitIndex } from "./figures/F0FitIndex";
import { F1Lags } from "./figures/F1Lags";
import { F2Leash } from "./figures/F2Leash";
import { F3Folds } from "./figures/F3Folds";

export function LearningChapter() {
  return (
    <article className="chapter g1">
      <header className="chapter-head">
        <p className="chapter-id">Chapter G1 · Supervised learning, regularisation, validation</p>
        <h1>Anything fits the past</h1>
        <p className="standfirst">
          A suit cut to a tailor's dummy bump for bump fits nobody else; one cut to the dummy's general shape fits most people; one cut loose fits
          nobody well. You cannot tell which you have by looking at the dummy — only by trying it on someone the tailor never measured. That is the
          whole of machine learning's discipline, and this page does it to the NIFTY. First you will fit the last sixty days of the index with a
          curve and watch the forecast go from a sensible number to a hundred and seventy-nine million as the fit gets better. Then the three
          habits that stop it: keep days the model never sees; put the coefficients on a leash; choose the leash on days you have already set
          aside. Everything here is chapter A3's least squares with more columns.
        </p>
        <p className="assumes">
          Assumes: a line through dots and the squared misses (A3), that the size of a day's move clusters and EWMA tracks it (A5), and that the
          500-day fence was already a test on unseen days (E1). Each is restated where it is used. Every figure runs on the real NIFTY record; the
          one textbook number is Tsay's, in a caption, labelled.
        </p>
      </header>

      <F0FitIndex />

      <div className="prose">
        <p>
          The dial does one thing: it lets the curve bend more. Each extra bend buys a closer fit to the sixty days it was given — the straight
          line misses them by 365 points on average, the fifteenth-degree curve by 72 — and nothing on the left half of the picture objects. The
          right half does. Twenty trading days later the index closed at 23,811; the line said 22,641, the fifth-degree curve 7,448, the
          fifteenth-degree curve 179 million. The better the fit, the worse the forecast, and no number you could compute from the fitted dots
          warned you. The only warning was the twenty days the curve never saw. That is the whole of this page in one picture: the fit is not the
          test; the test is the data you kept back.
        </p>
      </div>

      <F1Lags />

      <div className="prose">
        <p>
          Now do it properly. The thing to predict is the size of tomorrow's move — not its direction, which nothing on this site can forecast,
          but its size, which chapter A5 showed clusters. The inputs are the sizes of the last k days' moves; the model is a line through them,
          A3 with k columns. The days are split once and for all: the model is fitted on April 2016 to January 2024 and scored on the 683 days
          since, which it never sees. On the fitted days the error falls for ever as k grows, as it must. On the unseen days it falls to four lags
          — eight per cent better than guessing the average every day — and then climbs, until at sixty lags the model is back to guessing. Cut
          the training set to its last 250 days and the climb is a cliff: sixty lags do nearly thirty per cent worse than guessing. The U is the shape of
          every supervised model ever fitted; it gets sharper as the data get thinner; and you only see it on the days you kept back.
        </p>
      </div>

      <F2Leash />

      <div className="prose">
        <p>
          The second habit keeps all sixty lags and adds one term to the thing being minimised: the sum of the squared coefficients, times a
          number λ. Call it a leash. With the leash slack, the fit is the one Figure 1 showed at sixty lags — and look at the coefficients:
          twenty-five of them are negative, meaning a big move on some day three weeks ago makes tomorrow's move <em>smaller</em>, which is not
          a fact about markets but a fact about one history with sixty knobs to explain it. Tighten the leash and the bars settle into a smooth
          decaying profile — yesterday matters most, then less and less — and the error on the unseen days falls to within half a point of the
          best hand-picked k, with nothing picked. Tighten too far and the bars go flat and the model is guessing again. Shrinking toward zero is
          not throwing information away; it is refusing to believe sixty numbers from one history. The closed form is one line, under the figure.
        </p>
      </div>

      <F3Folds />

      <div className="prose">
        <p>
          Which brings the obvious question: who chose the leash? Not the unseen days — if they chose it, they are no longer unseen, and Figure
          2's reading would be as flattering as Figure 0's left half. The third habit cuts the <em>training</em> days into five blocks, fits on
          four and scores the fifth, five times over, and adds the scores up; that number is allowed to choose. It chooses a leash of about 560.
          The unseen days, asked afterwards and once, would have preferred about 1,800 — a little tighter — but both do far better than no leash
          at all, and the point is not that the choice was perfect but that it was made without peeking. The five scores are worth a look: one
          block, May 2019 to December 2020, holds March 2020 and scores nearly three times the next worst; on its own it is more than half of the sum. Tsay ran this
          test on IBM in his textbook: a small neural network trained on seventy years of monthly returns scored 91.74 on the two years it never
          saw; predicting the average every month scored 91.85.
        </p>
      </div>

      <div className="prose">
        <h2>So what is supervised learning?</h2>
        <p>
          Least squares with more columns, and three habits. Hold out: the only error that counts is on days the fit never saw. Regularise: a
          penalty on the size of the coefficients trades a little fit for a lot of stability; ridge is the one with a closed form. Validate:
          choose the penalty, the lag count, the model, on folds of the training data, and touch the test set once. Everything called machine
          learning — trees, networks, the lot — is a more flexible curve and the same three habits.
        </p>
        <details className="g1-more">
          <summary>Ridge in one line, bias and variance in words, why the folds are blocks, the lasso, double descent — if you want them</summary>
          <M block tex="\hat\beta_\lambda=\arg\min_\beta\ \sum_t\big(y_t-x_t^{\top}\beta\big)^2+\lambda\sum_j\beta_j^2=(X^{\top}X+\lambda I)^{-1}X^{\top}y" />
          <p>
            The error on unseen days splits into three parts: the noise nobody can predict, the bias of a model too stiff to follow the truth,
            and the variance of a model so flexible it follows this history's accidents. More columns lower the bias and raise the variance; the
            leash does the reverse; the U is their sum. The folds here are contiguous blocks, not a shuffle, because neighbouring days share
            their volatility — shuffle them and tomorrow leaks into today's training set, and the cross-validation score flatters (chapter G3 is
            about that leak). The lasso penalises the sum of the absolute coefficients instead of the squares; its constraint region has corners,
            so it sets coefficients exactly to zero and chooses columns, where ridge only shrinks them. The one-standard-error rule picks the
            simplest setting whose CV score is within one standard error of the best. And the reader who has heard that very large networks
            stop over-fitting has heard right — past the point where a model can fit the training data exactly the test error can fall again,
            which is called double descent and does not repeal the U, only extends its axis.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Every fitted thing on this site was a fit with these risks: chapter D3's smiles, chapter F2's valley, the 0.94 in chapter E1's EWMA.
          A desk's first question about a backtest with a Sharpe ratio of three is not "what is the strategy?" but "how many versions did you
          try?" — because each version tried is a bend in the curve, and the backtest is the left half of Figure 0. Chapter G3 is that question
          done properly.
        </p>
        <p className="g1-last">The fit is not the test. The test is the data you kept back.</p>
        <div className="g1-pull">
          <strong>And when there is no label to hold out?</strong> Prices moving together, with nothing to predict and nothing to score — the
          question becomes what to keep and what to throw away.{" "}
          <a href="#/G2">G2 · Unsupervised: clustering, PCA, autoencoders →</a>
        </div>
        <details className="prose g1-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num g1-code">
            {`Data: the real NIFTY 50 record, 2016-01-01 → 2026-11-03 (2,683 daily returns). Figure 0: the 60 closes 10 Jul–5 Oct 2026, polynomial of degree d by least squares, read 20 trading days ahead
Figures 1–3: y = |return| in %, inputs = the last k values; training rows 1 Apr 2016–30 Jan 2024 (1,940 days), test rows 31 Jan 2024–3 Nov 2026 (683 days), scored once per figure
Ridge: (XᵀX + λI)⁻¹Xᵀy, intercept unpenalised. Folds: five contiguous blocks of the training rows. EWMA: λ 0.94, forecast √(2/π)·σ. Errors as "% better than guessing the training mean"
// engine/learning.ts, tested against tests/answer-key/key_G1.py (numpy least squares; 11 tests)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
