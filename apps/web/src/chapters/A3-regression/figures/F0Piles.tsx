import { useMemo, useState } from "react";
import "./figures.css";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Curve, Label, Plot, Points, fmt, type Pt } from "../../../ui/Plot";
import { Readouts } from "../../../ui/controls";
import { ols, randomWalk } from "../../../engine/regression";
import { rng } from "../../../engine/random";

const DAYS = 50;
type Pick = "under" | "about" | "over";
const n2 = fmt.n(2);

/** How often a pair of 50-day coin piles beats R² = 0.8 — measured, not asserted (2,000 pairs). */
function rateOver(threshold: number): number {
  const r = rng(808);
  let c = 0;
  const trials = 2000;
  for (let t = 0; t < trials; t++) {
    const a = randomWalk(DAYS, r);
    const b = randomWalk(DAYS, r);
    if (ols(a, b).r2 > threshold) c++;
  }
  return c / trials;
}

/** Figure 0 — game round 1: two coin piles. Bet, then flip until pure noise scores. */
export function F0Piles() {
  const [pick, setPick] = useBet<Pick>("A3-F0");
  const [seed, setSeed] = useState(0); // 0 = not flipped yet
  const [rolls, setRolls] = useState(0);
  const [best, setBest] = useState(0);

  const piles = useMemo(() => {
    if (seed === 0) return null;
    const r = rng(seed);
    const a = randomWalk(DAYS, r);
    const b = randomWalk(DAYS, r);
    return { a, b, fit: ols(a, b) };
  }, [seed]);
  const p80 = useMemo(() => rateOver(0.8), []);
  const p50 = useMemo(() => rateOver(0.5), []);

  const roll = () => {
    const s = (Date.now() % 100000) + rolls * 7919 + 1;
    const r = rng(s);
    const a = randomWalk(DAYS, r);
    const b = randomWalk(DAYS, r);
    const r2 = ols(a, b).r2;
    setSeed(s);
    setRolls(rolls + 1);
    if (r2 > best) setBest(r2);
  };

  const lineA: Pt[] = piles ? piles.a.map((v, i) => [i, v]) : [];
  const lineB: Pt[] = piles ? piles.b.map((v, i) => [i, v]) : [];
  const cloud: Pt[] = piles ? piles.a.map((v, i) => [v, piles.b[i]]) : [];
  const span = piles ? Math.max(8, ...piles.a.map(Math.abs), ...piles.b.map(Math.abs)) : 8;
  const fitLine: Pt[] = piles ? [[-span, piles.fit.intercept - piles.fit.slope * span], [span, piles.fit.intercept + piles.fit.slope * span]] : [];
  const tAbs = piles ? Math.abs(piles.fit.slope / piles.fit.se) : 0;
  const done = rolls >= 3 || best > 0.8;
  const onePer = p80 > 0 ? Math.round(1 / p80) : 0;
  const onePer50 = p50 > 0 ? Math.round(1 / p50) : 0;

  return (
    <Figure
      n="0"
      prompt={
        <>
          Two piles of coins, one flipped each day: heads adds a coin, tails takes one. The piles have never met. Fit a line through "pile B against pile A" and read
          the score, R². Bet first.
        </>
      }
      observe={
        pick && (
          <>
            Two coin piles share nothing, yet the score climbs with every re-roll and the line looks like it means something. Hold on to that feeling: the fit is
            real, the relationship is not. The rest of this chapter is about telling the two apart.
          </>
        )
      }
    >
      <Bet
        question="How high can R² go between two coin piles that have never met?"
        options={[
          { id: "under", label: "under 0.1 — it's noise" },
          { id: "about", label: "about 0.5" },
          { id: "over", label: "over 0.8" },
        ]}
        pick={pick}
        onPick={setPick}
      >
        <div className="a3-row">
          <button type="button" className="btn primary" onClick={roll}>
            {rolls === 0 ? "flip 50 days" : "new piles"}
          </button>
          <Readouts items={[["R²", piles ? n2(piles.fit.r2) : "—"], ["|t|", piles ? n2(tAbs) : "—"], ["pile-pairs so far", String(rolls)]]} />
          <span className="a3-tiles">
            <span className={"a3-tile " + (best > 0.8 ? "best" : "")}>
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
                <Curve pts={fitLine} role="error" width={2} smooth={false} />
                <Points pts={cloud} role="ink" r={3.2} opacity={0.75} />
                <Label at={[span, span]} text={`R² = ${n2(piles.fit.r2)}`} role="error" anchor="end" dx={-8} dy={16} />
              </>
            )}
          </Plot>
        </div>
        {done && (
          <ResultCard
            yours={pick === "under" ? "under 0.1" : pick === "about" ? "about 0.5" : "over 0.8"}
            answer={`best so far R² = ${n2(best)} after ${rolls} pile-pairs. Nothing caps it: over 0.5 turns up about one pair in ${onePer50}, over 0.8 one in ${onePer}`}
            verdict={pick === "over" ? "right" : pick === "about" ? "close" : "miss"}
          >
            Two piles that have never met. The fit is real; the relationship is not — and the chapter is about telling them apart.
          </ResultCard>
        )}
      </Bet>
    </Figure>
  );
}
