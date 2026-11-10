import "./b1.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0Season } from "./figures/F0Season";
import { F1Ledger } from "./figures/F1Ledger";
import { F2Machine } from "./figures/F2Machine";
import { F3Street } from "./figures/F3Street";
import { F4Rebuild } from "./figures/F4Rebuild";
import { F5BusStop } from "./figures/F5BusStop";

export function ChainsChapter() {
  return (
    <article className="chapter b1">
      <header className="chapter-head">
        <p className="chapter-id">Chapter B1 · Random walks, Markov chains, Poisson</p>
        <h1>The weather has a habit</h1>
        <p className="standfirst">
          Look at four months of weather, one square per day: dry, some rain, heavy. The pattern is obvious — rain comes in spells — and yet
          "tomorrow depends only on today" turns out to describe it almost perfectly. This page takes that strip apart, finds the small machine
          inside it, and uses the same machine to explain why a drunk drifts and why buses arrive in clumps.
        </p>
        <p className="assumes">
          Assumes: you can count and you know what a fraction is. That is all. The season is Bengaluru's 2024 monsoon, day by day, from Open-Meteo's
          weather archive; nothing on this page is simulated except the strips the machine grows.
        </p>
      </header>

      <F0Season />

      <div className="prose">
        <p>
          Spells are long, not two days; after a heavy day it rains again more often than not. Nothing is explained yet — but notice that every
          observation you just made was about <em>pairs</em> of days. Count the pairs.
        </p>
      </div>

      <F1Ledger />

      <div className="prose">
        <p>
          The whole strip collapses into nine fractions, one per "yesterday → today", and each row adds to one because tomorrow has to be something.
          The three on the diagonal are the stickiness, and they are why spells are long. That table is the machine. Drive it.
        </p>
      </div>

      <F2Machine />

      <div className="prose">
        <p>
          The token reads the arrow it stands on and never looks at the strip behind it — that is the whole of "Markov". Two instruments: what has
          actually happened so far, and what you would bet before looking; from any corner the bet settles in a few hops on the machine's long-run
          weather, and the "so far" creeps to within a few hundredths of it. Now put the states on a line instead of in a triangle.
        </p>
      </div>

      <F3Street />

      <div className="prose">
        <p>
          A drunk at a lamppost with steps of ±1 is the same machine, and his crowd is a bell whose width grows like the square root of the number
          of steps — ten lampposts after a hundred, twenty after four hundred. Give him a memory and the crowd spreads faster than that. "No memory
          beyond now" is not a simplification; it is what buys the square root, and chapter B3 is built on it. Does the weather machine actually
          make weather?
        </p>
      </div>

      <F4Rebuild />

      <div className="prose">
        <p>
          The chain's strip has the season's spells and the fair coin's does not — and the coin's is the one most people pick as the original,
          because it looks "more random". One honest gap: the real monsoon is wetter in June and August than in September, so its rain fraction
          drifts across the season while the chain's is flat — the one thing fixed arrows cannot do. Last act: the same idea on a clock.
        </p>
      </div>

      <F5BusStop />

      <div className="prose">
        <h2>So what is a Markov chain?</h2>
        <p>
          A strip plus a table of fractions, where the next square is drawn from the row you are standing in and nothing else. The random walk is
          the same machine with states on a line; the bus process is the same idea on a clock, whose only state is "no bus yet" — and that is why
          chance clumps and why the average wait is the full ten minutes, not five.
        </p>
        <M block tex="\text{tomorrow's law} = \text{today's law} \times \tok{approx}{P}" />
        <details className="b1-more">
          <summary>The fixed point, the forgetting speed, the scaled walk and the Poisson count — if you want them</summary>
          <p>
            The long-run weather is the row vector π with π = πP; the speed at which the machine forgets its start is the second-largest eigenvalue of
            P (closer to one, slower). Shreve's scaled walk takes steps of ±1/√n every 1/n of a second: as n grows it becomes Brownian motion, the
            subject of chapter B3. A clock that rings with a tiny chance each second, independently, rings a Poisson number of times an hour — on
            average λ, with the gaps between rings exponential — and the inspection paradox is that a random arrival lands more often in a long
            gap than a short one, so the expected wait equals the expected gap.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Credit rating transitions are a Markov chain with states AAA … D — the one place the nine-number table appears as itself, in chapter G1. The
          lamppost walk, scaled down to tiny steps, is where the next chapters' price paths come from. A "calm / stormy" weather table for volatility is
          the same object again, later.
        </p>
        <p className="b1-last">The weather has a habit, and the habit fits in nine numbers.</p>
        <div className="b1-pull">
          <strong>What the drunk keeps.</strong> The drunk's average position never moves — and that, not the memory, is what a price has.{" "}
          <a href="#/B2">B2 · The meter that will not move →</a>
        </div>
        <details className="prose b1-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num b1-code">
            {`three states dry / some / heavy (< 1 mm, 1–10 mm, > 10 mm); P estimated by counting yesterday → today pairs; rows normalised
law after n days: π_n = π_0 Pⁿ; stationary law π = πP; mean run length per state = 1/(1 − P_ii)
lamppost walk: ±1 steps, 1,000 walkers; with memory: repeat the last step with probability 3/4
buses: a 1-in-600 lottery each second over two hours (λ = 6/hour); waits of a random arrival averaged over 1,000 arrivals
// all tested against tests/answer-key/key_B1.py`}
          </pre>
        </details>
      </div>
    </article>
  );
}
