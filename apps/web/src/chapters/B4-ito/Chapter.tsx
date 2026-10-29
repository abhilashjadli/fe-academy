import "./b4.css";
import { Says } from "../../ui/Comic";
import { Figure } from "../../ui/Figure";
import { WatchOrDo } from "../../ui/WatchOrDo";
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

      <WatchOrDo watchLabel="watch it (22 s)" doLabel="do it yourself — flip the coin" watch={<Figure n="2" prompt="The square whose side jitters, watched."><ClipSquare /></Figure>}>
        <F2Square />
      </WatchOrDo>

      <div className="prose">
        <p>
          The square showed you one function, x². The same race happens for any function: every term of its expansion is a tile, and the tiles shrink at
          different speeds when the step gets smaller. Two tiles survive, and one of them is the square you just met.
        </p>
      </div>

      <WatchOrDo watchLabel="watch the race (19 s)" doLabel="run it yourself — halve the step" watch={<Figure n="3" prompt="The race of the tiles, watched."><ClipTiles /></Figure>}>
        <F3Tiles />
      </WatchOrDo>

      <div className="prose">
        <p>
          Now the money. A stock is modelled as growing by percentages, so the function to track is its logarithm — and the logarithm curves downward.
          A curve that bends pays the toll.
        </p>
      </div>

      <F4Bug />

      <div className="prose">
        <p>One last thing: break it on purpose, and watch the simulated average drift away from the truth.</p>
      </div>

      <F5Break />

      <div className="prose">
        <h2>So what is Itô's lemma?</h2>
        <p>
          It is the chain rule for things that jitter. Ordinary calculus says: if you know how S moves, the slope tells you how any function of S moves.
          Itô's lemma says the same, with one extra term that ordinary calculus throws away — <strong>half the bend, times the wobble squared</strong>.
        </p>
        <M block tex="df = \big(\tok{approx}{\text{chain rule}} + \tok{truth}{\tfrac12\,\text{bend}\cdot\text{wobble}^2}\big)\,dt + \tok{approx}{\text{slope}\cdot\text{wobble}}\,dW" />
        <p>
          That is the whole result. The surviving tile is the blue term. Everything you do with the lemma is: write down how S wobbles, pick a function
          of S you care about, and read off how <em>that</em> wobbles. Try it on a function you haven't met yet.
        </p>
      </div>

      <F6Apply />

      <div className="prose">
        <h2>Where it is used</h2>
        <p>
          Three places, every day. Apply the lemma to ln S and the stock's own price formula falls out — with the −½σ² you just built. Apply it to an
          option's value V(S, t): its jitter is slope × wobble, so holding <em>slope</em> shares of stock cancels the jitter exactly, what remains is
          riskless, and that sentence is the Black–Scholes equation (C3). Read it as a profit-and-loss statement — slope × move, ½ × bend × move², and the
          cost of a day passing — and you have delta, gamma and theta, the daily life of an options desk.
        </p>
      </div>

      <div className="ending">
        <h2>The conclusion</h2>
        <p>
          A jittering step is not a small step: its square is as big as the <em>time</em>-step itself. So when something jitters, the <em>bend</em> of any function of it
          is never negligible — it pays, or charges, a steady toll of half the bend times the wobble squared. Itô's lemma is just the chain rule with that
          toll added, and three things follow from it: the formula for a stock's price, the equation that prices every option, and the way a trading desk
          splits its daily profit into delta, gamma and theta.
        </p>
        <p>
          If a desk head asks what you learned today: <strong>"anything that bends pays a toll for wobbling — and a stock's log bends down, so its
          typical year ends below its average one."</strong>
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

    </article>
  );
}
