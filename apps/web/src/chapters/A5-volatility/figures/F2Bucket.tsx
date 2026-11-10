import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Slider } from "../../../ui/controls";
import { Curve, Label, type Pt } from "../../../ui/Plot";
import { ewmaStep, ewmaVariance } from "../../../engine/volatility";
import { DATES, EWMA94, MARCH23, N, R, RV250, SQ, YEAR, halfLifeOfHole, n1, niceDate, toPct2, useNarrow, varPct2, volPct } from "./a5";
import { setClock, useClock } from "./clock";
import { Bucket } from "./Bucket";
import { SQ_CAP, TwoPictures, levelPts } from "./pictures";
import "./figures.css";

/**
 * Figure 2 — the metaphor machine, one dial. Beside the bottom picture, a bucket: each day a cup is poured in (the day's
 * square); a hole leaks a fixed fraction daily. The dial is the hole. The level is EWMA variance (Hull eq. 17.7 with
 * λ = 1 − hole), drawn as a ±√level band over the top picture and as a line over the squares; a ghost beside it is the
 * 250-cup average. Readouts: forgets half in N days; the level (variance); its square root (volatility).
 */

const HOLE_DEFAULT = 0.06; // RiskMetrics λ = 0.94

export function F2Bucket() {
  const i = useClock();
  const [hole, setHole] = useState(HOLE_DEFAULT);
  const lambda = 1 - hole;
  const path = useMemo(() => (hole === HOLE_DEFAULT ? EWMA94 : ewmaVariance(R, lambda)), [hole, lambda]);
  const narrow = useNarrow();
  const level = path[i + 1]; // the level after today's cup
  const before = path[i];
  const ghost = RV250[i];
  const line = useMemo<Pt[]>(() => levelPts(path, toPct2), [path]);
  const ghostLine = useMemo<Pt[]>(() => {
    const out: Pt[] = [];
    for (let k = 249; k < N; k += 2) out.push([YEAR[k], toPct2(RV250[k])]);
    return out;
  }, []);
  const band = useMemo(() => {
    const up: Pt[] = [],
      lo: Pt[] = [];
    const stride = 2;
    for (let k = 0; k < N; k += stride) {
      const s = 100 * Math.sqrt(path[k + 1]);
      up.push([YEAR[k], s]);
      lo.push([YEAR[k], -s]);
    }
    return { up, lo };
  }, [path]);
  const ghostBand = useMemo(() => {
    const up: Pt[] = [],
      lo: Pt[] = [];
    for (let k = 250; k < N; k += 2) {
      const s = 100 * Math.sqrt(RV250[k]);
      up.push([YEAR[k], s]);
      lo.push([YEAR[k], -s]);
    }
    return { up, lo };
  }, []);
  const hl = halfLifeOfHole(hole);
  const peakAt = useMemo(() => path.indexOf(Math.max(...path)) - 1, [path]);
  const check = ewmaStep(before, R[i], lambda);

  return (
    <Figure
      n="2"
      prompt={
        <>
          A bucket beside the squares. Every day the day's square is poured in as a cup; a hole in the bottom leaks a fixed <em>fraction</em> of whatever is in the bucket. One dial: the hole.
          The water level is drawn over both pictures; the faint dashed band beside it is the 250-cup average.
        </>
      }
      controls={
        <>
          <Slider label="the hole leaks, per day" value={hole} min={0.01} max={0.3} step={0.01} onChange={setHole} role="truth" fmt={(v) => (100 * v).toFixed(0) + " %"} width={170} />
          <button type="button" className="btn" onClick={() => setClock(MARCH23)}>
            go to {niceDate(DATES[MARCH23])}
          </button>
          <Readouts
            items={[
              ["forgets half in", `${n1(hl)} days`],
              [
                "level (variance)",
                <span key="l" className="a5-truth">
                  {varPct2(level)}
                </span>,
              ],
              [
                "√ level (volatility)",
                <span key="v" className="a5-truth">
                  {volPct(Math.sqrt(level))}
                </span>,
              ],
            ]}
          />
        </>
      }
      observe={
        <>
          Small hole ({"≤"} 3 %): smooth, slow, misses the storm for a week. Big hole (20 % and up): jumps on the day, drains in a fortnight. The 250-cup average barely notices —
          three storm days do not move a year's average. At 6 % (RiskMetrics, 1994) the bucket forgets half in {n1(halfLifeOfHole(HOLE_DEFAULT))} days — the half-life of A4's Figure 3, there for a
          fading correlation, here for a fading square — and peaks at {volPct(Math.sqrt(Math.max(...EWMA94)))} a day on {niceDate(DATES[EWMA94.indexOf(Math.max(...EWMA94)) - 1])}. The level is a{" "}
          <strong>variance</strong>; volatility is its square root.
        </>
      }
    >
      <div className="a5-stage">
        <div className="a5-machine">
          <TwoPictures
            top={
              <>
                <Curve pts={ghostBand.up} role="ghost" width={1.1} dash="3 3" smooth={false} />
                <Curve pts={ghostBand.lo} role="ghost" width={1.1} dash="3 3" smooth={false} />
                <Curve pts={band.up} role="truth" width={1.4} smooth={false} />
                <Curve pts={band.lo} role="truth" width={1.4} smooth={false} />
                <Label at={[YEAR[Math.round(N * 0.62)], 100 * Math.sqrt(path[Math.round(N * 0.62) + 1])]} text="± √ level" role="truth" dy={-5} />
                <Label at={[YEAR[Math.round(N * 0.8)], -100 * Math.sqrt(RV250[Math.round(N * 0.8)])]} text={narrow ? "± √ average" : "± √ 250-cup average"} role="ghost" dy={12} anchor="middle" />
              </>
            }
            bottom={
              <>
                <Curve pts={ghostLine} role="ghost" width={1.2} smooth={false} />
                <Curve pts={line} role="truth" width={1.6} smooth={false} />
                <Label at={[YEAR[peakAt], Math.min(SQ_CAP * 0.8, toPct2(path[peakAt + 1]))]} text="level" role="truth" dx={5} dy={-2} />
                <Label at={[YEAR[Math.round(N * 0.9)], toPct2(RV250[Math.round(N * 0.9)])]} text="250-cup average" role="ghost" dy={-5} anchor="end" />
              </>
            }
            bottomLabel="squares (%²) and the bucket's level"
            ariaTop="Daily moves with a blue band at plus and minus the square root of the bucket's level, and a fainter band for the trailing-year average"
            ariaBottom="The squares with the bucket's level drawn over them as a blue line and the 250-day average as a grey line"
          />
          <div className="a5-bucket-col">
            <Bucket level={toPct2(level)} cup={SQ[i]} hole={hole} ghost={Number.isFinite(ghost) ? toPct2(ghost) : undefined} label="variance" />
          </div>
        </div>
        <div className="a5-words">
          <div className="a5-words-rule">
            level today = (1 − hole) × level yesterday + hole × today's cup
          </div>
          <div className="a5-words-nums">
            {varPct2(check)} = {(lambda).toFixed(2)} × {varPct2(before)} + {hole.toFixed(2)} × {SQ[i].toFixed(2)} %² &nbsp;<span className="a5-hint">({niceDate(DATES[i])}{narrow ? "" : "; a fraction leaks, not an amount"})</span>
          </div>
        </div>
      </div>
    </Figure>
  );
}
