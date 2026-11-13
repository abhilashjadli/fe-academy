import "./figures.css";
import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Segmented, Slider } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, type Pt } from "../../../ui/Plot";
import { XTicks, YTicks } from "./parts";
import { BEST_K, EWMA_TEST_PCT, FIG1, K, betterWorse, dmy, getFitK, kCurve, n0, n3, neg, pct1, useNarrow, type TrainSet } from "./g1";

/**
 * Figure 1 — tomorrow's move size from the last k sizes (real record): |return| in % regressed on its last k values by least
 * squares, fitted on the training days (1 Apr 2016–30 Jan 2024) and scored on the 683 test days since. Two curves against k:
 * the error on the training days and on the test days, each as "% better than guessing the training average". The sweep is
 * the key's (key.fig1.full / small_curve); the dialled k runs live (fitK, equals the key's row). A5's EWMA is the line.
 * Segmented training set: all 1,940 days / the last 250. Two controls; three readouts.
 */

const X: [number, number] = [0, K + 1];
const Y: [number, number] = [-36, 34];
const pctTick = (v: number) => `${neg(String(v))} %`;
const SET_LABEL: Record<TrainSet, string> = { full: `all ${n0(FIG1.train.n)} days`, small: `the last ${FIG1.small.n} days` };

function Curves({ set, k, narrow }: { set: TrainSet; k: number; narrow: boolean }) {
  const curve = kCurve(set);
  const live = getFitK(set, k);
  const trainPts: Pt[] = curve.map((p) => [p.k, p.train]);
  const testPts: Pt[] = curve.map((p) => [p.k, p.test]);
  const bestSoFar = curve.slice(0, k).reduce((a, b) => (b.test > a.test ? b : a));
  return (
    <Plot xDomain={X} yDomain={Y} width={narrow ? 400 : 720} height={narrow ? 300 : 340} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={X[0]} axisY={0} ariaLabel={`error on the training days (amber) and on the test days (blue) against the number of lags k from 1 to ${K}, each as percent better than guessing the average; training set ${SET_LABEL[set]}; the dial at k = ${k}`}>
      <YTicks at={[-30, -20, -10, 10, 20, 30]} fmt={pctTick} />
      <XTicks at={[1, 10, 20, 30, 40, 50, 60]} fmt={(v) => String(v)} label="lags k" />
      <Label at={[X[1], 0]} text="0 %: as good as guessing the average every day" role="ink" dx={-6} dy={14} anchor="end" />
      <Curve pts={[[X[0], EWMA_TEST_PCT], [X[1], EWMA_TEST_PCT]]} role="ghost" width={1.2} dash="5 4" smooth={false} />
      <Label at={[X[1], EWMA_TEST_PCT]} text={`A5's EWMA on the test days: ${pct1(EWMA_TEST_PCT)}`} role="ghost" dx={-6} dy={-5} anchor="end" />
      <Curve pts={trainPts} role="approx" width={2} smooth={false} />
      <Curve pts={testPts} role="truth" width={2.2} smooth={false} />
      <Curve pts={[[k, Y[0]], [k, Y[1]]]} role="ghost" width={1} smooth={false} />
      <Marker at={[k, live.train]} role="approx" r={5} />
      <Marker at={[k, live.test]} role="truth" r={5} />
      <Label at={[k, live.train]} text={`training ${pct1(live.train)}`} role="approx" dx={k > 45 ? -9 : 9} dy={-8} anchor={k > 45 ? "end" : "start"} />
      <Label at={[k, live.test]} text={`test ${pct1(live.test)}`} role="truth" dx={k > 45 ? -9 : 9} dy={live.test < Y[0] + 9 ? -12 : 19} anchor={k > 45 ? "end" : "start"} />
      {bestSoFar.k !== k && <Marker at={[bestSoFar.k, bestSoFar.test]} role="ink" r={3} />}
      <Label at={[X[0], Y[1]]} text={narrow ? "amber: fitted days · blue: unseen days" : `amber: the days it was fitted on · blue: the ${n0(FIG1.test.n)} days it never saw`} role="ink" dx={46} dy={14} />
    </Plot>
  );
}

export function F1Lags() {
  const narrow = useNarrow();
  const [k, setK] = useState(4);
  const [set, setSet] = useState<TrainSet>("full");
  const live = getFitK(set, k);
  const curve = kCurve(set);
  const bestSoFar = curve.slice(0, k).reduce((a, b) => (b.test > a.test ? b : a));
  const full = kCurve("full");
  const small = kCurve("small");
  const fullBest = full[BEST_K.k - 1];
  const fullLast = full[K - 1];
  const smallLast = small[K - 1];
  const trainStart = set === "full" ? FIG1.train.start : FIG1.small.start;

  return (
    <Figure
      n="1"
      prompt={
        <>
          Now something worth predicting: the size of tomorrow's move, from the sizes of the last k days' moves — chapter A3's line with k columns. Fitted on {dmy(trainStart)} to {dmy(FIG1.train.end)},
          scored on the {n0(FIG1.test.n)} days since, which it never sees. Dial k and watch the two errors part company.
        </>
      }
      controls={
        <>
          <Slider label="lags k" value={k} min={1} max={K} step={1} onChange={setK} role="truth" fmt={(v) => String(v)} />
          <Segmented<TrainSet> label="training set" options={[{ id: "full", label: SET_LABEL.full }, { id: "small", label: SET_LABEL.small }]} value={set} onChange={setSet} />
          <Readouts
            items={[
              ["on the training days", <span className="g1-approx">{betterWorse(live.train)}</span>],
              ["on the test days", <span className={live.test < 0 ? "g1-bad" : "g1-truth"}>{betterWorse(live.test)}</span>],
              ["best k so far", `${bestSoFar.k} ${bestSoFar.k === 1 ? "lag" : "lags"} (${pct1(bestSoFar.test)})`],
            ]}
          />
        </>
      }
      observe={
        <>
          The error is the mean squared miss on |return| in %, quoted against the miss of guessing the training average every day (training days {n3(FIG1.train.mse_mean)}, test days{" "}
          {n3(FIG1.test.mse_mean)} — the training years hold March 2020, so the raw numbers are not comparable; the percentages are). On all {n0(FIG1.train.n)} days the training error improves for ever,{" "}
          {pct1(full[0].train)} at one lag to {pct1(fullLast.train)} at {K}; the test error peaks at {fullBest.k} lags, {pct1(fullBest.test)} better (test MSE {n3(BEST_K.test)}), and at {K} lags is{" "}
          {pct1(fullLast.test)} better — back to guessing. A5's EWMA (λ {FIG1.ewma.lam}) scores {pct1(EWMA_TEST_PCT)} on the same days (test MSE {n3(FIG1.ewma.test)}). On the last {FIG1.small.n} training days
          alone, {K} lags score {pct1(-smallLast.test)} <em>worse</em> than guessing — while their training error reads {pct1(smallLast.train)} better (key). The U is the
          shape of every supervised model; it sharpens as the data thin; it is visible only on the days kept back.
        </>
      }
    >
      <div className="g1-lags">
        <div className="g1-panel">
          <div className="g1-panel-title">
            <strong>% better than guessing the average, against k</strong> <span>training set {SET_LABEL[set]} · dashed: chapter A5's EWMA on the test days</span>
          </div>
          <Curves set={set} k={k} narrow={narrow} />
        </div>
        <div className="g1-rule" role="status">
          <strong>
            {k} {k === 1 ? "lag" : "lags"}, {SET_LABEL[set]}
          </strong>
          <span>
            training {pct1(live.train)} · test {pct1(live.test)} · best test so far {pct1(bestSoFar.test)} at k = {bestSoFar.k} · EWMA {pct1(EWMA_TEST_PCT)}
          </span>
        </div>
      </div>
    </Figure>
  );
}
