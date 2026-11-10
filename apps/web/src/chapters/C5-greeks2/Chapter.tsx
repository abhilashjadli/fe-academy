import "./c5.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0Rounds } from "./figures/F0Rounds";
import { F1Poster } from "./figures/F1Poster";
import { F2Grid } from "./figures/F2Grid";

export function GreeksTwoChapter() {
  return (
    <article className="chapter c5">
      <header className="chapter-head">
        <p className="chapter-id">Chapter C5 · Greeks II</p>
        <h1>All he did was change his mind</h1>
        <p className="standfirst">
          A trader sells four calls, buys the index against them, and is flat. He trades nothing, the index does not move — and by lunchtime he is
          short. All he did was change his mind about the wobble. Every strange-named Greek on this page is that one story told twice over: nudge
          one thing, and watch a number you thought was fixed drift. Only two of them are worth carrying in your head, and you will meet both
          before any symbol.
        </p>
        <p className="assumes">
          Assumes: chapter C4's three words (slope, bend, clock) and chapter C3's dial (the wobble is the one input you choose). That is all. The
          rows are the real NSE chain of 23 October: the 23,050, 22,600 and 22,250 calls at their own implied wobbles, eleven days out.
        </p>
      </header>

      <F0Rounds />

      <div className="prose">
        <p>
          Two drifts, neither of them a trade. When the wobble you feed the model changes, the slope changes — up for an out-of-the-money call,
          down for one in the money, hardly at all at the strike. When the clock moves, the slope drifts the same way a wobble <em>fall</em> would
          push it, because less time and less wobble both shrink the cloud. The first is called vanna, the second charm, and a hedge balanced this
          morning is wrong by lunchtime for both reasons. Here is every strike and every date at once.
        </p>
      </div>

      <F1Poster />

      <div className="prose">
        <p>
          Read the poster as a map, not a formula. Vanna and charm are mirror images with the same zero line down the middle; charm crowds into the
          last days while vanna's dark patches sit weeks out; volga is a wing phenomenon, white at the money with a thin sliver of the opposite sign
          hugging the ridge. The second row — gamma's own slope, wobble-sensitivity and drift — is there so you know the names exist, and Wilmott's
          footnote under it is your permission to forget them. A desk never looks at these planes; it looks at a table that has the same shape.
        </p>
      </div>

      <F2Grid />

      <div className="prose">
        <h2>So what are the higher Greeks?</h2>
        <p>
          Slopes of slopes: how the slope you hedged with drifts when the wobble moves (vanna), when the clock moves (charm), and how the
          wobble-sensitivity itself bends (volga); the rest are the same questions asked of gamma. For a single at-the-money option they are the
          residual after delta, gamma, theta and vega have been subtracted — under half a cent a day in Moontower's year of real data. They matter
          for books, for wings and for the last days before expiry, which is exactly where Raj's grid turns red.
        </p>
        <M block tex="d\Delta \;\approx\; \Gamma\,dF \;+\; \tok{approx}{\text{vanna}}\,d\sigma \;+\; \tok{truth}{\text{charm}}\,dt \;+\; \tfrac12\,\text{speed}\,dF^2" />
        <details className="c5-more">
          <summary>The glossary, the sign rules and two misconceptions — if you want them</summary>
          <p>
            Vanna = ∂Δ/∂σ = ∂vega/∂F, with sign −sign(d₂): negative in the money, positive out of it, zero where d₂ = 0 (just about the forward).
            Volga = ∂²V/∂σ² = vega · d₁d₂/σ, positive in both wings and negative in the thin band where d₁ &gt; 0 &gt; d₂. Charm = ∂Δ/∂t in calendar time
            — this page's convention, so an out-of-the-money call's charm is negative (its delta decays); some books quote ∂Δ/∂τ and flip the
            sign. Speed = ∂Γ/∂F, zomma = ∂Γ/∂σ, color = ∂Γ/∂t (positive at the money: gamma grows as expiry nears), veta = ∂vega/∂τ. Two things
            freshers are told that are wrong: "vanna is positive for calls and negative for puts" — a call and a put at one strike have the same
            vanna; the sign is about moneyness, not the type. And "volga is always positive" — not quite, near the money. Taleb's identity vega =
            σ τ F² Γ is the reason a desk that hedges gamma and vega separately is counting one risk twice. Chapter D2's sticky-delta rule adds a
            vega-times-smile-slope term to delta — vanna's market-world cousin.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          The Monday-morning risk report whose deltas differ from Friday's with nothing traded ("did you look at your charm over the weekend?");
          the spot × wobble grid every desk reads before the open; FX desks, which quote the smile itself as vanna and volga positions (chapter
          H2, one sentence); and chapter D3's Heston model, whose correlation knob is vanna turned into a parameter.
        </p>
        <p className="c5-last">A hedge is a sentence about the world. Change your mind about the world and the sentence is wrong, even if nothing happened.</p>
        <div className="c5-pull">
          <strong>Where the cents go.</strong> The cents left over after Raj's clock and bend in chapter D1 are these — and the smile in chapter D2
          is the market saying the wobble is not one number. What happens to a price when the wobble has a life of its own?{" "}
          <a href="#/D3">D3 · Three stories, one curve →</a>
        </div>
        <details className="prose c5-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num c5-code">
            {`forward form (Black-76), each strike at its chain-implied wobble: vanna = −e^{−rT} N′(d₁) d₂/σ; volga = vega·d₁d₂/σ; charm = d/dt of e^{−rT}N(d₁) (calendar time)
rounds: 4 lots × 65 units of the 23,050 call (Δ 0.237 → 0.336 at +10 vol pts; → 0.115 with 4 days left) and the 22,250 call (Δ 0.707 → 0.639)
poster: planes over strike 21,800–23,400 × days 1–60 at the row's ATM wobble; grid: short 6,500 units hedged at 0.506, repriced at ±2 % and 12 / 15.9 / 20 %
// every formula checked against a central finite difference of the price in tests/answer-key/key_C5.py`}
          </pre>
        </details>
      </div>
    </article>
  );
}
