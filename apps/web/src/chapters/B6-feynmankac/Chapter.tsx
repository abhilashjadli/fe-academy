import "./b6.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0Crawl } from "./figures/F0Crawl";
import { F1Clock } from "./figures/F1Clock";
import { F2Stills } from "./figures/F2Stills";
import { F3Drag } from "./figures/F3Drag";
import { F4Check } from "./figures/F4Check";

export function FeynmanKacChapter() {
  return (
    <article className="chapter b6">
      <header className="chapter-head">
        <p className="chapter-id">Chapter B6 · Feynman–Kac</p>
        <h1>Two ways to get the same number</h1>
        <p className="standfirst">
          On a desk two programs price the same option. One releases ten thousand imaginary futures and averages what they pay. The other never
          simulates anything: it fills in a grid from the end backwards. They print 4.76 ± 0.05 and 4.76. This page is about why they must agree, why
          one of them is faster, and what the ± is.
        </p>
        <p className="assumes">Assumes: you know what an average is and can read a grid. That is all.</p>
      </header>

      <F0Crawl />

      <div className="prose">
        <p>
          Three ideas, no finance: the value now is a weighted average of the value one step later; only the next step's numbers matter, because
          everything after it is already inside them; and the answer flows backwards. Now the same three ideas on a textbook option, two ways at once.
        </p>
      </div>

      <F1Clock />

      <div className="prose">
        <p>
          The walkers answer by brute force and their bracket shrinks like one over the square root of their number. The grid answers by the pub-crawl
          rule — each cell is the discounted average of its three children — and lands inside the bracket. Cooling backwards and averaging forwards
          are one picture. Here is the grid's rule as three stills.
        </p>
      </div>

      <F2Stills />

      <div className="prose">
        <p>
          A cell is the plain average of its neighbours plus a push proportional to the bend. That push is the only place a formula is named on this page,
          and it is the same term as chapter B4's surviving tile. Now see what each method knows.
        </p>
      </div>

      <F3Drag />

      <div className="prose">
        <p>
          The grid already knew the answer for every starting point; the walkers answer one point at a time. That is why a desk's grid pricer is instant
          and its simulator is not — and why the simulator survives anyway: it does not care how many dimensions the grid would have needed. One last
          thing: a case you can check by hand.
        </p>
      </div>

      <F4Check />

      <div className="prose">
        <h2>So what is Feynman–Kac?</h2>
        <p>
          The statement that "today's value is the average over all the futures" and "today's value obeys a rule for how it changes as you move the
          starting point" are the same sentence written twice. The tree you built in C2 already does both: each node is the discounted average of its
          children, and "average of neighbours, corrected for curvature" is what a diffusion equation says. The equality is exact; only the simulation
          side is noisy.
        </p>
        <M block tex="V(t, x) = e^{-r(T-t)}\,\mathbb{E}\big[\,\text{payoff}(X_T)\,\big|\,X_t = x\,\big]\quad\text{solves}\quad V_t + \tfrac12\sigma^2 x^2 V_{xx} + r x V_x = rV" />
        <details className="b6-more">
          <summary>The three-step argument, if you want it</summary>
          <p>
            Take the discounted value along a future, e<sup>−rt</sup>V(t, X<sub>t</sub>). Under chapter B5's weights it is a fair game — its average
            never moves. Apply chapter B4's lemma to it: the dW part is allowed to wobble, but the dt part of a fair game must be zero, and setting it to
            zero is exactly the backward rule above. That is why the rule carries the interest rate and not the stock's drift: the average is taken under
            Raj's coin, where every traded thing grows at r.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Every pricing library has both programs, and the choice between them is this page: a grid when the problem is small enough to draw (one or two
          prices, early exercise, barriers — chapter F1 builds the grid properly), a simulation when it is not (baskets, path-dependence, many assets —
          chapter E2). The ± after the walkers' number is the bracket, and a desk reports it.
        </p>
        <p className="b6-last">If two honest methods disagree by more than the bracket, one of them has a bug, and it is almost never the maths.</p>
        <div className="b6-pull">
          <strong>The next thing to find.</strong> The smooth curve at six months has a closed form, and two different arguments reach it.{" "}
          <a href="#/C3">C3 · Black–Scholes in detail →</a>
        </div>
        <details className="prose b6-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num b6-code">
            {`grid (ln S, trinomial): V[i] = e^{−rδt}(φ₊ V[i+1] + φ₀ V[i] + φ₋ V[i−1]),  φ± = ½(σ²δt/δx² ± (r − ½σ²)δt/δx),  φ₀ = 1 − σ²δt/δx²
walkers: average of e^{−rT}·payoff over N futures; bracket = ± sd/√N (one standard error, drawn and tested as such)
F1's grid: 100 columns over six months, δx = σ√(1.5 δt) → three doors weighted 0.34 / 0.33 / 0.32 (up / flat / down)
x² check: u(x, t) = x² + (T − t) exactly; grid reproduces it to 1e−6, walkers to ±0.012 at N = 20,000
stable only while σ²δt/δx² ≤ 1 (weights stay probabilities)
// all tested against tests/answer-key/key_B5B6.py`}
          </pre>
        </details>
      </div>
    </article>
  );
}
