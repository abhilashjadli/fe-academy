import "./a1.css";
import { Who } from "../../ui/Comic";
import { F0Story } from "./figures/F0Story";
import { F1LogMove } from "./figures/F1LogMove";
import { F2Ledger } from "./figures/F2Ledger";
import { F4World } from "./figures/F4World";
import { F5Tails } from "./figures/F5Tails";
import { F6Break } from "./figures/F6Break";
// F3Lognormal (the abstract lognormal curve with μ, σ sliders) is folded into Figure 1's "smooth curve" toggle; the file is kept.

export function LognormalChapter() {
  return (
    <article className="chapter">
      <header className="chapter-head">
        <p className="chapter-id">Chapter A1 · Probability &amp; statistics for finance</p>
        <h1>Normal, lognormal and fat tails: adding slides, multiplying stretches</h1>
        <p className="standfirst">
          Bet 1 % of your money on a fair coin every day for a year. The coin is fair — so why do you usually end the year poorer? And how often does
          a market really have a terrible day?
        </p>
        <p className="assumes">Assumes: you have met logarithms, averages and the idea of a spread. That is all.</p>
      </header>

      <F0Story />

      <div className="prose">
        <p>
          <Who name="Ada" />'s year is a sum: 100 plus 250 steps of ±1. Many small independent steps added together make a bell — the one fact we lean
          on. <Who name="Mel" />'s year is a <em>product</em>: 100 times 250 factors of 1.01 or 0.99. Her pile has a definite shape too — a lean, a long
          right reach, a floor at zero. To see what that shape is, change the ruler.
        </p>
      </div>

      <F1LogMove />

      <div className="prose">
        <p>
          On a log ruler, multiplying becomes adding, so Mel's pile is a bell there and her balance is called <strong>lognormal</strong>: a bell in the
          log. That explains the lean. It does not yet explain why her typical year ends 1.24 below where it started. Let Mel argue her case.
        </p>
      </div>

      <F2Ledger />

      <div className="prose">
        <p>
          Everything so far came out of a coin. Real daily changes are not coin tosses — but they are small, numerous and roughly independent, so the
          same argument says they should pile up as a bell. Here is a real year. Do they?
        </p>
      </div>

      <F4World />

      <div className="prose">
        <p>
          The bell fits the middle and misses the edges: big days come far more often than it allows. Is there a curve that fits the edges too? The
          simplest one is the bell with some of the middle scooped out and dumped into the far ends. It is called the Student-t; its one knob, ν, sets
          how much went to the ends. The next figure asks the only question that matters.
        </p>
      </div>

      <F5Tails />

      <div className="prose">
        <p>
          If daily changes have tails this fat, is the bell still safe to lean on? Adding many steps should still make a bell — unless the steps are so
          wild that the recipe itself breaks.
        </p>
      </div>

      <F6Break />

      <div className="ending">
        <p>
          Adding slides, multiplying stretches, and a logarithm turns one into the other. Anything that grows by percentages ends up lognormal, its
          typical outcome a little below its average — the price of every wobble. The bell beneath it needs a finite spread, and real markets have days wild
          enough to question that. The bell is a first draft; the t a better second one; "once in a lifetime" becomes "once in a year".
        </p>
        <div className="a1-pull">
          <div className="a1-pull-k">Where you meet this next</div>
          <p>Mel tossed one coin a day. A stock price moves every second. What does her year look like when the steps become infinitely small and infinitely many?</p>
          <p>
            Her drag survives the limit intact, and becomes a term in the equation every option price is built on.{" "}
            <a href="#/B3">B3 · Brownian motion and geometric Brownian motion →</a>
          </p>
        </div>
        <details className="prose" style={{ marginTop: "0.75rem" }}>
          <summary className="links" style={{ cursor: "pointer" }}>
            What computes the figures on this page
          </summary>
          <pre className="num" style={{ fontSize: "0.8rem", lineHeight: 1.5, overflowX: "auto" }}>
            {`// the two savers, same seeded coin
ada[d] = ada[d-1] + (heads ? +1 : -1)
mel[d] = mel[d-1] * (heads ? 1.01 : 0.99)

// Figure 1: exact year-end distribution, k heads of 250, P = C(250,k) / 2^250
// smooth curve: lognormal density, Y = e^X with X ~ N(mu, sigma²)
f(y) = exp(-(ln y - mu)² / 2 sigma²) / (y sigma sqrt(2π))
mean = e^(mu + sigma²/2)   median = e^mu   mode = e^(mu - sigma²)

// Figure 4: NIFTY 50 daily log-changes, ln(close_t / close_{t-1}), src/data/nifty50.json
// Student-t tail: P(|T| > x) = I_{nu/(nu+x²)}(nu/2, 1/2)   (regularised incomplete beta)
// once-in-N-years = 1 / (252 × P)
// all tested against a scipy answer key`}
          </pre>
        </details>
      </div>
    </article>
  );
}
