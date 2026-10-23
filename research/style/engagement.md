# How the best explainers hook and hold beginners — rules for our pages

_Written 2026-10-22 for the R1 sprint. Sponsor's brief: "the content should be such that it elicits great interest in continuing the studies, do not make it look like rocket science, make it interesting." Audience: an engineer in their first weeks at a quant firm — calculus and basic probability intact, no finance. This note sits beside `research/illustration-catalogue.md` Part A (which fixes chapter anatomy and interaction rules) and does not repeat it; it answers a different question: what makes a fresher *want* the next screen. Every claim below names the source it came from; Part D lists only pages actually opened._

---

## Part A — Fifteen principles for our pages

Each principle: the rule, where it comes from, one concrete application to one of our chapters.

### 1. The first 30 seconds: something moves because *you* moved it, and a question forms

PhET's interview studies of ~89 students found that a sim "should start up with very little or no animation", because students who had not triggered the motion themselves hesitated to experiment; a brief, still "wiggle-me" cue on the one grabbable object was enough to start exploration ([PhET Part II](https://phet.colorado.edu/publications/archive/PhET%20Interview%20Paper%20Part%20II.htm)). Their later "implicit scaffolding" paper puts it in one line: "The state of the sim when first opened is carefully designed … Implicit scaffolding guides without students feeling guided" ([Podolefsky, Moore & Perkins](https://arxiv.org/pdf/1306.6544)). Mathigon's chaos course opens with a pendulum and the instruction "Watch the pendulum swinging, and try to predict what it'll do next!" — a prediction before a single term is defined. Red Blob Games adds the web reality: "web users might hit back button at any point", so open journalism-style, not textbook-style ([Red Blob, EDUC 432 notes](https://redblobgames.com/x/2306-educ432)).

**Rule for us.** Above the fold: a title in plain words, a two-sentence standfirst, and a figure that is still until the reader touches it, with one imperative sentence of prompt. No definition, no syllabus, no "in this chapter we will".

**Applied — the Greeks (C4).** Open on a single curve: option value against the stock price, with a draggable stock-price marker and a shaded "your position" tile showing P&L in rupees. Prompt: "Drag the price up ₹10. Now down ₹10. Why is the loss bigger than the gain?" The reader has felt gamma before the word exists.

### 2. Ask before you tell — every reveal is preceded by a commitment

Brilliant's own description of its lessons: "Brilliant often asks a question before presenting a procedure", learners "answer carefully sequenced questions before a rule is simply handed to them", and the first attempt "gives the explanation a purpose" ([Brilliant, how we teach math](https://brilliant.org/resources/choosing-brilliant/how-brilliant-teaches-math/)). Mathigon gates text on participation: "students have to actively participate at every step before the next one is revealed" ([Mathigon, About](https://mathigon.org/about)). The reason it matters is Muller's finding: students who watched a clear, correct expository physics video rated it "clear", "concise" and "easy to understand", reported high confidence — and scored no better than before (about 6/26 pre and post). They "didn't have to pay much attention", because the video "bolstered the confidence that the students had in their initial, albeit incorrect, theories" ([Muller, summarised in THE Journal](https://thejournal.com/articles/2015/05/05/watching-videos-does-not-necessarily-lead-to-learning.aspx)).

**Rule for us.** No figure runs before the reader has guessed its outcome: a slider set to their guess, a bet, a sketch, a multiple choice. The prediction is stored and shown beside the result.

**Applied — VaR (E1).** Before the histogram of 500 daily P&Ls appears: "Pick the loss you are 99% sure tomorrow will not exceed." A single draggable line on an empty axis. Then the 500 days drop in and the count of days beyond the reader's line is printed. Most freshers pick too tight; the surprise is the chapter.

### 3. Let the misconception speak first, then break it in a figure

Muller's thesis work (over a thousand students, three years): treatments that voiced the common wrong idea — a scripted student–tutor *Dialogue*, or a *Refutation* narrated by one speaker — produced gains "between half and one full standard deviation greater than the Exposition treatment", on average twice the gain, and students "invest more mental effort in watching misconception-based treatments" ([Muller, Sharma & Reimann, IISME](https://openjournals.library.sydney.edu.au/IISME/article/view/6345/6984)). PhET found the same mechanism in sims: "User control of every perceived potentially significant parameter is valuable" — even parameters with no real effect, "since students can test their misconceptions" ([PhET Part I](https://phet.colorado.edu/publications/archive/PhET%20interview%20Paper%20Part%20I.htm)).

**Rule for us.** Write the wrong belief in the reader's own voice ("surely…"), give it a control, and let the figure refute it. This is the "break it" beat of catalogue rule 15, moved to the *front* of a section where the misconception is the natural first thought.

**Applied — Itô's lemma (B4).** "Surely the x² term vanishes for tiny steps — it did in Taylor." Give the reader a Δt slider on a Brownian path and a running total of (ΔW)² next to a running total of (Δt)². The second goes to zero; the first stubbornly goes to T. The lemma is the name for what they just watched refuse to vanish.

### 4. The smallest example that still shows the point, and nothing bigger until it has

StatQuest's method, in Starmer's words: "the simplest example — the 'Hello World' of whatever it is", "I just plug numbers in and I do the math by hand", and for neural networks a dataset of "three points" with one input and one output so that "two different curves were getting added together" is visible ([Starmer on SuperDataScience](https://www.superdatascience.com/podcast/the-statistics-and-machine-learning-quest-of-dr-josh-starmer); [Posit hangout](https://opensource.posit.co/resources/videos/2026-01-19_teaching-out-loud-and-becoming-statquest-josh-starmer-data-science-hangout/)). Cognitive-load theory gives the reason: material with high *element interactivity* overloads working memory, and the remedy is to "first present isolated elements … then gradually work up to the tasks in their full complexity" ([LITFL, cognitive load theory](https://litfl.com/cognitive-load-theory/)); Kalyuga and Sweller even endorse "a simplified, partly inaccurate model that builds a foundation before the full system" ([expertise reversal summary](https://csed.substack.com/p/the-expertise-reversal-effect-2003)).

**Rule for us.** Three data points, one path, one coin, one term — worked to the end with the arithmetic visible — before the histogram, the fan of paths, the series.

**Applied — GARCH (A5).** Five days of returns, in a table: −2%, +0.5%, +3%, −2.5%, +0.2%. Compute tomorrow's variance by hand with ω, α, β shown as three coloured weights on three visible numbers (long-run, yesterday's squared return, yesterday's variance). Only after the reader has done one step does the 2,500-day series appear.

### 5. Analogy → diagram → example → plain English → technical. The formula is the last arrival and names something already done

Kalid Azad's ADEPT order, with his reason: "Most new concepts are variations, extensions, or combinations of what we already know"; the analogy is "a raft to get across the river, and leave behind once you've crossed"; and "Math is the sheet music we've agreed upon to share ideas" — you write the sheet music after you can hum the tune ([BetterExplained, ADEPT](https://betterexplained.com/articles/adept-method/)). His Fourier article opens with the two formulas and the one-word paragraph "Yikes." before "Rather than jumping into the symbols, let's experience the key idea firsthand"; his e article dismisses "the base of the natural logarithm" as "like a dictionary that defines labyrinthine with Byzantine: it's correct but not helpful". Grant Sanderson, on Fourier: "You can get to the substance before you get to the intimidating formalism", and when the formalism arrives "it has a way of articulating an idea that's already in your mind" ([TEDx transcript](https://singjupost.com/what-makes-people-engage-with-math-grant-sanderson-transcript/)). Brilliant: symbols arrive "once the idea already makes sense".

**Rule for us.** A displayed formula may appear only when every symbol in it has already been a coloured thing on screen and the reader has computed at least one instance by hand or by figure. The sentence after the formula says what it *reproduces*, not what it *is*.

**Applied — Black–Scholes (C3).** The reader prices a one-step, then two-step, then 50-step tree by button; the price stops changing in the third decimal. Then: "That number you have been converging on has a closed form." The formula appears with S, K, σ√T, e^{−rT} in the colours of the tree's labels, and the only commentary is "N(d₂) is the fraction of your paths that ended above K — hover to check."

### 6. One idea per screen, one decision per idea, feedback within a second

Brilliant: each section "focuses on a manageable idea" and "begins with the simplest useful case"; feedback arrives "while the learner's reasoning is still active", "giving them a chance to revise rather than simply marking the attempt wrong". Mayer's *segmenting* principle — people learn better from a lesson "in pieces rather than one continuous unit" — is the one Khan Academy cites for its 6–9-minute chunks ([Khan Academy blog](https://blog.khanacademy.org/how-khan-academy-videos-are-made-to-help-you-learn/); [Mayer's principles](https://ugc.futurelearn.com/uploads/files/7d/d6/7dd6188d-c343-4311-b064-ac98d2c95abc/Multimedia_Principles._R._E._Mayer__2020.pdf)).

**Rule for us.** A figure answers one question. If the caption needs "also", split the figure. Every control changes something visible within a frame, and the thing it changes is named in the readout.

**Applied — correlation (A2).** Figure 1 should ask exactly one thing: "How much of the first coin should the second borrow to make the cloud this steep?" One slider (ρ), one readout (the tilt), nothing about Cholesky, eigenvectors or tails until the next figure.

### 7. Pre-train the nouns: show the three or four things the chapter is about before the mechanism between them

Mayer's *pre-training* principle: learners do better when they "know names and characteristics of the main concepts" before the lesson. In cognitive-load terms this is lowering element interactivity by making the elements familiar first. PhET: "Unfamiliar objects: If students don't know what is depicted, they hesitate to manipulate it" ([PhET Part I](https://phet.colorado.edu/publications/archive/PhET%20interview%20Paper%20Part%20I.htm)).

**Rule for us.** The first figure of a chapter with more than two named objects is a labelled picture of those objects doing nothing — a glossary you can hover, not read.

**Applied — the Greeks (C4).** Before any Greek: a value curve with three hover-labels — *height* (what the option is worth), *slope* (how much it moves when the stock moves), *bend* (how the slope itself changes) — and one clock icon (*what a day costs*). Delta, gamma, theta are then the Greek names for words already on the page, and chapter 0.1 is one hover away.

### 8. Cut what does not carry the idea — decorations, extra controls, "advanced" options

PhET's standard: "If a feature is fun, it must also create learning" and "Every feature adds to a student's cognitive load and so needs to have educational purpose"; a pulsing brain in one sim was explored eagerly and "no further understanding of the concepts was garnered". More than "about three groups of three similar items discourages users from starting" ([PhET Part I](https://phet.colorado.edu/publications/archive/PhET%20interview%20Paper%20Part%20I.htm), [Part II](https://phet.colorado.edu/publications/archive/PhET%20Interview%20Paper%20Part%20II.htm)). Mayer's *coherence* principle says the same for words and pictures: "extraneous material is excluded rather than included". Nicky Case: "Don't try to explain *everything* with something interactive" ([Case, explorable explanations post](https://blog.ncase.me/explorable-explanations)).

**Rule for us.** Every figure gets a one-line "what this must make visible"; any control, label, line or animation that does not serve that line is removed or moved to a final sandbox. Easing, particle effects and ambient motion are out unless the motion *is* the content.

**Applied — the normal distribution (0.2).** The Galton board opener shows pegs, balls and buckets — not the binomial coefficients, not a fitted curve, not a speed dial. Those arrive one per later figure.

### 9. Words inside the picture, not beside it

Sweller's split-attention effect: when a diagram and its explanation are separated "learners spend effort searching and matching them"; for novices the fix is text integrated into the diagram, and the advantage reverses only for experts ([expertise reversal summary](https://csed.substack.com/p/the-expertise-reversal-effect-2003)). Mayer's *spatial contiguity* ("near rather than far") and *signaling* (cues that show where to look) say the same. PhET: "Labels should be attached directly to controls. Labels not tied to a control were often missed", and students "read very little, typically one to three words". Red Blob names the failure: "readers must read the text to learn what a color means, then find it in the diagram."

**Rule for us.** Numbers are annotated on the curve, not in a legend; a symbol's colour in a formula is its colour in the figure (catalogue rule 4); captions are one sentence; "notice that…" sits next to the thing to notice.

**Applied — Taylor (0.1).** The ½ in 1 − x²/2 is labelled *on the curve* where the quadratic peels away from the cosine, with a brace reading "the bend: f″(0) = −1, halved" — rather than explained in the paragraph below.

### 10. Talk like a colleague, to "you"

Mayer's *personalization* principle: conversational wording beats formal wording; Khan Academy's reason is that "learners feel they have a partner rather than someone judging them". Kalid: "Academic writing is a bomb shelter, built to be defended from critics" and "Lessons barricaded with prefaces and caveats indicate you are protecting yourself, not trying to be helpful" ([BetterExplained, math empathy](https://betterexplained.com/articles/math-empathy/)). Starmer on dense notation: "I glaze over when I see that stuff".

**Rule for us.** Second person, present tense, short sentences, no "it can be shown that", no "trivially", no "recall that" (if they needed to recall it, show it). Caveats go in a footnote or the "break it" figure, never in the opening.

**Applied — GARCH (A5).** Not "Conditional heteroskedasticity is modelled via a recursive variance specification" but "Yesterday was wild, so you expect today to be wild too. GARCH is that sentence with three numbers in it."

### 11. The reader should feel like the discoverer; the page confirms rather than announces

Sanderson, on judging SoME: "I think it's easiest to remember a piece of math if you feel like you invented it yourself" ([SoME4 post](https://3blue1brown.substack.com/p/some4-prizes)); at Stanford: "When we put the visuals first, then start to articulate the meaning, you can get a sense of ownership over it" and "I want people to see that whatever your background is, you are not different from the top student" ([Stanford Daily](https://www.stanforddaily.com/2020/01/24/3blue1brown-creator-grant-sanderson-15-talks-engaging-with-math-using-stories-and-visuals)). Brilliant's principle 8: "A great education should encourage failure" ([Brilliant principles](https://brilliant.org/principles/)). Mathigon always offers an exit — "Are you stuck? Skip to the next step or reveal all steps" — so being stuck never becomes being trapped. Mayer's *generative activity* principle (learners guided through generating the content learn more deeply) is the lab version.

**Rule for us.** Wherever possible the figure lets the reader *find* the number (the ½, the 0.68, the ρ) and the next paragraph begins "You will have found…" (0.1 already does this well). A wrong guess is answered with the reason, never with "incorrect". Every gated step has a "show me".

**Applied — Black–Scholes (C3).** The hedging game: the reader holds a short call and chooses how many shares to hold at each of ten steps; the P&L is shown. After three rounds the page observes that their best choice tracked a particular curve — and names it delta. They derived N(d₁) with their hands before seeing it.

### 12. Story and stakes, not usefulness, carry a fresher through the hard middle

Sanderson's TEDx argument: usefulness makes maths "like going to the gym" — accepted for the payoff — whereas story "appeals to emotion": "comedy, characters you care about", "a mystery you need to see resolved"; the aim is to make the maths draw you in "for what it is now, not what it promises to give you later". His block-collision video opens like "a crime scene": only the problem, no context, and the digits of π appear. Mathigon's rule: "introduce every new topic with an interesting narrative" ([Mathigon, About](https://mathigon.org/about)); its probability course opens with Pascal and Fermat's interrupted game, and the formula is introduced as what the mathematicians "discovered". Kalid: "If an idea was debated for centuries before being accepted, shouldn't that be taught?"

**Rule for us.** Every chapter has one narrative spine — a question whose answer is withheld until the last figure — and the standfirst states the question, not the topic. Part C gives eight shapes.

**Applied — VaR (E1).** Spine: "How wrong can a confident number be?" The reader sets a 99% loss limit in Figure 0, and the chapter does not reveal how many of the 500 days actually breached it until after they have built the three estimators; the historical disaster hook (Part C) supplies the stakes.

### 13. Fun only where it teaches; a game must have the invariant as its score

PhET: "Features can be so much fun to play with that students are distracted from learning" — the dog-spamming game was "a fun, but unproductive, game" until limited to one dog, which "kept the teaching point". Nicky Case: "Gamification is about changing *behaviour*. We're about changing *knowledge*." This is the charter's "game-like mechanics inside a chapter only where they teach", made operational.

**Rule for us.** A game is allowed when its score *is* the quantity the chapter teaches (hedging P&L, breach count, convergence error). No points, badges or timers otherwise.

**Applied — correlation (A2).** A "build the cloud" game is legitimate if the score is the distance between the reader's ρ and the target; it is decoration if it counts clicks.

### 14. Credibility: real numbers, real units, and extremes that behave

PhET: "For engaged exploration to occur, students must believe the simulation", and "Extreme behavior should respond in a physically meaningful way. Users test limits and are disappointed when nothing happens." Students told a sim might be buggy "were much more likely to attribute what they did not understand to programming bugs". Bret Victor's version: an explorable's "facts, assumptions, and calculations are all visible and editable", so the reader can rebut by modifying the model rather than "blindly trust, or blindly don't" ([Victor, Explorable Explanations](http://worrydream.com/ExplorableExplanations/)).

**Rule for us.** Sliders run to the ends a fresher will try (σ → 0, T → 0, ρ → ±1, ν → 2) and the figure does the right thing there, with a one-line note. Figures use a real index level, a real currency, a real date range (catalogue rule 8's scale figure). "How this number was formed" is one click away (catalogue rule 6).

**Applied — Black–Scholes (C3).** At σ → 0 the price collapses onto max(S − Ke^{−rT}, 0) with a visible caption "no uncertainty: worth exactly its forward intrinsic value"; at T → 0 onto the hockey stick. A fresher who pushes the slider to the end and sees the kink appear trusts everything else on the page.

### 15. End on a pull, not a recap: scale, one sentence, and the next crack

Red Blob: a page needs "a conclusion that uses what the explorer has learned". Victor's ladder: "stepping down is as important as stepping up" — end concrete. Sanderson's "mystery you need to see resolved" works at the end as well as the start: the last figure should show where the chapter's model *breaks*, which is the first figure of another chapter. The catalogue already fixes the mechanics (three one-line lessons, code panel, reading list, scale figure); this adds the emotional shape.

**Rule for us.** Last figure: the chapter's model on real data or at real scale, with the first visible failure. Last paragraph: one sentence a fresher could say to a desk head tomorrow. Then the pull, *visible*, not folded away: "The next thing that goes wrong is …" with one link.

**Applied — normal distribution (0.2).** After the 68–95–99.7 rule: ten years of index returns on the bell, with the 5σ days coloured and a counter "the bell expected 0.0 of these; there were 11". One line: "The bell is what adding does; the next chapter is what multiplying does, and after that, what those 11 days do."

---

## Part B — "Not rocket science": ten things that intimidate a fresher, and the fix

Examples marked ▶ are from our built chapters (`apps/web/src/chapters/*/Chapter.tsx`).

1. **A proper noun in the first fifty words.** Names before pictures signal "you are expected to know this". ▶ A2's standfirst: "names the shear that makes them (Cholesky), finds their own axes (principal components)" — two capitalised terms before the reader has seen a cloud. **Fix:** the standfirst uses only everyday words; names appear in the figure where the thing is first seen ("this recipe has a name"). Compare A1's standfirst, which is all verbs and nouns a fresher owns ("leans, cannot go below zero, and quietly taxes every wobble").

2. **Formulas in the summary.** Ending on symbols makes the last impression "it was maths after all". ▶ 0.2's closing paragraph carries both the binomial pmf and the normal density inline; A2's carries Σ = LLᵀ and L⁻¹. **Fix:** the ending paragraph is words only; the formulas sit in a small "the two formulas" card to the side, already seen earlier in colour.

3. **The pull to the next chapter hidden behind a disclosure.** ▶ All four built chapters fold "Where you will meet this again" into a collapsed `<details>`. The one paragraph written to make a fresher want to continue is the one they must click to see. **Fix:** keep the code panel collapsed; make the pull a visible two-line card with one link, phrased as the next problem, not as a list of chapter ids ("E3 turns uᵀΣu into…" assumes they know what uᵀΣu is).

4. **Insider shorthand in the "Assumes" line.** ▶ "eigenvalues (mechanically)" (A2) is copied from the charter and means nothing to the reader. **Fix:** "Assumes you can multiply a matrix by a vector and have met eigenvalues at least once. That is all." — 0.1's "That is all." is the model: it tells the fresher the list is short and complete.

5. **Dense notation before the operation has been done by hand.** Sweller's worked-example effect: novices learn more from a solved instance than from a general statement. ▶ 0.1 does this right: three knobs, then the derivation, then the formula. **Fix (for later chapters):** the first appearance of any Σ, ∫, ∂ or subscript is a worked instance with the numbers in, next to a figure; the general form comes one figure later.

6. **Too many controls on the first figure.** PhET: more than ~3×3 controls stops users from starting. **Fix:** first figure one control, the sandbox last (catalogue rule 10). Audit each chapter's F0/F1 for this.

7. **Cross-references that presume linear reading.** Chapters are standalone by charter. ▶ A1: "Chapter 0.2 said that a sum of many small independent steps makes a bell" is fine because it is followed by "and it does" and a figure; "The same logarithm, expanded as in chapter 0.1" is not — a reader who skipped 0.1 is now told they missed something. **Fix:** every back-reference carries its one-line content ("expand ln(1+r) ≈ r − r²/2, as any Taylor expansion does") and the link is a courtesy, not a prerequisite.

8. **Jargon that arrives with no plain reading beside it.** ▶ A1 handles "kurtosis" correctly: "the practical reading of it is 'how often does a k-σ day come round'". ▶ The code panels mention "regularised incomplete beta" and "Jacobi rotations" — acceptable because collapsed and labelled "what computes it". **Fix (rule):** a technical term may stand alone only if its plain reading was given within the previous two sentences.

9. **Scale missing: numbers without money, time or size.** A density with no units, a ρ with no portfolio, a σ with no index level reads as abstract. ▶ A1 gives "once in 7,000 years" vs "once in a few years" — the best single sentence in the built set. **Fix:** every chapter has at least one tile in currency or calendar time, and the ending restates the lesson in those units.

10. **No exit when stuck.** A gated or multi-step figure with no "show me" turns a stuck reader into a leaving reader (Mathigon's "Are you stuck? Skip to the next step or reveal all steps"). ▶ Step-through figures (0.1 F2, A1 F2) have Forward; check each also has "jump to end". **Fix:** every step-through and every predict-then-run has a one-click reveal, phrased without judgement.

---

## Part C — Eight hook shapes, one worked hook each

Each hook is for a chapter not yet built, and is written to be the first 150 words plus the first figure's prompt.

**1. The bet — D1 delta hedging.** "You have just sold a call option on an index at 20,000. You are not allowed to buy it back. Here is the index for the next 30 days, one day per click. Before each click, choose how many index units to hold. At the end you keep whatever is left. First question, before the first click: if the index ends exactly at 20,000, do you make or lose money?" Most freshers say "neither". The P&L tile at the end says otherwise, and the gap between their answer and the tile is gamma-versus-theta.

**2. The paradox — A5 volatility and GARCH.** "Here are ten years of daily returns. Yesterday's return tells you nothing useful about today's — try it: the correlation is 0.01. Now square them. Yesterday's squared return tells you a great deal about today's: the correlation is 0.2 and it stays positive for months. The *sign* is unpredictable; the *size* is not. A model that uses only this fact runs most risk desks in the world." Figure 0: one toggle, "returns / squared returns", the autocorrelation bars switching from nothing to a decaying staircase.

**3. The everyday object — B1 Poisson process.** "Rain on a windscreen. Each drop lands where it likes, with no memory of the last. Count the drops in one square per second." Figure 0: a dotted square filling with drops; a counter; a button "another second". The histogram of counts builds a shape nobody designed, and the one number that fixes it — the rate — is the only input. Jumps in prices, defaults, order arrivals are drops on a windscreen.

**4. The two characters — B5 risk-neutral measure.** "Priya thinks the stock will almost certainly go up. Raj, the bookmaker, does not care what Priya thinks. He sets the odds so that whatever happens he cannot lose, and he has a row of other customers to help him do it. The price Raj quotes is not Priya's probability. It is the probability of someone who is never wrong because he never bets — and it is the only price anyone can trade at." Figure 0: Priya's p slider and Raj's quote, which does not move when her slider does.

**5. "You already do this" — A4 random walk vs mean reversion.** "Your guess for tomorrow's temperature is today's, nudged a little toward the season's average. Your guess for tomorrow's share price is today's, full stop. You already run both models in your head; this chapter is about telling, from a chart, which one you are looking at — and why it is so easy to be wrong." Figure 0: two unlabelled series; the reader clicks "which one has a season to return to?" and is told, with the test that would have answered it.

**6. The historical disaster — E1 VaR and expected shortfall.** "In August 2007 the chief financial officer of Goldman Sachs said the bank was seeing 25-standard-deviation moves, several days in a row. Under the bell curve, one such day is expected roughly once in 10¹³⁵ years — a number with more digits than the universe has had years. He was not reporting a miracle. He was reporting that the number his risk desk was using was the wrong number. This chapter is about that number, how it is built three ways, and how you would have known it was wrong." *(Verify the exact wording of the Viniar quotation in the E1 research note before use.)* Figure 0: a bell with a 25σ marker far off the right of the screen; a scroll-right affordance that never reaches it.

**7. The magic trick — C2 binomial model.** "Pick any probability you like that the stock goes up next period — 10%, 50%, 90%. I will tell you the option's price without looking at your choice." Figure 0: a p slider, a one-step tree, and the price tile frozen while p slides. The reveal, three figures later, is that the price came from a hedge, not a forecast; the risk-neutral probability is the one number that makes the trick work, and it is not the reader's p.

**8. The challenge — D2 implied volatility and the smile.** "Here are eleven option prices from one afternoon, same stock, same expiry, strikes from 80 to 120. Find the single volatility that reproduces all eleven. There is a slider. Take your time." Figure 0: the σ slider, eleven model prices against eleven market prices, a total error that never reaches zero. The reader discovers the smile by failing to flatten it; the chapter then plots the eleven σs that fit one price each.

---

## Part D — Sources actually opened

Primary pages, read in full or to the stated limit:

- BetterExplained — ADEPT method: https://betterexplained.com/articles/adept-method/ ; Fourier: https://betterexplained.com/articles/an-interactive-guide-to-the-fourier-transform/ ; e: https://betterexplained.com/articles/an-intuitive-guide-to-exponential-functions-e/ ; Bayes: https://betterexplained.com/articles/an-intuitive-and-short-explanation-of-bayes-theorem/ ; Empathy-driven mathematics: https://betterexplained.com/articles/math-empathy/
- Brilliant — principles: https://brilliant.org/principles/ ; how Brilliant teaches math: https://brilliant.org/resources/choosing-brilliant/how-brilliant-teaches-math/ ; vs Khan Academy: https://brilliant.org/help/why-brilliant/brilliant-vs-khan-academy/ ; about: https://brilliant.org/about/ (marketing copy; no published lesson-design document was found — lesson pages themselves are behind login)
- Mathigon — about: https://mathigon.org/about ; Probability course intro: https://mathigon.org/course/probability/introduction ; Chaos course intro: https://mathigon.org/course/chaos/introduction ; "The Textbook of the Future" link https://static.mathigon.org/whitepaper.pdf resolved to the promotional page, which contains the "actively participate … before more content is revealed" statement but no research citations
- PhET — A Study of Educational Simulations Part I (engagement and learning): https://phet.colorado.edu/publications/archive/PhET%20interview%20Paper%20Part%20I.htm ; Part II (interface design): https://phet.colorado.edu/publications/archive/PhET%20Interview%20Paper%20Part%20II.htm ; Look and Feel: https://phet.colorado.edu/publications/PhET%20Look%20and%20Feel.pdf ; Podolefsky, Moore & Perkins, Implicit scaffolding in interactive simulations: https://arxiv.org/pdf/1306.6544
- 3Blue1Brown — Grant Sanderson, "What makes people engage with math" (TEDx transcript): https://singjupost.com/what-makes-people-engage-with-math-grant-sanderson-transcript/ ; Stanford Daily report of the 2020 talk: https://www.stanforddaily.com/2020/01/24/3blue1brown-creator-grant-sanderson-15-talks-engaging-with-math-using-stories-and-visuals ; SoME4 prizes post (judging by "novelty, clarity, and memorability"; "invented it yourself"): https://3blue1brown.substack.com/p/some4-prizes ; SoME1 results: https://www.3blue1brown.com/blog/some1-results ; "Math's pedagogical curse" and "Ego and math" pages are video-only, no transcript: https://www.3blue1brown.com/lessons/pedagogical-curse
- Veritasium / Derek Muller — Muller, Sharma & Reimann, "Tackling misconceptions in introductory physics using multimedia presentations" (IISME): https://openjournals.library.sydney.edu.au/IISME/article/view/6345/6984 ; THE Journal summary of the Khan-Academy-style expository video result: https://thejournal.com/articles/2015/05/05/watching-videos-does-not-necessarily-lead-to-learning.aspx
- Kurzgesagt — "How to make a Kurzgesagt video in 1200 hours" transcript: https://www.lingq.com/en/learn-english-online/courses/689474/how-to-make-a-kurzgesagt-video-in-120-4887128/ (research-first, draft "rewritten and edited over and over again", experts fact-check; **no "hook → stakes → turn" structure is documented by them anywhere I could find — treat that phrase as third-party folklore, not a Kurzgesagt source**)
- Explorable explanations — Bret Victor, Explorable Explanations: http://worrydream.com/ExplorableExplanations/ ; Up and Down the Ladder of Abstraction: http://worrydream.com/LadderOfAbstraction/ ; Nicky Case, explorable-explanations workshop post: https://blog.ncase.me/explorable-explanations ; the plan: https://blog.ncase.me/explorable-explanations-the-plan ; hub: https://explorabl.es/ ; Amit Patel (Red Blob Games), EDUC 432 notes: https://redblobgames.com/x/2306-educ432
- StatQuest — Starmer on SuperDataScience 553: https://www.superdatascience.com/podcast/the-statistics-and-machine-learning-quest-of-dr-josh-starmer ; Posit Data Science Hangout 2026-01-19: https://opensource.posit.co/resources/videos/2026-01-19_teaching-out-loud-and-becoming-statquest-josh-starmer-data-science-hangout/ ; BU event page (abstract only): https://www.bu.edu/csmet/?p=26203
- Khan Academy — How Khan Academy videos are made to help you learn: https://blog.khanacademy.org/how-khan-academy-videos-are-made-to-help-you-learn/
- Cognitive load and multimedia — Mayer, Multimedia Principles (2020 summary, 15 principles): https://ugc.futurelearn.com/uploads/files/7d/d6/7dd6188d-c343-4311-b064-ac98d2c95abc/Multimedia_Principles._R._E._Mayer__2020.pdf ; Kalyuga & Sweller expertise reversal summary: https://csed.substack.com/p/the-expertise-reversal-effect-2003 ; LITFL cognitive load theory (intrinsic/extraneous/germane, element interactivity, simple-to-complex): https://litfl.com/cognitive-load-theory/

Not found / not usable: a Brilliant design blog on lesson structure (none public); Crash Course's method (no primary statement located; omitted rather than guessed); a primary Kurzgesagt structure essay (see above).

The five Mayer/Sweller principles that matter most for our pages, in order: **coherence** (cut), **pre-training** (nouns first), **segmenting** (one idea per figure, reader-paced), **spatial contiguity / split attention** (words in the picture), and the **worked-example effect with expertise reversal** (solved instance first; fade the scaffolding by the last figure, because the sandbox is for the reader who has become the expert).
