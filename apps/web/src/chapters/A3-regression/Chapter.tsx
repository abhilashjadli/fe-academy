import "./a3.css";
import "./figures/figures.css";
import { Says, Who } from "../../ui/Comic";
import { M } from "../../ui/Math";
import { F0Piles } from "./figures/F0Piles";
import { F1Honest } from "./figures/F1Honest";
import { F2Liars } from "./figures/F2Liars";
import { ClipLeftovers } from "./figures/ClipLeftovers";
import { F3Hedge } from "./figures/F3Hedge";
import { F4Fool } from "./figures/F4Fool";
import { F5Card } from "./figures/F5Card";
import { F6Sandbox } from "./figures/F6Sandbox";

export function RegressionChapter() {
  return (
    <article className="chapter a3">
      <header className="chapter-head">
        <p className="chapter-id">Chapter A3 · Probability &amp; statistics for finance</p>
        <h1>The line is half the answer</h1>
        <p className="standfirst">
          Fit a line through a cloud of points and you get two things: a slope, and a number that says how sure you are. The slope is usually fine. The
          "how sure" is a lie more often than you'd think — and you can see the lie in the leftovers.
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
      </div>

      <F2Liars />

      <div className="prose">
        <Says who="Ada" mood="thinking">Pictures are easy to make up. Show me one that happened.</Says>
        <p>
          Here is one from the desk. You hold a bank index. You can only trade NIFTY. The question every hedger asks: how much NIFTY per unit of bank
          index? A regression answers in one second — and tells you how sure to be.
        </p>
      </div>

      <ClipLeftovers />
      <F3Hedge />

      <div className="prose">
        <Says who="Mel" mood="smug">So more data fixes it. Give me two thousand days.</Says>
        <p>Try it. More days make the fake look <em>more</em> certain, not less. Then learn the one check that catches it.</p>
      </div>

      <F4Fool />

      <div className="prose">
        <p>Four liars, one lie. Switch them on and off and watch which numbers move.</p>
      </div>

      <F5Card />

      <div className="prose">
        <h2>So what is a regression?</h2>
        <p>
          A line through a cloud, chosen to make the leftover squares as small as possible, plus a how-sure computed from those leftovers. The slope is
          almost always fine. The how-sure is only honest if the leftovers look like nothing — and the first thing to do with any regression is to look.
        </p>
        <M block tex="\text{slope} = \frac{\operatorname{cov}(x,y)}{\operatorname{var}(x)},\qquad \text{how-sure}_{\text{honest}} \ge \text{how-sure}_{\text{textbook}}" />
        <p>Try it yourself: drag the points and watch the two how-sures move apart.</p>
      </div>

      <F6Sandbox />

      <div className="prose">
        <h2>Where it is used, every day</h2>
        <div className="a3-cards">
          <div className="a3-card">
            <strong>1 · Hedge ratios and betas.</strong> "How much of X per unit of Y" is a regression slope, and every desk runs one. The slope is used;
            the how-sure decides how often you re-check it. Chapter E3 builds a whole portfolio out of these slopes.
          </div>
          <div className="a3-card">
            <strong>2 · Factor models.</strong> Explain sixty stocks by a handful of inputs — the market, a sector, a style. That is sixty regressions, and
            the Twins show up whenever two inputs are nearly the same thing (A2's PCA is how you find out; G1 is what to do about it).
          </div>
          <div className="a3-card">
            <strong>3 · The backtest that lied.</strong> A strategy's "edge" is a regression of returns on a signal. If both wander, the Drunks have been at
            the keyboard; chapter G3 is the full story of how a backtest fools its author.
          </div>
        </div>
        <h2>The conclusion</h2>
        <p>
          A fitted line is two claims: the slope, and how sure. Believe the slope; audit the how-sure. The audit is one habit — plot the leftovers in
          order — and four questions: do they fan, do they run, are two inputs twins, do both series wander? Each has a one-line fix, and none of them
          changes the line much. What changes is whether you are allowed to be confident.
        </p>
        <p>
          The one sentence to say to a desk head tomorrow: <strong>"the t-stat is 40 if you trust the leftovers and 10 if you don't — I looked, and I
          don't."</strong>
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
        <Who name="Ada" /> looks at the leftovers. <Who name="Mel" /> trusts the badge. <Who name="Funnel" /> <Who name="Echo" /> <Who name="Twins" />{" "}
        <Who name="Drunks" /> are the four liars.
      </p>
    </article>
  );
}
