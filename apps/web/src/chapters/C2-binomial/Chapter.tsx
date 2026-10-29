import "./c2.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0Trick } from "./figures/F0Trick";
import { F1Hedge } from "./figures/F1Hedge";
import { F2Prop } from "./figures/F2Prop";
import { F3Fill } from "./figures/F3Fill";
import { F4Refine } from "./figures/F4Refine";

export function BinomialChapter() {
  return (
    <article className="chapter c2">
      <header className="chapter-head">
        <p className="chapter-id">Chapter C2 · From the binomial model to Black–Scholes</p>
        <h1>Pick any probability</h1>
        <p className="standfirst">
          A stock is 20. In three months it will be 22 or 18 — you choose how likely. A ticket pays if it is 22. Set the odds to anything you like and I
          will tell you what the ticket is worth without looking at your dial. The trick works every time, it is the whole of option pricing, and by the
          end of this page you will have done it on a thousand-step board.
        </p>
        <p className="assumes">Assumes: you know what an average is and what interest is. That is all.</p>
      </header>

      <F0Trick />

      <div className="prose">
        <p>
          The tile did not move. Whatever you believe about the stock, the ticket is worth 0.633 — and the "average payout" readout, which did move, is
          not its price. Here is how the trick is done. No probabilities are involved; only a dial for how many shares to hold.
        </p>
      </div>

      <F1Hedge />

      <div className="prose">
        <p>
          You copied the ticket. A quarter of a share and some borrowed cash pay exactly what the ticket pays, in both futures, so the ticket must cost
          what the copy costs. The odds never entered because the copy works whichever way the stock goes. But a price is usually an average of{" "}
          <em>something</em> — so what was the magician's prop?
        </p>
      </div>

      <F2Prop />

      <div className="prose">
        <p>
          There was a probability on the table all along: 0.6523, the one weight that makes the stock itself a fair bet at the interest rate. It is not a
          forecast — nobody estimated it; the board fixed it (22, 18, 12 %). Price under that weight and you get 0.633 by the other road. Chapter B5 is
          about why such a weight always exists; here, scale the board up.
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
          cash, and the ticket must cost what the copy costs. The chance of going up never enters. The copy's cost happens to equal an average under one
          particular weight — the one that makes the stock a fair bet at the interest rate — and on a thousand-step board that average becomes a number
          with a closed form: 10.4506, the Black–Scholes price.
        </p>
        <M block tex="\text{price} = e^{-rT}\,\mathbb{E}_{p}\big[\text{payoff}\big],\qquad p = \frac{e^{r\delta t} - d}{u - d}" />
        <details className="c2-more">
          <summary>The pieces, if you want them</summary>
          <p>
            Δ, the shares to hold, is the ticket's change over the stock's change between the two futures: (1 − 0) / (22 − 18) = 0.25. The up and down
            moves on a fine board are set to match the stock's wobble σ: u = e<sup>σ√δt</sup>, d = 1/u, so the board's spread after a year is the
            stock's. The n-step price is a sum over the 2ⁿ paths grouped by how many ups they contain — chapter 0.2's path counts are the weights. The
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
          <strong>The next thing to find.</strong> The number the board closes in on has two derivations, and the smooth curve the tree makes at six
          months is one of them. <a href="#/C3">C3 · Black–Scholes in detail →</a>
        </div>
        <details className="prose c2-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num c2-code">
            {`one step: Δ = (f_u − f_d)/(S u − S d);  f = e^{−rT}(p f_u + (1−p) f_d),  p = (e^{rT} − d)/(u − d)
n steps: fill the last column with the payoff, then each node = e^{−rδt}(p·up + (1−p)·down); American: max(that, exercise)
CRR: u = e^{σ√δt}, d = 1/u;  S = K = 100, r = 5 %, σ = 20 %, T = 1 → 10.4506 as n → ∞
// all tested against tests/answer-key/key_C1C2.py (Hull ch. 10 numbers to printed precision)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
