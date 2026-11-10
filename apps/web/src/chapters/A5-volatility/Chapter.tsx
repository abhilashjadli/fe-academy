import "./a5.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0Shuffle } from "./figures/F0Shuffle";
import { F1Clock } from "./figures/F1Clock";
import { F2Bucket } from "./figures/F2Bucket";
import { F3June } from "./figures/F3June";
import { F4Drip } from "./figures/F4Drip";
import { F5Score } from "./figures/F5Score";
import { KEY, n0, n1 } from "./figures/a5";

export function VolatilityChapter() {
  return (
    <article className="chapter a5">
      <header className="chapter-head">
        <p className="chapter-id">Chapter A5 · Volatility</p>
        <h1>How fast should you forget?</h1>
        <p className="standfirst">
          Nobody packs an umbrella because of the yearly average: after a stormy day you expect more storms, and after a dry fortnight you stop.
          Markets are the same — big days come in spells. So "how risky is tomorrow" is really a question about how fast to forget yesterday, and
          this page is about choosing that speed, on ten real years of the index.
        </p>
        <p className="assumes">
          Assumes: you can read a bar chart and know what an average and a square are. That is all. Every series on this page is the real NIFTY 50,
          2016 → 2026.
        </p>
      </header>

      <F0Shuffle />

      <div className="prose">
        <p>
          Same days, same average, same spread, same worst day — and one strip has weather while the other is fuzz. The order <em>is</em> the
          information: the storms of September 2019, March 2020, February 2022 and June 2024 are spells, not single days. Whatever a volatility number is, it has to see the
          spell. Put the days on a clock and look at them twice.
        </p>
      </div>

      <F1Clock />

      <div className="prose">
        <p>
          The top picture is noise: a big move is followed by nothing in particular. The bottom picture is the same days squared, and it has weather:
          a big square follows a big square more than twice as often as chance. That is the whole discovery — the sign of tomorrow's move is unknowable, but
          its size has a memory. A machine that remembers sizes is a bucket with a hole.
        </p>
      </div>

      <F2Bucket />

      <div className="prose">
        <p>
          Pour in each day's square, leak a fixed fraction overnight; the level is tomorrow's variance and its square root is the volatility. A small
          hole is smooth and slow and misses the storm for a week; a big hole jumps and drains. The dial is a speed of forgetting, and the next figure
          is the day that speed was the whole question.
        </p>
      </div>

      <F3June />

      <div className="prose">
        <p>
          The year's number was too calm; the bucket overshot and then had no idea the storm would end. Something is missing from the machine: a
          home to come back to.
        </p>
      </div>

      <F4Drip />

      <div className="prose">
        <p>
          A thin tap dripping a constant each day gives the level a home, and when you stop pouring it glides back along a curve instead of sitting
          still. The bucket without the drip is EWMA; with it, GARCH(1,1). The only remaining question is the one the whole page has been asking:
          which hole?
        </p>
      </div>

      <F5Score />

      <div className="prose">
        <h2>So what is a volatility model?</h2>
        <p>
          A rule for how fast to forget. Equal weights over a year forget nothing for a year and then everything at once; the bucket forgets a fixed
          fraction a day; the bucket with a drip forgets and drifts home. The test of a good speed is not a formula but the last picture: divide each
          day's square by the model's band and the clumps should vanish, until the real strip looks like the shuffled one.
        </p>
        <M block tex="\sigma_{t+1}^2 = \tok{ghost}{\omega} + \tok{approx}{\alpha}\,r_t^2 + \tok{truth}{\beta}\,\sigma_t^2 \qquad(\text{drip} + \text{cup} + \text{what stays in the bucket})" />
        <details className="a5-more">
          <summary>Likelihood, the flat ridge, fat tails, leverage — if you want them</summary>
          <p>
            The computer's "try all three pipes" maximises the likelihood of the real squares under the band — the same idea as asking which hole
            makes the storms least surprising. The ridge is flat: many (α, β) pairs with the same α + β score almost the same, which is why
            persistence (α + β, typically 0.98–0.99 on daily index data) is quoted more confidently than either knob. Daily moves have fatter tails
            than a bell even after scaling, so desks fit a Student-t error; and index falls raise volatility more than rises of the same size (the
            leverage effect), which GJR-GARCH handles with one extra knob on the down days. Hull's yen example gives the textbook numbers (ω =
            0.00000176, α = 0.0626, β = 0.8976, long-run 0.665 % a day) and lives in the tests. Figure 5's "eaten the weather" has a formal test: the Ljung–Box
            statistic of the squares over twenty lags is {n0(KEY.ljung_box_r2.stat)} on the raw strip and {n1(KEY.ljung_box_std2.stat)} on the squares divided by
            the computer's band — a value a strip with no weather would give {Math.round(100 * KEY.ljung_box_std2.p)} % of the time.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          The number VaR multiplies (chapter E1) is the one you just chose; the implied volatility screens quote (chapter C3) is the market's version
          of the same question; and a risk manager's "what is our vol?" is a choice of hole before it is a number.
        </p>
        <p className="a5-last">The future's sign is unknowable. Its size remembers yesterday — and your only decision is how fast to let it forget.</p>
        <div className="a5-pull">
          <strong>The next thing to find.</strong> A one-day loss you should only exceed once in a hundred days — the number the bucket is multiplied
          by. <a href="#/E1">E1 · Value at risk →</a>
        </div>
        <details className="prose a5-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num a5-code">
            {`real series: NIFTY 50 daily log moves, 2016-01-04 → 2026-11-03 (2,683 days), sd 1.02 %/day
EWMA: σ²_{t+1} = λ σ²_t + (1 − λ) r_t²; half-life = ln ½ / ln λ
GARCH(1,1): σ²_{t+1} = ω + α r_t² + β σ²_t, fitted by maximum likelihood (Nelder–Mead) on the real series; long-run σ² = ω/(1 − α − β)
4 Jun 2024: trailing-year, EWMA before/after, GARCH forecast vs the next 25 days' realised
// all tested against tests/answer-key/key_A5.py (Hull's yen rows to printed precision)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
