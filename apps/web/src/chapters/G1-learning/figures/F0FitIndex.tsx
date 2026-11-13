import "./figures.css";
import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Readouts, Slider, Toggle } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, type Pt } from "../../../ui/Plot";
import { DotsPath, XTicks, YTicks } from "./parts";
import { FUT, FUT_DATES, LAST_CLOSE, MAX_DEGREE, SEG, SEG_DATES, dm, dmy, getPoly, n0, pts, useNarrow } from "./g1";

/**
 * Figure 0 — fit the index (real closes): the sixty NIFTY closes 10 Jul–5 Oct 2026 as dots; a polynomial of the dialled degree
 * through them (live polyFit, equals key.fig0.rows[d − 1]) and its reading twenty trading days ahead, to 3 Nov. Bet first (which
 * curve lands closest on 3 Nov?), dial the degree 1 → 15, reveal the twenty days that followed. The y-axis is fixed around the
 * closes; a curve that leaves it is clipped and its reading printed. Two controls (dial, toggle); three readouts.
 */

type Pick = "1" | "5" | "15";
const BET_DEGREES: number[] = [1, 5, 15];
const N = SEG.length;
const H = FUT.length;
const X: [number, number] = [-5.5, N + H + 18];
const Y: [number, number] = [20000, 26000];
const ordinal = (d: number) => (d === 1 ? "a straight line" : `a ${d}${d === 2 ? "nd" : d === 3 ? "rd" : "th"}-degree curve`);
const miss = (d: number) => Math.abs(getPoly(d).day20 - LAST_CLOSE);

function Fit({ degree, reveal, narrow }: { degree: number; reveal: boolean; narrow: boolean }) {
  const f = getPoly(degree);
  const fitPts: Pt[] = Array.from(f.fit, (v, i) => [i, v]);
  const extPts: Pt[] = [[N - 1, f.fit[N - 1]], ...Array.from(f.ext, (v, j) => [N + j, v] as Pt)];
  const last = f.day20;
  const above = last > Y[1];
  const below = last < Y[0];
  const lastDate = dm(FUT_DATES[H - 1]);
  return (
    <Plot xDomain={X} yDomain={Y} width={narrow ? 400 : 720} height={narrow ? 300 : 340} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={X[0]} axisY={Y[0]} ariaLabel={`the sixty NIFTY closes from ${dmy(SEG_DATES[0])} to ${dmy(SEG_DATES[N - 1])} as dots, a degree-${degree} polynomial through them and its extension twenty trading days to ${dmy(FUT_DATES[H - 1])}${reveal ? ", with the twenty real closes that followed" : ""}`}>
      <YTicks at={[21000, 22000, 23000, 24000, 25000]} fmt={n0} />
      <XTicks at={[0, 20, 40, N - 1, N + H - 1]} fmt={(v) => (v < N ? dm(SEG_DATES[v]) : dm(FUT_DATES[v - N]))} />
      <Curve pts={[[N - 0.5, Y[0]], [N - 0.5, Y[1]]]} role="ghost" width={1} dash="4 3" smooth={false} />
      <Label at={[N - 0.5, Y[1]]} text="fitted on these 60 days" role="ink" dx={-6} dy={14} anchor="end" />
      <Label at={[N - 0.5, Y[1]]} text="the 20 days after" role="ink" dx={34} dy={14} />
      <Curve pts={fitPts} role="approx" width={2.2} />
      <Curve pts={extPts} role="approx" width={2} dash="6 4" />
      <DotsPath xs={SEG.map((_, i) => i)} ys={SEG} role="ink" r={2.8} />
      {reveal && <DotsPath xs={FUT.map((_, j) => N + j)} ys={FUT} role="truth" r={3} />}
      {reveal && <Marker at={[N + H - 1, LAST_CLOSE]} role="truth" r={5} />}
      {reveal && <Label at={[N + H - 1, LAST_CLOSE]} text={`${lastDate}: ${n0(LAST_CLOSE)}`} role="truth" dx={9} dy={!above && !below && last > LAST_CLOSE ? 14 : -6} />}
      {!above && !below && <Marker at={[N + H - 1, last]} role="approx" r={5} />}
      {!above && !below && <Label at={[N + H - 1, last]} text={`curve: ${pts(last)}`} role="approx" dx={9} dy={reveal && last <= LAST_CLOSE ? 14 : -6} />}
      {(above || below) && <Label at={[X[1], above ? Y[1] : Y[0]]} text={`off the chart ${above ? "↑" : "↓"} ${pts(last)} on ${lastDate}`} role="approx" dx={-6} dy={above ? 32 : -18} anchor="end" />}
    </Plot>
  );
}

export function F0FitIndex() {
  const narrow = useNarrow();
  const [pick, setPick] = useBet<Pick>("g1-f0");
  const [degree, setDegree] = useState(1);
  const [reveal, setReveal] = useState(false);
  const f = getPoly(degree);
  const answer = BET_DEGREES.reduce((a, d) => (miss(d) < miss(a) ? d : a));
  const verdict = pick === null ? "none" : Number(pick) === answer ? "right" : "miss";
  const OPTIONS: Array<{ id: Pick; label: string }> = BET_DEGREES.map((d) => ({ id: String(d) as Pick, label: ordinal(d) }));
  const yoursLabel = OPTIONS.find((o) => o.id === pick)?.label ?? "";
  const r1 = getPoly(BET_DEGREES[0]);
  const r5 = getPoly(BET_DEGREES[1]);
  const r15 = getPoly(BET_DEGREES[2]);
  const lastDate = dm(FUT_DATES[H - 1]);
  const known = reveal || pick !== null;

  return (
    <Figure
      n="0"
      prompt={
        <>
          The real index: the {N} NIFTY closes from {dmy(SEG_DATES[0])} to {dmy(SEG_DATES[N - 1])}. Put a curve through them and read it {H} trading days ahead, to {dmy(FUT_DATES[H - 1])}. Bet first,
          then turn the dial — each notch lets the curve bend once more — and reveal what the index did.
        </>
      }
      controls={
        <>
          <Slider label="degree of the curve" value={degree} min={1} max={MAX_DEGREE} step={1} onChange={setDegree} role="approx" fmt={(v) => String(v)} />
          <Toggle label={reveal ? `hide the ${H} days that followed` : `reveal the ${H} days that followed`} on={reveal} onChange={setReveal} />
          <Readouts
            items={[
              [`miss on the ${N} fitted dots`, `${pts(f.rmseIn)} points`],
              [`miss on the ${H} unseen days`, reveal ? <span className={f.rmseOut > 2 * r1.rmseOut ? "g1-bad" : undefined}>{pts(f.rmseOut)} points</span> : <span className="g1-dim">hidden until you reveal them</span>],
              [`the curve's ${lastDate} reading`, <>{pts(f.day20)}{known ? <> · the index closed at {n0(LAST_CLOSE)}</> : null}</>],
            ]}
          />
        </>
      }
      observe={
        <>
          The miss is the root-mean-square gap in index points: on the {N} fitted dots it falls from {pts(r1.rmseIn)} (the line) through {pts(r5.rmseIn)} (degree {r5.degree}) to {pts(r15.rmseIn)} (degree{" "}
          {r15.degree}); on the {H} days the curve never saw it goes {pts(r1.rmseOut)}, {pts(r5.rmseOut)}, {pts(r15.rmseOut)}. The {lastDate} readings are {pts(r1.day20)}, {pts(r5.day20)} and{" "}
          {pts(r15.day20)} against a close of {n0(LAST_CLOSE)} (engine, equal to the key). The curve is fitted by least squares on the day number, standardised, so the fit itself is chapter
          A3's; only the number of columns changes. Nothing computed on the left half — not the miss, not how pleasingly the curve hugs the dots — distinguishes the line from the fifteenth-degree
          curve in a way that favours the line. The right half does.
        </>
      }
    >
      <div className="g1-fit">
        <Bet<Pick>
          question={
            <>
              Three curves through the same {N} dots. Which will be closest to the index on {dmy(FUT_DATES[H - 1])} — {H} trading days past the last dot?
            </>
          }
          options={OPTIONS}
          pick={pick}
          onPick={(v) => {
            setPick(v);
            if (v !== null) setDegree(Number(v));
          }}
        >
          <ResultCard
            yours={yoursLabel}
            answer={
              <>
                {ordinal(answer)} — the index closed at {n0(LAST_CLOSE)}; the line said {pts(r1.day20)}, the {r5.degree}th-degree curve {pts(r5.day20)}, the {r15.degree}th-degree curve {pts(r15.day20)}
              </>
            }
            verdict={verdict}
          >
            The fit on the dots said the opposite: the line misses them by {pts(r1.rmseIn)} points, the {r15.degree}th-degree curve by {pts(r15.rmseIn)}. Turn the dial and watch the two halves of
            the picture disagree; reveal the {H} days to see which half was telling the truth.
          </ResultCard>
        </Bet>
        <div className="g1-panel">
          <div className="g1-panel-title">
            <strong>degree {degree}</strong>{" "}
            <span>
              dots: the {N} real closes · amber: the fitted curve, dashed where it is read ahead{reveal ? " · blue: the 20 days that followed" : ""}
            </span>
          </div>
          <Fit degree={degree} reveal={reveal} narrow={narrow} />
        </div>
        <div className="g1-rule" role="status">
          <strong>degree {degree}</strong>
          <span>
            fitted miss {pts(f.rmseIn)} points · {lastDate} reading {pts(f.day20)}
            {reveal ? <> · unseen-day miss {pts(f.rmseOut)} points · the index: {n0(LAST_CLOSE)}</> : null}
          </span>
        </div>
      </div>
    </Figure>
  );
}
