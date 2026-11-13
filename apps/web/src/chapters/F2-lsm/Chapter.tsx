import "./f2.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0EightPaths } from "./figures/F0EightPaths";
import { F1Scale } from "./figures/F1Scale";
import { F2Valley } from "./figures/F2Valley";
import { F3Tape } from "./figures/F3Tape";

export function LsmChapter() {
  return (
    <article className="chapter f2">
      <header className="chapter-head">
        <p className="chapter-id">Chapter F2 · Longstaff–Schwartz, calibration, automatic differentiation</p>
        <h1>Three jobs with no formula</h1>
        <p className="standfirst">
          Three things a desk does every morning that no formula does for it. It decides, on simulated paths, when an option should be exercised
          — by fitting a curve through the paths themselves. It turns a model's knobs until its prices match the screen's — and finds a long
          valley of settings that match equally well. And it gets every sensitivity of a price in one pass, not by bumping each input and
          repricing, but by differentiating the pricing program itself, number by number. Each is arithmetic you already own — least squares from
          chapter A3, paths from E2, the chain rule — pointed at a job that used to need a formula.
        </p>
        <p className="assumes">
          Assumes: paths, error bars and keeping the same seed (E2), the American rule on a grid and its 4.28 (F1), three stories fitted to one
          smile (D3), delta, vega and theta (C4), and least squares (A3). Each is restated where it is used. The first two figures are textbook
          examples, labelled; the last two run on the real chain.
        </p>
      </header>

      <F0EightPaths />

      <div className="prose">
        <p>
          The trick is to ask the paths. At year two, five of the eight paths are in the money; whether each should exercise depends on what
          waiting would pay, and no single path can say. But the five together can: regress what each went on to earn against where it stood, and
          the fitted curve is the value of waiting at every price. Path 1 at 1.08 would collect 0.02 by exercising and the curve says waiting is
          worth 0.037, so it waits; paths 4, 6 and 7 exercise. Do the same at year one, add up the cash flows, discount, average: 0.1144, more than
          the 0.10 that exercising today would pay, and twice what the same eight paths say a European put is worth. Two regressions and a
          comparison — that is the whole algorithm, and it works for any number of paths, any number of dates, any number of assets.
        </p>
      </div>

      <F1Scale />

      <div className="prose">
        <p>
          On the put that chapter F1's grid priced at 4.284 the regression method lands within one standard error at two hundred thousand paths,
          and arrives from an interesting direction. With a thousand paths it reads 4.52 — too high, because the exercise rule was fitted on the
          very paths it is then judged on, and a rule that knows the future looks better than it is. With many paths the fitted rule stops being
          the best rule and the estimate settles just under the truth. A cubic basis instead of a quadratic moves the answer by half a standard
          error: the basis is a modelling choice, not a detail. The staircase the regression finds is the grid's exercise boundary, found without
          a grid.
        </p>
      </div>

      <F2Valley />

      <div className="prose">
        <p>
          Calibration is the same tool pointed the other way: hold the prices fixed and fit the model. Here it is chapter D3's ruler, SABR,
          fitted to the real 34 implied vols by least squares, and the thing to look at is not the answer but the shape of the error around it.
          Along the tilt the fit is sharp — a ρ of zero is three times worse than the best. Along the curvature it is a long valley: a ν of 1.75
          and a ν of 4.25 fit the eleven-day smile almost equally well, and the fitted 2.71 is one point in it. Wilmott's verdict is the honest
          one: you cannot hedge with a model whose prices differ from the instruments you hedge with, so you calibrate; and the data show how
          little the fit pins down. A desk chooses its point in the valley for reasons the smile does not give — stability from day to day, the
          behaviour of other expiries — and chapter D3's third round, where a mean-reversion of 2 and of 20 drew the same curve, was this valley
          seen from inside a different model.
        </p>
      </div>

      <F3Tape />

      <div className="prose">
        <p>
          The third job is differentiation, and the surprise is that a program can be differentiated as it runs. Carry alongside every
          intermediate number a second number — how much it would move if the index moved by one — and apply the chain rule at every step:
          ln(F/K) carries 1/F, d₁ carries that over σ√T, the normal's curve carries its density, and the last node carries delta, 0.50642…,
          equal to chapter C4's closed form to fifteen digits. Seed σ instead of F and the same tape delivers vega. Compare bumping: nudge the
          index, reprice, divide. There is a best nudge — about a millionth here — and on either side of it the error grows, from the
          curvature you ignored if the nudge is large and from the digits you threw away if it is small. On paths the lesson is chapter E2's again:
          differentiate the path, or bump with the same random numbers; bump with fresh ones and the delta is noise five times wider.
        </p>
      </div>

      <div className="prose">
        <h2>So what are the three jobs?</h2>
        <p>
          Longstaff–Schwartz: at each date, regress what waiting paid on where the paths were, and exercise where exercising beats the fit —
          optimistic on few paths, slightly low in the limit, as good as its basis. Calibration: least squares between the model's prices and the
          screen's, with a valley where one expiry cannot tell the knobs apart; you calibrate because you hedge with what you fit. Automatic
          differentiation: carry derivatives through the program — forward mode one extra pass per input; reverse mode, the adjoint, one pass for
          all of them at once — exact where a bump has a best step and a floor.
        </p>
        <details className="f2-more">
          <summary>The algorithm in six lines, the dual-number rules, the pathwise delta, the adjoint — if you want them</summary>
          <M block tex="\frac{d\,\text{price}}{dF} = \frac{\partial \text{price}}{\partial N(d_1)}\cdot\frac{\partial N(d_1)}{\partial d_1}\cdot\frac{\partial d_1}{\partial \ln(F/K)}\cdot\frac{1}{F} + \cdots" />
          <p>
            Longstaff–Schwartz: simulate paths; at the last date set the value to the payoff; step back a date: discount, regress the carried
            values of the in-the-money paths on (1, S, S²), replace the carried value by the payoff where the payoff beats the fit; repeat to the
            first date; average. Two biases: optimistic when the rule is fitted and judged on the same few paths; low in the limit because an
            estimated rule is never quite the best one (a second set of paths for the valuation removes the first). Andersen's alternative fits
            the exercise boundary directly. Dual numbers: (v, d) with (v₁ + v₂, d₁ + d₂), (v₁v₂, v₁d₂ + d₁v₂), f(v) → (f(v), f′(v)d). The
            pathwise delta of a call is e<sup>−rT</sup>·1{"{"}S<sub>T</sub> {">"} K{"}"}·S<sub>T</sub>/F; for a digital payoff the pathwise derivative is zero almost everywhere and the
            method fails — likelihood-ratio and "vibrato" estimators exist for that. The adjoint (Giles and Glasserman, "Smoking adjoints",
            2006) runs the tape backwards from the price and gets every input's sensitivity for about the cost of one more pricing; it is the
            reason a bank's overnight Greeks run finishes before morning.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Every exotics desk prices Bermudans and callables by Longstaff–Schwartz and risks them with adjoint Greeks; every model on this site
          was calibrated the way Figure 2 shows, valley and all; and the tape fed to a neural network is what Huge and Savine call differential
          machine learning. Chapter G1 is the regression that chooses its own basis — and the day it fits the noise.
        </p>
        <p className="f2-last">No formula: a regression, a fit, a tape. The arithmetic was always yours.</p>
        <div className="f2-pull">
          <strong>A regression that picks its own basis.</strong> The exercise rule was as good as the functions you gave it. Machine learning is
          the business of letting the data choose them — and of noticing when they chose the noise.{" "}
          <a href="#/G1">G1 · Supervised learning, regularisation, validation →</a>
        </div>
        <details className="prose f2-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num f2-code">
            {`Figure 0: Hull §20.9 / Longstaff–Schwartz 2001's eight paths, K 1.10, r 6 %, basis (1, S, S²) — textbook; Figure 1: F1's put (S 50, K 50, r 10 %, σ 40 %, 5 m), 50 dates, seeded GBM paths — textbook
Figure 2: SABR β = 1 (Hagan) on the real 34 implied vols of 23 Oct (F 22,603, 11 days); α from the at-the-money vol at each (ρ, ν); rms in vol points
Figure 3: Black-76 on dual numbers for the real 22,600 call; bumps relative to F; Monte Carlo delta on 20,000 seeded draws (seeds 9 and 10)
// engine/lsm.ts (+ volmodels.ts for SABR), tested against tests/answer-key/key_F2.py (Hull Tables 20.1–20.4 to his digits; the 200,000-path reference vs F1's grid)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
