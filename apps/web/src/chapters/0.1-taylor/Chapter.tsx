import { M } from "../../ui/Math";
import { F0Car } from "./figures/F0Car";
import { F1Knobs } from "./figures/F1Knobs";
import { F2Table } from "./figures/F2Table";
import { F3BuildUp } from "./figures/F3BuildUp";
import { F4Wall } from "./figures/F4Wall";
import { F5Zoom } from "./figures/F5Zoom";
import "./taylor.css";

export function TaylorChapter() {
  return (
    <article className="chapter">
      <header className="chapter-head">
        <p className="chapter-id">Chapter 0.1 · Foundations</p>
        <h1>Taylor series: a few numbers at one point buy you the curve nearby</h1>
        <p className="standfirst">
          Your calculator cannot compute cos x. Nobody can, by hand. What it does instead is multiply and add a handful of numbers, and this page is about where
          those numbers come from and when the trick stops working.
        </p>
        <p className="assumes">Assumes you can differentiate: power rule, chain rule, derivatives of sin, cos and eˣ. That is all.</p>
      </header>

      <F0Car />

      <div className="prose">
        <p>
          Multiplying and adding is all a calculator, or a person with a pencil, can really do. So the only curves you can compute directly are polynomials.{" "}
          <span className="tok-truth">cos x</span> is not one. Can a <strong>quadratic</strong> — a polynomial with three numbers, c₀ + c₁x + c₂x² — be made to
          behave like cos x near x = 0? Try it before reading on.
        </p>
      </div>

      <F1Knobs />

      <div className="prose">
        <p>
          Three facts about <span className="tok-truth">cos x</span> at x = 0 — height 1, slope 0, bend −1 — fixed the three numbers. The ½ in{" "}
          <M tex="1 - \tfrac{x^2}{2}" /> appeared because differentiating x² twice produces a 2, which you had to divide back out. A cubic term would bring a 6;
          a fourth power, 24. Those are factorials, and the reason they show up is worth one picture.
        </p>
      </div>

      <F2Table />

      <div className="prose">
        <p>
          Differentiate the polynomial k times and set x = 0: every term except the xᵏ one has been wiped out. So knob k is the only knob that touches the k-th
          derivative — which is why you could set the knobs one at a time without undoing the last one. That lets you write the whole recipe down at once:
        </p>
        <M block tex="\tok{approx}{c_k} = \frac{f^{(k)}(0)}{k!}, \qquad f(x) \;\approx\; f(0) + f'(0)\,x + \frac{f''(0)}{2!}\,x^2 + \frac{f'''(0)}{3!}\,x^3 + \cdots" />
        <p>
          Read it as words: the k-th knob is the k-th derivative at the centre, divided by k factorial. Each term is one derivative, one factorial, one power of the
          distance. You can keep adding terms as long as you like. Watch what each new one buys.
        </p>
      </div>

      <F3BuildUp />

      <div className="prose">
        <p>
          For cos x and eˣ you can push the fit as far as you like by adding terms. For ln x you cannot: there is a wall, exactly as far from the centre as the point
          where ln x itself blows up. Here is that wall, with the running totals of the series bouncing off it.
        </p>
      </div>

      <F4Wall />

      <div className="prose">
        <p>
          So "more terms" is not a free lunch; it works inside the wall and fails outside. But for most functions you meet, the practical question is different:{" "}
          <em>how good is the guess for the step I actually care about?</em> Zoom in and the answer draws itself.
        </p>
      </div>

      <F5Zoom />

      <div className="prose">
        <p>
          Keep n terms and the leftover error is about the size of the first term you threw away. Halve your step and a one-term guess gets 4× better, a two-term
          guess 8× better. That is the whole budget — it says why the line is fine for small steps and not for big ones, and what the bend buys you.
        </p>
      </div>

      <div className="ending">
        <p>
          A few numbers measured at one point — height, slope, bend, each divided by its factorial — rebuild a curve near that point, and the first number you leave
          out tells you how far "near" reaches. If someone asks what a Taylor series is: a guess that earns one more correction every time you look closer.
        </p>
        <div className="t-pull">
          <div className="t-pull-k">Where you will meet this again</div>
          <p>The value of a trading position is a curve in the market level. The slope and bend of that curve are the numbers a desk carries about it.</p>
          <p>They are called the Greeks — and they are exactly these coefficients.</p>
          <a href="#/C4">C4 · Greeks I: delta, gamma, theta →</a>
        </div>
        <details className="prose" style={{ marginTop: "1rem" }}>
          <summary className="links" style={{ cursor: "pointer" }}>
            What computes the figures on this page
          </summary>
          <pre className="num" style={{ fontSize: "0.8rem", lineHeight: 1.5, overflowX: "auto" }}>
            {`// k-th Taylor coefficient of f about a
coefficient(f, k, a) = f.deriv(k, a) / k!

// degree-n polynomial at x, evaluated from the highest power down
taylor(f, n, a, x):
  acc = 0
  for k = n down to 0: acc = acc * (x - a) + coefficient(f, k, a)
  return acc

// each function supplies its n-th derivative analytically (engine/taylor.ts),
// tested against an independent Python answer key`}
          </pre>
        </details>
      </div>
    </article>
  );
}
