import "./a3.css";
import "./figures/figures.css";
import { Who } from "../../ui/Comic";
import { F0Piles } from "./figures/F0Piles";
import { F1Honest } from "./figures/F1Honest";
import { F2Liars } from "./figures/F2Liars";
import { ClipLeftovers } from "./figures/ClipLeftovers";
import { F3Hedge } from "./figures/F3Hedge";
import { F4Fool } from "./figures/F4Fool";
import { F5Card } from "./figures/F5Card";
import { F6Quartet } from "./figures/F6Quartet";
import { Figure } from "../../ui/Figure";
import { WatchOrDo } from "../../ui/WatchOrDo";

export function RegressionChapter() {
  return (
    <article className="chapter a3">
      <header className="chapter-head">
        <p className="chapter-id">Chapter A3 · Probability &amp; statistics for finance</p>
        <h1>The line is half the answer</h1>
        <p className="standfirst">
          Fit a line through a cloud of points and you get two things: a slope, and a number that says how sure you are. The how-sure is a lie more
          often than you'd think, and sometimes the slope is too — and both lies show in the leftovers, if you look.
        </p>
        <p className="assumes">Assumes: you can read a scatter plot and know what an average is. That is all.</p>
      </header>

      <F0Piles />

      <div className="prose">
        <p>
          Two piles of coins that have never met, and a line that fits them. The fit is real — the number is computed correctly — and the relationship is
          nonsense. This chapter is about telling those two apart. First, what an honest fit looks like.
        </p>
      </div>

      <F1Honest />

      <div className="prose">
        <p>
          The slope is the easy part. The <em>how-sure</em> is built from the leftovers, and it only holds if they look like nothing: same size everywhere,
          no memory, no wander. Meet the four things that make leftovers look like something.
        </p>
        <details className="a3-more">
          <summary>The three numbers every regression prints, in plain words</summary>
          <p>
            <strong>R²</strong> is the share of the up-and-down in y that the line accounts for: 1 means every point is on the line, 0 means the line is
            flat and useless. <strong>The standard error</strong> is the how-sure: redo the experiment with fresh data and the slope would wobble by about
            this much. <strong>The t-stat</strong> is the slope divided by its standard error; the textbook says "if |t| is above 2, believe the slope is
            not zero". Every number on this page is one of these three, or a leftover.
          </p>
        </details>
      </div>

      <F2Liars />

      <div className="prose">
        <p>
          Now one with stakes. You hold a bank index. You can only trade NIFTY. The question every hedger asks: how much NIFTY per unit of bank index?
          A regression answers in one second — and tells you how sure to be. (NIFTY is real; the bank index is a simulated stand-in until the real file
          arrives, and it says so on the figure.)
        </p>
      </div>

      <WatchOrDo watchLabel="watch the leftovers (15 s)" doLabel="do it yourself — drag, bet, look" watch={<Figure n="3" prompt="The fit says certain. Its leftovers, drawn in the order they happened."><ClipLeftovers /></Figure>}>
        <F3Hedge />
      </WatchOrDo>

      <div className="prose">
        <p>
          A natural hope: more data fixes it. Try it. More days make a fake look <em>more</em> certain, not less — and then learn the one check that
          catches it.
        </p>
      </div>

      <F4Fool />

      <div className="prose">
        <p>Four liars, one lie. Switch them on and off and watch which numbers move.</p>
      </div>

      <F5Card />

      <div className="prose">
        <h2>So what is a regression?</h2>
        <p>
          A line through a cloud, chosen to make the leftover squares as small as possible, plus a how-sure computed from those leftovers. The how-sure is
          only honest if the leftovers look like nothing. The slope is only meaningful if the relationship held still while the data was collected — the
          hedge above didn't, and the leftovers said so before any formula did. The first thing to do with any regression is to look.
        </p>
        <p>One more reason to look: here are four clouds with the same line and the same three numbers.</p>
      </div>

      <F6Quartet />

      <div className="prose">
        <h2>Where it is used</h2>
        <p>
          "How much of X per unit of Y" is a regression slope, and every desk runs one — hedge ratios, betas, the factor loadings that explain sixty stocks
          by a handful of inputs, and the "edge" of a trading signal, which is a regression of returns on that signal. The Twins turn up whenever two
          inputs are nearly the same thing; the Drunks turn up whenever both series wander, which is most prices. Chapter G3 is the full story of how a
          backtest fools its author.
        </p>
        <h2>The conclusion</h2>
        <p>
          A fitted line is two claims: the slope, and how sure. Audit both with one habit — plot the leftovers in order — and four questions: do they
          fan, do they run, are two inputs twins, do both series wander? Fan and runs leave the slope and shrink your confidence. Twins leave the fit and
          scramble the credit. Wander can make the whole thing up. Each has a one-line fix, and the fix is never "more data".
        </p>
        <p>
          What you can now say in a meeting: <strong>"the t-stat is 150 if you trust the leftovers and 40 if you don't — I looked, and I don't."</strong>
        </p>
        <div className="a3-pull">
          <strong>The next thing that goes wrong.</strong> The Drunks wander because each day's value is yesterday's plus a step. Some series come home
          instead; a test tells them apart, and no chart can. <a href="#/A4">A4 · Time series: random walk or mean reversion →</a>
        </div>
        <details className="prose a3-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num a3-code">
            {`// ordinary least squares, one regressor
slope = cov(x,y)/var(x);  intercept = ȳ − slope·x̄;  e = y − fitted
naive SE   = sqrt( Σe²/(n−2) / Σ(x−x̄)² )
White SE   = sqrt( Σ (x−x̄)²e² ) / Σ(x−x̄)²
Newey–West = sqrt( Σu² + 2 Σ_l (1−l/(L+1)) Σ u_t u_{t−l} ) / Σ(x−x̄)²,  u = (x−x̄)e,  L = 4
Durbin–Watson = Σ(e_t − e_{t−1})² / Σe²        rule of thumb: R² > DW → suspect
// all tested against tests/answer-key/key_A3.py (statsmodels)`}
          </pre>
        </details>
      </div>
      <p className="footnote a3-faces">
        The four liars: <Who name="Funnel" /> <Who name="Echo" /> <Who name="Twins" /> <Who name="Drunks" />
      </p>
    </article>
  );
}
