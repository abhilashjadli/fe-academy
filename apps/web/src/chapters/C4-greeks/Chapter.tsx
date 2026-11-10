import "./c4.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0RiskLine } from "./figures/F0RiskLine";
import { F1Comic } from "./figures/F1Comic";
import { F2Surface } from "./figures/F2Surface";
import { F3Scrub } from "./figures/F3Scrub";
import { F4Ledger } from "./figures/F4Ledger";
import { F5Dial } from "./figures/F5Dial";

export function GreeksChapter() {
  return (
    <article className="chapter c4">
      <header className="chapter-head">
        <p className="chapter-id">Chapter C4 · Greeks I</p>
        <h1>The slope, the bend and the clock</h1>
        <p className="standfirst">
          Raj sold 100 lots of the 22,600 call on Friday for ₹16.2 lakh. His risk screen shows him five numbers for it, and on Monday morning the
          index has moved 153 points. This page is about those five numbers: they are the slope, the bend and the sinking rate of one curved surface,
          read at the spot where Raj is standing — and the surface sinks exactly as fast as it bends, which is why nobody gets curvature for free.
        </p>
        <p className="assumes">
          Assumes: you have seen a price curve bend (chapter C3's cloud gave you one; it is redrawn here) and you remember from chapter 0.1 that a curve
          near a point is "value + slope × step + ½ bend × step²". That is all.
        </p>
      </header>

      <F0RiskLine />

      <div className="prose">
        <p>
          Five numbers, each with a unit and no meaning yet. The page lights them one at a time. The first exists because the obvious way of
          protecting a sold call does not work, and the cheapest way to see that is to watch it fail.
        </p>
      </div>

      <F1Comic />

      <div className="prose">
        <p>
          Holding the whole index above the strike and none below sounds safe and bleeds money at every crossing, however finely you trade. What
          Raj holds instead is the <em>slope</em> of the price curve where the index is now — half a lot per call — and he will change it when the
          curve tells him to. To see when it tells him, stand on the surface.
        </p>
      </div>

      <F2Surface />

      <div className="prose">
        <p>
          One surface, three directions. Along the index the probe reads a height, a slope and a bend; turn to look along time and the same probe
          reads how fast the floor is dropping. Delta, gamma, theta — three readings of one object, not three objects. The last days before expiry
          are where the object becomes violent.
        </p>
      </div>

      <F3Scrub />

      <div className="prose">
        <p>
          With a day to go the bend at the strike is three times Friday's and so is the clock; with an hour to go the slope flips from nothing to
          everything inside a hundred points and the bend is sixteen times Friday's. The two curves that change shape do it in lockstep — that is not a coincidence, and Figure 5 is the sentence that ties them. First,
          Monday morning.
        </p>
      </div>

      <F4Ledger />

      <div className="prose">
        <p>
          Slope times move, half the bend times the move squared, the clock times the days — chapter 0.1's three terms, on a real move, within a rupee
          and a half of the exact re-price. The weekend charged three days of clock. And with the slope hedged away, the whole week comes down to one
          comparison.
        </p>
      </div>

      <F5Dial />

      <div className="prose">
        <h2>So what are the Greeks?</h2>
        <p>
          The price of an option is a curved surface over "where the index is" and "how long is left". Delta is the slope where you stand, gamma the
          bend, theta how fast the floor drops, vega how much the whole surface inflates when the wobble dial turns. And the surface drops exactly as
          fast as it bends: a position that gains from movement must pay for it by the day, and a position that collects by the day is paying for
          it with the bend. In words, <em>the clock plus half the wobble squared times the bend equals interest on the price</em>; in symbols:
        </p>
        <M block tex="\tok{approx}{\Theta} + \tfrac12\,\sigma^2 F^2\,\tok{truth}{\Gamma} = r\,V" />
        <details className="c4-more">
          <summary>The closed forms and the units, if you want them</summary>
          <p>
            In the forward form of chapter C3: Δ = e<sup>−rT</sup>N(d₁); Γ = e<sup>−rT</sup>N′(d₁)/(Fσ√T), the same for a call and a put; Θ =
            −e<sup>−rT</sup>F N′(d₁)σ/(2√T) + rV per year, divided by 365 for a calendar day (desks also quote per trading day, ÷252); vega =
            e<sup>−rT</sup>F√T N′(d₁) per unit of σ, ÷100 for a vol point; ρ = −T·V per unit of r. Three things freshers get wrong: delta is only
            roughly the chance of finishing in the money (the exact chance is N(d₂)); theta is not a risk to hedge — there is no uncertainty about the
            passage of time, it is the fee for the bend; and a put's gamma is positive too. Hull's bank: a call on 100,000 shares at 49, strike 50,
            twenty weeks, sold for $300,000 and worth $240,000; delta 0.522 → 52,200 shares; hedged weekly the cost came out at $263,300 on one
            path and $256,600 on another, and the spread of that cost falls from 0.43 of the premium at five-week rebalancing to 0.09 at a quarter
            week — chapter D1's whole subject. Gamma and vega can be hedged with other options, not with the index; two lines in Hull, one in chapter
            D1.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          The risk line in Figure 0 is read every morning on every desk, in rupees per name; "why is our theta so big?" is answered by looking at the
          gamma column. The gamma–theta race over a week is chapter D1. The higher legs of the same surface — how the slope itself bends, how it
          drifts with time — are chapter C5, and the fact that the wobble dial reads differently at each strike is chapter D2.
        </p>
        <p className="c4-last">Five numbers, one surface. Learn to stand on it and the screen reads itself.</p>
        <div className="c4-pull">
          <strong>A week on the real closes.</strong> Raj hedged once a day for a week on the real closes. The clock paid him every morning and the bend
          charged him on the one day it moved. Did he keep the money? <a href="#/D1">D1 · Theta pays for gamma →</a>
        </div>
        <details className="prose c4-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num c4-code">
            {`Greeks in the forward form (Black-76): Δ = e^{−rT}N(d₁), Γ = e^{−rT}N′(d₁)/(Fσ√T), Θ = −e^{−rT}F N′(d₁)σ/(2√T) + rV, vega = e^{−rT}F√T N′(d₁)
row: F = 22,603, K = 22,600, T = 11/365, r = 6.5 %, σ = 15.853 %; position −6,500 units
Monday: ΔδS + ½ΓδS² + Θδt with δS = 153.2, δt = 3 days → 51.45 against the exact re-price 49.93
break-even move with the slope hedged: √(−2Θ_day/Γ) = 187.2 ≈ σF√(1/365) = 187.6
// all tested against tests/answer-key/key_C3C4.py (PDE identity to 1e−6 at 50 random points)`}
          </pre>
        </details>
      </div>
    </article>
  );
}
