import "./f1.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0Rod } from "./figures/F0Rod";
import { F1Step } from "./figures/F1Step";
import { F2Schemes } from "./figures/F2Schemes";
import { F3American } from "./figures/F3American";

export function FdmChapter() {
  return (
    <article className="chapter f1">
      <header className="chapter-head">
        <p className="chapter-id">Chapter F1 · Finite-difference solvers</p>
        <h1>Every point moves toward its neighbours</h1>
        <p className="standfirst">
          Predict how a cup of tea cools by assuming it loses a fixed share of its excess heat every minute, and you will be right — at one-minute
          checks. Check once an hour and apply the hourly share in one go, and your prediction overshoots the room and rings. That is the whole of
          this page. The Black–Scholes equation says how the value of an option, drawn as a curve over the index, relaxes as you walk back from
          expiry: every point moves toward the average of its neighbours, faster where the index is higher. A computer does exactly that, one
          neighbour at a time, and gets the formula's 249.15 without the formula. Take too long a step and it gets a billion rupees. There is a
          second way of stepping that cannot overshoot, a third that is accurate to the square of the step — and one extra line that prices the
          option the formula cannot.
        </p>
        <p className="assumes">
          Assumes: the equation as a heat rod (B6), the real 22,600 call at 249.15 (C3), stepping back from expiry (C2), and the bend as a second
          difference (C4). Each is restated where it is used. Three of the four figures are the real chain; the fourth is Hull's textbook American
          put, labelled.
        </p>
      </header>

      <F0Rod />

      <div className="prose">
        <p>
          That is a pricer with no formula in it. Lay the payoff along the rod, apply one rule eleven days running — each value moves toward the
          average of its two neighbours, by an amount that grows with the square of the index, less a little for the carry — and the number over
          22,603 is the number on the screen. The rule is chapter B6's heat equation read aloud, and the "amount" is chapter C4's bend: where the
          curve is bent the neighbours' average sits above the point, and the point is pulled up. The corner at the strike is where the bend is
          infinite, which is why it rounds off first and fastest. Now break it.
        </p>
      </div>

      <F1Step />

      <div className="prose">
        <p>
          The simplest way to step — tomorrow's value from today's three neighbours — hides three weights that add to one, and the middle one is
          one minus twice the pull. Make the step too long for the grid and that weight goes negative: the scheme is now subtracting the point's
          own value, each step amplifies the last step's error, and after eleven steps a ₹249 option is worth a billion rupees. The limit is
          not a property of the step or of the grid but of the two together: halve the spacing and the allowed step falls by four. Hull prints a
          gentle version of the same failure — negative option prices in the corner of a textbook table — and the cure is the same: smaller steps,
          or a scheme that cannot overshoot.
        </p>
      </div>

      <F2Schemes />

      <div className="prose">
        <p>
          Three schemes, one answer. The implicit scheme asks for today's values all at once, so that each is consistent with its own
          neighbours' pull; it can never overshoot, at the price of solving a chain of equations each step — a cheap chain, as it happens. It is
          first order in the step: halve the step, halve the error. Crank–Nicolson averages the two and is second order on a smooth payoff; on a
          payoff with a corner it rings, and the standard cure is to begin with two implicit half-steps. All three fall with the square of the
          grid spacing. On the real chain the accurate scheme on a fine grid is within a hundredth of a rupee of the formula; the formula, after
          all, is only this equation solved exactly for one payoff.
        </p>
      </div>

      <F3American />

      <div className="prose">
        <p>
          The formula cannot price an option that may be exercised early; the grid prices it with one more line — after each step, never let the
          value fall below what exercising would pay. Where that line binds is the exercise boundary, and on Hull's textbook put it is a staircase
          that climbs toward the strike as expiry nears. The grid reproduces his tables to the cent, the negative cells of the explicit version
          included. NSE's index options are European, so this is the one figure on the page that is not the real call — and chapter F2 is about what
          to do when the grid itself is impossible.
        </p>
      </div>

      <div className="prose">
        <h2>So what is a finite-difference solver?</h2>
        <p>
          The equation, obeyed one neighbour at a time on a grid. Explicit: tomorrow from today's neighbours — cheap, and unstable past a step that
          shrinks with the square of the grid spacing. Implicit: today's neighbours solved together — never unstable, first order in the step.
          Crank–Nicolson: the average of the two — second order on a smooth payoff, apt to ring at a corner unless started gently. American
          exercise: the same grid plus "never below the payoff", and the line where that rule binds is the exercise boundary.
        </p>
        <details className="f1-more">
          <summary>The equation, the three stencils, the stability limit, the corner — if you want them</summary>
          <M block tex="\frac{\partial V}{\partial t} + \tfrac{1}{2}\sigma^2 F^2 \frac{\partial^2 V}{\partial F^2} - rV = 0, \qquad \text{on the grid:}\quad a_j = \frac{\sigma^2 F_j^2}{2\,\delta F^2},\quad (LV)_j = a_j\,(V_{j-1} - 2V_j + V_{j+1}) - rV_j" />
          <p>
            In words: the clock pays for the bend, less the carry. Explicit: V⁺ = V + δt·LV. Implicit: (I − δt·L)V⁺ = V, a tridiagonal system solved
            in one sweep down and one sweep up (the Thomas algorithm). Crank–Nicolson: (I − ½δt·L)V⁺ = (I + ½δt·L)V. The explicit scheme's three
            weights are a_jδt, 1 − 2a_jδt − rδt, a_jδt — Hull's trinomial tree — and the middle one is positive only while δt ≤ δF²/(σ²F²_max): on
            this page's 100-point grid, 0.185 days, so at least 60 steps for an eleven-day option. The corner: Crank–Nicolson's error with two time
            steps is 27 rupees; with the first step taken as two implicit half-steps (Rannacher), 0.8. A detail that cost a draft of this page an
            afternoon: a wide grid starves a short option — on 0 to 45,200 an eleven-day call has 1.4 grid points per standard deviation and the
            answer is 18 rupees low (key); on 18,000 to 28,000 the hundred dots the page shows have six per standard deviation, and the 800-node grid behind them fifty. And the deep-in boundary in this forward form is the <em>discounted</em>{" "}
            intrinsic, e<sup>−rτ</sup>(F − K); get it wrong and put–call parity fails on the grid by 55 points at the far edge (key); with the right one it holds to a millionth of a rupee.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Every pricing library has a PDE engine with a "scheme" and a "grid" setting nobody touches until a price comes out negative. Americans
          on single stocks and barriers run on it daily — chapter H1's barrier is this grid with one more boundary; chapter D3's local-vol and
          Heston prices run on a two-dimensional version. It is the reason Glasserman calls Monte Carlo "not competitive" in one dimension, and
          chapter E2 is the method that takes over when the dimensions multiply.
        </p>
        <p className="f1-last">The formula is the equation solved once. The grid is the equation obeyed, one neighbour at a time, for anything.</p>
        <div className="f1-pull">
          <strong>When the grid is impossible.</strong> Many assets, a rule that depends on the road — the American rule has to be done on paths,
          and a desk has to fit its models and differentiate its prices without a formula in sight.{" "}
          <a href="#/F2">F2 · Longstaff–Schwartz, calibration, automatic differentiation →</a>
        </div>
        <details className="prose f1-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num f1-code">
            {`grid: F from 18,000 to 28,000 (δF = 10,000/M), forward form, boundaries 0 and e^{−rτ}(F − K); chain F 22,603, K 22,600, r 6.5 %, σ 15.853 %, 11 days (real)
Figure 0: Crank–Nicolson 800 × 88 with a Rannacher start, shown on 101 dots; Figure 1: explicit scheme, the step you set; Figure 2: all three schemes, the grid you set
Figure 3: Hull Example 18.1 on Hull's own S-grid stencils (18.25 implicit, 18.32 explicit), S_max 100, 20 × 10, American projection after each step (textbook)
// engine/fdm.ts, tested against tests/answer-key/key_F1.py (Hull Tables 18.1–18.2 cell by cell, Wilmott Tables 77.1–77.2, parity to 2e−6)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
