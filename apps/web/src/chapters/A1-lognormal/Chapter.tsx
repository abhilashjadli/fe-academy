import { M } from "../../ui/Math";
import { F0Story } from "./figures/F0Story";
import { F1LogMove } from "./figures/F1LogMove";
import { F2Derive } from "./figures/F2Derive";
import { F3Lognormal } from "./figures/F3Lognormal";
import { F4World } from "./figures/F4World";
import { F5Tails } from "./figures/F5Tails";
import { F6Break } from "./figures/F6Break";

export function LognormalChapter() {
  return (
    <article className="chapter">
      <header className="chapter-head">
        <p className="chapter-id">Chapter A1 · Probability &amp; statistics for finance</p>
        <h1>Normal, lognormal and fat tails: adding slides, multiplying stretches</h1>
        <p className="standfirst">
          Two savers, one coin, two rules. One of them ends the year on a bell; the other on a curve that leans, cannot go below zero, and quietly taxes
          every wobble. The logarithm turns one into the other — and the real world, it turns out, obeys neither as closely as we would like.
        </p>
        <p className="assumes">Assumes: logarithms and e, random variables, expectation, variance. Chapter 0.2 helps but is recapped where needed.</p>
      </header>

      <F0Story />

      <div className="prose">
        <p>
          Ada's year is a sum: 100 plus 250 steps of ±1. Chapter 0.2 said that a sum of many small independent steps makes a bell, and it does. Mel's year is
          a <em>product</em>: 100 times 250 factors of 1.01 or 0.99, and products were nowhere in that chapter. Yet her pile has a definite shape too — a
          lean, with a long right reach and a floor at zero. The quickest way to see what that shape is, is to change the ruler we measure it with.
        </p>
      </div>

      <F1LogMove />

      <div className="prose">
        <p>
          A logarithmic axis makes Mel's pile a bell and Ada's a lean: the two savers are the same story read on different rulers. That is a strong hint about
          why — and about where Mel's missing 1.24 went. Let the derivation run.
        </p>
      </div>

      <F2Derive />

      <div className="prose">
        <p>
          A product becomes a sum under a logarithm; a sum of many small independent terms is a bell; therefore the log of Mel's balance is normal and her
          balance is <strong>lognormal</strong>. The same logarithm, expanded as in chapter 0.1, carries a second-order term that is negative whichever way
          the coin falls — half of r² per step — and that is the <strong>volatility drag</strong> that sets Mel's typical year below her average one. Here
          is the curve she ends on, in general.
        </p>
      </div>

      <F3Lognormal />

      <div className="prose">
        <p>
          Everything so far has been about the shape produced by a coin. Real daily changes are not coin tosses — but they are small, numerous and roughly
          independent, so the argument says their logarithms should pile up as a bell. Do they?
        </p>
      </div>

      <F4World />

      <div className="prose">
        <p>
          The bell fits the middle and fails the edges, and the failure is systematic: far-out days happen hundreds of times more often than the bell
          allows. The simplest curve that captures this is the Student-t, which looks like a bell with its shoulders pushed into its tails. The number that
          separates the two is the kurtosis, and the practical reading of it is "how often does a k-σ day come round".
        </p>
      </div>

      <F5Tails />

      <div className="prose">
        <p>
          If daily changes have tails this fat, is the argument of Figure 2 still safe? Adding many of them should still make a bell — unless the tails are
          so fat that the precondition fails.
        </p>
      </div>

      <F6Break />

      <div className="ending">
        <p>
          Adding slides and multiplying stretches; the logarithm converts one into the other, so a quantity that grows by percentages is lognormal, with its
          mean above its median by the drag <M tex="\tfrac12\sigma^2" />. The bell that all of this rests on needs a finite variance, and real daily
          changes have tails fat enough to make that a live question: the bell is the first draft, the t is a better second one, and "once in 7,000 years"
          under the first is "once in a few years" under the second.
        </p>
        <details className="prose" style={{ marginTop: "1rem" }}>
          <summary className="links" style={{ cursor: "pointer" }}>
            Where you will meet this again
          </summary>
          <p className="footnote" style={{ marginTop: "0.6em" }}>
            B3 takes Mel into continuous time: geometric Brownian motion, with the same −½σ² sitting in its drift. C3's Black–Scholes formula lives
            entirely in Mel's world and assumes the bell for log-returns — which is why its prices need a correction called the smile (D2) and why its
            risk numbers need the fat-tail corrections of E1. A5 is about the other way the bell fails: not fat tails but clustering, when the size of
            the steps itself wanders.
          </p>
        </details>
        <details className="prose" style={{ marginTop: "0.5rem" }}>
          <summary className="links" style={{ cursor: "pointer" }}>
            What computes the figures on this page
          </summary>
          <pre className="num" style={{ fontSize: "0.8rem", lineHeight: 1.5, overflowX: "auto" }}>
            {`// the two savers, same seeded coin
ada[d] = ada[d-1] + (heads ? +1 : -1)
mel[d] = mel[d-1] * (heads ? 1.01 : 0.99)

// lognormal density, Y = e^X with X ~ N(mu, sigma²)
f(y) = exp(-(ln y - mu)² / 2 sigma²) / (y sigma sqrt(2π))
mean = e^(mu + sigma²/2)   median = e^mu   mode = e^(mu - sigma²)

// Student-t tail: P(|T| > x) = I_{nu/(nu+x²)}(nu/2, 1/2)   (regularised incomplete beta)
// once-in-N-years = 1 / (252 × P)
// all tested against a scipy answer key`}
          </pre>
        </details>
      </div>
    </article>
  );
}
