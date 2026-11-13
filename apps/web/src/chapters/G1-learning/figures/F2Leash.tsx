import "./figures.css";
import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { M } from "../../../ui/Math";
import { Readouts, Slider } from "../../../ui/controls";
import { Bars, Curve, Label, Marker, Plot, type Pt } from "../../../ui/Plot";
import { XTicks, YTicks } from "./parts";
import { BEST_K, BEST_K_PCT, BEST_LAM_I, FIG1, FIG2, K, LAMS, LAM_CURVE, betterWorse, getRidge, lamFmt, lamX, n0, n3, neg, pct1, useNarrow } from "./g1";

/**
 * Figure 2 — the leash (real record): keep all sixty lags and add λ·Σβ² to the thing minimised. The sixty coefficients as bars at
 * the dialled λ (live ridge on the 1,940 training rows, equals key.fig2.rows[i].coef), negatives in the warning colour; beside
 * them the test error over log λ as % better than guessing (key.fig2.rows), the dialled point marked, the best hand-picked k
 * of Figure 1 dashed for reference. One control (the log dial over the key's grid); three readouts.
 */

const BX: [number, number] = [-6, K + 1.5];
const BY: [number, number] = [-0.1, 0.25];
const LX: [number, number] = [-0.85, 5.35];
const LY: [number, number] = [-1.5, 11.5];
const pctTick = (v: number) => `${v} %`;
const LAM_TICKS = LAMS.map((_, i) => i).filter((i) => i === 0 || Number.isInteger(Math.log10(LAMS[i])));

function Coefs({ i, narrow }: { i: number; narrow: boolean }) {
  const r = getRidge(i);
  const bars = Array.from(r.coef.slice(1), (c, j) => ({ x: j + 1, y: c, w: 0.8 }));
  const pos = bars.filter((b) => b.y >= 0);
  const negs = bars.filter((b) => b.y < 0);
  return (
    <Plot xDomain={BX} yDomain={BY} width={narrow ? 400 : 480} height={narrow ? 260 : 300} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={BX[0]} axisY={0} ariaLabel={`the ${K} fitted coefficients at λ = ${lamFmt(r.lam)}, one bar per lag from yesterday to ${K} days back; ${r.negatives} are negative`}>
      <YTicks at={[0.1, 0.2]} fmt={(v) => neg(v.toFixed(2))} />
      <XTicks at={[1, 10, 20, 30, 40, 50, 60]} fmt={(v) => (v === 1 ? "yesterday" : String(v))} label="days back" />
      <Bars bars={pos} role="approx" opacity={0.9} gap={1} />
      <Bars bars={negs} role="error" opacity={0.95} gap={1} />
      <Label at={[BX[1], BY[1]]} text={`${r.negatives} of ${K} negative`} role={r.negatives > 0 ? "error" : "ink"} dx={-6} dy={14} anchor="end" />
      <Label at={[BX[0], BY[1]]} text={narrow ? "weight of each past day's move" : "how much each past day's move size counts toward tomorrow's"} role="ink" dx={4} dy={14} />
    </Plot>
  );
}

function LamCurve({ i, narrow }: { i: number; narrow: boolean }) {
  const live = getRidge(i);
  const pts: Pt[] = LAM_CURVE.map((p) => [lamX(p.i), p.test]);
  const best = LAM_CURVE[BEST_LAM_I];
  const x = lamX(i);
  return (
    <Plot xDomain={LX} yDomain={LY} width={narrow ? 400 : 380} height={narrow ? 260 : 300} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={LX[0]} axisY={0} ariaLabel={`the test error against the leash λ on a log axis from 0 to ${lamFmt(LAMS[LAMS.length - 1])}, as percent better than guessing; the dial at λ = ${lamFmt(live.lam)} reads ${pct1(live.test)}; the best hand-picked k of Figure 1 dashed at ${pct1(BEST_K_PCT)}`}>
      <YTicks at={[2, 4, 6]} fmt={pctTick} />
      <XTicks at={LAM_TICKS.map(lamX)} fmt={(v) => (v < 0 ? "0" : v === 0 ? "1" : lamFmt(10 ** Math.round(v)))} />
      <Label at={[LX[1], 0]} text="0 %: guessing the average" role="ink" dx={-6} dy={-5} anchor="end" />
      <Curve pts={[[LX[0], BEST_K_PCT], [LX[1], BEST_K_PCT]]} role="ghost" width={1.2} dash="5 4" smooth={false} />
      <Label at={[LX[1], BEST_K_PCT]} text={`Figure 1's best hand-picked k (${BEST_K.k} lags): ${pct1(BEST_K_PCT)}`} role="ghost" dx={-6} dy={-5} anchor="end" />
      <Label at={[LX[0], LY[1]]} text={`the dial: λ ${lamFmt(live.lam)} → ${betterWorse(live.test)}`} role="approx" dx={4} dy={14} />
      <Curve pts={pts} role="truth" width={2.2} smooth={false} />
      <Marker at={[lamX(best.i), best.test]} role="ink" r={3} />
      <Marker at={[x, live.test]} role="approx" r={5.5} />
    </Plot>
  );
}

export function F2Leash() {
  const narrow = useNarrow();
  const [i, setI] = useState(0);
  const live = getRidge(i);
  const named = FIG2.named;
  const best = LAM_CURVE[BEST_LAM_I];
  const at1000 = LAM_CURVE[LAMS.indexOf(1000)];
  const at100k = LAM_CURVE[LAMS.length - 1];

  return (
    <Figure
      n="2"
      prompt={
        <>
          Keep all {K} lags. Add one term to the thing being minimised — the sum of the squared coefficients, times λ — and tighten it. The bars are the {K} coefficients; the curve is the error on
          the {n0(FIG1.test.n)} unseen days. Watch what the leash does to both.
        </>
      }
      controls={
        <>
          <Slider label="leash λ" value={i} min={0} max={LAMS.length - 1} step={1} onChange={setI} role="approx" fmt={() => lamFmt(live.lam)} />
          <Readouts
            items={[
              ["on the test days", <span className={live.test < 0 ? "g1-bad" : "g1-truth"}>{betterWorse(live.test)}</span>],
              ["negative bars", <span className={live.negatives > 0 ? "g1-bad" : undefined}>{live.negatives} of {K}</span>],
              ["sum of the bars' sizes Σ|β|", n3(live.sumAbs)],
            ]}
          />
        </>
      }
      observe={
        <>
          Ridge regression on the {K} lags, the intercept left off the leash; the grid is a quarter-decade from 1 to {lamFmt(LAMS[LAMS.length - 1])}, with 0 at the left. At λ = 0 it is Figure 1's{" "}
          {K}-lag fit: {named["0"].negatives} negative coefficients, Σ|β| {n3(named["0"].sum_abs)}, {pct1(LAM_CURVE[0].test)} better than guessing. At {lamFmt(1000)} the bars have settled into a decaying
          profile — {named["1000"].negatives} still negative but small — Σ|β| {n3(named["1000"].sum_abs)}, {pct1(at1000.test)} better; the grid's best is λ {lamFmt(best.lam)} at {pct1(best.test)} (test MSE{" "}
          {n3(FIG2.rows[BEST_LAM_I].test)}), within {pct1(BEST_K_PCT - best.test).replace(" %", "")} of a point of Figure 1's best hand-picked k ({BEST_K.k} lags, {pct1(BEST_K_PCT)}) with nothing picked. At{" "}
          {lamFmt(at100k.lam)} the bars are flat, Σ|β| {n3(named["100000"].sum_abs)}, no negatives, and the model is {pct1(at100k.test)} better — back to guessing (key). Shrinking toward zero is not
          throwing information away; it is refusing to believe {K} numbers from one history.
        </>
      }
    >
      <div className="g1-leash">
        <div className="g1-leash-two">
          <div className="g1-panel">
            <div className="g1-panel-title">
              <strong>the {K} coefficients</strong> <span>at λ = {lamFmt(live.lam)} · amber positive, red negative</span>
            </div>
            <Coefs i={i} narrow={narrow} />
          </div>
          <div className="g1-panel">
            <div className="g1-panel-title">
              <strong>the test error against λ</strong> <span>% better than guessing on the {n0(FIG1.test.n)} unseen days</span>
            </div>
            <LamCurve i={i} narrow={narrow} />
          </div>
        </div>
        <div className="g1-formula">
          <M block tex="\hat\beta_\lambda=\arg\min_\beta\ \sum_t\big(y_t-x_t^{\top}\beta\big)^2+\lambda\sum_j\beta_j^2=(X^{\top}X+\lambda I)^{-1}X^{\top}y" />
        </div>
        <div className="g1-rule" role="status">
          <strong>λ = {lamFmt(live.lam)}</strong>
          <span>
            test {pct1(live.test)} · {live.negatives} negative bars · Σ|β| {n3(live.sumAbs)} · best on the grid: λ {lamFmt(best.lam)} at {pct1(best.test)}
          </span>
        </div>
      </div>
    </Figure>
  );
}
