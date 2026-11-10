import "./d2.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0Strip } from "./figures/F0Strip";
import { F1Record } from "./figures/F1Record";
import { F2Tickets } from "./figures/F2Tickets";
import { F3Kink } from "./figures/F3Kink";
import { F4Surface } from "./figures/F4Surface";

export function SmileChapter() {
  return (
    <article className="chapter d2">
      <header className="chapter-head">
        <p className="chapter-id">Chapter D2 · Implied volatility, the smile and the surface</p>
        <h1>The market does not believe in one number</h1>
        <p className="standfirst">
          On 23 October the 22,250 call was priced as if the index would wobble at 17.0 %; the 23,050 call, same index, same day, same expiry, at
          15.5 %. The index can only wobble one way over those eleven days. So who is wrong? This page is about why the question is wrong — the
          formula was never a belief about the index, it is a language for comparing prices — and what the curve of those numbers, read strike by
          strike, says about the future the market is actually paying to avoid.
        </p>
        <p className="assumes">
          Assumes: chapter C3's dial (implied volatility is the one input the screen does not fix), chapter C1's law (a call and a put at one strike
          are one bet plus a forward) and chapter A1's picture (the real index has fat tails). Each is restated in one line where it is used.
        </p>
      </header>

      <F0Strip />

      <div className="prose">
        <p>
          Neither set of traders is wrong; the formula is — in a way the market has learned to speak. Once a screen of prices is translated into the
          formula's one unobservable input, the translation disagrees with itself, and the disagreement is information. The first thing it is
          telling you is in the index's own record.
        </p>
      </div>

      <F1Record />

      <div className="prose">
        <p>
          Ten years of the real index: the days beyond four of its own standard deviations should have happened once or twice in a century, and
          there were fifteen, ten of them down. A seller of far-below puts who priced them off the bell would have been run over again and again;
          the market charges more for those puts, and "more" shows up on the strip as a higher wobble at low strikes. What, exactly, is a strike's
          price a bet on? Three tickets answer that.
        </p>
      </div>

      <F2Tickets />

      <div className="prose">
        <p>
          A butterfly is a probability you can buy: ₹3.70 for ₹50 if the index lands within 25 points of 22,600. Done at every strike the tickets draw the
          market's own odds for expiry day — once the prices are smoothed, because raw last-trades are stale by seconds and six of the fifteen tents
          came out below zero. Below zero would mean a free lunch, which is the other thing a smile must never do.
        </p>
      </div>

      <F3Kink />

      <div className="prose">
        <p>
          A kink in the smile is a trade: buy the two outer tickets, sell two of the middle one, collect money and wait. The printed screen has one
          at 22,650 — three prints from three different seconds — and a desk's smile is a smooth curve precisely so that it never does. One more
          axis, and the curve becomes a surface.
        </p>
      </div>

      <F4Surface />

      <div className="prose">
        <h2>So what is the smile?</h2>
        <p>
          The market's prices, translated into the formula's one unobservable input, do not come out as one number: far-below strikes translate to
          a higher wobble because the real index falls hard more often than the bell says, and the market charges for it. Read as a curve, the smile
          is the market's own odds for expiry day; read across time, a surface. The formula survives not as a belief but as the language the odds
          are quoted in — Hull calls it "a sophisticated interpolation tool", and that is a compliment.
        </p>
        <M block tex="\text{P}(\text{land within } \pm\tfrac{h}{2}\text{ of }K) \;\approx\; e^{rT}\,\frac{C(K-h) - 2\,C(K) + C(K+h)}{h}" />
        <details className="d2-more">
          <summary>The rest, if you want it: coordinates, the frown, sticky rules, 1987</summary>
          <p>
            Parity forces a call and a put at one strike to the same vol — chapter C3's last figure showed NSE's own column failing that test only
            because of the inputs it was fed. A smile can be plotted against the strike, against ln(K/F), or against ln(K/F)/√T; the last makes
            smiles from different dates and expiries look alike, because all moves are relative (Natenberg). The smile need not smile: Hull's
            single-jump stock — 50 that will be 58 or 42 on the news, then 20 % wobble — gives vols of 31 % at the wings and 41 % at the money, a
            frown, because the market there fears the middle. A chain only sees the mass between its strikes — about half of it here — and a
            quadratic drawn through 34 dots is an extrapolation beyond 22,250 and 23,050, said so in Figure 2. Two habits for how the smile moves
            when the index moves: <em>sticky strike</em> (each strike keeps its vol; equity desks tend to assume it) and <em>sticky delta</em> (the
            smile slides with the index; FX desks quote it that way) — the hedge delta differs between them, and neither is a consistent model
            (Derman, 1999). And the date: equity skews have existed since 19 October 1987, when the S&amp;P fell 22.9 % in a day; before that, implied
            vols were nearly flat across strikes. The skew is the scar.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Every vol surface on every desk is Figure 4 with real rows; chapter D3 is about models that draw the whole curve from three knobs; chapter
          H2 is how FX quotes the smile as a risk reversal and a strangle.
        </p>
        <p className="d2-last">Seventeen strikes, seventeen numbers, one index. The numbers are not seventeen opinions — they are one opinion, written out.</p>
        <div className="d2-pull">
          <strong>Three knobs.</strong> Three knobs that draw the whole curve — and the day they stop fitting.{" "}
          <a href="#/D3">D3 · Local vol, Heston, SABR →</a>
        </div>
        <details className="prose d2-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num d2-code">
            {`smile fit: σ(k) = a + b k + c k², k = ln(K/F), least squares on the 34 (strike, vol) dots → 0.1595 − 0.418 k + 7.2 k², rms 0.16 vol pts
tents (h = 50): C(K−h) − 2C(K) + C(K+h); probability within ±h/2 = e^{rT} × tent / h;  raw LTPs: 6 of 15 negative
density from the smoothed smile by the same second difference, h = 5; P(S_T < K) = e^{rT} × (P(K+h) − P(K−h)) / 2h
record: 2,683 daily log moves 2016–2026, sd 1.02 %; beyond 2σ 62/44 (bell 61 each), 3σ 20/17 (3.6), 4σ 10/5 (0.1)
// all tested against tests/answer-key/key_D2.py (Hull Ex. 15.1, Tables 15.2, 15.3 to printed precision)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
