# Discussion pack — after the research sprint (2026-10-23)

_For the sponsor. Everything below is an option, not a decision, except where marked "already fixed". Read this, then the one-line decisions in §6; the detail sits in the repo files named._

## 1. What the sprint produced

| Where | What |
|---|---|
| `research/style/engagement.md` | 15 sourced principles for hooking and holding a beginner (PhET, Brilliant, Mathigon, 3Blue1Brown, Muller/Veritasium, Mayer/Sweller, BetterExplained, StatQuest); a 10-point "not rocket science" checklist with examples from our own pages; 8 hook shapes with one worked hook each |
| `research/style/modes.md` | 21 illustration modes with exemplars, build cost and fresher risk; a rubric *kind of idea → mode*; one non-slider pairing for every one of the 31 chapters |
| `research/style/fresher-critique.md` | A fresh-eyes read of 0.1, 0.2, A1, A2 as a fresher: where they would stop reading (quoted), jargon-before-definition lists, mode errors, ten changes ranked by impact |
| `research/style/manim-feasibility.md`, `clips/` | Manim works here: 13 s to render a 12 s clip, both themes from one script, LaTeX fine. Recipe, theme module, test scene committed |
| `research/style/style-guide-draft.md` | The synthesis: ten rules per page, the mode rubric, components to build, the storyboard review checklist, the v1→v2 list for built chapters |
| `research/r1/A3 … D2.md` (16 notes, ~77k words) | Per chapter: the feeling, three hooks, sources actually reopened (book pages, 3b1b scenes, 10–20 web pages each), **three illustration concepts in three different modes**, a recommendation, the maths with book-cited test numbers, open questions |

## 2. The headline findings

1. **Flatness is register first, sliders second.** The critique's ranking: formal 80–130-word captions in the third person > every figure in the same box > guesses with no reward > story and characters dropped by Figure 3 > no real artefacts > empty first frames > no faces > no humour > machine numbers. Fixing the words and the frame does more than any new widget.
2. **Three figures were in the wrong mode** for the same reason: derivations narrated as a Timeline at speech speed (A1 F2, A2 F2, 0.2 F6). Derivations need Back/Forward and a knob per step — 0.1 F2's locking sliders, which the critique calls "the best teaching device on the site".
3. **Two trust bugs** in A1 (the 98.2/96.8 vs 100/98.76 "missing 1.24"; "a stock index" that is simulated) and one in A2 (ν = 3 in the screenshot, 4 in the code). Cheap; fix in v2.
4. **The evidence base for "ask before you tell" is strong**: Muller's thousand-student studies — a clear expository video raised confidence and not scores; a voiced misconception then refuted roughly doubled the gain. Every figure should take a guess first and reward it with a result card.
5. **Every chapter from A3 to D2 now has a non-slider spine** grounded in a source: comics, games with the invariant as score, annotated real artefacts, physical metaphors (bowl, bucket, odometer), icon grids, clips. Sliders survive where a relationship is the idea — one slider, named.
6. **The books carry the artefacts we lacked.** Natenberg p. 13 is a real option chain that satisfies parity to 10¢ (C1); Natenberg Fig. 18-7 is a full 1992 Bund chain, 15 strikes, call and put prices (D2's smile builder); Natenberg Figs 6-11–6-14 are vanna and charm drawn in 1994 without the names (C5's sign map); Hull Tables 14.2–14.4 are D1's hedging ledger; Tsay's 1y/3y Treasury regression is A3's "hedge that drifted".

## 3. Style decisions (each one line to answer)

| # | Decision | My recommendation |
|---|---|---|
| S1 | Adopt the ten page rules and the storyboard checklist in `style-guide-draft.md` as the house style (replacing charter §4) | Yes |
| S2 | House rules: no two consecutive figures in the same mode; at least one non-box figure per chapter; ≤ 60-word observe boxes in the second person | Yes |
| S3 | Drawn characters with faces (Ada, Mel, the stalls; proposed Priya & Raj for B5; farmer/baker for C1; a croupier for B2; "Funnel, Echo, the Twins" for A3) — within the firm's tone? | Yes, line-drawn, restrained; faces double as legends |
| S4 | Casino imagery for B2 martingales (croupier, chips, table limit) or a coin game among friends? | Coin game with a "house" character; same maths, no casino décor |
| S5 | Manim clips allowed (both themes, ≤ 2 per chapter, always followed by a "now you" beat)? | Yes (already confirmed verbally; recorded here) |
| S6 | 3-D (Three.js) for C4's Greeks surface, or heat-map + synced slice? | Heat-map + slice first; 3-D only if the slice fails |
| S7 | Sonification (A5 returns as clicks; B1 Geiger arrivals; B3 white→brown noise) — one beat per chapter max? | Yes, optional, never load-bearing |
| S8 | Metaphor machines as chapter spines: marble-in-a-bowl (A4), leaky bucket (A5), three dials on a drunk car + odometer (B3), nudged square with tiles (B4), pinball board (C3) | Yes — each is exact, not decorative; the notes say where each breaks |
| S9 | Note length: the R1 notes run 3–5.5k words against a 3k target because §3 (sources) and §6 (numbers) are quote-heavy | Keep; they are the reference, not the chapter |

## 4. Per-chapter recommendation (the sequence each note proposes)

| Ch | A fresher must walk away feeling… | Recommended sequence (modes) | Decision needed |
|---|---|---|---|
| A3 Regression | A fitted line is half the answer; when the leftovers have a shape, every "how sure" number lies | 40-s "make R² = 0.9 from two coin piles" → comic "The three liars" → annotated real Treasury hedge that drifted → game "Fool the regression" | Real Tsay/FRED rates file or simulated? Comic tone OK? |
| A4 Time series | A series has a memory and one number says how fast it forgets | "Stationary or not?" quiz (9 panels, score) → marble-in-a-bowl with one dial (φ) → symbols one at a time; roots-on-circle demoted to appendix | Bowl as central picture? DF only or full ADF? |
| A5 Volatility | Sign unpredictable, size not | "Real or shuffled?" with r vs r² ACF → leaky bucket (EWMA/GARCH) → "Be the fitter" game (Hull yen numbers as tests) | Hull yen series or S&P data? λ dial first, then ω/β? |
| B1 RW / Markov / Poisson | Randomness can have rules you can picture | Crowd of drunks (0.2 board, √t) → spot-the-fake-weather → hand-driven chain → bus-stop comic with "place the buses" | 2-state only or 3-state simplex? Real rain data? |
| B2 Martingales | No strategy moves the average of a fair game | 4-panel comic on the doubling system → "Beat the fair game" playable with a meter that will not move + one honest "peek" cheat | Casino vs coin game (S4); keep custom bet mode? |
| B3 Brownian / GBM / QV | Zoom forever and it never straightens, yet the squared-wiggle tally is a clock | "Zoom forever" (90 s) → three dials on a drunk car (odometer settles at t) → GBM fan, OU leash with a "break Euler" dial | Comic or zoom first? State GBM closed form before B4? |
| B4 Itô | The (ΔW)² term refuses to vanish | 3b1b nudged square with a jittery side → tile step-through (dt², dt·dW die; (dW)² lives) → f = ln S gives −½σ²; break-it "omit −½σ²" | W² puzzle or simulation-bug opener? Coin or normal draws? |
| B5 Risk-neutral | The price is the odds of someone who never bets | "The bet you can't lose on" (belief dial moves nothing) → "same futures, different weights" (θ dial tilts a dot histogram; needle hits 100 at θ = 0.25) → Girsanov as text | Hull 20/22/18 or riskhub 100/125/80 defaults? Where does "delta ≠ probability" live? |
| B6 Feynman–Kac | One clock, two answers: average forward, diffuse backward | Wilmott's pub-crawl comic → two synced panels (walkers piling / grid filled backwards with curvature arrows) with a heat-rod clip | Binomial or trinomial grid? Clip OK? |
| C1 Options | A right is worth something even when you don't use it | Baker-who-wanted-to-walk-away story → annotated real chain (Natenberg p. 13, parity to 10¢) → payoff builder → conversion break-it | Futures-style chain (no discounting) first? Drawn characters? |
| C2 Binomial → BS | The price comes from a hedge, not a forecast | 30-s typed bet → hedge dial on the Galton lattice (0.25 shares) → real-probability dial moves nothing → two-row DP + American toggle → refinement clip to BS 10.4506 with the odd/even sawtooth | Hull or Wilmott numbers? Dial visible from beat 1? |
| C3 Black–Scholes | The formula is a picture: an area, a weighted pile, a discount | "Guess the price" on the lognormal pinball board → formula pieces fly out of the picture → bookmaker-who-lays-off-bets 4-panel story (PDE) → dealer sheet solved live by a σ dial | Pinball opener OK for "in detail"? Which quote sheet? |
| C4 Greeks I | Slope, bend, clock | Comic "the slope, the bend, the clock" (Hull's stop-loss failure animates) → walk on the V(S,T) surface with three instruments → one-day P&L bars Δ, Γ, Θ | 3-D vs heat-map (S6); one running example across C3/C4/D1? |
| C5 Greeks II | When vol moves, my delta and vega drift — and I can read the direction off a map | 3-round guess-then-reveal (Natenberg p. 110) → static sign-map poster with Natenberg's own 1994 curves; second-row Greeks one line each | Charm sign convention; how much of speed/zomma/color/veta |
| D1 Delta hedging | Hedging is a race against the model's clock | Market-maker story → ONE explorable: hedge the book 30 days as a ledger (Hull Table 14.2), Θ/Γ bars, bet, "run 1,000" histogram, frequency/cost knobs (Hull Table 14.4, √n inset) | Weekly (Hull) or daily steps? Short book default with "flip"? |
| D2 Smile | One σ cannot fit eleven prices | "Find the one σ" challenge (fails) → smile builder on the real 1992 Bund chain → puts land on calls → butterfly flag → surface from Hull Table 15.2 → density as three tickets (Breeden–Litzenberger) | Bund or a NIFTY snapshot you supply? Density tab here or D3? |

## 5. Data and artefacts I need from you (nothing is blocked without them, but each replaces a "simulated" label)

1. **NIFTY 50 and S&P 500 daily closes** (as long as you can get; CSV) — A1 F4, 0.2's ending, A5, B1.
2. **One real option chain snapshot** (NIFTY or SPX, any recent afternoon, with strikes, call and put bid/ask, expiry, spot) — C1, D2's second preset.
3. **One real vol surface screen** or a table of implied vols by strike × expiry — D2.
4. **A public autocallable / Phoenix term sheet (PDF)** — H2, later.
5. Nice-to-have: Tsay's weekly 1y/3y Treasury file (or I use FRED GS1/GS3), Hull's yen/dollar daily file.

## 6. Decisions I need from you, in one line each

1. S1–S9 above (a "yes to all" is a valid answer; name any exceptions).
2. For each chapter in §4, "go with the recommendation" or the alternative named in the Decision column — or "discuss" for the ones you want to talk through.
3. The order of work after this discussion. My proposal:
   - **Style sprint (3–4 days):** build the new components (ResultCard/Bet, Comic/Avatar, IconGrid, Artefact/Hotspot, Ledger, TokenFlight, Clip) and demo each in one real beat; v2 of A1 and A2 per `style-guide-draft.md` §7 (cheap fixes first); restore 0.1's Figure 0.
   - **Then A3 → D2 in syllabus order**, each as storyboard (from its note's §5, 5–8 beats per figure) → your approval → build → Antigravity review → publish.
4. Who reviews: you run Antigravity on the four built chapters with the charter §8 prompt whenever convenient; its findings merge into the v2 list.

## 7. Housekeeping found on the way

- Book page offsets (PDF = book + n): Hull +15, Wilmott +21, Shreve +16 (garbled text layer — read as images), Natenberg +13 (scanned; images only), Tsay +25.
- Misprints to keep out of tests: Hull 5e Example 14.5 gamma 0.00866 (should be 0.00857); Shreve (3.2.11) 0.1555/0.7775 (exact 0.154981/0.7749); Tsay p. 49 half-life formula and p. 119 α+β; Wilmott Table 50.2's 7-month entry; acadifi's online convergence table is arithmetically wrong.
- drwong's hedging "theory marker" ½S²Γ(σ²imp − σ²real)T overstates the exact mean P&L by ~20 % at its own defaults — our engine will mark the exact value (Wilmott's V(σreal) − V(σimp)).
- StackExchange and a few sites are blocked at this workspace's proxy; Investopedia/Khan did not surface in search. Not a problem; noted so nobody wonders.
- Hull p. 216 contains your brief verbatim: stochastic calculus "left entirely to 'rocket scientists'. This is not so." It will open B4.
