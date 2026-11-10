import "./a4.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F1NineCharts } from "./figures/F1NineCharts";
import { F2Bowl } from "./figures/F2Bowl";
import { F3Forget } from "./figures/F3Forget";
import { F4Pairs } from "./figures/F4Pairs";
import { F5FoolTheEye } from "./figures/F5FoolTheEye";

export function TimeSeriesChapter() {
  return (
    <article className="chapter a4">
      <header className="chapter-head">
        <p className="chapter-id">Chapter A4 · Time series</p>
        <h1>Does it come home?</h1>
        <p className="standfirst">
          Some series have a home they keep coming back to. Others wander off and never return. A trader's whole edge can be the difference — and no
          chart can tell you which you are looking at. This page is a game about telling them apart, played in five rounds, and then the one test
          that can — given enough days.
        </p>
        <p className="assumes">Assumes: you can read a line chart and know what an average is. That is all.</p>
      </header>

      <F1NineCharts />

      <div className="prose">
        <p>
          Most people swap the two that matter: the price looks as if it has a level, and it does not; the wild-looking cycle looks lawless, and it
          keeps its rules perfectly. "Stationary" means the rules do not change — the average, the spread, the way today leans on yesterday — not that
          the picture is calm. Round two is the machine that makes both kinds.
        </p>
      </div>

      <F2Bowl />

      <div className="prose">
        <p>
          Today is yesterday times a number, plus news. The bowl is a picture of that multiplication, not of gravity: below one, every kick fades and
          the marbles pile up at a home; at exactly one the table is flat and the pile never stops spreading; above one it flies. The whole chapter
          is that one number, and the next round is how to read it off a series.
        </p>
      </div>

      <F3Forget />

      <div className="prose">
        <p>
          A single kick shrinks by the same fraction every day, and those shrinking bars are the autocorrelation — the honest version of the eye. The
          real index's bars sit near one for a month: no home. Its daily changes vanish at lag one: a home at zero. Taking differences is the one-step
          fix, and it is why every model in this block runs on changes, not levels. Now a round with money on it.
        </p>
      </div>

      <F4Pairs />

      <div className="prose">
        <p>
          Seventy crossings can be luck. The trade's whole edge is a finite expected return time, and the test for it is one regression: today's change
          on yesterday's level. A slope of zero is the drunk; a negative slope is the rubber band. The only subtlety is that the slope's usual
          yardstick does not apply at the boundary, which is why the test carries its own table of critical values. Last round, no labels.
        </p>
      </div>

      <F5FoolTheEye />

      <div className="prose">
        <h2>So what is a time series model?</h2>
        <p>
          A rule for how today depends on yesterday. The one number in that rule says whether there is a home: below one the series forgets its
          past at a fixed rate and comes back; at one it remembers everything and wanders; and the two look alike by eye for any sample you will
          ever see near the line — Round 5's test only got all ten on the long sample. Autoregressive models remember the level, moving-average models remember the recent news, and ARIMA is the same
          machine run on differences until the home exists.
        </p>
        <M block tex="x_t = \tok{approx}{\varphi}\,x_{t-1} + \varepsilon_t,\qquad \text{a home exists only if } |\varphi| < 1" />
        <details className="a4-more">
          <summary>If you want the symbols: AR, MA, ARIMA and the comb</summary>
          <p>
            AR(p) lets today lean on the last p levels; MA(q) lets it lean on the last q shocks; ARMA combines them; the I in ARIMA is the number of
            times you difference before fitting. The autocorrelation comb tells them apart: an AR comb decays geometrically, an MA comb cuts off dead
            after q lags, and a random walk's comb barely decays at all. The Dickey–Fuller regression Δx<sub>t</sub> = α + βx<sub>t−1</sub> + ε tests
            β = 0 with its own critical values (about −2.86 at 5 % with a constant); the augmented version adds lagged differences to soak up short
            memory. Tsay and Hull both warn that near the boundary a decade is not long: the test's power against φ = 0.98 on 250 days is poor, which
            is Round 5's honest sentence.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Every pairs desk lives in Round 4; every risk model runs on differences because of Round 3; and chapter A5 is this page's machine applied to
          the <em>size</em> of the kicks, which has a memory of its own.
        </p>
        <p className="a4-last">A chart can show you a home. Only a test can tell you whether it is really there.</p>
        <div className="a4-pull">
          <strong>The next thing to find.</strong> The kicks in Round 2 were all the same size. Real kicks come in spells — and the size of the kick
          has a memory too. <a href="#/A5">A5 · How fast should you forget? →</a>
        </div>
        <details className="prose a4-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num a4-code">
            {`AR(1): x_t = φ x_{t−1} + ε_t, ε ~ N(0, 1); stationary variance 1/(1 − φ²); ACF at lag k = φ^k
sample ACF of the real NIFTY level and of its daily log changes, lags 1–30
Dickey–Fuller: regress Δx_t on x_{t−1} (with constant); statistic = β̂ / se(β̂); critical values from the DF table
Round 5: five random walks and five AR(1) with φ ∈ [0.95, 0.98], 250 points each, seeded
// all tested against tests/answer-key/key_A4.py`}
          </pre>
        </details>
      </div>
    </article>
  );
}
