import { F0Board } from "./figures/F0Board";
import { F1OneBall } from "./figures/F1OneBall";
import { F2Paths } from "./figures/F2Paths";
import { F3Coins } from "./figures/F3Coins";
import { F4Binomial } from "./figures/F4Binomial";
import { F5Dice } from "./figures/F5Dice";
import { F6Gaussian } from "./figures/F6Gaussian";
import { F7Measure } from "./figures/F7Measure";
import { F8Break } from "./figures/F8Break";
import { F9Nifty } from "./figures/F9Nifty";
import "./normal.css";

export function NormalChapter() {
  return (
    <article className="chapter">
      <header className="chapter-head">
        <p className="chapter-id">Chapter 0.2 · Foundations</p>
        <h1>Counting, the binomial and the normal: a pile of coin flips is a bell</h1>
        <p className="standfirst">
          Drop balls through a board of pegs and a shape appears that nobody designed. This page follows that shape — count the routes, stack them, and a bell shows
          up — and then asks what the bell needs from the world in order to show up at all.
        </p>
        <p className="assumes">Assumes: you have met random variables, averages, variance and independence. Counting and the bell curve are taught here. That is all.</p>
      </header>

      <F0Board />

      <div className="prose">
        <p>To see why the pile is predictable, slow one ball down to a crawl. The board below has only five rows, and the ball moves one peg per click.</p>
      </div>

      <F1OneBall />

      <div className="prose">
        <p>
          So a bucket is a <em>sum</em>: five steps of +1 or −1, added. The ball does not aim for the middle; the middle is simply where most sums land. How many? That
          is a counting question. Label each bucket by how many of the five bounces went right, and ask how many routes lead into it.
        </p>
      </div>

      <F2Paths />

      <div className="prose">
        <p>
          Ten routes into bucket 2, one into bucket 0 — and since every route is equally likely, that ratio is the whole shape of the pile. But you <em>generated</em> those
          numbers, each from the two above it. Can you count them directly? Forget the board for a moment and think about the choice the ball makes.
        </p>
      </div>

      <F3Coins />

      <div className="prose">
        <p>
          With the count in hand, every bucket's probability is a formula — but see it as bricks before symbols: one brick per route, stacked by bucket. Then make the
          board bigger, and tilt it.
        </p>
      </div>

      <F4Binomial />

      <div className="prose">
        <p>
          The bars form a bell even when the pegs are tilted, and nothing in the formula mentions a bell. Is this special to coins? The next figure says no: add up
          enough copies of almost any random thing — however lopsided — and the same hump appears.
        </p>
      </div>

      <F5Dice />

      <div className="prose">
        <p>
          You just saw the <strong>central limit theorem</strong> before anyone stated it: add up enough independent copies of almost any random quantity, shift by the
          mean, squeeze by the spread, and you get one universal curve. Here is that curve, built one symbol at a time — with a knob for each symbol.
        </p>
      </div>

      <F6Gaussian />

      <div className="prose">
        <p>Now put the whole chain to work on a question with a definite answer, and check the answer by brute force.</p>
      </div>

      <F7Measure />

      <div className="prose">
        <p>
          Every link in that chain rested on something the board did silently: each bounce ignored the previous ones, each peg behaved like the others, and no single
          bounce could move the ball more than one slot. Take those away, one at a time.
        </p>
      </div>

      <F8Break />

      <div className="prose">
        <p>
          Which board is the real world? Here is one year of a real index, one square per day. The question is simply how many days landed beyond the bell's comfort
          zone, compared with how many the bell promised.
        </p>
      </div>

      <F9Nifty />

      <div className="ending">
        <p>
          A bucket on the board is a sum of coin flips. Count the routes and you get the binomial; rescale it — or any dice sum with a finite spread — and the same bell
          appears, probability carried by its area. The one sentence to keep: a sum of many small, independent things is a
          bell — and the days that matter are the ones that are not.
        </p>
        <div className="n2-pull">
          <div className="n2-pull-k">Where you will meet this again</div>
          <p>Market moves are percentages, not fixed steps, and some days are a hundred times bigger than the rest. What does the bell become then?</p>
          <p>The next chapter builds the lognormal from this board, and counts how often the real index breaks it.</p>
          <a href="#/A1">A1 · Normal, lognormal and fat tails →</a>
        </div>
        <details className="prose" style={{ marginTop: "1rem" }}>
          <summary className="links" style={{ cursor: "pointer" }}>
            What computes the figures on this page
          </summary>
          <pre className="num" style={{ fontSize: "0.8rem", lineHeight: 1.5, overflowX: "auto" }}>
            {`// the board: each ball is n coin flips from a seeded random-number generator
bits[r] = (random() < p) ? 1 : 0 ;  bucket = sum(bits)
// the wild peg: with probability 1/100 per row, bucket += ±5

// routes into bucket k
choose(n, k) = n! / (k! (n-k)!)
binomial(k) = choose(n, k) * p^k * (1-p)^(n-k)

// exact distribution of a sum of dice: list every combination (a convolution)
sum_of(die, n) = die * die * ... * die      // (p*q)[s] = Σ p[x] q[s-x]

// normal density and areas (engine/normal.ts, tested against a Python answer key)
// NIFTY 50 closes: src/data/nifty50.json; daily move = ln(close / previous close)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
