import "./c3.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { Who } from "../../ui/Comic";
import { F0Dial } from "./figures/F0Dial";
import { F1Cloud } from "./figures/F1Cloud";
import { F2Steps } from "./figures/F2Steps";
import { F3Raj } from "./figures/F3Raj";
import { F4Game } from "./figures/F4Game";
import { F5Column } from "./figures/F5Column";

export function BlackScholesChapter() {
  return (
    <article className="chapter c3">
      <header className="chapter-head">
        <p className="chapter-id">Chapter C3 · Black–Scholes in detail</p>
        <h1>The one dial the screen does not set</h1>
        <p className="standfirst">
          Five things decide what a call costs. Four of them are printed on the screen: the index, the strike, the date, the interest. The fifth is not
          printed anywhere — and yet the screen says 249.15, which means somebody turned it. This page hands you that dial, lets you find the setting
          that prints 249.15, opens the machine to show why it prints what it prints, and then turns the dial on every strike at once until the
          market's own opinion appears as a curve.
        </p>
        <p className="assumes">
          Assumes: you can read a table, you know what an average is and what interest is. The row is the one from C1 — NIFTY 22,600, call 249.15,
          put 249.60 on 23 October 2026, forward 22,603 — and it is restated where it is used.
        </p>
      </header>

      <F0Dial />

      <div className="prose">
        <p>
          You found it without knowing what was in the box: a wobble of about 15.9 % makes the machine print the screen's price. That number is called
          the <em>implied volatility</em>, and it is how traders quote options to each other — not in rupees but in the dial setting that produces the
          rupees. Keep the second number in your pocket: the screen's own IV column says 13.66 % for this row, and both of you cannot be right. Now
          open the box.
        </p>
      </div>

      <F1Cloud />

      <div className="prose">
        <p>
          Inside the box there is no forecast, only a cloud of two thousand equally likely futures centred on the forward — chapter B5's coin. The
          price is what the futures above the strike pay, by how far above, shrunk by eleven days of interest. Widening the wobble barely changes how
          many land above the line; it changes how far above they land. That is why the dial moves the price without moving the odds — and it is
          the one piece of the picture that becomes a formula.
        </p>
      </div>

      <F2Steps />

      <div className="prose">
        <p>
          Two areas and a discount. The first area is the share of futures above the strike; the second is the same futures weighted by their own
          price, which is why it is slightly larger and why it is one unit, not a probability times anything. Every option price on every screen is
          this picture with different numbers in it. There is a second way to reach the same line, and it involves no cloud at all — only a man who
          refuses to have an opinion. <Who name="Raj" /> is back.
        </p>
      </div>

      <F3Raj />

      <div className="prose">
        <p>
          Raj sold the call and does not know where the index is going; he holds half a lot against it and adjusts the sliver every day. His combined
          position has no wobble left in it, so it must grow like a bank deposit, and that one sentence — written out as a rule for how the price
          curve must bend and sink — is the Black–Scholes equation. The cloud solved it in Figure 2. Now the game, on the rest of the screen.
        </p>
      </div>

      <F4Game />

      <div className="prose">
        <p>
          The dots do not land on a flat line. The 22,250 call was priced as if the index would wobble at 17.0 %; the 23,050 call, same index, same
          day, same expiry, at 15.5 %. The formula is wrong in a way the market has learned to speak — chapter D2 is about that language. One last
          thing: the screen's own IV column, the one that said 13.66 %.
        </p>
      </div>

      <F5Column />

      <div className="prose">
        <h2>So what is Black–Scholes?</h2>
        <p>
          The price of a call is the average payoff over a bell-shaped cloud of futures centred on the forward, shrunk by interest. The famous line is
          that average written out: two areas under the cloud and a discount. The only input the screen does not fix is the width of the cloud, and
          "implied volatility" is turning that one dial until the formula agrees with the screen. A desk quotes the dial setting, not the price,
          because the setting can be compared across strikes and dates and the price cannot.
        </p>
        <M block tex="c = e^{-rT}\big[\,\tok{truth}{F\,N(d_1)} - \tok{approx}{K\,N(d_2)}\,\big],\qquad d_{1,2} = \frac{\ln(F/K) \pm \tfrac12\sigma^2 T}{\sigma\sqrt{T}}" />
        <details className="c3-more">
          <summary>The textbook's version and the limits, if you want them</summary>
          <p>
            Hull's example: a stock at 42, the right to buy at 40 in six months, 10 % interest, 20 % wobble → d₁ = 0.7693, d₂ = 0.6278, call 4.76, put
            0.81 (the same picture on a spot price S, with F = S e<sup>rT</sup>). Turn the wobble to zero and the cloud collapses to a spike at the
            forward: the call is worth max(F − K, 0) discounted — ₹2.99 on this row. Send the index to infinity and both areas become 1: the call is
            the forward minus the strike, discounted. A dividend yield, a foreign interest rate or a futures contract only change what the forward is;
            the line is the same. Why the cloud's answer and Raj's answer agree is chapter B6's whole page.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Every quote in "vol" is this dial; a volatility surface is Figure 4's strip drawn for every expiry at once (chapter D2); the slope 0.51 that
          Raj hedged with is chapter C4's delta, and his daily ticking is chapter D1's whole week. When a screen prints an IV, it is printing the output
          of this machine with that screen's inputs — and Figure 5 is the reason to ask what they were.
        </p>
        <p className="c3-last">Four of the five numbers are facts. The fifth is a price wearing a percentage sign.</p>
        <div className="c3-pull">
          <strong>Monday morning on Raj's screen.</strong> Raj's slope was 0.51 on Friday. On Monday the index moved 153 points and his screen handed him five
          numbers — the slope, the bend, the clock and two more. <a href="#/C4">C4 · The slope, the bend and the clock →</a>
        </div>
        <details className="prose c3-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num c3-code">
            {`forward form: c = e^{−rT}[F N(d₁) − K N(d₂)], d₁ = (ln(F/K) + ½σ²T)/(σ√T), d₂ = d₁ − σ√T;  F = 22,603 (C1's chain), T = 11/365, r = 6.5 %
cloud: 2,000 quantiles of the lognormal with mean F; price = e^{−rT} × mean of max(S_T − K, 0)  (within 0.5 of the formula)
implied vol: Newton with vega as the slope, bracketed by bisection; from 30 % the 22,600 call lands in two steps at 15.853 %
NSE's column: spot Black–Scholes with S = 22,600, r = 10 %, T = 11 d reproduces all 34 printed IVs to rms ₹0.04
// all tested against tests/answer-key/key_C3C4.py`}
          </pre>
        </details>
      </div>
    </article>
  );
}
