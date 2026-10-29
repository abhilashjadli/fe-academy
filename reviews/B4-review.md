# B4 Itô's lemma — independent review (2026-10-29)

Read: charter §2–3, the research note, the storyboard, all chapter source, both Manim scripts, the screenshots (which predate the "So what is Itô's lemma" / Figure 6 / cards / conclusion sections; those are reviewed from source). External sources opened: Wikipedia, riskhub "Why dW² = dt", quantt.co.uk, QuantInsti, MIT 18.S096 transcript, Wilmott forum (dX)² = dt thread, QuantNet dB² = dt thread, Straight Dope (Hellestal), 3Blue1Brown "Derivative formulas through geometry", osyuksel "Itô's lemma through numerical simulation", d'Annibale's Wiener simulators; Shreve §4.4 and Wilmott §4.7–4.14 via the note. (quant.SE and math.SE are blocked here.)

## 1. Coverage vs the syllabus and the note

**Present and in proportion.** Σ(ΔW)² → T (F0); "the squares never cancel" (F1); the coin on the square (clip 2a + F2); the tile race, the box table earned from the tiles, the general lemma with f_t, the full working collapsed (F3); the lemma in words; apply-it on ln S, S², √S, eˢ (F6); the GBM solution (card 1, F6 footnote); the ln S ledger landing on A1's 98.76 (F4); the bug toggle (F5); three "why it matters" cards. Spot-checked numbers (110.52, 102.02, 1.0833, toll −0.080 at σ = 40 %) are right.

**Missing.**
- *Itô integral / non-anticipating.* Absent. No "left endpoint", no "no peeking", nothing. The note's open question 5 (keep the peeking experiment here or move it to B5) was never answered in the storyboard, so it silently fell out. "Inside a sum, yes. Outside one, it's a lie" is asserted by Ada and never demonstrated.
- *The single-term randomness that makes the lemma non-obvious.* Because F2 uses a coin, every corner is exactly Δt and Σ(Δx)² = n·Δt by construction. The "corners so far" meter is a counter, and the "t = …" marker always sits on it. The surprise everyone else leads with — riskhub: "68 % of squared increments fall below Δt, the median ratio is 0.455"; Wilmott's "N squares" with sd δt√(2/N) — is reduced to one footnote: "A normal draw of the same size gives the same total give or take 0.xx". The chapter claims the fact (F0 table) but never *shows* it.
- *The curvature picture.* The storyboard's C2 beat 6 (the triangle under the slope line, sign of f″, convex adds / concave subtracts) is not built. F4's observe box *describes* it — "The slope line of ln S is straight; the curve bends down. A jittery step lands on the curve, not the line, so every step loses a sliver" — but no curve is drawn anywhere on the page. The sign of the toll, the note's declared secondary takeaway, lives only in prose and in a signed number in F6.
- *The name.* F1 panel 4 says "That number has a name" and the chapter never gives it. "Quadratic variation" and "realised variance" do not occur in the source. A fresher googling later has nothing to type.
- *The f″ = 0 case* (Vasicek/linear: no correction) — a one-line addition to F6's function picker; cheap and clarifying.

**Over-weighted.** The −½σ² story is told five times: F4 ledger, F5 toggle, F6 ln footnote, card 1, the conclusion's "one sentence to say to a desk head". Meanwhile the hedge (card 2), the thing the note calls "the first P&L explain a fresher reads", gets 70 words with no picture. The two Manim clips duplicate the two explorables that follow them (storyboard decision 4 said "none — every beat here is something the reader should press, not watch"; the build added two anyway, each a preview of the next figure).

## 2. Figure by figure

**F0 bet.** Good opener; the three options are what a fresher actually thinks, and the "sum of squared time-steps" column is the right contrast. But it is a table: "settles on one number" would be *seen* as Σ(ΔW)² against n with the √(2/n) band shrinking — osyuksel's 100-trial table as a picture. Nobody opened draws it; build it.

**F1 comic.** Panels 1–3 carry the idea without captions. Mel's line in the observe box, "his profit-and-loss is wrong every day the price moves", is the chapter's best sentence; promote it to the standfirst. Keep.

**Clip 2a + F2 square.** The best available picture of a second-order term — 3Blue1Brown's own (https://www.3blue1brown.com/lessons/derivatives-power-rule: "a tiny change squared is a negligible change") — inverted with a coin. The inversion is original; nothing opened has it. The build undersells it:
- Initial state is a blank square and two empty meters (dark-fig3.png); nothing is illustrated until "flip" is pressed.
- The bar meters rescale as totals grow (`range={Math.max(4, Math.ceil(Math.abs(strips)))}`), so "the strips wander around zero" cannot be seen. The right form is two running lines against t: a random walk and a ramp. That picture *is* "the strips are a fair game, the corners are a clock" without the caption.
- The coin makes the corners meter tautological (§1): turn the Δt dial and "the corners dial reads the same total" — by definition, flips × Δt. A reader who notices feels cheated.
- "0.1 said so" appears three times; a reader who opened B4 first (charter: any order) is told a joke about a chapter they have not read.

**Clip 3a + F3 tiles.** The race is sound and the box table arriving cell by cell from the tiles is the best move in the chapter ("A table earned, not announced"). Problems: (i) tiles have different shapes — first-order terms are bars of fixed 120 px height, the survivor is a square. Humans compare height, not area; in dark-fig4.png the amber bar (area 0.5) *looks* bigger than the blue square (area 0.5), so "halves — same as the bar" is carried by the printed numbers, not the picture. (ii) Step 1 reprises 0.1 with three tiles, step 2 has five: eight labelled objects before the race starts. (iii) "E|ΔW| = √(2Δt/π) · E(ΔW)² = Δt" in the corner and "f′ and ½f″ set to 1 so a tile's area is its increment" in the footer are exactly what the lightness amendment says to hide. (iv) The MIT transcript's one line beats the whole table: "this one survives because it's equal to dt." Say it under the picture.

**"So what is Itô's lemma?" + F6 apply.** The word formula "df = (what the chain rule says + ½ bend × wobble²) dt + slope × wobble dW" is the best single line on the page — and in apply.png it is clipped to "slope × wobble d". Fix the overflow. F6 is a good calculator with well-written per-function stories ("Bends down, so the toll is a charge"), but it is four readouts and no picture. Add the curve: f(S), its tangent, the two landings ±σS√Δt, the shaded signed gap — Shreve Fig 4.4.1 / 3b1b `SecondTermIntuition` — and the sign of the toll becomes visible. Figure 6 also appears before Figures 4 and 5, and card 1 cites "(Figures 4 and 5)" before the reader reaches them. Renumber in page order.

**F4 bug (bet + ledger).** Good bet, right control. The ledger has a hole: row 6 "So the typical year ends at mean × e^{−½σ²}", row 7 "Forget the sliver and you overstate the mean by 1 / 0.923". Why does forgetting a *median* correction move the *mean*? Missing row: "the desk's formula puts its typical year where the true mean is, so its mean sits ½σ² higher." The observe box describes a picture that is never drawn.

**F5 break-it.** Right mode, right number. Defects in dark-fig7.png: end labels collide and clip ("tru simulated 110." / "typical year 102."); the prompt says "the same coin flips each time" while the engine draws normals; 0.997 is coloured good and >1.005 bad — use |ratio − 1|. osyuksel's naive-vs-Itô on identical paths is the same idea as a table; ours has the toggle and the fan, but no SD band, so a fresher cannot tell 0.997 from 1.000.

**Cards and conclusion.** Card 2 is the best 70 words on the page. The conclusion's first clause is wrong: "its square is as big as the step itself" — (√Δt)² = Δt is as big as the *time*-step. The desk-head sentence is good.

## 3. Immersion and simplicity as a fresher

Where I would stop: F3 step 2 — five tiles labelled aΔt, bΔW, a²Δt², 2ab Δt·ΔW, b²(ΔW)², two greyed-out buttons, and the footer "a = 0.1, b = 0.3; f′ and ½f″ set to 1". The clip just showed me the race; now I am asked to re-run it with more symbols. A tired fresher closes the tab here.

The template is felt: bet → comic → clip → explorable → clip → step-through → prose + formula → apply → cards → bet + ledger → break-it → conclusion → pull card → two `details`. Twelve blocks for one idea, and the two clip/explorable pairs make the reader do the same beats twice ("Watch first (22 seconds). Then you get the coin."). The storyboard promised six figures and ~2,000 words; the build has nine figure blocks and roughly 4,900 words of reader-visible text. "Assumes: you can take a derivative and you have seen a price chart. That is all." is not true of a page that shows f_{xx}, e^{(μ−½σ²)T+σW_T}, E|ΔW| = √(2Δt/π) and a 2×2 table of differentials.

Too heavy: F3's symbol load; F2's check panel (three-row table plus footnote) right after the one-line formula; the forward-referencing card text. Too thin: the picture of curvature (none); the name of the fact (none); the hedge (prose only); the single-term randomness (one footnote).

What is genuinely light and good: F0's three options; the Ada/Mel exchanges ("Each one is nothing. There are a million of them."); the word formula; "the chain rule got a passenger"; F6's per-function stories.

## 4. Comparison table

| Resource | Its best move | Ours | Verdict |
|---|---|---|---|
| 3Blue1Brown ch. 3, nudged square (3blue1brown.com/lessons/derivatives-power-rule) | Shapes *are* the terms; "a tiny change squared is a negligible change" | Same square, coin on the side, sticker crossed out | We win on idea; tie on execution (our initial state is blank, the running totals are bar meters) |
| Wilmott §4.12 "Itô and Taylor" (book, via note) | "Taylor series *is* very similar to Itô" with dX² = dt as a rule of thumb "because it's wrong"; the N-squares paragraph | "Inside a sum, yes. Outside one, it's a lie" — asserted, not shown | We lose: the sum-vs-term point has no figure |
| Shreve Rem. 4.4.2 / Fig 4.4.1 / Rem. 4.4.7 (book, via note) | Tangent-vs-curve gap drawn; "errors accumulate … the sum of the errors does not [vanish]" | Gap described in F4 observe, never drawn | We lose |
| MIT 18.S096 transcript (ocw) | "this one survives because it's equal to dt"; e^{σB} picks up an unwanted ½σ² drift | F3 table + F6 eˢ story | Tie; their sentence is shorter than our table |
| riskhub "Why dW² = dt" | Signed-error sum → 0 vs absolute-error sum → 0.97; peeking weight leaves 0.484 | Nothing on non-anticipating | We lose |
| Wikipedia "Itô's lemma" | Jensen/convexity reading of −½σ²; AM–GM; no figures | F6 + card 1 + F4 ledger | We win (we have numbers and a toggle) |
| quantt.co.uk | "Itô's lemma is the correction"; 200,000-path sanity check; OU example with zero correction | F5; no f″ = 0 case | We win on form, lose the zero-correction example |
| QuantInsti | Arithmetic vs geometric mean from real Microsoft data | A1's 98.76 in the ledger | Tie |
| Straight Dope (Hellestal) | "Any concavity or convexity in the function is a big deal" — good runs help less than bad runs hurt | Curvature as a number in F6 | We lose on picture, win on everything else |
| QuantNet (Qui-Gon) | Partition must be disjoint and contiguous: "3 − 2 + 1 − 0 = 2 not 3" | Not mentioned | Miss (minor; one footnote) |
| osyuksel numerical | Naive vs Itô scheme on the same paths; gap = ½f″ exactly | F5 toggle (same idea, interactive, 2,000 paths) | We win on form; add a SD band to win on rigour |
| d'Annibale Wiener simulators | Sliders, MSD log-log slope ≈ 1 | F0 table | Tie — neither plots Σ(ΔW)² against n |

Net: on *form* this chapter beats everything opened; nothing else has a coin on a square, a tile race, or a break-it toggle. On *content* it misses three things the books and riskhub do well: the per-term randomness, the drawn curvature gap, and non-anticipating.

## 5. Ten changes, ranked by impact

1. **Draw the curvature.** In F6 (or a new small figure between F3 and F6): f(S), its tangent at S, the two landings S ± σS√Δt, the signed gap shaded. Switch ln S / S² / eˢ and watch the gap flip sign. This is the one picture the chapter owes and the one every book has.
2. **Replace F2's bar meters with two running lines against t** (strips = random walk, corners = ramp, dashed t-line on top). Keep the square; drop the rescaling bars. Then the Δt dial shows the walk getting finer while the ramp stays — visible, not read off.
3. **Put the per-term randomness on the page.** In F2's check panel, a "use a normal draw instead of a coin" toggle that shows individual corners of 0.03, 0.21, 0.004 … summing to 0.98 for t = 1. One sentence: "each corner is nowhere near Δt; the pile still is." That is Ada's "Inside a sum, yes" demonstrated.
4. **Cut both clips** (storyboard decision 4) or make them the figures. The current pattern — watch the thing, then press the same thing — doubles the length and is the main reason the page feels templated.
5. **Fix the three visible defects:** clipped "wobble d" in the word formula; colliding/clipped labels in F5; renumber figures in page order (6 appears before 4 and 5) and remove the forward reference in card 1.
6. **Simplify F3 to one shape and four tiles.** Drop step 1's reprise of 0.1; all tiles as bars (or all as squares) so "halves — same as the bar" is seen; delete the E|ΔW| formula and the a/b footer; put the MIT sentence under the picture.
7. **Name the fact.** After F1 panel 4 or in F0's result card: "quadratic variation (traders: realised variance)". One phrase, no definition.
8. **Add one ledger row to F4** between rows 6 and 7 explaining why forgetting the median correction inflates the mean; fix "its square is as big as the step itself" in the conclusion to "as big as the time step".
9. **Add non-anticipating in 60 words + one number** as a collapsed panel after F2's check: "count a corner only after seeing the flip … the books are off by 0.48 and never recover" (riskhub's 2φ(1)). If B5 is to own it, say so in the pull card instead.
10. **Add a linear function (f″ = 0) to F6's picker** — "toll 0: the chain rule was right all along" — and a SD band on F5's simulated mean.

## 6. Verdict

Not yet as the showcase, but close. The ideas are the best I found anywhere for this topic — a coin on 3Blue1Brown's square, tiles that race, a box table that is earned, a bug you can switch on — and the writing in the Ada/Mel exchanges and the word formula is exactly what the lightness amendment asked for. What a sharp reviewer would say first is that the chapter never draws a curve, so "half the bend" is a phrase, not a picture; that the main figure's clock is a counter because the coin makes it one; and that the page is twice the promised length because every explorable is preceded by a film of itself. Those are a week's fixes, not a redesign. Fix items 1–5 and I would show it to anyone.
