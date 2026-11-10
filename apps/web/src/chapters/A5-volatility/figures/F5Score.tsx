import { useEffect, useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Slider } from "../../../ui/controls";
import { Curve, Label, Plot, type Pt } from "../../../ui/Plot";
import { acf, ewmaVariance, standardise } from "../../../engine/volatility";
import { FIT, GARCH_FIT, KEY, N, R, YEAR, halfLifeOfHole, n0, n1, scoreAgainstTrailingYear, useNarrow, varPct2, volPct } from "./a5";
import { useClock } from "./clock";
import { Hand, SQ_CAP, Spikes, TwoPictures } from "./pictures";
import "./figures.css";

/**
 * Figure 5 — score the fit, then "did it eat the weather?". One dial (the hole) with a score: under each real day a bar,
 * blue when the bucket's band fits that day better than the trailing year did, red when it is too wide or a spike pokes
 * out (Hull eq. 17.12, the per-day likelihood term, less the same term with the 250-day average as the band); the score
 * is the sum, "points above the 250-day average". Button: let the computer try all three pipes — the maximum-likelihood
 * GARCH(1,1) of the key (the engine's own garchFit) — then redraw the squares divided by its band.
 */

type Stage = 0 | 1 | 2;
const SCORE_CAP = 3;

export function F5Score() {
  const i = useClock();
  const narrow = useNarrow();
  const [hole, setHole] = useState(0.1);
  const [best, setBest] = useState<{ score: number; hole: number } | null>(null);
  const [stage, setStage] = useState<Stage>(0);
  const lambda = 1 - hole;
  const path = useMemo(() => ewmaVariance(R, lambda), [lambda]);
  const yours = useMemo(() => scoreAgainstTrailingYear(path), [path]);
  const computer = useMemo(() => scoreAgainstTrailingYear(GARCH_FIT), []);
  useEffect(() => {
    setBest((b) => (!b || yours.total > b.score ? { score: yours.total, hole } : b));
  }, [yours.total, hole]);
  // the dial's own optimum, searched over every setting the dial can take
  const gridBest = useMemo(() => {
    let bh = 0.01,
      bs = -Infinity;
    for (let h = 0.01; h <= 0.3 + 1e-9; h += 0.01) {
      const t = scoreAgainstTrailingYear(ewmaVariance(R, 1 - h)).total;
      if (t > bs) {
        bs = t;
        bh = h;
      }
    }
    return { hole: bh, score: bs };
  }, []);
  const stdSq = useMemo(() => standardise(R, GARCH_FIT).map((z) => z * z), []);
  const rhoBefore = acf(R.map((r) => r * r), 1)[0];
  const rhoAfter = acf(stdSq, 1)[0];
  const band = (p: number[], stride = 2) => {
    const up: Pt[] = [],
      lo: Pt[] = [];
    for (let k = 0; k < N; k += stride) {
      const s = 100 * Math.sqrt(p[k + 1]);
      up.push([YEAR[k], s]);
      lo.push([YEAR[k], -s]);
    }
    return { up, lo };
  };
  const yourBand = useMemo(() => band(path), [path]);
  const compBand = useMemo(() => band(GARCH_FIT), []);
  const pos = useMemo(() => yours.perDay.map((d) => (d > 0 ? d : NaN)), [yours]);
  const neg = useMemo(() => yours.perDay.map((d) => (d < 0 ? d : NaN)), [yours]);
  const fmtScore = (s: number) => (s >= 0 ? "+" : "−") + n0(Math.abs(s));

  return (
    <Figure
      n="5"
      prompt={
        <>
          Score the bucket. Under each real day a bar: blue when the band fits that day better than the 250-day average did, red when the band was too wide for a quiet day or a spike poked out of it. The
          score is the sum, in points above the 250-day average. Find the best hole, then let the computer try all three pipes.
        </>
      }
      controls={
        <>
          <Slider label="the hole leaks, per day" value={hole} min={0.01} max={0.3} step={0.01} onChange={setHole} role="truth" fmt={(v) => (100 * v).toFixed(0) + " %"} width={170} />
          <button type="button" className="btn" onClick={() => setStage((s) => (s === 0 ? 1 : s === 1 ? 2 : 1))}>
            {stage === 0 ? "let the computer try all three pipes" : stage === 1 ? "did it eat the weather?" : "back to the squares"}
          </button>
          <Readouts
            items={[
              ["your score", <span key="y" className="a5-truth">{fmtScore(yours.total)}</span>],
              ["your best", best ? `${fmtScore(best.score)} at ${(100 * best.hole).toFixed(0)} %` : "—"],
              ["the computer's", stage > 0 ? <span key="c" className="a5-approx">{fmtScore(computer.total)}</span> : "?"],
            ]}
          />
        </>
      }
      observe={
        stage === 0 ? (
          <>
            Every bucket beats the year's average by hundreds of points; the best hole on this dial is <strong>{(100 * gridBest.hole).toFixed(0)} %</strong> ({fmtScore(gridBest.score)}; the
            RiskMetrics 6 % is close), forgetting half in {n1(halfLifeOfHole(gridBest.hole))} days. Too small a hole and the band misses the storms (red spikes poke out); too big and it jumps around on quiet days (red for being too wide). The balance{" "}
            <em>is</em> the fit.
          </>
        ) : stage === 1 ? (
          <>
            The computer tuned all three pipes at once by the same score over the whole ten years: drip {varPct2(FIT.omega, 3)} a day, cup share {FIT.alpha.toFixed(3)}, keep {FIT.beta.toFixed(3)} —
            home {volPct(Math.sqrt(KEY.VL))} a day, half-life {n1(KEY.half_life)} days. Its score, <strong>{fmtScore(computer.total)}</strong>, beats the best single hole ({fmtScore(gridBest.score)}) by{" "}
            {n0(computer.total - gridBest.score)} points: the home is worth that much. It is called GARCH(1,1), and it was fitted by maximising exactly
            this sum (Hull calls it the likelihood).
          </>
        ) : (
          <>
            The bottom picture is now each square divided by the computer's band — "how big was today, in units of how big the bucket said it could be". The clumps are gone: it looks like
            Figure 0's shuffled strip. The lag-one correlation of the squares was <strong>{rhoBefore.toFixed(3)}</strong>; of the squares ÷ band it is <strong>{rhoAfter.toFixed(3)}</strong>. The model has eaten the weather. That — not "was tomorrow's square close to the band" — is the only test that
            matters.
          </>
        )
      }
    >
      <div className="a5-stage">
        <TwoPictures
          top={
            <>
              {stage > 0 && (
                <>
                  <Curve pts={compBand.up} role="approx" width={1.4} smooth={false} />
                  <Curve pts={compBand.lo} role="approx" width={1.4} smooth={false} />
                </>
              )}
              <Curve pts={yourBand.up} role="truth" width={1.3} smooth={false} />
              <Curve pts={yourBand.lo} role="truth" width={1.3} smooth={false} />
              <Label at={[YEAR[Math.round(N * 0.62)], 100 * Math.sqrt(path[Math.round(N * 0.62) + 1])]} text="your bucket's band" role="truth" dy={-5} />
              {stage > 0 && <Label at={[YEAR[Math.round(N * 0.62)], -100 * Math.sqrt(GARCH_FIT[Math.round(N * 0.62) + 1])]} text={narrow ? "the computer's" : "the computer's three pipes"} role="approx" dy={13} />}
            </>
          }
          bottomSeries={stage === 2 ? stdSq : undefined}
          bottomRole={stage === 2 ? "ink" : "approx"}
          bottomCap={stage === 2 ? 12 : SQ_CAP}
          bottomLabel={stage === 2 ? (narrow ? "squares ÷ the computer's band" : "squares ÷ the computer's band (1 = a one-band day)") : "the day's move, squared (%²)"}
          ariaTop={stage > 0 ? "Daily moves with the reader's bucket band in blue and the computer's fitted GARCH band in amber" : "Daily moves with the reader's bucket band in blue"}
          ariaBottom={stage === 2 ? "Each day's square divided by the fitted model's variance: an even strip with no clumps" : "The squares"}
          extra={(W, margin, xDomain) => (
            <Plot xDomain={xDomain} yDomain={[-SCORE_CAP * 1.3, SCORE_CAP * 1.3]} width={W} height={narrow ? 100 : 110} margin={{ ...margin, bottom: 6 }} xTicks={0} yTicks={3} grid={false} axisY={0} ariaLabel="Under each day a bar: up and blue when the bucket's band scores better than the trailing year on that day, down and red when worse">
              <Spikes ys={pos} role="truth" from={250} clampHi={SCORE_CAP} />
              <Spikes ys={neg} role="error" from={250} clampLo={-SCORE_CAP} />
              <Hand i={i} />
              <Label at={[xDomain[0], SCORE_CAP * 1.3]} text={narrow ? "score per day (first year: no average yet)" : "points above the 250-day average, per day (first year: no average yet)"} dx={4} dy={10} />
            </Plot>
          )}
        />

      </div>
    </Figure>
  );
}
