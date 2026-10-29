import { useMemo, useState } from "react";
import "./figures.css";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Curve, Label, Plot, Points, fmt, type Pt } from "../../../ui/Plot";
import { Readouts } from "../../../ui/controls";
import { ols, randomWalk } from "../../../engine/regression";
import { rng } from "../../../engine/random";

const DAYS = 50;
const TRIALS = 400;
type Pick = "no" | "rare" | "often";
const n2 = fmt.n(2);

/** The textbook test: |t| = |slope / SE| > 2 says "related". */
const passes = (slope: number, se: number) => Math.abs(slope / se) > 2;

/** How often two 50-day coin piles that never met pass the textbook test — measured over 400 pairs, not asserted. */
function passRate(): number {
  const r = rng(50);
  let c = 0;
  for (let t = 0; t < TRIALS; t++) {
    const a = randomWalk(DAYS, r);
    const b = randomWalk(DAYS, r);
    const f = ols(a, b);
    if (passes(f.slope, f.se)) c++;
  }
  return c / TRIALS;
}

/** Which option a measured rate belongs to: "no" (≤ 2 %), "1 in 20" (≤ 15 %), "more often than not" (> 50 %); in between, nobody is right. */
function bandOf(p: number): Pick | null {
  if (p <= 0.02) return "no";
  if (p <= 0.15) return "rare";
  if (p > 0.5) return "often";
  return null;
}
const ORDER: Pick[] = ["no", "rare", "often"];
const LABEL: Record<Pick, string> = { no: "no — they're unrelated", rare: "yes, about 1 time in 20", often: "yes, more often than not" };

/** Figure 0 — game round 1: two coin piles that never met. Bet on the textbook test, then flip and count. */
export function F0Piles() {
  const [pick, setPick] = useBet<Pick>("A3-F0");
  const [seed, setSeed] = useState(0); // 0 = not flipped yet
  const [rolls, setRolls] = useState(0);
  const [passed, setPassed] = useState(0);
  const [best, setBest] = useState(0);

  const piles = useMemo(() => {
    if (seed === 0) return null;
    const r = rng(seed);
    const a = randomWalk(DAYS, r);
    const b = randomWalk(DAYS, r);
    return { a, b, fit: ols(a, b) };
  }, [seed]);
  const rate = useMemo(passRate, []);
  const band = bandOf(rate);

  const roll = () => {
    const s = (Date.now() % 100000) + rolls * 7919 + 1;
    const r = rng(s);
    const a = randomWalk(DAYS, r);
    const b = randomWalk(DAYS, r);
    const f = ols(a, b);
    setSeed(s);
    setRolls(rolls + 1);
    if (passes(f.slope, f.se)) setPassed(passed + 1);
    if (f.r2 > best) setBest(f.r2);
  };

  const lineA: Pt[] = piles ? piles.a.map((v, i) => [i, v]) : [];
  const lineB: Pt[] = piles ? piles.b.map((v, i) => [i, v]) : [];
  const cloud: Pt[] = piles ? piles.a.map((v, i) => [v, piles.b[i]]) : [];
  const span = piles ? Math.max(8, ...piles.a.map(Math.abs), ...piles.b.map(Math.abs)) : 8;
  const fitLine: Pt[] = piles ? [[-span, piles.fit.intercept - piles.fit.slope * span], [span, piles.fit.intercept + piles.fit.slope * span]] : [];
  const tAbs = piles ? Math.abs(piles.fit.slope / piles.fit.se) : 0;
  const pass = piles ? passes(piles.fit.slope, piles.fit.se) : false;
  const done = rolls >= 3;
  const pct = Math.round(rate * 100);
  // verdict: right only when the pick is the band the measured rate falls in; close when one step away; miss otherwise
  const verdict: "right" | "close" | "miss" = !pick || !band ? "miss" : pick === band ? "right" : Math.abs(ORDER.indexOf(pick) - ORDER.indexOf(band)) === 1 ? "close" : "miss";

  return (
    <Figure
      n="0"
      prompt={
        <>
          Two piles of coins, one flipped each day: heads adds a coin, tails takes one. The piles have never met. Fit a line through "pile B against pile A"
          and ask the textbook test — is |t| above 2? Bet first.
        </>
      }
      observe={
        pick && (
          <>
            Two coin piles share nothing, yet the textbook test calls them related in {pct} pairs out of 100. Hold on to that feeling: the fit is real, the
            relationship is not. The rest of this chapter is about telling the two apart.
          </>
        )
      }
    >
      <Bet
        question="Two piles of coins that have never met. Will the textbook test say they are related?"
        options={ORDER.map((id) => ({ id, label: LABEL[id] }))}
        pick={pick}
        onPick={setPick}
      >
        <div className="a3-row">
          <button type="button" className="btn primary" onClick={roll}>
            {rolls === 0 ? "flip 50 days" : "new piles"}
          </button>
          <Readouts
            items={[
              ["|t|", piles ? <span className={pass ? "tok-error" : undefined}>{`${n2(tAbs)} — ${pass ? "related" : "not related"}`}</span> : "—"],
              ["passed the test", rolls ? `${passed} of ${rolls} pairs` : "—"],
            ]}
          />
          <span className="a3-tiles">
            <span className="a3-tile">
              <span className="k">best R² so far</span>
              <span className="v">{rolls ? n2(best) : "—"}</span>
            </span>
          </span>
        </div>
        <div className="two">
          <Plot xDomain={[0, DAYS]} yDomain={[-span, span]} width={440} height={300} xLabel="day" yLabel="coins in the pile" xTicks={5} yTicks={5} ariaLabel="Two running heads-counts over fifty days">
            {piles ? (
              <>
                <Curve pts={lineA} role="truth" width={2} smooth={false} />
                <Curve pts={lineB} role="approx" width={2} smooth={false} />
                <Label at={[DAYS - 1, piles.a[DAYS]]} text="pile A" role="truth" anchor="end" dx={-4} />
                <Label at={[DAYS - 1, piles.b[DAYS]]} text="pile B" role="approx" anchor="end" dx={-4} />
              </>
            ) : (
              <Label at={[DAYS / 2, 0]} text="press “flip 50 days”" anchor="middle" dy={4} role="ghost" />
            )}
          </Plot>
          <Plot xDomain={[-span, span]} yDomain={[-span, span]} width={440} height={300} xLabel="pile A" yLabel="pile B" xTicks={5} yTicks={5} ariaLabel="Pile B against pile A with the fitted line">
            {piles && (
              <>
                <Curve pts={fitLine} role={pass ? "error" : "ghost"} width={2} smooth={false} />
                <Points pts={cloud} role="ink" r={3.2} opacity={0.75} />
                <Label at={[span, span]} text={`R² = ${n2(piles.fit.r2)}, |t| = ${n2(tAbs)}`} role={pass ? "error" : "ghost"} anchor="end" dx={-8} dy={16} />
              </>
            )}
          </Plot>
        </div>
        {done && (
          <ResultCard
            yours={pick ? LABEL[pick] : "—"}
            answer={`yes, ${pct} times in 100 — measured over ${TRIALS} fresh pairs of 50-day piles; ${passed} of your ${rolls} passed`}
            verdict={verdict}
          >
            Two piles that have never met, and the textbook test says "related" more often than not. The fit is real; the relationship is not — and the chapter
            is about telling them apart.
          </ResultCard>
        )}
      </Bet>
    </Figure>
  );
}
