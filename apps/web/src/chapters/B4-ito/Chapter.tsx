import "./b4.css";
import { Says, Who } from "../../ui/Comic";
import { F0Bet } from "./figures/F0Bet";
import { F1Comic } from "./figures/F1Comic";
import { ClipSquare, ClipTiles } from "./figures/Clips";
import { F2Square } from "./figures/F2Square";
import { F3Tiles } from "./figures/F3Tiles";
import { F4Bug } from "./figures/F4Bug";
import { F5Break } from "./figures/F5Break";
import { F6Apply } from "./figures/F6Apply";
import { M } from "../../ui/Math";

export function ItoChapter() {
  return (
    <article className="chapter b4">
      <header className="chapter-head">
        <p className="chapter-id">Chapter B4 · Stochastic calculus</p>
        <h1>The square that would not vanish</h1>
        <p className="standfirst">
          In ordinary calculus a tiny step squared is nothing. Prices take tiny steps all day. Why does squaring theirs leave something behind — and why
          does it make every simulated stock in the world slightly too expensive?
        </p>
        <p className="assumes">Assumes: you can take a derivative and you have seen a price chart. That is all.</p>
      </header>

      <F0Bet />

      <div className="prose">
        <p>
          You have just met the one fact this chapter rests on: chop a year of wobbles as finely as you like, add up the squared steps, and the total
          settles at the length of the year. Not zero. Here is the same fact as an argument between two accountants.
        </p>
      </div>

      <F1Comic />

      <div className="prose">
        <Says who="Mel" mood="smug">Fine, the squares add. But each one is nothing.</Says>
        <Says who="Ada" mood="happy">Each one is nothing. There are a million of them.</Says>
        <p>Watch what "nothing, a million times" looks like on a square whose side is decided by a coin.</p>
      </div>

      <ClipSquare />
      <F2Square />

      <div className="prose">
        <Says who="Mel" mood="thinking">So I just write dW² = dt and move on?</Says>
        <Says who="Ada" mood="neutral">Inside a sum, yes. Outside one, it's a lie.</Says>
        <p>
          The square showed you one function, x². The same race happens for any function: every term of its expansion is a tile, and the tiles shrink at
          different speeds when the step gets smaller. Watch the race, then run it yourself.
        </p>
      </div>

      <ClipTiles />
      <F3Tiles />

      <div className="prose">
        <h2>So what is Itô's lemma?</h2>
        <p>
          It is the chain rule for things that jitter. Ordinary calculus says: if you know how S moves, the slope tells you how any function of S moves.
          Itô's lemma says the same, with one extra term that ordinary calculus throws away — <strong>half the bend, times the wobble squared</strong>.
        </p>
        <M block tex="df = \big(\tok{approx}{\text{chain rule}} + \tok{truth}{\tfrac12\,\text{bend}\cdot\text{wobble}^2}\big)\,dt + \tok{approx}{\text{slope}\cdot\text{wobble}}\,dW" />
        <p>
          That is the whole result. The surviving tile is the blue term. Everything you do with the lemma is: write down how S wobbles, pick a function
          of S you care about, and read off how <em>that</em> wobbles. Try it.
        </p>
      </div>

      <F6Apply />

      <div className="prose">
        <h2>Where it is used, every day</h2>
        <div className="b4-cards">
          <div className="b4-card">
            <strong>1 · The price of a stock.</strong> Apply the lemma to ln S and the price's own formula falls out: S<sub>T</sub> = S<sub>0</sub>{" "}
            e<sup>(μ − ½σ²)T + σW<sub>T</sub></sup>. That "−½σ²" is why a stock's typical year ends below its average year (A1), and why forgetting it
            overprices everything (Figures 4 and 5).
          </div>
          <div className="b4-card">
            <strong>2 · The price of an option.</strong> An option's value V depends on the stock and on time. Apply the lemma to V(S, t): its jitter is
            (slope × wobble) dW, so holding <em>slope</em> shares of stock against it cancels the jitter exactly. What is left has no randomness, so it must
            earn the risk-free rate — and that sentence <em>is</em> the Black–Scholes equation (C3). Without the lemma there is no hedge and no formula.
          </div>
          <div className="b4-card">
            <strong>3 · A trader's day.</strong> Read the lemma as a profit-and-loss statement: slope × (move) is the stock-like part, which the hedge
            removes; ½ × bend × (move)² is what a hedged option earns from the stock <em>moving at all</em>; and the time term is what it pays for the day
            passing. Desks call these delta, gamma and theta (C4), and the gamma-versus-theta tug of war is the daily life of an options book (D1).
          </div>
        </div>
        <Says who="Mel" mood="worried">Fine. Show me the money in a number.</Says>
        <p>
          A stock is modelled as growing by percentages, so the function to track is its logarithm. The logarithm curves downward — and a curve that bends
          pays the toll.
        </p>
      </div>

      <F4Bug />

      <div className="prose">
        <p>One last thing: break it on purpose, and watch the simulated average drift away from the truth.</p>
      </div>

      <F5Break />

      <div className="ending">
        <h2>The conclusion</h2>
        <p>
          A jittering step is not a small step: its square is as big as the step itself. So when something jitters, the <em>bend</em> of any function of it
          is never negligible — it pays, or charges, a steady toll of half the bend times the wobble squared. Itô's lemma is just the chain rule with that
          toll added, and three things follow from it: the formula for a stock's price, the equation that prices every option, and the way a trading desk
          splits its daily profit into delta, gamma and theta.
        </p>
        <p>
          The one sentence to say to a desk head tomorrow: <strong>"the drift of the log is μ minus half sigma squared, and that half is not a
          convention — it's the toll a bending function pays for wobbling."</strong>
        </p>
        <div className="b4-pull">
          <strong>The next thing that goes wrong.</strong> The stock's price is random, so the price of an <em>option</em> on it is random too — and
          someone has to hedge it, every day, with Ada's square in the books. <a href="#/C2">C2 · the binomial tree, where the hedge appears →</a>
        </div>
        <details className="prose b4-more">
          <summary>Also connects to</summary>
          <p className="footnote">
            A1 (the same −½σ² as "volatility drag"), B3 (the squared-wobble odometer that reads the clock), C3 (Black–Scholes, which is this lemma applied
            to an option's price) and C4 (the Greeks, where the surviving tile is called gamma).
          </p>
        </details>
        <details className="prose b4-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num b4-code">
            {`// a coin path: each step ±√dt;  a Brownian path: each step √dt × N(0,1)
sumDW2 = Σ (W[i+1] − W[i])²          → T,  sd = T·√(2/n)
telescoping (exact for any path):   W_T² − 2 Σ W[i]·dW[i] = Σ dW[i]²
Itô:  df = (f_t + a f_x + ½ b² f_xx) dt + b f_x dW
ln S with dS = μS dt + σS dW:        d ln S = (μ − ½σ²) dt + σ dW
GBM mean S₀e^{μT}, median S₀e^{(μ−½σ²)T};  forget −½σ² → mean × e^{½σ²T}
// all tested against tests/answer-key/key_B4.py (numpy)`}
          </pre>
        </details>
      </div>
      <p className="footnote b4-faces">
        <Who name="Ada" /> keeps the squares. <Who name="Mel" /> keeps first-order books. They first appeared in chapter A1.
      </p>
    </article>
  );
}
