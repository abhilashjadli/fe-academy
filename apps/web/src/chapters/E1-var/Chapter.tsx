import "./e1.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0Sort } from "./figures/F0Sort";
import { F1Fence } from "./figures/F1Fence";
import { F2Raj } from "./figures/F2Raj";
import { F3Stills } from "./figures/F3Stills";

export function VarChapter() {
  return (
    <article className="chapter e1">
      <header className="chapter-head">
        <p className="chapter-id">Chapter E1 · Value at Risk and Expected Shortfall</p>
        <h1>A line through the bad days</h1>
        <p className="standfirst">
          In August 2007 a bank's finance chief explained a week of losses with the sentence "we were seeing things that were 25-standard-deviation
          moves, several days in a row". Under the bell curve a seven-standard-deviation day comes once in three billion years; his came on Tuesday,
          Wednesday and Thursday. The arithmetic was fine. The curve was wrong. This page is about the one risk number every desk reports — how much
          you lose on 99 days in 100 — how it is drawn through a pile of past days, what it leaves out, and the only honest test of it: counting how
          often the next year crossed the line. A town does not build its flood wall for the worst flood imaginable; it builds it for the hundred-year
          flood, and then watches the high-water marks.
        </p>
        <p className="assumes">
          Assumes: that a percentile is a position in a sorted pile (0.2), that the real index has fat tails (A1, D2), that volatility comes in
          clusters (A5), and the slope and bend of an option (C4) and Raj's book (D1). Each is restated where it is used. Every number on this page
          is computed from the real NIFTY record, 2016–2026.
        </p>
      </header>

      <F0Sort />

      <div className="prose">
        <p>
          That is the whole definition. Take every day you have, work out what today's position would have made or lost on each, sort them, and count
          in from the bad end: the 27th of 2,683 days is where 1 % begins, and the loss on that day is the number — ₹2.65 lakh on ₹1 crore of NIFTY.
          It is not a forecast and it is not a worst case; it is a <em>rank</em>. Five of the 2,683 days lost more than twice that, and one lost
          nearly five times it. Expected Shortfall is the obvious second question — when it is worse than the line, how much worse? — and its answer, the
          average of the 27 days beyond the line, is ₹4.33 lakh. The bell gives a different line, a little to the right, because it does not know
          the pile has a long left tail; it sees the width and nothing else. Which line is right? There is one honest way to find out.
        </p>
      </div>

      <F1Fence />

      <div className="prose">
        <p>
          A risk number earns its keep by its track record and nothing else. Draw the fence each day from only the 500 days before it, then count
          how often the next day jumped it. A right fence is jumped about one day in a hundred: 22 times in 2,183 days. The fence drawn from the
          days themselves was jumped 25 times, which is what a right fence does on most runs. The fence drawn from a bell was jumped 41 times — the
          bell's 1 % is the real pile's 2 %. Giving the bell a short memory (RiskMetrics' weighting, which chapter A5 built) makes it quicker on its
          feet and still wrong at the tail: 43. And look where the crossings are. Six of the historical fence's 25 came in March 2020, against an
          expected fifth of one; on 23 March the index lost 3.5 times the fence of the day before. Clusters are what volatility does, and a fence
          that passes its count can still be jumped five times in a fortnight.
        </p>
      </div>

      <F2Raj />

      <div className="prose">
        <p>
          For a position in the index itself the pile is the whole story. For an option book there is a trap, and it is set exactly where a hedger
          stands. Raj's book from chapter D1 — short 6,500 of the 22,600 call, long 3,292 futures against it — has almost no slope, so the
          one-line formula that multiplies the slope by the day's wobble says he can lose ₹144. Reprice the book on each of the 2,683 real days
          instead and the 27th worst is ₹10.3 lakh. The gap is the bend: a hedged short option loses on a move in either direction, and a formula
          that only knows the slope cannot see it. The bend formula on a bell gets most of the way (₹7.35 lakh); the real days' fat tails do the rest.
          Turn the hedge dial and watch the linear number fall to ₹144 and climb away again — a third low at the extremes, wrong by a factor of thousands where Raj lives.
        </p>
      </div>

      <F3Stills />

      <div className="prose">
        <h2>So what is VaR?</h2>
        <p>
          A line through a pile of past days at the 99th-worst position, reported in rupees — a number for the person who cannot read a thousand
          Greeks. There are three ways to draw it: use the days themselves (historical), fit a bell and read 2.33 widths (parametric), or simulate
          tomorrows and sort them (Monte Carlo — six steps: pick the risk factors, draw a tomorrow for each, reprice the book, record the loss,
          repeat, sort; chapter E2 is about the drawing). Expected Shortfall is the average of what lies beyond the line, and it is the measure that
          adds up across desks when VaR does not. Backtesting is the only test: count the crossings, and look at where they fall.
        </p>
        <details className="e1-more">
          <summary>The bell's two numbers, the √10 rule, Kupiec's count, Cornish–Fisher — if you want them</summary>
          <M block tex="\mathrm{VaR}_{99\%} = 2.326\,\sigma, \qquad \mathrm{ES}_{99\%} = \sigma\,\frac{\varphi(2.326)}{0.01} = 2.665\,\sigma" />
          <p>
            Ten-day VaR is usually quoted as √10 times the one-day figure, which is exact only if the days are independent and bell-shaped: on the
            record, the ten-day historical figure is ₹7.41 lakh against √10 × ₹2.65 lakh = ₹8.39 lakh. Kupiec's test asks whether the count of
            crossings is what the right model would produce: 25 against 21.8 expected gives a likelihood ratio of 0.44, well under the 3.84 that
            would reject it; 41 and 43 are rejected. Cornish–Fisher corrects the bell's quantile for skew — Hull's example takes −5.33 to −5.98 at a
            skew of −0.4; on Raj's book, whose delta-gamma P&L has a skew of −2.8, it gives ₹8.0 lakh against the exact ₹7.35 lakh, a serviceable
            shortcut. Wilmott's point about <em>which</em> volatility: the slope comes from the implied one, the move from the realised one. Extreme
            value theory fits the tail alone; McNeil's famous fit on 16 October 1987 put the fifty-year loss at 24 % when the worst day in the data
            was 6.7 %, and the next day fell 20.4 %. A measure that always adds up is called coherent; ES is, VaR is not.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Every risk report: the column headed "VaR 99 % 1d" beside the desk's P&L, and the monthly line "exceptions year to date". Bank capital
          under Basel is a multiple of the ten-day 99 % figure, and the multiple rises with the traffic light. Position limits are set in VaR.
          Chapter E2 draws the tomorrows a Monte Carlo VaR needs and says how wide the error bar on a worst day is; chapter E3 shows how a bond
          book's forty exposures become three.
        </p>
        <p className="e1-last">The number is a line through yesterday. The test is tomorrow.</p>
        <div className="e1-pull">
          <strong>Sample, reprice, sort.</strong> Monte Carlo VaR throws random tomorrows at the book — and the fiftieth-worst of five thousand is a
          shakier number than it looks.{" "}
          <a href="#/E2">E2 · Monte Carlo methods →</a>
        </div>
        <details className="prose e1-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num e1-code">
            {`record: 2,683 daily log returns 2016-01-04 → 2026-11-03 (NSE NIFTY 50 closes); P&L = ₹1 crore × (e^r − 1); VaR = ⌈1 % × n⌉-th worst; ES = mean beyond
fences: 500 days strictly before the day — historical (5th worst), normal (2.326 × window sd), normal with EWMA-0.94 variance; exceptions = loss > fence; Kupiec POF
Raj's book: Black-76 repriced one day older on every real move (F 22,603, K 22,600, σ sold 15.853 %, 11 days); linear 2.326 × |Δ_book| × F × 1.015 %/day; delta-gamma quantile exact
// engine/var.ts, tested against tests/answer-key/key_E1.py (Hull Ch. 16, Wilmott Ch. 19, Tsay Ch. 7 checks included)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
