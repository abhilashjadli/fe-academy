import "./b3.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { useBet } from "../../ui/Bet";
import { F0Comic, type DialPick } from "./figures/F0Comic";
import { F1Zoom } from "./figures/F1Zoom";
import { F2Dials } from "./figures/F2Dials";
import { F3Real } from "./figures/F3Real";
import { F4Fan } from "./figures/F4Fan";
import { F5Leash } from "./figures/F5Leash";

export function BrownianChapter() {
  const [pick, setPick] = useBet<DialPick>("B3-F0");
  return (
    <article className="chapter b3">
      <header className="chapter-head">
        <p className="chapter-id">Chapter B3 · Brownian motion, GBM, quadratic variation</p>
        <h1>The dial that reads the clock</h1>
        <p className="standfirst">
          A car drives a jittery road. On its dashboard: a speedometer, an odometer, and a strange third dial that adds up the squares of every
          little move. Now read the dashboard twice as often, and twice as often again. Which dial settles to a steady reading? Almost everyone
          picks the wrong one — and the right one is the instrument the rest of this library is built on.
        </p>
        <p className="assumes">
          Assumes: you know what a slope is and you have seen a jagged line chart. That is all. One figure on this page uses the real index; every
          other series is simulated and says so.
        </p>
      </header>

      <F0Comic pick={pick} onPick={setPick} />

      <div className="prose">
        <p>
          Hold your guess. Before the dials can be read, the road itself needs looking at — closely, and then more closely than that.
        </p>
      </div>

      <F1Zoom />

      <div className="prose">
        <p>
          A smooth curve is its own tangent by ten times zoom; the random road never straightens, and at ten thousand times it looks exactly as it
          did at one. There is no slope anywhere — and yet one toggle makes every zoom level the same picture: measure height in the square root of
          time. That is the road's one law, and the dashboard reads it.
        </p>
      </div>

      <F2Dials pick={pick} />

      <div className="prose">
        <p>
          The speedometer runs away, the odometer runs away, and the squares dial settles on the time elapsed — one unit of time, one unit on the
          dial. The ledger says why it is steady: two thirds of the single steps are <em>below</em> their share; the dial is right because the errors
          cancel, not because each step is right. Now the dial on a real road.
        </p>
      </div>

      <F3Real />

      <div className="prose">
        <p>
          Over ten real years the squares dial gives a steady-ish yearly volatility that lights up in the storms, while the drift readout swings from
          window to window and never settles. You can measure the wobble from one path; you cannot measure the drift from one decade — a fact that
          chapter C3 turns into the whole of option pricing. Next: the one rule that makes a price out of a road.
        </p>
      </div>

      <F4Fan />

      <div className="prose">
        <p>
          Ada adds the jostles to a level and her fan is symmetric; Mel applies them as percentages and her fan leans, so that the average path and
          the middle path drift apart — after ten years at 40 % wobble the average is 272 while the median is 122. That gap is chapter A1's 98.76 in
          continuous time, and chapter B4 says exactly where the half comes from. One more rule change.
        </p>
      </div>

      <F5Leash />

      <div className="prose">
        <h2>So what is Brownian motion?</h2>
        <p>
          A path whose steps over a short interval are as big as the square root of the interval. So it has no slope anywhere, no finite length,
          and exactly one steady tally: the squares dial, which reads the clock. Geometric Brownian motion is the same road applied as percentages
          (Figure 4); a mean-reverting process is the same road on a leash (Figure 5); and the dial is the same on all three.
        </p>
        <M block tex="\sum (\Delta W)^2 \;\longrightarrow\; \tok{truth}{t}\qquad\text{as the tick} \to 0" />
        <details className="b3-more">
          <summary>The defining properties, the scaled coin walk, Mel's closed form and the leash — if you want them</summary>
          <p>
            Brownian motion W starts at 0, has independent increments, and W<sub>t</sub> − W<sub>s</sub> is normal with mean 0 and variance t − s;
            its paths are continuous and nowhere differentiable. Shreve builds it from a coin: ±1/√n every 1/n of a second, n → ∞. Mel's rule, dS =
            μS dt + σS dW, has the closed form S<sub>t</sub> = S<sub>0</sub> exp((μ − ½σ²)t + σW<sub>t</sub>) — stated here, derived in B4 — whose
            median is S<sub>0</sub>e<sup>(μ−½σ²)t</sup> and whose mean is S<sub>0</sub>e<sup>μt</sup>. The leash, dX = κ(θ − X)dt + σ dW, has
            half-life ln 2/κ and long-run spread σ/√(2κ); its exact simulation uses e<sup>−κΔt</sup>. The stepped version multiplies the gap by
            (1 − κΔt) instead: at κΔt = 1 it forgets its start in one step, at 1.5 it overshoots, and from κΔt = 2 the factor is −1 or worse and the
            spread grows without limit while the exact one sits still.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          The squares dial is realised variance on every desk and the σ in every pricing formula; Mel's fan is the model under chapters C2–C4; the
          leash is how short rates (chapter F) and volatility itself (chapter D3) are modelled; and Figure 3's "you cannot measure the drift" is why
          chapter B5 can drop it.
        </p>
        <p className="b3-last">The speedometer lies and the odometer lies. The dial that adds up the squares reads the clock.</p>
        <div className="b3-pull">
          <strong>The dial comes back.</strong> The squares dial is about to become a toll on every curved function of the road.{" "}
          <a href="#/B4">B4 · Itô's lemma →</a>
        </div>
        <details className="prose b3-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num b3-code">
            {`one path refined by Brownian bridging between its points (same random numbers at every zoom), 16 → 65,536 readings on [0, 1]
dials: Σ|ΔW|/Δt (speedometer), Σ|ΔW| (odometer), Σ(ΔW)² (the squares dial → 1.0)
real road: NIFTY 50 daily log moves 2016 → 2026; one-year window: realised vol = √(252 × mean square), drift = 252 × mean move
fans: 1,000 paths, additive (Ada) vs multiplicative (Mel), σ = 20 % / 40 %; leash: exact vs Euler step at κΔt = 0.1, 0.5, 1, 1.5
// all tested against tests/answer-key/key_B3.py`}
          </pre>
        </details>
      </div>
    </article>
  );
}
