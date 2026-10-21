import { M } from "../../ui/Math";
import { F0Opening } from "./figures/F0Opening";
import { F1Knobs } from "./figures/F1Knobs";
import { F2Derive } from "./figures/F2Derive";
import { F3Table } from "./figures/F3Table";
import { F4BuildUp } from "./figures/F4BuildUp";
import { F5Centre } from "./figures/F5Centre";
import { F6Converge } from "./figures/F6Converge";
import { F7Zoom } from "./figures/F7Zoom";
import { F8Ladder } from "./figures/F8Ladder";

export function TaylorChapter() {
  return (
    <article className="chapter">
      <header className="chapter-head">
        <p className="chapter-id">Chapter 0.1 · Foundations</p>
        <h1>Taylor series: derivatives at one point buy you the curve nearby</h1>
        <p className="standfirst">
          A position's value is a curve. A risk report is a short polynomial pretending to be that curve. This chapter is about why the pretence works, how far it
          works, and where the ½ comes from.
        </p>
        <p className="assumes">Assumes you can differentiate: power rule, chain rule, derivatives of sin, cos and eˣ. Nothing about markets is assumed.</p>
      </header>

      <F0Opening />

      <div className="prose">
        <p>
          The curve above is the value of a position as the market moves. Nobody on a trading desk re-computes that whole curve every time the market
          ticks; they carry a handful of numbers measured at today's level — a slope, a bend — and use those to say what happens next. The straight line is
          the first of those numbers at work; the parabola is the second. For a small move both are fine, for a large one the line drifts off while the bend
          stays close, and for a very large one even the bend gives up.
        </p>
        <p>
          That is the entire idea. Measure a few derivatives <em>at one point</em>, and you can reconstruct the function <em>near</em> that point. The
          cleanest way to see how is to try it by hand on a curve you know well. Here is <span className="tok-truth">cos x</span> and a polynomial with three
          free numbers.
        </p>
      </div>

      <F1Knobs />

      <div className="prose">
        <p>
          You will have found that c₀ wants to be 1, c₁ wants to be 0, and c₂ wants to be somewhere around −0.5. You will also have found that no setting
          makes the fit perfect everywhere: a quadratic is not a cosine, and the farther you look from x = 0 the more the two curves disagree. Both of those
          findings are the chapter in miniature. Now let us get the numbers exactly, and see why they are what they are.
        </p>
      </div>

      <F2Derive />

      <div className="prose">
        <p>
          Three facts about <span className="tok-truth">cos x</span> at x = 0 — its height is 1, its slope is 0, its bend is −1 — fixed the three numbers.
          The ½ in <M tex="1 - \tfrac{x^2}{2}" /> appeared because differentiating x² twice produces a 2, and we had to divide it back out. Add a cubic term
          and the same thing happens with a 6; add a quartic and it is 24. Those are factorials, and the reason they appear is worth seeing laid out, because
          it is also the reason each knob could be set on its own without disturbing the others.
        </p>
      </div>

      <F3Table />

      <div className="prose">
        <p>
          The table says something stronger than "there are factorials". Read a column at x = 0: exactly one entry is non-zero. The k-th derivative of the
          polynomial, evaluated at the centre, hears only the k-th term. That independence is what made Figure 2 a sequence of three separate decisions
          rather than one tangled fit, and it is what lets us write the whole recipe down at once:
        </p>
        <M block tex="\tok{approx}{c_k} = \frac{f^{(k)}(0)}{k!}, \qquad f(x) \;\approx\; f(0) + f'(0)\,x + \frac{f''(0)}{2!}\,x^2 + \frac{f'''(0)}{3!}\,x^3 + \cdots" />
        <p>
          Each term is a derivative at the centre, divided by its factorial, times a power of the distance. With the recipe in hand we can keep adding terms
          for as long as we like. Watch what each new term buys.
        </p>
      </div>

      <F4BuildUp />

      <div className="prose">
        <p>
          Two things to notice. First, the band of disagreement is always thinnest at the centre and widens with distance — the polynomial knows the function{" "}
          <em>at a point</em>, and that knowledge fades as you walk away. Second, each new term does not improve the fit uniformly; it pushes the edge of the
          good region outward. The ghost of the previous polynomial makes the increment visible.
        </p>
        <p>
          Nothing special happened at x = 0 except that cos and eˣ have convenient derivatives there. The centre can be anywhere. Move it, and the polynomial
          moves with it.
        </p>
      </div>

      <F5Centre />

      <div className="prose">
        <p>
          For cos x the fit can be pushed as far as you like by adding terms. For ln x and <M tex="\sqrt{1+x}" /> it cannot: there is a wall, at the same
          distance from the centre as the point where the function itself misbehaves (ln x at 0; <M tex="\sqrt{1+x}" /> at −1). No number of terms crosses it.
          Here is that wall, in the digits.
        </p>
      </div>

      <F6Converge />

      <div className="prose">
        <p>
          So "more terms" is not a free lunch; it works inside a radius and fails outside, and the radius is set by the nearest trouble spot of the function.
          For most of what this library does — option values as a function of the stock price, say — the functions are well behaved and the practical
          question is a different one: <em>how good is the approximation for the moves I actually care about?</em> That is a question about the first term
          left out, and it has a clean answer.
        </p>
      </div>

      <F7Zoom />

      <div className="prose">
        <p>
          The error of the n-th polynomial shrinks like the (n + 1)-th power of the step. That one line is the budget for every approximation in this library:
          it says why a first-order hedge is fine for small moves and not for large ones, and why adding the second-order term buys an extra power of
          accuracy. Which brings us back to the curve we started with.
        </p>
      </div>

      <F8Ladder />

      <div className="ending">
        <p>
          A few derivatives at one point — height, slope, bend, each divided by its factorial — rebuild a function in a neighbourhood of that point, and the
          first term you leave out tells you how large the neighbourhood is. In this firm the point is today's market, the derivatives are the Greeks, and the
          polynomial is the risk report. Everything else on this page is the same idea with the names changed.
        </p>
        <details className="prose" style={{ marginTop: "1rem" }}>
          <summary className="links" style={{ cursor: "pointer" }}>
            What computes the figures on this page
          </summary>
          <pre className="num" style={{ fontSize: "0.8rem", lineHeight: 1.5, overflowX: "auto" }}>
            {`// k-th Taylor coefficient of f about a
coefficient(f, k, a) = f.deriv(k, a) / k!

// degree-n polynomial at x, by Horner's rule
taylor(f, n, a, x):
  acc = 0
  for k = n down to 0: acc = acc * (x - a) + coefficient(f, k, a)
  return acc

// the option curve supplies V, Δ = ∂V/∂S, Γ = ∂²V/∂S² analytically
// (Black-Scholes; engine/blackscholes.ts, tested against a Python answer key)`}
          </pre>
        </details>
        <p className="links" style={{ marginTop: "1rem" }}>
          Continue with <a href="#/">C4 Greeks I</a> (the coefficients, named and interlocked) · <a href="#/">D1 Delta hedging</a> (this table as a P&amp;L) ·{" "}
          <a href="#/">B4 Itô's lemma</a> (when the second-order term will not vanish).
        </p>
      </div>
    </article>
  );
}
