import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Plot, VLine, usePlot, type Pt } from "../../../ui/Plot";
import { Readouts, Slider } from "../../../ui/controls";
import { driftFromReturns, logReturns, realisedVolFromPrices } from "../../../engine/brownian";
import data from "../../../data/nifty50-long.json";
import { Gauge } from "./gauges";
import { KEY, monthYear, niceDate, pct1, pctSp, useNarrow } from "./b3";
import "./figures.css";

/**
 * Figure 3 — the dial on a real path. NIFTY 50 daily closes, 2016 → 2026 (NSE, in the repo), nothing simulated. The squares dial is
 * run over one year of daily log-moves (Shreve 3.4.16, 252 days) and read as a yearly volatility; the same window's average move
 * is read as a yearly drift. One scrubber slides the window across the decade. Every window's two readings are drawn underneath,
 * so the whole decade is visible at once: the dial is steady-ish and lights up in the storms; the drift swings and never settles.
 */

const CLOSES: number[] = data.rows.map((r) => r.c);
const DATES: string[] = data.rows.map((r) => r.d);
const WINDOW = KEY.nifty.days_per_year; // 252 trading days
const STORM = 0.25; // the dial "lights up" above this yearly volatility

const year = (iso: string) => {
  const d = new Date(iso + "T00:00:00Z");
  const y = d.getUTCFullYear();
  const start = Date.UTC(y, 0, 1),
    end = Date.UTC(y + 1, 0, 1);
  return y + (d.getTime() - start) / (end - start);
};

function Shade({ x0, x1 }: { x0: number; x1: number }) {
  const { x, inner } = usePlot();
  return <rect className="b3-shade" x={x(x0)} y={inner.top} width={Math.max(1, x(x1) - x(x0))} height={inner.height} />;
}

export function F3Real() {
  const series = useMemo(() => {
    const rets = logReturns(CLOSES);
    const vol = realisedVolFromPrices(CLOSES, WINDOW); // one per window, aligned to the window's last close
    const drift: number[] = [];
    for (let j = 0; j + WINDOW <= rets.length; j++) drift.push(driftFromReturns(rets.slice(j, j + WINDOW)));
    const yrs = DATES.map(year);
    const volPts: Pt[] = vol.map((v, j) => [yrs[j + WINDOW], 100 * v]);
    const driftPts: Pt[] = drift.map((v, j) => [yrs[j + WINDOW], 100 * v]);
    const pricePts: Pt[] = CLOSES.map((c, i) => [yrs[i], c]);
    let jmax = 0;
    vol.forEach((v, j) => {
      if (v > vol[jmax]) jmax = j;
    });
    return { vol, drift, yrs, volPts, driftPts, pricePts, jmax, windows: vol.length };
  }, []);
  const [j, setJ] = useState(Math.min(series.windows - 1, 900)); // opens on 2019–20, so the storm is one drag away
  const narrow = useNarrow();

  const v = series.vol[j],
    d = series.drift[j];
  const from = DATES[j],
    to = DATES[j + WINDOW];
  const x0 = series.yrs[j],
    x1 = series.yrs[j + WINDOW];
  const xDomain: [number, number] = [series.yrs[0], series.yrs[series.yrs.length - 1] + 0.05];
  const W = narrow ? 380 : 620;
  const stormDate = DATES[series.jmax + WINDOW];

  return (
    <Figure
      n="3"
      prompt={
        <>
          The squares dial on a real path: NIFTY 50, every trading day from {niceDate(DATES[0])} to {niceDate(DATES[DATES.length - 1])} (NSE). Slide a one-year window across the
          decade and read the two instruments.
        </>
      }
      controls={
        <>
          <Slider label="window ends" value={j} min={0} max={series.windows - 1} step={1} onChange={setJ} fmt={() => monthYear(to)} width={narrow ? 170 : 260} />
          <Readouts
            items={[
              ["window", `${niceDate(from)} → ${niceDate(to)}`],
              ["whole decade: the dial", <span className="b3-truth">{pctSp(KEY.nifty.rv_all)} a year</span>],
              ["whole decade: drift", <span className="b3-approx">{pctSp(KEY.nifty.drift_ann_all)} a year</span>],
            ]}
          />
        </>
      }
      observe={
        <>
          The dial — the year's squared daily moves, added up and read as a yearly wobble — sits near {pctSp(KEY.nifty.rv_all, 0)} most of the decade and lights up in the
          storms (the year to {monthYear(stormDate)}, which holds March 2020: {pctSp(series.vol[series.jmax])}). The drift readout swings from window to window and never settles.{" "}
          <strong>You can measure the wobble from one path; you cannot measure the drift from one decade.</strong> Read the dial much finer than a day and it starts to
          over-read — the bid-ask bounce is a move that is not a move — which is why this one stops at daily closes.
        </>
      }
    >
      <div className="b3-real">
        <div className="b3-real-plots">
          <Plot xDomain={xDomain} yDomain={[6000, 28000]} width={W} height={narrow ? 150 : 170} margin={{ top: 12, right: 30, bottom: 22, left: 54 }} xTicks={6} yTicks={3} yLabel="NIFTY 50 close" ariaLabel="NIFTY 50 daily closes 2016 to 2026 with the one-year window shaded" axisY={6000}>
            <Shade x0={x0} x1={x1} />
            <Curve pts={series.pricePts} role="ink" width={1} smooth={false} />
          </Plot>
          <Plot xDomain={xDomain} yDomain={[-40, 60]} width={W} height={narrow ? 190 : 210} margin={{ top: 12, right: 30, bottom: 30, left: 54 }} xTicks={6} yTicks={5} xLabel="year" yLabel={narrow ? "% a year" : "% a year, for the window ending here"} ariaLabel="Rolling one-year volatility and drift of NIFTY 50; the volatility is steady with a spike in 2020, the drift swings widely">
            <Curve pts={series.driftPts} role="approx" width={1.3} smooth={false} />
            <Curve pts={series.volPts} role="truth" width={2} smooth={false} />
            <VLine at={x1} />
            <Label at={[series.volPts[series.jmax][0], series.volPts[series.jmax][1]]} text={`year to ${monthYear(stormDate)}: ${pct1(series.vol[series.jmax])}`} role="truth" anchor="start" dx={6} dy={-6} />
            <Label at={[xDomain[0], 100 * KEY.nifty.rv_all]} text="the dial, as a yearly wobble" role="truth" dx={6} dy={-6} />
            <Label at={[xDomain[0], -32]} text="the average move, as a yearly drift" role="approx" dx={6} dy={-6} />
          </Plot>
        </div>
        <div className="b3-real-dash">
          <Gauge value={100 * v} max={50} ticks={5} label="the dial" sub="yearly wobble, %" printed={pctSp(v)} role={v > STORM ? "error" : "truth"} mark={100 * KEY.nifty.rv_all} markLabel="decade" width={narrow ? 130 : 150} />
          <Gauge value={100 * d} min={-40} max={60} ticks={5} label="average move" sub="yearly drift, %" printed={(d >= 0 ? "+" : "−") + pctSp(Math.abs(d))} role="approx" width={narrow ? 130 : 150} />
        </div>
      </div>
    </Figure>
  );
}
