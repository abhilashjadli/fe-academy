# FE Library style guide — DRAFT for discussion (2026-10-23)

_Synthesises the sprint's four studies: `engagement.md` (how the best explainers hook beginners, 15 sourced principles), `modes.md` (21 illustration modes and a rubric), `fresher-critique.md` (a fresh-eyes read of the four built chapters) and `manim-feasibility.md`. Nothing here is locked; the sponsor decides in the discussion pack. Once agreed, this file replaces §4 "House style" of the charter and becomes the checklist every storyboard is reviewed against._

## 0. The brief, in one line

Easy to understand first, interesting second, interactive third. A fresher at 9 pm, three weeks into the firm, must not stop reading — and must not feel that the page is rocket science.

## 1. Why the built chapters feel flat (what we are fixing)

The critique ranked the causes; the first three account for most of it.

1. **Register.** Observe boxes are 80–130-word essays in the third person ("the subject of Figure 3", "chapter E2"). Nobody talks to the reader.
2. **One frame for all 32 figures.** Prompt, plot, grey control strip, paragraph. The Galton board and the Ada/Mel canvas are the only bodies that are not a plot in a box.
3. **Stakes without reward.** Three figures ask for a guess; all three answer with one grey sentence. The real reveals (the lean drains out of Mel's pile; every die becomes the same curve; "once in 62.6 years vs once in 9.9 months") happen without the page noticing.
4. **The story is dropped and the axes revert to x, y, z.** Ada and Mel vanish by Figure 3.
5. **No real artefacts.** The one figure that claims real data (A1 F4) is simulated; the finance payoff of every chapter is hidden in a collapsed `<details>`.
6. Pages load on empty grids; no faces; no humour; machine numbers (`9.29e-1`); grey boxes.

Two trust-breaking bugs to fix regardless: A1 F0 says mean 98.2 / median 96.8 (a 160-path sample) while F2 says 100 / 98.76 and "the missing 1.24"; A1 F4's prompt says "a stock index" and its footnote says "simulated". Also: the ν = 3 / ν = 4 mismatch between A2 F5's screenshot and code.

## 2. Ten rules for every page (from engagement.md, each sourced there)

1. **First 30 seconds.** Plain-words title, two-sentence standfirst stating the chapter's *question*, and a figure that is still until the reader touches it, with one imperative prompt. No definitions, no syllabus. The first frame is never empty.
2. **Ask before you tell.** No figure runs before the reader has committed to a guess (a bet, a drawn line, a slider set to their prediction). The guess is stored and shown next to the result on a **result card** — "You said 6. Bucket 6 won; 70 % of people get this right, and here is why."
3. **Let the misconception speak first.** Write the wrong belief in the reader's own voice ("surely the x² term vanishes…"), give it a control, break it in a figure. (Muller: voiced misconceptions roughly double learning versus clean exposition.)
4. **Smallest example first.** Three points, one path, one coin, one term — arithmetic visible — before the histogram or the fan. The 2,500-day series arrives only after one step has been done by hand.
5. **Formula last.** A displayed formula appears only when every symbol has already been a coloured thing on screen and the reader has computed one instance. The sentence after it says what it *reproduces*, not what it *is*.
6. **One idea per figure, feedback within a frame.** If the caption needs "also", split the figure. Every control changes something visible and named.
7. **Pre-train the nouns.** A chapter with more than two named objects opens with a labelled picture of them doing nothing — a hoverable glossary, not a paragraph.
8. **Words inside the picture.** Numbers annotated on the curve; a symbol's colour in the formula is its colour in the figure; "notice that…" sits next to the thing.
9. **Talk like a colleague.** Second person, present tense, ≤ 60 words per observe box, one idea; the rest goes under a "more" disclosure. No "it can be shown", "recall that", "trivially".
10. **End on a pull, not a recap.** Last figure: the model on real data or at real scale with its first visible failure (keep the "break it" closers — they are the firm's culture). Last paragraph: one sentence a fresher could say to a desk head tomorrow. The "where you meet this next" card is **visible**, phrased as the next problem, with one link — never a collapsed list of chapter ids.

Plus the four "not rocket science" fixes the critique and engagement study agree on: no proper noun in the first fifty words; no formula in the closing paragraph; the "Assumes" line in everyday words ending "That is all."; every back-reference carries its one-line content so a reader who skipped the other chapter loses nothing.

## 3. Choosing the mode (modes.md Part B, condensed)

| Kind of idea | First choice | Never |
|---|---|---|
| A relationship (a parameter shapes a curve) | Metaphor machine with one control, or three captioned stills | A dashboard of readouts; a derivation step-through |
| A procedure (algorithm, recursion, backward induction) | StepThrough with Back/Forward, one decision per step, controls that lock (0.1 F2 is the model) | Narrated Timeline or clip; a game |
| A derivation (why this formula) | Symbol-into-picture inside a StepThrough; each step adds one symbol *and* one knob; or a ≤ 6-panel comic with a character voicing the wrong step | Timeline at speech speed (A1 F2, A2 F2 failed here) |
| A count or probability | Icon / unit grid ("13 in every 100") | A density curve with "y" on the axis |
| A feeling for randomness | Physical simulation with a measured companion panel; speed ramp 1 → 100 → 10,000; sonification as one beat | A single path with no "run 1,000" |
| A definition (a Greek, a column of a term sheet) | Annotated real artefact — the thing itself, dated, with the term pointed at | A game; a slider |
| A warning / model failure | Break-it button inside the chapter's own metaphor, honest number kept on screen; a character who makes the mistake | A paragraph; a footnote |
| A real-world object (chain, risk report, crash) | Annotated artefact, opening the chapter | A synthetic stand-in labelled as real |
| The same thing in two forms | Representation morph as a short clip or Timeline beat | A separate figure |
| A chapter opener | Guess-then-reveal on an artefact or a physical object | Definitions; a sandbox; an empty plot with Play |

**Two house rules.** No two consecutive figures share a mode. Every chapter has at least one figure that is not a plot in a box (icon grid, comic/character, annotated artefact, or illustrated static text).

**Where each existing device belongs.** Inline-live explorable: relationships, one slider, named quantity. StepThrough: procedures and derivations. Timeline (play/scrub/voice): morphs, physical simulations with a clock, and nothing that has decisions in it. Clip (Manim, now proven feasible): continuous transformations to *watch*, 8–40 s, one idea, always followed by a "now you" beat. Canvas: physical simulations.

## 4. Components to add in the style sprint (from modes.md Part A)

`IconGrid` · `Comic` / `Avatar` / `Says` (drawn characters with a line-drawn face used as the legend wherever the character appears) · `TokenFlight` (symbol-into-picture: a formula piece flies to its part of the picture) · `Bet` + `ResultCard` (store the guess, reward the reveal) · `DrawIt` (you-draw-it prediction) · `Artefact` + `Hotspot` (annotated real screenshot/table) · `Ledger` (worked example, one row per click, live substitution) · `Clip` (video with poster, scrubber, beat-jump, captions synced to voice) · `Multiples` · `Callout` for illustrated static text · `Sonify` (one beat per chapter at most).

## 5. Voice, numbers, characters

- Voice narration reads the same words as the caption; derivations are never voice-only.
- Numbers in the units a person feels: "once in 63 years", "₹1.2 lakh on a 1,000-lot", never `9.29e-1`, never six decimals. Every chapter has at least one tile in currency or calendar time.
- Characters recur across chapters (Ada and Mel from A1; Priya and Raj proposed for B5; the stalls from A2) and get a face. The story does not drop after Figure 2: the axes keep the character's name.
- Real data, dated: an index CSV (NIFTY 50 and S&P 500 daily closes), one real option chain, one real vol surface, one public autocallable term sheet. Until a dataset is in the repo the figure says "simulated" in the prompt, not in a footnote.
- Humour is allowed where it is exact ("the normal cheerfully puts probability below zero" stays).

## 6. The review checklist (what a storyboard must pass before code)

1. Feeling sentence in plain words (§1 of the R1 note) — no symbols.
2. Opener: a guess within 30 seconds, first frame not empty, no proper noun in the first fifty words.
3. Modes listed per figure; no two consecutive the same; at least one non-box figure.
4. Every formula is preceded by its picture and one hand-computed instance.
5. Every observe ≤ 60 words, second person.
6. Every guess has a result card.
7. One real artefact or dataset named, with its source — or the word "simulated" in the prompt.
8. Break-it closer and a visible pull to the next problem.
9. Reference numbers from the books in §6 of the note, to go into the Python key.
10. ≤ 6–8 figures; near-duplicates merged.

## 7. What the built chapters need (v1 → v2), by cost

Cheap, do first: un-collapse the pull card in all four; strip formulas from closing paragraphs; rewrite A2's standfirst and Assumes line; fix A1's number continuity; kill scientific notation; ≤ 60-word observes everywhere; restore 0.1's Figure 0 bet with a result card.
Medium: A1 F2 and A2 F2 Timeline → StepThrough (or A1 F2 → four-panel Ada/Mel comic); merge duplicate figures (0.1 F1+F2, F4+F5; 0.2 F2+F3; A1 F1+F3; A2 F1+F2); faces for Ada, Mel and the stalls.
Needs data: A1 F4 with the real index and 1987/2008/2020 labelled; A2 F4 as a real six-ticker correlation matrix read by a step-through.
