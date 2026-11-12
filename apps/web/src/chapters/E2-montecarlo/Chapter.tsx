import "./e2.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0Wobble } from "./figures/F0Wobble";
import { F1Law } from "./figures/F1Law";
import { F2Asian } from "./figures/F2Asian";
import { F3Tomorrows } from "./figures/F3Tomorrows";

export function MonteCarloChapter() {
  return (
    <article className="chapter e2">
      <header className="chapter-head">
        <p className="chapter-id">Chapter E2 · Monte Carlo methods</p>
        <h1>How sure are you?</h1>
        <p className="standfirst">
          In chapter C3 you grew a cloud of two thousand index levels for 3 November and read the price of a call off it — 249, the average of
          what the call paid in each dot. Nobody called it Monte Carlo. Grow the cloud again with different random numbers and the price is 268;
          again, 242. This page is about that wobble: why a random average carries an error bar you can compute from the same draws, why halving it
          costs four times the dots, the two tricks that shrink it for free, and the two jobs — a payoff that depends on the whole road, a book with
          two risks that move together — for which throwing random tomorrows is the only method there is. Stanislaw Ulam invented it in 1946,
          convalescing and wondering how often a game of solitaire comes out; the name is the casino.
        </p>
        <p className="assumes">
          Assumes: the cloud and its dial (C3), that a price is an average taken under the weight that makes the forward fair (B5), that
          correlation is a shear (A2), Raj's book (D1) and that VaR is a rank in a pile (E1). Each is restated where it is used; the chain is the
          real one from 23 October.
        </p>
      </header>

      <F0Wobble />

      <div className="prose">
        <p>
          The dots in chapter C3 never moved because they were not random — they were two thousand evenly spaced quantiles of the bell, which is a
          trick this page comes back to. Make them random and the average wobbles, and the wobble has a size you can read off the dots themselves:
          the spread of the payoffs divided by the square root of their number. Nineteen of twenty re-rolls land within twice that bar of the
          true price, which is what the bar promises. The bar is the
          thing Monte Carlo gives you that a formula does not need and a desk cannot do without.
        </p>
      </div>

      <F1Law />

      <div className="prose">
        <p>
          The bar shrinks like one over the square root of the dots, in one dimension or a thousand, which is why the method loses to a grid for one
          variable and wins for forty: four times the dots for half the wobble, a hundred times for one more decimal. The two tricks change the
          dots, not their number. Mirror each dot through the forward and the pair cancels the part of the payoff that slopes — a call's bar shrinks;
          a straddle's, which has no slope to cancel, gets <em>wider</em>. Correct each payoff by how far the index itself landed from the forward,
          which you know averages to zero, and the bar halves. Neither costs a draw. Now the job no formula can do.
        </p>
      </div>

      <F2Asian />

      <div className="prose">
        <p>
          An option on the <em>average</em> of the next seven closes cannot be priced from the endpoint cloud, because the average depends on the
          road. So draw roads. An average wobbles less than an endpoint, so the option is cheaper than the plain call — 169 against 249. The trick
          that makes this a desk's method rather than a toy is the control: the <em>geometric</em> average has a closed form, so each road's
          arithmetic payoff is corrected by the error in its geometric one, and the bar collapses three-hundredfold. The real road, as it happens,
          paid 463 — a draw from near the top of the pile, beyond six roads in seven.
        </p>
      </div>

      <F3Tomorrows />

      <div className="prose">
        <p>
          Monte Carlo VaR is chapter E1's recipe with drawn tomorrows instead of remembered ones: sample, reprice, sort. Two things it teaches that
          the pile did not. The fiftieth worst of five thousand is a thin place to stand — for the hedged book its error bar is about ±5 %, double what a
          plain bell would carry, because the book's losses bend. And whether the correlation between the index and its wobble matters depends on what the
          book is short of: Raj's hedged book is a bend book with little vol exposure, and the correlation moves its number by under 2 %; the naked
          short call feels the sign, because the wobble tends to fall when the index rises.
        </p>
      </div>

      <div className="prose">
        <h2>So what is Monte Carlo?</h2>
        <p>
          Compute an average by drawing random tomorrows, and compute how wrong you probably are from the same draws. The error falls like one over
          the square root of the number of draws however many dimensions the problem has, so it is the method of last resort for one variable and of
          first resort for many. The tricks are ways of throwing fewer, better darts.
        </p>
        <table className="e2-table">
          <thead>
            <tr>
              <th>trick</th>
              <th>what it attacks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>antithetic (mirror)</td>
              <td>the part of the payoff that is odd in the draw — the slope</td>
            </tr>
            <tr>
              <td>control variate</td>
              <td>the part that moves with something you can price exactly</td>
            </tr>
            <tr>
              <td>stratified / quasi-random</td>
              <td>the gaps between random points — C3's quantile dots were this</td>
            </tr>
            <tr>
              <td>importance sampling</td>
              <td>the rare region a far-out-of-the-money payoff lives in</td>
            </tr>
            <tr>
              <td>moment matching</td>
              <td>the sample's own mean and width, forced to the true ones</td>
            </tr>
          </tbody>
        </table>
        <details className="e2-more">
          <summary>The error bar, the exact step, and the generator — if you want them</summary>
          <M block tex="\hat\alpha_n = \frac{1}{n}\sum_{i=1}^{n} f(Z_i), \qquad \mathrm{SE} = \frac{s_f}{\sqrt{n}}, \qquad S_{t+\delta t} = S_t \exp\!\Big[\big(r - \tfrac{\sigma^2}{2}\big)\delta t + \sigma\sqrt{\delta t}\,Z\Big]" />
          <p>
            The log step is exact for a stock at any step size; the Euler step S + rSδt + σS√δt Z is true only in the limit, and for chapter D3's
            breathing wobble no step is exact, which is why those paths needed Milstein. Correlated draws come from a Cholesky factor of the
            covariance — in two dimensions, the shear from chapter A2. Greeks by simulation need the <em>same</em> random numbers for the bumped and
            unbumped runs, or the difference is noise. Hull's old twelve-uniforms normal has the right width and no tails beyond six. The site's
            generator is a 32-bit mixer seeded by hand, so every figure here can be re-rolled and every number re-derived; the answer key ports it
            bit for bit.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          A structured-products desk's overnight batch: ten thousand paths a trade, a standard-error column nobody reads, and a Greek that flips
          sign because somebody re-seeded. Chapter E1's VaR when the book is nonlinear. Chapter H's barriers and autocallables, which have no other pricer — and chapter F1 is
          the other way to price without a formula, when the problem is small enough for a grid.
        </p>
        <p className="e2-last">A random average is a measurement. Report the error bar.</p>
        <div className="e2-pull">
          <strong>The matrix has axes of its own.</strong> Cholesky factorised the covariance to draw correlated tomorrows. Ask the same matrix which
          directions it actually moves in and a yield curve answers: three.{" "}
          <a href="#/E3">E3 · The frontier and the three motions of a curve →</a>
        </div>
        <details className="prose e2-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num e2-code">
            {`cloud: F 22,603, K 22,600, r 6.5 %, 11 days, σ 15.853 % (the real chain); S_T = F e^{−σ²T/2 + σ√T Z}; mulberry32 + Box–Muller, seeds shown
error bars: sample sd/√n; antithetic ratio = var(n independent)/2 ÷ var(n/2 pair means); control b = cov/var; exact values by quadrature over the bell
Asian what-if: fixings on the seven real trading days 26 Oct → 3 Nov; geometric control in closed form; 2,000 seeded roads on the page, 10⁶ in the key
Raj's book: 5,000 correlated (index, vol) tomorrows, vol stand-in 6 %/day relative, ρ as set; VaR = 50th worst; bootstrap band from the same draws
// engine/montecarlo.ts, tested against tests/answer-key/key_E2.py (Glasserman Table 4.1, Hull §18.6–18.7 checks included)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
