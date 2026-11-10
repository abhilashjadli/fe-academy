import "./d3.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0Knobs } from "./figures/F0Knobs";
import { F1Map } from "./figures/F1Map";
import { F2Life } from "./figures/F2Life";
import { F3Potholes } from "./figures/F3Potholes";
import { F4Together } from "./figures/F4Together";

export function VolModelsChapter() {
  return (
    <article className="chapter d3">
      <header className="chapter-head">
        <p className="chapter-id">Chapter D3 · Beyond Black–Scholes</p>
        <h1>Three stories, one curve</h1>
        <p className="standfirst">
          Black–Scholes draws a flat line through the smile, so something in it has to give, and the thing that gives is the one number it never let
          move: the wobble. Let the wobble depend on where the price is, and you get a smile. Let it have a random life of its own, and you get a
          smile. Let the price jump now and then, and you get a smile. All three draw the same curve through today's quotes to a tenth of a point —
          and they disagree completely about tomorrow. This page is about the three stories, the one knob in each that makes the tilt, and the
          question that tells them apart.
        </p>
        <p className="assumes">
          Assumes: chapter C3's cloud and dial, chapter D2's smile (17.0 % at 22,250 sloping to 15.5 % at 23,050), and the idea from B5 that a price
          is an average over weighted futures. Each is restated where it is used; the chain is the real one from 23 October.
        </p>
      </header>

      <F0Knobs />

      <div className="prose">
        <p>
          Three numbers can be read off one expiry — the level, the tilt and the curvature of the curve — and that is all. The knobs that say how
          fast the wobble comes home, or where home is, leave no mark on an eleven-day chain, and the question that matters most to a desk, what
          the smile does tomorrow, is not answered by today's quotes at all. Now the three stories, one at a time, on the cloud you already know.
        </p>
      </div>

      <F1Map />

      <div className="prose">
        <p>
          In the first story the wobble is a property of the <em>place</em>: a map painted under the price axis, read off as the price moves. Built
          that way the cloud lands exactly on the real dots — by construction, because the map was drawn from them — and the implied wobble at a
          strike is the average colour along the road to it, which is why the map is nearly twice as steep as the smile. In the second story the wobble has a
          life of its own.
        </p>
      </div>

      <F2Life />

      <div className="prose">
        <p>
          Two knobs do two different jobs. The lean — how the wobble moves when the price moves — makes the tilt, and at the real chain's lean the
          traced smile falls onto the dots. The jitter of the wobble itself makes the curvature. The other three knobs (where the wobble starts, where
          it is pulled back to, how hard) are invisible at eleven days, as round three said. The third story needs no second random thing at all.
        </p>
      </div>

      <F3Potholes />

      <div className="prose">
        <p>
          A bell plus a rare bad day is a smile: the small cloud of "one jump" sits to the left and pulls the puts' prices up. Big rare jumps and
          small frequent ones fit the same eleven-day chain equally well — the chain sees the mixture, not the recipe. Put the three stories on one
          axis.
        </p>
      </div>

      <F4Together />

      <div className="prose">
        <h2>So what is "beyond Black–Scholes"?</h2>
        <p>
          Three ways to let the wobble move. By place — local volatility: a map, exact for today's prices by construction, and wrong about how the
          smile moves. By its own random life — Heston: five knobs, two of which the chain can read, three of which are promises. By jumps — Merton:
          a bell plus rare bad days, a smile that dies out with time, and a risk no hedge can remove. SABR is the ruler desks use to draw a smile
          through a few quotes. Each has a known failure: local vol's forward smiles come out flat; Heston's short-dated skew is too weak; SABR's
          wings can price a negative probability (not at eleven days on this chain — the engine looked — but routinely at longer dates); Merton's
          jumps cannot be hedged away. Gatheral's verdict, after a book on the subject: the model
          that survives a desk is usually stochastic volatility <em>with</em> jumps.
        </p>
        <details className="d3-more">
          <summary>The three recipes and the knob table — if you want them</summary>
          <M block tex="\begin{aligned} &\text{place:}&& dS/S = \sigma(S,t)\,dW \\ &\text{a life of its own:}&& dS/S = \sqrt{v}\,dW_1,\quad dv = \kappa(\theta - v)\,dt + \eta\sqrt{v}\,dW_2,\quad \mathrm{corr}(dW_1, dW_2) = \rho \\ &\text{jumps:}&& dS/S = \sigma\,dW + (J - 1)\,dN \end{aligned}" />
          <p>
            Local volatility's map comes from the smile by Dupire's rule — in words, the local variance at a strike and date is what the butterfly
            and calendar spreads there say it must be. Heston's knobs: v₀ the wobble now, θ where it is pulled back to, κ how hard, η how jittery
            it is, ρ how it leans with the price (tilt). SABR's: α level, ρ tilt, ν curvature, β how the wobble scales with the price. Merton's: σ
            the everyday wobble, λ jumps per year, μ_J the typical jump, σ_J its spread. On one expiry the chain fixes level, tilt and curvature —
            three numbers — however many knobs a story has.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Every exotics desk prices barriers and autocallables (chapters H1, H2) on one of these stories, and which one changes the price by percent,
          not basis points; chapter E2's Monte Carlo is how Heston and Merton paths are actually run; and chapter D2's smile is the input every one of
          them is fitted to each morning.
        </p>
        <p className="d3-last">Today's curve does not choose the story. Tomorrow does — and a desk is paid for tomorrow.</p>
        <div className="d3-pull">
          <strong>The next thing to find.</strong> A product that pays only if the index never touches a level cares about the story, not the curve.{" "}
          <a href="#/E1">E1 · Value at risk →</a>
        </div>
        <details className="prose d3-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num d3-code">
            {`Heston: one-integral (Lewis/Gatheral) pricer, validated to 1e−9 against QuantLib's Alan Lewis references; Merton: Poisson-weighted sum of Black-76 prices; SABR: Hagan's formula
fits to the 34 real dots (F 22,603, 11 days): SABR α 0.157 ρ −0.31 ν 2.7; Heston (κ = 2) v₀ 0.027 ρ −0.31 η 0.87; Merton (λ = 1) σ 14.4 % μ_J −8.9 % σ_J 6.1 % — rms 0.16 vol pts each
local vol: Dupire at fixed T from D2's smoothed smile; the cloud grown on it reprices the smile within 0.1 vol pt (200k paths)
// all tested against tests/answer-key/key_D3.py`}
          </pre>
        </details>
      </div>
    </article>
  );
}
