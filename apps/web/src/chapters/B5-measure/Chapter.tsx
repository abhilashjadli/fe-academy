import "./b5.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { Who } from "../../ui/Comic";
import { F0Odds } from "./figures/F0Odds";
import { F1Dial } from "./figures/F1Dial";
import { F2Coin } from "./figures/F2Coin";
import { F3Weights } from "./figures/F3Weights";
import { F4Girsanov } from "./figures/F4Girsanov";

export function MeasureChapter() {
  return (
    <article className="chapter b5">
      <header className="chapter-head">
        <p className="chapter-id">Chapter B5 · The risk-neutral measure</p>
        <h1>The odds are not the price</h1>
        <p className="standfirst">
          Priya is sure the stock is going up. Raj sets odds for a living and never bets on anything. They are both shown the same stock and the same
          ticket, and they disagree about everything — except, it turns out, what the ticket is worth today. This page is their argument, and why Raj
          wins it without ever saying what he thinks will happen.
        </p>
        <p className="assumes">Assumes: you know what an average is and what interest is. That is all.</p>
        <p className="b5-cast">
          <Who name="Priya" /> has a belief: 70 % up. <Who name="Raj" /> has no belief, only a trade. Their faces mark which is which on every figure.
        </p>
      </header>

      <F0Odds />

      <div className="prose">
        <p>
          The price came out of a trade, not a forecast. If Priya pays her seventy paise, Raj sells her the ticket, buys a quarter share, and pockets
          the difference — every time, whichever way the stock goes. She will not pay seventy for long. But she has a sharper objection.
        </p>
      </div>

      <F1Dial />

      <div className="prose">
        <p>
          The needle Raj charges never moves, because Priya's belief was never in his two columns. Widen the range of futures and it moves at once: the{" "}
          <em>spread</em> of what can happen is in the price; the odds of each are not. That is the half of the sentence freshers forget. Priya has one
          more go.
        </p>
      </div>

      <F2Coin />

      <div className="prose">
        <p>
          A bookmaker's odds are not his opinion of who wins. They are set so that his book balances whatever happens — and that is exactly Raj's coin:
          the one weight under which the stock itself is a fair bet after interest. Priya's way also reaches 0.633, but only by discounting at a rate she
          cannot know until she already has the answer. With two futures that is the whole story. With a thousand, Priya tries once more.
        </p>
      </div>

      <F3Weights />

      <div className="prose">
        <p>
          Same two thousand futures, different weights. The needle lands on 100 at exactly one setting of the dial — the one that makes the stock a fair
          bet — and there the call lands on Black–Scholes. The drift moved; the wobble did not. That re-weighting has a name, and a picture.
        </p>
      </div>

      <F4Girsanov />

      <div className="prose">
        <h2>So what is the risk-neutral measure?</h2>
        <p>
          Raj's coin: the one set of weights on the futures under which every traded thing is a fair bet after interest, so that today's price is simply
          the discounted average payoff. It is not anyone's belief, and it is not an assumption that people stop minding risk. It is the odds a bookmaker
          who never bets is forced to post.
        </p>
        <M block tex="\text{price today} = e^{-rT}\,\mathbb{E}_{\mathbb{Q}}\big[\text{payoff}\big]" />
        <details className="b5-more">
          <summary>The exchange rate between the two coins, if you want it</summary>
          <p>
            Each future carries a conversion factor from Priya's weights to Raj's: Z(up) = 0.6523 / 0.7041 = 0.9265 and Z(down) = 0.3477 / 0.2959 =
            1.1750, and under Priya's coin they average to exactly 1. With a thousand futures the factor becomes a smooth curve in the final price,
            1.0579 × (S<sub>T</sub>/100)<sup>−1.25</sup> in Figure 3's example, and the rule that produces it is Girsanov's: shift the wobble's drift by
            θ = (μ − r)/σ and nothing else changes. Shreve's sentence: changing the measure changes the weights of the paths, not the paths.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Every option price on every screen is a discounted average under Raj's coin — chapter C3's formula is exactly that average written out for a
          lognormal future. When a desk quotes "the market-implied probability of a 20 % fall", it is quoting Raj's weight, not a forecast; chapter D2
          reads those weights off the smile. And the equation nobody has written yet, whose solution is Raj's average, is chapter B6.
        </p>
        <p className="b5-last">Priya predicts. Raj prices. Only one of them has to be right every time, and it is the one who never says what will happen.</p>
        <div className="b5-pull">
          <strong>The next thing to find.</strong> Raj's average is also the answer to an equation — and a grid can fill it in backwards without
          simulating a single future. <a href="#/B6">B6 · Two ways to get the same number →</a>
        </div>
        <details className="prose b5-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num b5-code">
            {`one step: f = e^{−rT}(p f_u + (1−p) f_d), p = (e^{rT} − d)/(u − d) = 0.6523 for 22/18 at 12 %
Priya's road: q = 0.7041 and a discount rate k with e^{−kT}(q f_u + (1−q) f_d) = f → k = 42.6 %
continuous tilt: w(S_T) = c·(S_T/S_0)^{−θ/σ}, θ = (μ − r)/σ; Σ w = 1; E[e^{−rT} S_T w] = S_0 at θ = 0.25
// all tested against tests/answer-key/key_B5B6.py`}
          </pre>
        </details>
      </div>
    </article>
  );
}
