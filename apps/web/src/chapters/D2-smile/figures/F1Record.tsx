import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Segmented } from "../../../ui/controls";
import { Curve, Label, Plot, VLine, usePlot, type Pt } from "../../../ui/Plot";
import { tailCounts } from "../../../engine/smile";
import { pdf } from "../../../engine/normal";
import data from "../../../data/nifty50-long.json";
import { KEY, n0, useNarrow } from "./d2";
import "./figures.css";

/**
 * Figure 1 — the bell and the record. NIFTY 50's daily log moves since 2016 as a histogram (real), with the bell curve of the same
 * width drawn over it (model). One control: how big a day, 2σ / 3σ / 4σ. The bins beyond it light up and three readouts count them
 * against what the bell expected. The worst day, −13.9 %, falls off the ±6 % frame and is pointed at.
 */

type Z = "2" | "3" | "4";
const RETURNS: number[] = data.returns.map((p) => p.r);
const EDGES: number[] = KEY.record.hist_edges;
const LO = EDGES[0],
  HI = EDGES[EDGES.length - 1];
const WIDTH = EDGES[1] - EDGES[0];
const Y_CAP = 60; // the middle of the pile is cut off so the tails are visible; the peak is said in words
const P = 100; // the x axis is drawn in percent
const niceDate = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function histogram(): number[] {
  const counts = new Array(EDGES.length - 1).fill(0);
  for (const r of RETURNS) {
    const x = Math.max(LO + 1e-9, Math.min(HI - 1e-9, r)); // the same clip as the answer key: the far days land in the end bins
    let i = Math.floor((x - LO) / WIDTH);
    if (i >= counts.length) i = counts.length - 1;
    counts[i]++;
  }
  return counts;
}

/** The histogram as bars that can be lit per bin. */
function Bins({ counts, lit }: { counts: number[]; lit: (centre: number) => "error" | "approx" | null }) {
  const { x, y } = usePlot();
  return (
    <g>
      {counts.map((n, i) => {
        const c = (EDGES[i] + EDGES[i + 1]) / 2;
        const role = lit(c);
        const x0 = x(P * EDGES[i]) + 0.5,
          x1 = x(P * EDGES[i + 1]) - 0.5;
        const top = y(Math.min(n, Y_CAP)),
          bot = y(0);
        return <rect key={i} className={"d2-bin " + (role ?? "plain")} x={x0} y={top} width={Math.max(0.5, x1 - x0)} height={Math.max(0, bot - top)} />;
      })}
    </g>
  );
}

export function F1Record() {
  const [z, setZ] = useState<Z>("2");
  const zz = parseInt(z, 10);
  const counts = useMemo(histogram, []);
  const tails = useMemo(() => tailCounts(RETURNS, zz), [zz]);
  const { mean, sd } = tails;
  const bell = useMemo<Pt[]>(() => {
    const pts: Pt[] = [];
    for (let v = LO; v <= HI + 1e-12; v += WIDTH / 4) pts.push([P * v, (RETURNS.length * WIDTH * pdf((v - mean) / sd)) / sd]);
    return pts;
  }, [mean, sd]);
  const worst = useMemo(() => data.returns.reduce((a, b) => (b.r < a.r ? b : a)), []);
  const peak = Math.max(...counts);
  const lo = mean - zz * sd,
    hi = mean + zz * sd;
  const lit = (c: number) => (c < lo ? "error" : c > hi ? "approx" : null);
  const narrow = useNarrow();
  const yMax = Y_CAP * 1.12;
  const expected = tails.bellEach;
  const fmtExp = expected >= 10 ? n0(expected) : expected >= 1 ? expected.toFixed(1) : expected.toFixed(2);

  return (
    <Figure
      n="1"
      prompt={
        <>
          Every daily move of the index for ten years, piled up by size. Over it, the bell curve with the same width ({(100 * sd).toFixed(2)} % a day). Pick how big a day counts
          as big; the days beyond it light up.
        </>
      }
      controls={
        <>
          <Segmented<Z>
            label="how big a day"
            options={[
              { id: "2", label: "2σ" },
              { id: "3", label: "3σ" },
              { id: "4", label: "4σ" },
            ]}
            value={z}
            onChange={setZ}
          />
          <Readouts
            items={[
              [`down by ${zz}σ or more`, <span key="d" className="d2-err">{tails.down} days</span>],
              [`up by ${zz}σ or more`, <span key="u" className="d2-approx">{tails.up} days</span>],
              ["what the bell expected", `${fmtExp} each way`],
            ]}
          />
        </>
      }
      observe={
        zz === 2 ? (
          <>
            Two-sigma days — moves past ±{(100 * 2 * sd).toFixed(1)} % — are about as common as the bell says, and already lopsided: {tails.down} down against {tails.up} up. Go bigger.
          </>
        ) : zz === 3 ? (
          <>
            Past ±{(100 * 3 * sd).toFixed(1)} % the bell expected {fmtExp} days each way in ten years; the index had {tails.down} down and {tails.up} up. The real pile has fat tails, and the fat
            is mostly on the left.
          </>
        ) : (
          <>
            Past ±{(100 * 4 * sd).toFixed(1)} % the bell expects {fmtExp} of a day in ten years — once in a few centuries. The index had {tails.down} down days and {tails.up} up, and one of them,{" "}
            {niceDate(worst.d)}, fell {(100 * Math.abs(worst.r)).toFixed(1)} % — off this chart. A seller of far-below puts who priced them off the bell would have been run over{" "}
            {tails.down} times in ten years. The market charges more for them; "more" prints as a higher wobble at the low strikes.
          </>
        )
      }
    >
      <div className="d2-stage">
        <Plot xDomain={[P * LO, P * HI]} yDomain={[0, yMax]} width={narrow ? 420 : 620} height={narrow ? 260 : 320} margin={{ top: 14, right: 14, bottom: 34, left: 40 }} xLabel="one day's move, %" yLabel="days" xTicks={narrow ? 5 : 7} yTicks={4} axisX={P * LO} ariaLabel="A histogram of 2,683 daily NIFTY 50 log moves between minus and plus six percent, with a bell curve of the same standard deviation drawn over it; bins beyond the chosen number of standard deviations are highlighted">
          <Bins counts={counts} lit={lit} />
          <Curve pts={bell} role="ink" width={1.8} />
          <VLine at={P * lo} />
          <VLine at={P * hi} />
          <Label at={[P * lo, yMax * 0.7]} text={`−${zz}σ`} dx={-5} anchor="end" />
          <Label at={[P * hi, yMax * 0.7]} text={`+${zz}σ`} dx={5} />
          <Label at={[0, Y_CAP]} text={narrow ? `cut off at ${Y_CAP} · peak ${n0(peak)}` : `middle cut off here · peak ${n0(peak)} days a bin`} dy={-5} anchor="middle" />
          <Label at={[P * HI, yMax * 0.5]} text="bell curve, same width (model)" dx={-6} anchor="end" />
          <WorstArrow at={P * LO} y={Y_CAP * 0.42} text={`worst day ${(100 * worst.r).toFixed(1)} %, ${niceDate(worst.d)} → off the chart`} />
        </Plot>
        <div className="d2-legend">
          <span>
            <i className="d2-sw plain" /> NIFTY 50, {data.returns[0].d.slice(0, 4)}–{data.returns[data.returns.length - 1].d.slice(0, 4)}, {n0(RETURNS.length)} days (real)
          </span>
          <span>
            <i className="d2-sw line" /> bell curve, same width (model)
          </span>
          <span>
            <i className="d2-sw error" /> lit, down
          </span>
          <span>
            <i className="d2-sw approx" /> lit, up
          </span>
        </div>
      </div>
    </Figure>
  );
}

/** A short arrow pointing out of the left edge, with its words. */
function WorstArrow({ at, y: yAt, text }: { at: number; y: number; text: string }) {
  const { x, y } = usePlot();
  const px = x(at) + 3,
    py = y(yAt);
  return (
    <g className="d2-arrow">
      <line x1={px + 28} y1={py} x2={px + 4} y2={py} />
      <path d={`M${px + 9} ${py - 4} L${px + 3} ${py} L${px + 9} ${py + 4}`} />
      <text x={px + 32} y={py + 4} className="label error">
        {text}
      </text>
    </g>
  );
}
