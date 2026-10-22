# Fresher critique of the built chapters

_Written 2026-10-22 as a fresh-eyes review. Persona: an engineering graduate, three weeks into a quant firm, knows calculus and first-year probability, has never heard "lognormal", "Greek" or "copula", reading on a laptop at 9 pm because they want to understand what the desk does. Impatient. Stops at the first sentence that smells of rocket science._

_Scope note: the brief says five chapters; four exist on disk (0.1, 0.2, A1, A2). The 0.1 screenshots (`shots/f0.png`, `shots/f8.png`) show a Figure 0 ("The market moves by +14. Which guess would you trade on") and a Figure 8 (the Greeks) that are no longer in `0.1-taylor/Chapter.tsx`. I review the code and mention those two where it matters; Figure 0 was the best hook on the site._

---

## 1. Chapter by chapter

### 0.1 Taylor series

**(a) Where I stopped.** Figure 7's observe: _"The right panel measures it — on log–log axes the error of Pₙ is a straight line of slope n + 1, so halving the step divides the first-order error by 4 and the second-order error by 8."_ Log–log axes are a tool for people who already know the answer. I had been happily following "zoom in until it looks straight" and then got a research plot with three fitted slopes, a readout saying `measured slopes: P₀ 1.05 P₁ 2.04 P₂ 3.03`, and a footnote with a ξ in it. The page had earned my trust for six figures and spent it in one.

A near-miss earlier: Figure 4's readout `gap 9.29e-1` — that is what a program prints to a log, not what a person says.

**(b) Jargon before it is explained.** "quadratic" (prose after F1, before anyone says a quadratic has three numbers); `f^{(k)}(0)` notation (the recipe formula, never spelled out as "the k-th derivative"); "probe" (F4 prompt: _"Drag on the plot to move the probe"_ — what probe?); "ghost" (visible in F4 before the observe explains it); "partial sum" (F6 axis label, never defined); "radius" (F6, only half-explained); "first-order"/"second-order" (prose after F7 uses them as if known; F7's observe defines them only in passing); "log–log"; "Lagrange's form of the remainder", ξ; "Horner's rule" (code panel); and in the collapsed details: "the Greeks", "risk desk", "P&L", "Itô's lemma". Note the first four finance words on the page are hidden inside a `<details>` the reader has to open.

**(c) The moment I felt clever.** Figure 1, when I found c₂ ≈ −0.5 by hand, and then Figure 2 step 6 told me _"That ½ is not a convention; it is the 2 from differentiating x² twice."_ I had the number; the page gave me the reason. Second: Figure 3 step 6, when the table collapses to a lit diagonal — factorials explained in one picture.

**(d) Taught most / least.** Most: Figure 2. One decision per step, the slider locks when the decision is made, the equation grows one term at a time. It is the best teaching device on the site. Least: Figure 7. Two panels, one slider that only affects the left panel, three slopes to compare, a footnote; I could not tell you what I was supposed to feel. Figure 6 is close behind: two unrelated half-figures (e at x = 1; ln x about 1), a stepper for one and a slider for the other, and `S3 = 2.666667 frozen digits underlined`.

**(e) Three rewrites.**

1. Standfirst: _"Most functions are awkward to compute and easy to differentiate. A Taylor series turns a few derivatives, measured at a single point, into a polynomial that stands in for the function near that point."_ → "Your calculator cannot compute cos x. Nobody can, by hand. What it does instead is multiply and add a handful of numbers, and this page is about where those numbers come from and when the trick stops working. At the firm, the same trick is how a risk report guesses tomorrow's P&L from today's position."

2. Prose after F3: _"The k-th derivative of the polynomial, evaluated at the centre, hears only the k-th term."_ → "Differentiate the polynomial k times and set x = 0: every term except the xᵏ one has been wiped out. So knob k is the only knob that touches the k-th derivative — which is why you could set the knobs one at a time without undoing the last one."

3. Prose after F7: _"The error of the n-th polynomial shrinks like the (n + 1)-th power of the step."_ → "Keep n terms and the leftover error is about the size of the first term you threw away. Halve your step and a one-term guess gets 4× better, a two-term guess 8× better. That is the whole budget."

**(f) Where the mode is wrong.** Figure 1 and Figure 2 are the same figure twice: same plot, same three sliders, same curve. Figure 2 should be Figure 1's second act ("Now let me show you" button) rather than a second grey box. Figure 4 and Figure 5 are also near-duplicates (same plot, same function picker, same stepper; one adds a draggable centre). Figure 6's idea — "walk away from the centre, the fit follows you, until you hit the wall where ln x blows up" — is a story with a location, and it is drawn as two convergence plots with no x-axis in sight; it wants one picture of the curve, the centre, the wall, and the partial sums bouncing when you cross it. Figure 7's idea is "zoom until straight", which is a Ciechanowski-style continuous zoom; the log–log panel belongs in a details box.

**(g) Too long?** Seven figures of the same blue cos / yellow polynomial. Merge F1+F2 and F4+F5, drop the log–log half of F7: five figures, each a different kind of thing. And bring back the screenshots' Figure 0 — a market move, a line, a bend, "which guess would you trade on" — as the opening, because right now the first finance word on the page is behind a disclosure at the bottom.

### 0.2 Counting, the binomial and the normal

**(a) Where I stopped.** Figure 6, step 2: _"σ (here 1.4) is the distance from the centre to where the curve bends from 'falling faster' to 'falling slower'. The 2 is there so that σ turns out to be the standard deviation."_ An inflection point described in words, in a step-through that has no slider, after five figures where I was dropping balls and drawing dice. This is where the page stops being a game and becomes a lecture with a Forward button. Step 4 confirms it: _"the √(2π) is a famous fact, and it is where π sneaks into probability"_ — famous to whom?

Runner-up: Figure 5's observe, _"computed by convolution rather than luck."_

**(b) Jargon before it is explained.** "binomial distribution" (standfirst; the page never says "this formula is called the binomial"); readout labels `mean np` and `sd √(np(1−p))` in F4 before the observe explains them; "ghost n = 10" toggle (ghost of what?); "standardise: (sum − mean) / sd" as a toggle label before the idea is introduced; "convolution" (F5, F8, code); "density" (axis label on F5–F9, defined in F6 step 5); "95 % band" and "sd ∝ √n" (F8); "Monte Carlo" (F8); "heavy tail" as a button label in F9; "binomial tree", "price an option", "lognormal" (F10); "seeded generator" (code panel). "Pascal's triangle" and "central limit theorem" are both introduced after the reader has seen the thing, which is right.

**(c) The moment I felt clever.** Betting on bucket 6 in Figure 0 and watching it win, then being told _"almost everyone bets on the middle without being able to say why"_ — flattered and hooked. Second: Figure 5's "standardise" toggle, when my deliberately lopsided die (29 % ones) turned into the same blue curve as every other die. I built that die; I believe that result.

**(d) Taught most / least.** Most: Figure 5 (draw your own die → roll → standardise → same curve). It is the chapter's thesis, and I did it myself. Least: Figure 10. The rotation is a nice trick, the buckets turn into horizontal bars, and the payoff is a paragraph about chapters C2 and A1 that I have not read. Figure 6 (formula built symbol by symbol) is a close second: correct, careful, and inert.

**(e) Three rewrites.**

1. Prose before F7: _"Because area is what carries probability, the useful facts about the curve are areas, and three of them are worth knowing by heart."_ → "People on the desk say 'that was a three-sigma day'. Here is what they mean. Drag the two posts and read how much of the bell sits between them."

2. F6 step 2 (quoted above) → "Give it a width. σ is the knob: double σ and the hump is twice as wide. (The 2 in 2σ² is bookkeeping so that σ comes out as exactly the standard deviation you already know.)"

3. F5 observe: _"'Exact probabilities' swaps the rolled frequencies for the true distribution, computed by convolution rather than luck."_ → "'Exact' shows what the bars would be if you rolled forever — worked out by listing every combination instead of trusting 3,000 rolls."

**(f) Where the mode is wrong.** Figure 6 is a derivation presented as a slideshow; each step adds a symbol, but I cannot wiggle it. Each step should add one symbol _and_ one slider (σ, then μ) so I feel width and position instead of reading about them. Figure 9's "one wild face" mode abandons the Galton board for a histogram, which breaks the figure's own conceit — the heavy tail should be shown _on the board_: one peg in a hundred that flings the ball five buckets sideways. Figure 3 (click two coins, find all ten) is a mini-puzzle, and then a "show all ten" button spoils it; it should be a counting game that will not tell you the answer until you have found ten. Figure 10 is a flourish that belongs as the last beat of Figure 0 or of the ending text, not a figure of its own.

**(g) Too long?** Eleven figures, all boxes. Cut F10, fold F7 into the last step of F6, and merge F2+F3 (paths generated vs paths counted is the same number from two sides; a fresher needs one). Eight figures.

### A1 Normal, lognormal and fat tails

**(a) Where I stopped.** The prose before Figure 5: _"The simplest curve that captures this is the Student-t, which looks like a bell with its shoulders pushed into its tails. The number that separates the two is the kurtosis, and the practical reading of it is 'how often does a k-σ day come round'."_ Three new names in two sentences — Student-t, kurtosis, k-σ day — none of them defined, and Figure 4 had just handed me `kurtosis 12.5 (bell: 3)`, `t fitted by kurtosis: ν ≈ 4.6` and _"The kurtosis — the fourth moment, 3 for a bell"_. Fourth moment of what? I was at the limit of what I could hold.

A second, quieter stop: Figure 2 segment 5, spoken at 1× by a voice: _"So every toss costs Mel half of r squared on average: half of one percent squared, five millionths, per day. Over 250 days that is a drag of 0.0125 in the log, which puts her median year at 100 times e to the minus 0.0125 — about 98.76 — while her mean stays at exactly 100."_ Six numbers in one breath, while four equations appear on the right. I pressed Pause and did not press Play again.

**(b) Jargon before it is explained.** "fat tails" (title — fine, it is the subject); "skewed" (F0 caption 5: _"Mel's is skewed"_; "lean" is explained, "skew" is not) and the F1 readouts `skewness of balances 0.48 / of log balances 0.00`; "axis warp" (a thing I have never met, as the main slider); "z-scores" (F4 prompt; defined in 0.2, but this page says it is self-contained); "Student-t"; "ν / degrees of freedom"; "kurtosis", "fourth moment"; "log-density view"; "power tail" vs "exponential"; "the worst day of October 1987" (I was not born); "a trading desk would recognise"; "standardised sums"; "sample sd"; and in the details: geometric Brownian motion, Black–Scholes, "the smile", clustering, "regularised incomplete beta", scipy.

**(c) The moment I felt clever.** Figure 1: dragging the axis warp and watching the lean drain out of Mel's pile. _"The skew lives in the axis, not in the coin"_ is a sentence I will repeat to someone. Second: Figure 5's readouts — `under the bell: once in 62.6 years / under the t: once in 9.9 months`. That is the first number on the site that made me sit up.

**(d) Taught most / least.** Most: Figure 5, because of those readouts. Least: Figure 6. Six postage-stamp histograms, readouts `kurtosis 942.8 / 1809.1 / 337.0`, a running-sd line below, a slider for ν, and a 130-word observe. I do not know what I am looking at or what to drag. Figure 3 is a close second: μ and σ sliders on an abstract curve with "y" on the axis; nothing of Mel survives into it, although the prose promises _"Here is the curve she ends on."_

**A specific break in trust.** Figure 0 caption 5 says _"Mel's average year ends at about 98.2, but her typical year — the median — ends at about 96.8"_ (those are the sample numbers from 160 paths; the screenshot agrees). Figure 2's prompt is _"where Mel's missing 1.24 went"_, and its segment 5 says the mean _"stays at exactly 100"_ and the median is 98.76. I have just been shown 98.2 and 96.8. 1.24 is a number I have never seen. A fresher either thinks the page has a bug or thinks they have misunderstood; either way they stop trusting it. Say "160 sample years; the exact answer is 100 and 98.76" in Figure 0, or draw the exact distribution there.

**(e) Three rewrites.**

1. Prose before F5 (quoted above) → "Is there a curve that fits the edges too? The simplest one looks like the bell with some of the middle scooped out and dumped into the far ends. It is called the Student-t, and it has one knob, ν, that sets how much went to the ends. The next figure asks the only question that matters about it: how often does a really bad day come round?"

2. F2 segment 5 (quoted above) → "Each toss, win or lose, costs Mel a tiny amount: half of 1 % squared, which is 0.005 % — nothing. But she pays it 250 times, so by year end her typical balance is 98.76, not 100. Her average is still 100, because a few lucky years are very lucky. Traders call this volatility drag."

3. F4 observe: _"the bell's tails fall away as a parabola (log of e^{−z²/2} is −z²/2), while the data's tails fall away as roughly straight lines. Straight lines in a log-density plot mean the tail is a power, not an exponential"_ → "Switch to the log view and the bell becomes an upside-down U, dropping faster and faster. The real data do not: past 3σ they fall away in a straight line, which means big days never stop being possible, they just get rarer slowly. Count them: the bell promised fewer than one day beyond 4σ in thirty years; there were 42."

**(f) Where the mode is wrong.** Figure 2 is a derivation with five numbers, delivered as a narrated timeline at speech speed. Derivations need Back/Forward (0.1's Figure 2 proves the StepThrough works); a Play button is the wrong control for "wait, say that again". Figure 3 is a slider explorable of an abstract curve; it should be Figure 1's bars with the smooth lognormal laid over them, so "the curve she ends on" literally shows her. Figure 4's prompt says _"Thirty years of daily returns of a stock index"_ and the footnote says _"This series is simulated."_ For a fresher that is the one figure that promised the real world, and it is fake; until real data arrives the prompt should not say "stock index". Figure 6 should be one live experiment — an "add one more step" button and a running sd that jumps when a monster lands — not six histograms and a line.

**(g) Too long?** Seven figures but heavy: the observe boxes on F4, F5 and F6 are 90–130 words each. Fold F3 into F1 and shrink F6 to one panel.

### A2 Dependence

**(a) Where I stopped.** Figure 2 segment 3, read aloud by the voice: _"Multiply L by its own transpose and you get the covariance matrix: ones on the diagonal, rho off it. That is the whole of Cholesky's trick: any covariance matrix can be written as L times L transpose with L lower-triangular."_ "Covariance" had been a single number ("the average signed area") one figure earlier; now it is a matrix, and "lower-triangular" and "transpose" arrive in the same sentence. If I had not stopped there, Figure 3's observe would have done it: _"They are the directions in which Σ acts as a pure stretch (no shear), and together they carry all the variance: λ₁ + λ₂ equals the trace."_ The prompt above it was friendly (_"Drag the line through the cloud... Where is it largest?"_); the observe under it is a linear-algebra lecture.

**(b) Jargon before it is explained.** "shear" (title; I know it from mechanics, which half helps); "Cholesky" and "principal components" (standfirst); "ρ" as a slider label before anyone says ρ is the correlation from Figure 0; "covariance" readout in F1 before the observe defines it; toggle labels "ghost: the unsheared cloud", "covariance rectangles", "ellipse and its axes" (which ellipse?); "matrix L", "transpose", "lower-triangular", "Σ"; "innovations"; "Monte Carlo"; `uᵀΣu`, λ, "trace", "eigenvalue"/"eigenvector"; "snap to PC1 / snap to PC2" buttons before PC1 is defined; "loadings" (axis label, never defined); "market factor", "sector"; "yield curve, level, slope and curvature"; "marginal spread"; "t-copula"; "joint extremes"; and in the details: regression, efficient frontier, Jacobi rotations, chi². Also, Figure 5's screenshot says `t-copula, ν = 3` while the code says ν = 4 — the kind of mismatch a fresher notices and distrusts.

**(c) The moment I felt clever.** Figure 1 with "covariance rectangles" on: blue boxes where x and y go the same way, rose where they go opposite, and _"the covariance is the average signed area."_ I had used covariance in a course and never once known what it was. Second: Figure 6's parabola — ρ ≈ 0 and y is a function of x. Third: Figure 5's counts (7 of 33 vs 13 of 37), which turned "correlations go to one in a crisis" from a thing people say into a thing I can see.

**(d) Taught most / least.** Most: Figure 5. Two clouds, same ρ, count the corner; it answers a sentence I have actually heard on the desk. Least: Figure 4. A 6×6 matrix, a bar chart of eigenvalues, a bar chart of "loadings", one slider called "strength of the market factor", and nothing moves in a way I can read. The observe tells me what to see rather than letting me see it.

**(e) Three rewrites.**

1. F2 segment 3 (quoted above) → "Here is the trick with a name. Multiply L by its own mirror image and out pops the table of covariances. So it works in reverse: hand me any covariance table and I can find the L that makes it — then L applied to plain independent noise gives noise with exactly that table. That is Cholesky."

2. F3 observe (quoted above) → "Turn the line until the readout peaks: that is the cloud's long axis, and the spread there, 5.6 out of 7, is most of the cloud. The short axis gets the rest. Those two directions are called the principal components, and the two spreads are the eigenvalues of the covariance table. If 'eigenvalue' makes you nervous: it is the readout at the peak."

3. F4 observe: _"the first eigenvector has every loading the same sign (that is 'the market'), the second has banks against tech (the sector spread)"_ → "The first direction weights all six stocks the same way — that is 'the market went up today'. The second weights banks plus and tech minus — that is 'banks beat tech today'. Everything after that is each stock's own news."

**(f) Where the mode is wrong.** Figure 2, like A1's Figure 2, is matrix algebra at speech speed; it needs Back/Forward and one concrete point — pick a dot, show its (z₁, z₂) turning into (x, y) with the numbers. Figure 4 is the wrong artefact: a correlation matrix is a real thing that exists on the desk, and this one is synthetic ("Bank A, Tech X"); it should be six real tickers over real dates, and "let PCA read it for you" should be a step-through that highlights the all-positive matrix, then the two blocks, then reveals PC1. Figure 0 (story), Figure 1 (machine), Figure 5 (count the corner) and Figure 6 (break it) are all in the right mode.

**(g) Too long?** Seven figures; drop Figure 4 (or send it to E3) and fold Figure 2 into Figure 1 as "the same recipe, written as a matrix" — five figures.

---

## 2. Cross-cutting: why it feels flat, ranked

1. **Register.** Every caption and observe box is a polished essay: long sentences, semicolons, "the subject of Figure 3", "chapter E2". Observe boxes run 80–130 words. Nobody talks to me; the second person appears twice on four pages ("You will have found", "Try it before reading on"). The words are good — they are just not for a fresher at 9 pm. This is the biggest single cause of "flat".

2. **Every figure is the same frame.** Prompt line, plot, grey control strip, observe paragraph; blue truth, amber approximation, same grid, same type. Thirty-two figures, one shape. By the fifth box on any page my eye slides off. The Galton board and the Ada/Mel canvas are the only bodies that are not a `<Plot>`.

3. **No stakes, no reward.** Three figures ask me to commit first (0.1 F1, 0.2 F0 bet, 0.2 F8 guess) and all three reward me with one sentence of grey text. No "you were right", no reveal animation, no score, no surprise. The genuine reveals (the lean drains out; every die becomes the same curve; 62 years vs 10 months) happen without the page noticing they are reveals.

4. **Abstract axes and the story dropped.** Ada and Mel, the lemonade and umbrella stalls, the 100 dice — all good — and by the second or third figure the axes are "x", "y", "z", "k", "density" and the characters are gone. A1 Figure 3 is "the curve she ends on" with a "y" axis and no Mel.

5. **No real-world artefacts.** Not one real price chart, risk report, dated crash, or screen from the firm. The one figure that claims real data (A1 F4) is simulated. The finance payoff of every chapter is hidden in a collapsed "Where you will meet this again" at the bottom; a fresher at a quant firm came _for_ that paragraph and has to click to find it.

6. **Pages load empty.** A1 and A2 open on two blank grids with a Play button (first segment is 8–9 seconds of nothing). 0.2's Figure 5 is five empty charts until "Roll". On a phone (`m-f5.png`) that is a full screen of empty axes.

7. **No faces.** Ada, Mel and the stalls are names and colours. One line-drawn avatar each would do more than any slider.

8. **No humour.** The nearest things are "the normal cheerfully puts probability below zero" and "a friendly bus driver". Both land. There are two of them in 20,000 words.

9. **Machine numbers.** `9.29e-1`, `0.995004`, `kurtosis 1809.1`, `S3 = 2.666667`. Numbers should be in the units a person feels: "once in 63 years" is the model.

10. **Palette and boxes.** Grey-on-white, muted blue and amber, every body in a rule box: elegant, and it reads like a journal. This matters less than everything above it.

---

## 3. Ten changes, ordered by impact per effort

1. Open every chapter with the firm: one sentence and one artefact ("this is a line from Tuesday's risk report") before any maths, and restore 0.1's Figure 0 (the +14 market move, "which guess would you trade on") as the first thing on the page.
2. Rewrite every observe box to at most 60 words, second person, one idea, and push the rest into a "more" disclosure under it.
3. Convert A1 Figure 2 and A2 Figure 2 from Timeline to StepThrough — derivations need Back and Forward, not Play.
4. Make the three bets real and add two more: a result card ("You said 6. Bucket 6 won — here's why 70 % of people get this right"), a mean-vs-median bet in A1 Figure 0, and a which-corner-fills bet in A2 Figure 5.
5. Fix the A1 number continuity: Figure 0 says 98.2 and 96.8, Figure 2 says 100, 98.76 and "missing 1.24" — show the exact numbers in Figure 0 or say they are a 160-year sample.
6. Replace "thirty years of a stock index" with real, dated index data, and label the three famous days on the histogram.
7. Kill scientific notation and six-decimal readouts everywhere: "gap 0.93" not "9.29e-1", "0.995" not "0.995004".
8. Give Ada, Mel and the two stalls a tiny drawn face next to their colour, and reuse it as the legend in every figure they appear in.
9. Make at least one figure per chapter not a plot in a box — a four-panel comic for A1 Figure 2, a fill-in table for 0.2 Figure 3, a full-bleed animation for 0.1 Figure 7's zoom.
10. Merge the near-duplicate figures (0.1 F1+F2 and F4+F5; 0.2 F2+F3; A1 F1+F3; A2 F1+F2) so each chapter has at most six figures and no two feel the same.

---

## 4. Five things that are already good and must not be lost

1. **Try before you are told.** 0.1 Figure 1 ("make the yellow polynomial indistinguishable"), 0.2 Figure 0 ("click the bucket you think will fill highest"), 0.2 Figure 8 ("type a guess, then roll"). These are the three best openings on the site. Multiply them; do not polish them away.
2. **The locking sliders in 0.1 Figure 2.** One decision per step, the knob locks, the formula grows. That is the house style for every derivation, and it should replace the narrated timelines wherever the content is a derivation.
3. **Every chapter ends by breaking the model.** Sticky pegs, the wild die, the infinite-variance step, the parabola with ρ = 0, the single outlier. That is the firm's actual culture, and a fresher who learns "the bell is a first draft and a dangerous final answer" on day one has learned the right thing.
4. **Metaphors that are exact, not decorative.** The Galton board _is_ the binomial; the shear _is_ correlation; the axis warp _is_ the logarithm; the covariance rectangles _are_ covariance. None of them lie, so none of them have to be unlearned later.
5. **Numbers in human units and the honesty line.** "Under the bell: once in 62.6 years; under the t: once in 9.9 months" is how every number on the site should be presented. And keep the "Assumes:" line at the top and the "This series is simulated" footnote — a fresher can smell when a page is hiding something, and these pages are not.
