import "./figures.css";
import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Segmented } from "../../../ui/controls";
import { Bars, Curve, Label, Marker, Plot, Points, usePlot, type Pt } from "../../../ui/Plot";
import { KUPIEC_CRIT_95 } from "../../../engine/var";
import { FENCE_NAMES, KEY, WINDOW, count, f1, f2, fmtDate, fmtDay, getBacktest, lakh, useNarrow, type FenceId } from "./e1";

/**
 * Figure 1 — did the line hold? The 2,183 test days (the record after the first 500) as a loss series, and the 99 % fence of each
 * day computed from the 500 days before it. Crossings lit red. One segmented control picks the fence: the days themselves
 * (historical), a bell of the 500-day width, or a bell of EWMA-0.94 width. A fixed inset: Feb–Apr 2020. Readouts: crossings,
 * expected, Basel zone. The counter card carries Kupiec's verdict.
 */

const Y: [number, number] = [-9, 15];
const YI: [number, number] = [-10.5, 15];
const SEG: Array<{ id: FenceId; label: string; short: string }> = [
  { id: "historical", label: "the days themselves", short: "the days" },
  { id: "normal", label: "a bell, 500-day width", short: "bell, 500 d" },
  { id: "ewma", label: "a bell, EWMA 0.94", short: "bell, EWMA" },
];

function YearTicks({ dates }: { dates: string[] }) {
  const { x, y: yv, inner } = usePlot();
  const years = ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"];
  return (
    <g>
      {years.map((yr) => {
        const i = dates.findIndex((d) => d >= yr + "-01-01");
        if (i < 0) return null;
        return (
          <g key={yr}>
            <text className="label e1-ticklabel" x={x(i) + 3} y={inner.top + inner.height - 4}>
              {yr}
            </text>
          </g>
        );
      })}
      {[-5, 0, 5, 10].map((v) => (
        <text key={v} className="label e1-ticklabel" x={inner.left + 3} y={yv(v) - 3}>
          {v === 0 ? "0" : `${v > 0 ? "" : "−"}${Math.abs(v)} lakh`}
        </text>
      ))}
    </g>
  );
}

export function F1Fence() {
  const narrow = useNarrow();
  const [id, setId] = useState<FenceId>("historical");
  const bt = useMemo(() => getBacktest(), []);
  const T = bt.dates.length;
  const fence = bt.fences[id];
  const res = bt[id];
  const pass = res.kupiecLR < KUPIEC_CRIT_95;
  const per250 = (res.exceptions * 250) / T;

  const dots = useMemo<Pt[]>(() => Array.from(bt.loss, (l, i) => [i, l / 1e5]), [bt]);
  const fenceLine = useMemo<Pt[]>(() => Array.from(fence, (v, i) => [i, v / 1e5]), [fence]);
  const hits = useMemo<Pt[]>(() => res.at.map((i) => [i, bt.loss[i] / 1e5]), [res, bt]);

  // the fixed inset: 1 Feb 2020 → 30 Apr 2020
  const inset = useMemo(() => {
    const a = bt.dates.findIndex((d) => d >= "2020-02-01");
    const b = bt.dates.findIndex((d) => d > "2020-04-30") - 1;
    const i20 = bt.dates.indexOf("2020-03-20");
    const i23 = bt.dates.indexOf("2020-03-23");
    const hitsIn = res.at.filter((i) => i >= a && i <= b);
    return { a, b, i20, i23, hitsIn, fence20: fence[i20], loss23: bt.loss[i23], fence23: fence[i23] };
  }, [bt, fence, res]);
  const marchHits = res.at.filter((i) => bt.dates[i].startsWith("2020-03")).length;
  const zoneWord = res.zone === "green" ? "green" : res.zone === "yellow" ? "yellow" : "red";

  return (
    <Figure
      n="1"
      prompt={
        <>
          Did the line hold? Each dot is one day's loss on the same ₹1 crore; the line is that day's 99 % VaR, drawn from the {WINDOW} days before it and nothing after. A dot above the
          line is a crossing. Switch how the line is drawn and count.
        </>
      }
      controls={
        <>
          <Segmented<FenceId> label={narrow ? "the line" : "how the line is drawn"} options={SEG.map((s) => ({ id: s.id, label: narrow ? s.short : s.label }))} value={id} onChange={setId} />
          <Readouts
            items={[
              ["crossings", `${res.exceptions} in ${count(T)}`],
              ["expected", f1(res.expected)],
              ["Basel zone", <span className={`e1-zone e1-zone-${res.zone}`}>{zoneWord}</span>],
            ]}
          />
        </>
      }
      observe={
        <>
          The Basel traffic light counts crossings per 250 trading days: {KEY.backtest.basel.green[0]}–{KEY.backtest.basel.green[1]} green, {KEY.backtest.basel.yellow[0]}–{KEY.backtest.basel.yellow[1]} yellow,{" "}
          {KEY.backtest.basel.red}+ red. This line: {res.exceptions} in {count(T)} days is {f1(per250)} per 250 — {zoneWord}. Kupiec's count test asks whether {res.exceptions} is what a right model
          gives on most runs of {count(T)} days: LR {f2(res.kupiecLR)} against {f2(KUPIEC_CRIT_95)} — the days themselves pass ({KEY.backtest.historical.exceptions} crossings, LR{" "}
          {f2(KEY.backtest.historical.kupiec_lr)}); both bells fail ({KEY.backtest.normal.exceptions} and {KEY.backtest.ewma.exceptions}). Passing on average is not the same as passing in a
          bunch: in March 2020 the historical fence was crossed {KEY.backtest.march2020.exceptions_in_month} times against an expected {KEY.backtest.march2020.expected_in_month}, and on 23 Mar the
          loss was {f1(KEY.backtest.march2020.ratio)} times the line (fence {lakh(KEY.backtest.march2020.fence_on_20mar)} on 20 Mar, loss {lakh(KEY.backtest.march2020.loss_23mar)}).
        </>
      }
    >
      <div className="e1-fence">
        <div className={`e1-counter ${pass ? "pass" : "fail"}`}>
          <strong>{res.exceptions} crossings</strong> in {count(T)} days · expected {f1(res.expected)} · {pass ? "passes" : "fails"} (Kupiec {f2(res.kupiecLR)} {pass ? "<" : ">"} {f2(KUPIEC_CRIT_95)})
          <span className="e1-quiet"> · {FENCE_NAMES[id]}</span>
        </div>
        <Plot
          xDomain={[0, T - 1]}
          yDomain={Y}
          width={narrow ? 400 : 800}
          height={narrow ? 260 : 320}
          margin={{ top: 10, right: 10, bottom: 8, left: 8 }}
          xTicks={0}
          yTicks={0}
          grid={false}
          axisX={0}
          axisY={0}
          ariaLabel={`daily losses of ₹1 crore long NIFTY over ${count(T)} test days with the ${FENCE_NAMES[id]} 99 % fence; ${res.exceptions} crossings lit red`}
        >
          <YearTicks dates={bt.dates} />
          <InsetBand a={inset.a} b={inset.b} />
          <Points pts={dots} role="ghost" r={narrow ? 1.2 : 1.6} opacity={0.45} />
          <Curve pts={fenceLine} role={id === "historical" ? "truth" : "approx"} width={1.6} smooth={false} />
          <Points pts={hits} role="error" r={narrow ? 3 : 3.6} opacity={1} />
          <Label at={[T - 1, Y[1]]} text={narrow ? "loss, ₹ lakh" : "each day's loss, ₹ lakh (gains below the axis)"} role="ghost" dx={-2} dy={12} anchor="end" />
          <Label at={[narrow ? inset.b : inset.a, Y[1]]} text={narrow ? "↓ Feb–Apr 2020" : "Feb–Apr 2020 ↓"} role="ghost" dx={narrow ? 4 : -2} dy={12} anchor={narrow ? "start" : "end"} />
        </Plot>
        <div className="e1-inset-row">
          <div className="e1-inset">
            <div className="e1-panel-title">
              <strong>Feb–Apr 2020</strong> <span>the same line, {inset.hitsIn.length} crossings in three months; {marchHits} in March</span>
            </div>
            <Plot
              xDomain={[inset.a - 0.5, inset.b + 0.5]}
              yDomain={YI}
              width={narrow ? 400 : 520}
              height={narrow ? 220 : 240}
              margin={{ top: 10, right: 10, bottom: 20, left: 8 }}
              xTicks={0}
              yTicks={0}
              grid={false}
              axisX={inset.a - 0.5}
              axisY={0}
              ariaLabel="Feb to Apr 2020: daily losses as bars with the fence; 23 Mar 2020 lost 3.5 times the line"
            >
              <InsetTicks a={inset.a} b={inset.b} dates={bt.dates} />
              <Bars bars={Array.from({ length: inset.b - inset.a + 1 }, (_, j) => ({ x: inset.a + j, y: bt.loss[inset.a + j] / 1e5, w: 0.8 }))} role="ghost" opacity={0.55} gap={0} />
              <Bars bars={inset.hitsIn.map((i) => ({ x: i, y: bt.loss[i] / 1e5, w: 0.8 }))} role="error" opacity={0.95} gap={0} />
              <Curve pts={fenceLine.slice(inset.a, inset.b + 1)} role={id === "historical" ? "truth" : "approx"} width={1.8} smooth={false} />
              <Marker at={[inset.i20, inset.fence20 / 1e5]} role={id === "historical" ? "truth" : "approx"} r={4} />
              <Label at={[inset.a, YI[1]]} text={`● fence on ${fmtDay(bt.dates[inset.i20])}: ${lakh(inset.fence20)}`} role={id === "historical" ? "truth" : "approx"} dx={2} dy={14} />
              <Label at={[inset.i23, inset.loss23 / 1e5]} text={`${fmtDay(bt.dates[inset.i23])}: ${lakh(inset.loss23)} — ${f1(inset.loss23 / inset.fence23)}× the line`} role="error" dx={narrow ? -8 : 8} dy={narrow ? -6 : 4} anchor={narrow ? "end" : "start"} />
            </Plot>
          </div>
          <div className="e1-fence-note">
            <p>
              The fence on {fmtDate(bt.dates[inset.i20])} read <strong>{lakh(inset.fence20)}</strong>. The next trading day lost <strong>{lakh(inset.loss23)}</strong>, {f1(inset.loss23 / inset.fence23)} times the line.{" "}
              {id === "historical"
                ? "The historical fence sat still through March: the line is a rank among the previous 500 days, and a few new bad days barely move the 5th-worst of 500."
                : id === "normal"
                  ? "The 500-day bell is smoother and lower than the days themselves — a bell has thinner tails than this record — so it is crossed more often."
                  : "The EWMA bell hugs recent days: it rose through March 2020 as the big moves arrived, so its crossings bunch less, but it starts every quiet spell too low."}
            </p>
          </div>
        </div>
      </div>
    </Figure>
  );
}

function InsetBand({ a, b }: { a: number; b: number }) {
  const { x, inner } = usePlot();
  return <rect className="e1-window" x={x(a)} y={inner.top} width={Math.max(2, x(b) - x(a))} height={inner.height} />;
}

function InsetTicks({ a, b, dates }: { a: number; b: number; dates: string[] }) {
  const { x, inner } = usePlot();
  const firsts = ["2020-02-01", "2020-03-01", "2020-04-01"].map((d) => dates.findIndex((e, i) => i >= a && i <= b && e >= d)).filter((i) => i >= 0);
  const names = ["Feb", "Mar", "Apr"];
  return (
    <g>
      {firsts.map((i, k) => (
        <text key={i} className="label e1-ticklabel" x={x(i)} y={inner.top + inner.height - 4} textAnchor="start">
          {names[k]} 2020
        </text>
      ))}
    </g>
  );
}
