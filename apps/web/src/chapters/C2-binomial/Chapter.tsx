import "./c2.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0Trick } from "./figures/F0Trick";
import { F1Hedge } from "./figures/F1Hedge";
import { F3Fill } from "./figures/F3Fill";
import { F4Refine } from "./figures/F4Refine";
import { REAL, REAL_SIGMA, SCREEN_CALL, f4, n0, n2, realStep } from "./figures/real";

export function BinomialChapter() {
  const step = realStep(); // the real one-step board: every number the prose quotes is the engine's
  return (
    <article className="chapter c2">
      <header className="chapter-head">
        <p className="chapter-id">Chapter C2 · From the binomial model to Black–Scholes</p>
        <h1>Pick any probability</h1>
        <p className="standfirst">
          The index is {n0(REAL.S0)} today. In eleven days it will be {n2(step.Su)} or {n2(step.Sd)} — you choose how likely. A ticket pays if it ends above{" "}
          {n0(REAL.K)}: C1's real row, on a one-step board. Set the odds to anything you like and I will tell you what the ticket is worth without looking at
          your dial. The trick works every time, it is the whole of option pricing, and by the end of this page you will have done it on a thousand-step
          board.
        </p>
        <p className="assumes">Assumes: you know what an average is and what interest is. That is all.</p>
      </header>

      <F0Trick />

      <div className="prose">
        <p>
          Spin the dial and the tile does not move. Whatever you believe about the index, the ticket is worth {n2(step.f)} — and the "average payout" readout,
          which does move, is not its price. Here is how the trick is done. No probabilities are involved; only a dial for how much of the index to hold.
        </p>
      </div>

      <F1Hedge />

      <div className="prose">
        <p>
          You copied the ticket. About half a unit of the index ({f4(step.delta)}) and some borrowed cash pay exactly what the ticket pays, in both futures, so
          the ticket must cost what the copy costs. The odds never entered because the copy works whichever way the index goes. But a price is usually an
          average of <em>something</em>, and so is this one: the copy's cost equals the discounted average payout under one particular weight — the one that
          makes the index itself a fair bet at the interest rate ({f4(step.p)} on the up node here, fixed by the two nodes and the rate, nothing about you).{" "}
          <a href="#/B5">B5 is the whole argument about that weight, with Priya and Raj</a>. Here, scale the board up.
        </p>
      </div>

      <F3Fill />

      <div className="prose">
        <p>
          Two rows is enough to see the rule: average your children with the weight, discount, step left. The hedge changes at every node, and an
          American option is the same fill with one extra question at each node — is it worth more exercised now than waiting? Now keep splitting the
          steps.
        </p>
      </div>

      <F4Refine />

      <div className="prose">
        <h2>So what is the binomial model?</h2>
        <p>
          A board on which the price can only go to two places per step, so a ticket's payoff can be copied exactly with some shares and some borrowed
          cash, and the ticket must cost what the copy costs. The chance of going up never enters: the real row's ticket cost {n2(step.f)} at every setting
          of the dial. The copy's cost happens to equal an average under one particular weight — the one that makes the stock a fair bet at the interest
          rate — and on a thousand-step board that average becomes a number with a closed form: the Black–Scholes price (10.4506 for the textbook
          100-stock of the last figure; the real row's one-step {n2(step.f)} becomes 249.11 on a thousand-step board, against the screen's {n2(SCREEN_CALL)} — C3 writes that formula
          out).
        </p>
        <M block tex="\text{price} = e^{-rT}\,\mathbb{E}_{p}\big[\text{payoff}\big],\qquad p = \frac{e^{r\delta t} - d}{u - d}" />
        <details className="c2-more">
          <summary>The pieces, if you want them</summary>
          <p>
            Δ, the units to hold, is the ticket's change over the index's change between the two futures: ({n2(step.fu)} − 0) / ({n2(step.Su)} −{" "}
            {n2(step.Sd)}) = {f4(step.delta)}. The up and down moves are set to match the wobble σ: u = e<sup>σ√δt</sup>, d = 1/u — on the real row's one
            step, u = {f4(REAL.u)} from σ = {f4(REAL_SIGMA)}; on a fine board the same rule makes the board's spread after a
            year the stock's. The n-step price is a sum over the 2ⁿ paths grouped by how many ups they contain — chapter 0.2's path counts are the weights. The
            bumps in the price as n grows are geometric (does a bucket land exactly on the strike?); averaging the n-step and (n+1)-step prices cancels
            most of them (100 and 101 steps average to 10.4493 against 10.4506).
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Every pricing library has this board inside it: the tree is how American options are priced in practice, how early exercise is checked node
          by node, and the first thing a desk reaches for when a payoff has no formula. The hedge dial is also the first thing a market maker does after
          selling a ticket — hold Δ shares against it — which is chapter D1's whole day.
        </p>
        <p className="c2-last">The trick has no secret: you never needed to know where the stock was going, only what you could copy.</p>
        <div className="c2-pull">
          <strong>What the board closes in on.</strong> The number the board closes in on has two derivations, and the smooth curve the tree makes at six
          months is one of them. <a href="#/C3">C3 · Black–Scholes in detail →</a>
        </div>
        <details className="prose c2-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num c2-code">
            {`one step: Δ = (f_u − f_d)/(S u − S d);  f = S Δ − e^{−rT}(S u Δ − f_u) = e^{−rT}(p f_u + (1−p) f_d),  p = (e^{rT} − d)/(u − d)
real row (F0, F1): S = ${n0(REAL.S0)} (= the chain's forward 22,603 discounted 11 days), K = ${n0(REAL.K)}, σ = ${f4(REAL_SIGMA)}, T = 11/365, r = 6.5 %; u = e^{σ√T} = ${f4(REAL.u)}, d = 1/u
  → ${n2(step.Su)} / ${n2(step.Sd)}, Δ = ${f4(step.delta)}, p = ${f4(step.p)}, f = ${n2(step.f)}
n steps: fill the last column with the payoff, then each node = e^{−rδt}(p·up + (1−p)·down); American: max(that, exercise)
CRR: u = e^{σ√δt}, d = 1/u;  S = K = 100, r = 5 %, σ = 20 %, T = 1 → 10.4506 as n → ∞
// all tested against tests/answer-key/key_C1C2.py (Hull ch. 10 numbers to printed precision; the real row in its c2_real block)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
