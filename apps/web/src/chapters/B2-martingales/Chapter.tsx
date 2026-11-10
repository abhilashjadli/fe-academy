import "./b2.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0Table } from "./figures/F0Table";
import { F1Leave } from "./figures/F1Leave";
import { F2Double } from "./figures/F2Double";
import { F3Hand } from "./figures/F3Hand";
import { F4Peek } from "./figures/F4Peek";
import { F5Wheel } from "./figures/F5Wheel";
import { Diary } from "./figures/Diary";

export function MartingalesChapter() {
  return (
    <article className="chapter b2">
      <header className="chapter-head">
        <p className="chapter-id">Chapter B2 · Martingales, stopping times, filtrations</p>
        <h1>The meter that will not move</h1>
        <p className="standfirst">
          A fair coin, a chip a toss, and you may leave whenever you like. Surely a clever enough plan — quit when ahead, double after a loss, bet
          big on a streak — beats it? Thousands have been sure. This page lets you try every plan at a table with a croupier, and shows the one
          number none of them touches, and the one thing that does.
        </p>
        <p className="assumes">Assumes: you know what an average is and what a fair coin is. That is all. Every toss on this page is a simulated coin.</p>
      </header>

      <F0Table />

      <div className="prose">
        <p>
          The fan widens — a typical player is fourteen chips up or down after two hundred tosses — and the meter above the table sits on zero,
          give or take its own error bar, and does not move. Hold on to that: the spread is the players'; the meter is the game's. Rule two.
        </p>
      </div>

      <F1Leave />

      <div className="prose">
        <p>
          "Right 94 % of the time" and "average zero" are both true, and the thin tail is where the second one lives: the players who never got
          their one chip at the bell are down sixteen on average and fifty-four at worst. No exit rule moves the meter; it only reshapes the fan. Rule three.
        </p>
      </div>

      <F2Double />

      <div className="prose">
        <p>
          A staircase of ones, and one night in thirty-two, a cliff. The doubling system is where the word <em>martingale</em> comes from — it was a
          betting system before it was mathematics — and its median player is ahead while its average is exactly zero. Now your own hand.
        </p>
      </div>

      <F3Hand />

      <div className="prose">
        <p>
          The croupier's sentence is the chapter's: anything you can see, you may use, and it does not help. The meter is indifferent to every
          habit a player can have, because every habit is written from what has already happened. There is exactly one thing that moves it.
        </p>
      </div>

      <F4Peek />

      <div className="prose">
        <p>
          Look ahead one toss and the meter moves for the first time, by a full chip a toss. That is the whole content of "fair": not that you
          cannot win, but that nothing you know now tilts the average of what comes next. Last rule — the one real casinos add.
        </p>
      </div>

      <F5Wheel />

      <div className="prose">
        <h2>So what is a martingale?</h2>
        <p>
          A game where, knowing everything up to now, your best guess for tomorrow's chips is today's. No exit rule and no bet sizing moves the
          average; only peeking does. Add a zero and every meter tilts down (a supermartingale); a stock under its own odds leans up (a
          submartingale); and chapter B5 is about who moves the odds so that the meter reads the price.
        </p>
        <M block tex="\mathbb{E}\big[\,X_{t+1}\,\big|\,\text{everything up to } t\,\big] = X_t" />
        <h3>The information diary</h3>
        <Diary highlight="HT" />
        <p>
          Picture the three-toss tree — 4, then ×2 or ×½ at each toss — and a diary with four pages. Before any toss, page one: eight paths are
          possible and the forecast of the end is 7.81. After one toss, page two: four paths remain and the forecast has moved to 12.5 or 3.13. After
          two, page three; after three, page four, one path, no forecast left to make. (The tree grows by a quarter a toss on average; count in
          today's chips — divide by 1.25 per toss — and every page's forecast is 4, the meter again.) No page is ever torn out — you cannot un-know a toss — and
          every page's forecast is the average of the next page's. A <em>stopping rule</em> is one you could write on today's page ("leave when up
          five"); a backtest that uses next year's index members is reading tomorrow's page. The diary has a name, <em>filtration</em>, and that is
          the only place on this page it is written.
        </p>
        <details className="b2-more">
          <summary>The four-line proof, the five properties, the fine print — if you want them</summary>
          <p>
            Proof that no system helps: your bet at toss n is decided from pages 1…n; the toss itself has mean zero and is independent of those
            pages; so the expected gain of the bet is the bet times zero; sum over tosses. The optional stopping theorem says the same for exit
            rules, provided the game cannot run forever on credit — the "up 1" rule needs unlimited time and an unlimited bankroll to be certain,
            which is where the −40 tail comes from. Figure 1's two walls are the same theorem as arithmetic: with walls at +a and −b the chance of
            reaching +a first is b / (a + b) — 20 / (20 + 5) = 0.8 — because that is the only split that keeps the average at zero. Five properties worth a sentence each: a martingale's increments are uncorrelated (not
            necessarily independent); a convex function of a martingale is a submartingale (Jensen — why the price of an option leans); a
            martingale that is bounded converges; Doob's inequality bounds how far it can wander; and any process splits into a predictable part
            plus a martingale (Doob decomposition), which is how B5 removes the lean.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Every "no free lunch" argument in blocks C–F is this meter; discounted prices under the pricing odds are martingales (chapter B5), which is
          the whole reason option prices are averages; and a strategy that looks great in a backtest is usually reading tomorrow's page.
        </p>
        <p className="b2-last">You may leave whenever you like, bet whatever you like, and use everything you know. The meter has already read it.</p>
        <div className="b2-pull">
          <strong>The question the meter leaves open.</strong> Which average — and who moves the odds so that the meter reads the price?{" "}
          <a href="#/B5">B5 · The odds are not the price →</a>
        </div>
        <details className="prose b2-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num b2-code">
            {`fair coin ±1 per chip, 200 tosses, 10,000 players (seeded); meter = average final chips; spread = sd ≈ √200 ≈ 14
exit rules: up 1 / up 5 or down 20 / bell at 200; doubling with limit 31: P(five reds) = 1/32 → −31
peek: bet on the known next toss → +1 per toss; stop before a losing run → the two-step tree 4 → 6.40 / 1.60 → 10.24 / 2.56 / 0.64
zero added: P(win) = 18/37; expected loss 1/37 ≈ 2.7 % of stake per toss
// all tested against tests/answer-key/key_B2.py`}
          </pre>
        </details>
      </div>
    </article>
  );
}
