import { M } from "../../ui/Math";
import { F0Board } from "./figures/F0Board";
import { F1OneBall } from "./figures/F1OneBall";
import { F2Paths } from "./figures/F2Paths";
import { F3Coins } from "./figures/F3Coins";
import { F4Binomial } from "./figures/F4Binomial";
import { F5Dice } from "./figures/F5Dice";
import { F6Gaussian } from "./figures/F6Gaussian";
import { F7Rule } from "./figures/F7Rule";
import { F8Measure } from "./figures/F8Measure";
import { F9Break } from "./figures/F9Break";
import { F10Lattice } from "./figures/F10Lattice";

export function NormalChapter() {
  return (
    <article className="chapter">
      <header className="chapter-head">
        <p className="chapter-id">Chapter 0.2 · Foundations</p>
        <h1>Counting, the binomial and the normal: a pile of coin flips is a bell</h1>
        <p className="standfirst">
          Drop balls through a board of pegs and a shape appears that nobody designed. This chapter follows that shape from counting paths, through the
          binomial distribution, to the normal curve — and shows what the curve needs from the world in order to show up.
        </p>
        <p className="assumes">Assumes: random variables, expectation, variance, independence. Counting and the normal distribution are taught here.</p>
      </header>

      <F0Board />

      <div className="prose">
        <p>
          To see why the pile is predictable, slow one ball down to a crawl. The board below has only five rows, and the ball moves one peg per click.
        </p>
      </div>

      <F1OneBall />

      <div className="prose">
        <p>
          So a bucket is a <em>sum</em>: five steps of +1 or −1, added. The ball does not aim for the middle; the middle is simply where most of the sums
          land. How many sums land there? That is a counting question, and the board answers it for us if we ask the right way: instead of labelling a
          bucket by its total, label it by how many of the five bounces went right. Then ask how many routes lead into each bucket.
        </p>
      </div>

      <F2Paths />

      <div className="prose">
        <p>
          Ten routes into bucket 2, one into bucket 0. Since every route is equally likely, that ratio is the whole story of the pile's shape. But the
          fractions on the pegs were <em>generated</em> — each from the two above it — not counted. To count them directly, forget the board for a moment and
          think about the choice the ball is making.
        </p>
      </div>

      <F3Coins />

      <div className="prose">
        <p>
          With the count in hand, the probability of each bucket is an explicit formula, and it is worth seeing it as bricks rather than symbols: one brick
          per route, stacked by bucket. Then make the board bigger, and tilt it.
        </p>
      </div>

      <F4Binomial />

      <div className="prose">
        <p>
          The bars form a bell even when the pegs are tilted, and even though nothing in the formula mentions a bell. The hint is in the readouts: the hump
          sits at np and has width √(np(1−p)), so its position grows like n and its width only like √n. Is this special to coins? The next figure says
          no — any repeated random thing with a finite spread will do, however lopsided.
        </p>
      </div>

      <F5Dice />

      <div className="prose">
        <p>
          This is the <strong>central limit theorem</strong>, seen before it is stated: add up enough independent copies of almost any random quantity,
          subtract the mean, divide by the standard deviation, and the result is drawn from one universal curve. Here is that curve, built one symbol at a
          time.
        </p>
      </div>

      <F6Gaussian />

      <div className="prose">
        <p>
          Because area is what carries probability, the useful facts about the curve are areas, and three of them are worth knowing by heart.
        </p>
      </div>

      <F7Rule />

      <div className="prose">
        <p>
          Now put the whole chain to work on a question with a definite answer, and check the answer by brute force.
        </p>
      </div>

      <F8Measure />

      <div className="prose">
        <p>
          Every step in that chain rested on assumptions that were easy to miss because the Galton board satisfied them silently: each bounce ignored the
          previous ones, each peg behaved like the others, and no single bounce could move the ball more than one slot. Take those away one at a time.
        </p>
      </div>

      <F9Break />

      <div className="prose">
        <p>
          One last thing to do with the board, and it costs nothing but a rotation.
        </p>
      </div>

      <F10Lattice />

      <div className="ending">
        <p>
          A bucket on a Galton board is a sum of coin flips; counting the routes into each bucket gives Pascal's triangle and the binomial distribution,{" "}
          <M tex="\binom{n}{k}p^k(1-p)^{n-k}" />; rescale the binomial — or the sum of any dice with a finite spread — and the same bell appears every
          time, <M tex="\tfrac{1}{\sigma\sqrt{2\pi}}e^{-(x-\mu)^2/2\sigma^2}" />, with probability carried by its area. The bell needs independence and
          a finite spread, and it is exactly where those fail that the next chapters begin.
        </p>
        <details className="prose" style={{ marginTop: "1rem" }}>
          <summary className="links" style={{ cursor: "pointer" }}>
            Where you will meet this again
          </summary>
          <p className="footnote" style={{ marginTop: "0.6em" }}>
            A1 asks what happens when the steps are percentages (the bell becomes the lognormal) and when a single day can dwarf the others (fat tails).
            A2 puts two boards side by side and lets them lean on each other (correlation). C2 prices an option on the sideways board. E2 uses the fact
            that an average tightens like 1/√n to understand why Monte Carlo is slow.
          </p>
        </details>
        <details className="prose" style={{ marginTop: "0.5rem" }}>
          <summary className="links" style={{ cursor: "pointer" }}>
            What computes the figures on this page
          </summary>
          <pre className="num" style={{ fontSize: "0.8rem", lineHeight: 1.5, overflowX: "auto" }}>
            {`// the board: each ball is n coin flips from a seeded generator
bits[r] = (random() < p) ? 1 : 0 ;  bucket = sum(bits)

// paths into bucket k
choose(n, k) = n! / (k! (n-k)!)
binomial(k) = choose(n, k) * p^k * (1-p)^(n-k)

// exact distribution of a sum of dice: repeated convolution
sum_of(die, n) = die * die * ... * die      // (p*q)[s] = Σ p[x] q[s-x]

// normal density and the 68-95-99.7 areas (engine/normal.ts, tested against a Python answer key)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
