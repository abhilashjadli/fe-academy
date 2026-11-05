import "./d1.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0Comic } from "./figures/F0Comic";
import { F1Ledger } from "./figures/F1Ledger";
import { F2Referee } from "./figures/F2Referee";
import { F3Weeks } from "./figures/F3Weeks";

export function HedgingChapter() {
  return (
    <article className="chapter d1">
      <header className="chapter-head">
        <p className="chapter-id">Chapter D1 · Delta hedging and P&amp;L attribution</p>
        <h1>Theta pays for gamma</h1>
        <p className="standfirst">
          Raj sold the 22,600 call for ₹16.2 lakh and bought half a lot of index per call so that the next hundred points would not hurt him. Then he
          went home. Every morning after that the screen handed him two numbers — what the clock paid him overnight and what the index's move cost
          him — and every morning he bought or sold a few lots to be square again. This page is that week, in his ledger, on the real closes; then
          the same week run a thousand times, so you can see which part of what happened to him was the market and which part was arithmetic.
        </p>
        <p className="assumes">
          Assumes: chapter C4's three words — slope, bend, clock — and that a hedge means holding index against a call. Both are restated in the first
          panel. The closes are NSE's; where the file ends before expiry the page says "simulated from here" and switches to the real rows when they
          arrive.
        </p>
      </header>

      <F0Comic />

      <div className="prose">
        <p>
          Three signs before any symbol: the clock pays Raj smoothly, the bend charges him in lumps, and he re-balances <em>after</em> the move. Hold
          your bet; the week settles it one press at a time.
        </p>
      </div>

      <F1Ledger />

      <div className="prose">
        <p>
          Every row is the same three moves: read the slope, trade the difference, bank the clock. The hedger is always a day late — he sells after
          the fall and buys after the rise, which Hull calls a buy-high, sell-low scheme, and the sum of those small late trades is what the bend
          charges. Whether the week ends ahead or behind the clock-minus-bend arithmetic is the <em>leak</em>; whether Raj makes money at all is a
          different question, and it has a referee.
        </p>
      </div>

      <F2Referee />

      <div className="prose">
        <p>
          The break-even wobble of a hedged option is its implied volatility. Raj sold 15.9 %; for three days the index wobbled at 6.5 %, and every
          one of those days the clock paid more than the bend charged. Mel's question is the one every fresher asks, and Raj's answer is the page:
          theta is the fee he is paid to carry the bend, not his profit. Which leaves the part that was luck.
        </p>
      </div>

      <F3Weeks />

      <div className="prose">
        <h2>So what is delta hedging?</h2>
        <p>
          Holding index against an option so that the next small move does not matter, and re-balancing after every move so that the <em>next</em>{" "}
          small move does not matter either. The book then earns the clock and pays for the bend; the two tie exactly when the index wobbles at the
          vol the option was sold at; and because you can only re-balance now and then, even a tie leaves a small, random leftover that shrinks as
          you hedge more often but never reaches zero. The mean of the week is set by the vol gap; the spread by the frequency; the two are
          independent.
        </p>
        <M block tex="\text{edge per day} \approx \tfrac12\,\Gamma F^2\big(\sigma_{\text{sold}}^2 - \sigma_{\text{realised}}^2\big)\,\delta t" />
        <details className="d1-more">
          <summary>Which vol do you hedge with? — two paragraphs, if you want them</summary>
          <p>
            Raj hedged at the vol he sold, 15.9 %. Wilmott's chapter 12 points out there is a second choice: hedge at the vol the index will{" "}
            <em>actually</em> have. Do that and the total profit is locked from day one — exactly the difference between the option priced at the two
            vols — but the daily marks wander, so you may lose on paper for days before you gain, like holding a bond to maturity. Hedge at the
            implied vol instead, as Raj did, and each day's profit is smooth and certain in sign, but the total depends on the path: it is biggest if
            the index spends the week near the strike, where the bend is largest.
          </p>
          <p>
            Nobody knows the actual vol in advance, so desks hedge at the implied and read the path. Transaction costs push the other way: hedge
            more often and the leak shrinks like one over the square root of the number of re-hedges, but the costs grow with it, so the best
            frequency is somewhere in between — a few times a day for an index, once a day for most books.
          </p>
        </details>
        <details className="d1-more">
          <summary>Hull's bank and the rule of thumb, if you want them</summary>
          <p>
            Hull's institution sold a call on 100,000 shares at 49, strike 50, twenty weeks, for $300,000 against a value of $240,000, and hedged
            weekly: 52,200 shares on day one, then the table of weekly trades ending at a cost of $263,300 on one path and $256,600 on another. The
            spread of that cost, as a fraction of the premium, falls from 0.43 at five-week rebalancing to 0.19 weekly and 0.09 at a quarter-week —
            our 20,000-path re-run gives 0.41, 0.19, 0.10. The rule of thumb for the leftover is √(π/4) × vega × σ / √n for n re-hedges, because n
            re-hedges are an n-sample estimate of the variance. Natenberg's futures hedge made 62.81 against the model's 63.00: the arithmetic of
            adjustments, not luck.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Every desk's morning P&amp;L explain line — theta, gamma, vega, residual — is Figure 1's two bars with two more columns. The break-even by
          strike is chapter D2's smile. The thousand weeks are chapter E2's Monte Carlo.
        </p>
        <p className="d1-last">Theta is the rent the market pays Raj for carrying the bend. The rent is fair exactly when the index does what he sold.</p>
        <div className="d1-pull">
          <strong>The next thing to find.</strong> Raj sold 15.9 %. The 23,050 call was sold at 15.5 % the same afternoon and the 22,250 at 17 %. Why
          would one index wobble differently depending on the strike? <a href="#/D2">D2 · The market does not believe in one number →</a>
        </div>
        <details className="prose d1-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num d1-code">
            {`ledger: each close → slope Δ (Black-76 on F = close × 22,603/22,600), trade −units·Δ − held, cash += held·ΔF (futures-style hedge), premium accrues at 6.5 %
day split: clock = units·Θ_day·days, bend = units·½Γ·ΔF²  (yesterday's Greeks); exact = units·ΔV + held·ΔF
referee: edge/day = units·½ΓF²(σ_real² − σ_sold²)/365;  realised σ = rms of log moves × √252, no mean subtracted
weeks: lognormal paths, hedge once per step, 1,500 paths; markers: mean, Wilmott V(σ_real) − V(σ_sold)
// all tested against tests/answer-key/key_D1.py (Hull Table 14.4 reproduced to ±0.03)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
