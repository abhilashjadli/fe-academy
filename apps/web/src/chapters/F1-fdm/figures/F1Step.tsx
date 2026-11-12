import "./figures.css";
import { useRef, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Segmented, Slider } from "../../../ui/controls";
import { Bars, Curve, Label, Marker, Plot, type Pt } from "../../../ui/Plot";
import { RowPath, XTicks, YTicks } from "./parts";
import { DIAL, FORMULA_ROW, GRID, ROD_F, STEP_DAYS, TRUTH, dayLabel, getDial, n0, n2, rupees, useLazy, useNarrow, type DialRun, type GridName } from "./f1";

/**
 * Figure 1 — too big a step. The explicit scheme on the same chain: dial the time step over the key's twelve stops (0.1 → 1 day),
 * switch the grid between 100 and 50 points. Live solveForward(GRID, M, N, "explicit") for the key's N (equals key.dial rows).
 * The y-axis is clipped once the grid blows past ₹1 lakh; a banner says how far off the chart it went. The panel shows the
 * scheme's three weights at the top node (engine explicitWeights): the middle one crosses zero exactly at the limit.
 * Two controls; three readouts.
 */

const X: [number, number] = [GRID.Flo, GRID.Fhi];
const SANE = 1e5;
const BOUNDARY = DIAL.grid100.rows[0].max_abs; // the deep-in boundary's value, the largest a sane grid holds

function yDomain(run: DialRun): [number, number] {
  if (run.sol.maxAbs > SANE) return [-6500, 6500];
  let lo = 0;
  let hi = 0;
  for (const v of run.sol.V) {
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  return [Math.min(-400, lo * 1.12), Math.max(5900, hi * 1.12)];
}

function Row({ run, narrow }: { run: DialRun; narrow: boolean }) {
  const Y = yDomain(run);
  const off = run.sol.maxAbs > SANE;
  const blown = run.sol.maxAbs > 2 * BOUNDARY;
  const formulaPts: Pt[] = ROD_F.map((F, i) => [F, FORMULA_ROW[i]]);
  const ticks = Y[1] > 10000 ? [-15000, -10000, -5000, 5000, 10000, 15000].filter((t) => t > Y[0] && t < Y[1]) : [1000, 2000, 3000, 4000, 5000].filter((t) => t < Y[1]);
  return (
    <div className="f1-step-stage">
      <Plot xDomain={X} yDomain={Y} width={narrow ? 400 : 560} height={narrow ? 270 : 320} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={X[0]} axisY={Y[0]} ariaLabel={`the explicit scheme's final row over the index at a step of ${dayLabel(run.stepDays)} on ${run.M} grid points${blown ? ": a saw-tooth" : ": the call's curve"}`}>
        <YTicks at={ticks} fmt={n0} />
        <XTicks at={[18000, 20000, 22000, 24000, 26000, 28000]} fmt={n0} />
        {Y[0] < -100 && <Curve pts={[[X[0], 0], [X[1], 0]]} role="ghost" width={1} smooth={false} />}
        <Curve pts={formulaPts} role="truth" width={1.6} dash="6 4" smooth={false} />
        <RowPath xs={run.sol.Fg} ys={run.sol.V} role={blown ? "error" : "approx"} width={blown ? 1.4 : 2.2} />
        {!blown && <Marker at={[GRID.F, run.sol.value]} role="ink" r={4.5} />}
        {!blown && <Label at={[GRID.F, run.sol.value]} text={`${n0(GRID.F)}: ${n2(run.sol.value)}`} role="ink" dx={-8} dy={-8} anchor="end" />}
        <Label at={[X[0], Y[1]]} text={`${run.M} points (δF = ${n0(run.sol.dF)}), step ${dayLabel(run.stepDays)}, ${run.N} steps`} role="ink" dx={4} dy={12} />
        <Label at={[X[1], FORMULA_ROW[ROD_F.length - 1]]} text="dashed: the formula" role="truth" dx={-6} dy={16} anchor="end" />
      </Plot>
      {off && (
        <div className="f1-banner" role="status">
          off the chart: the grid reaches ±{rupees(run.sol.maxAbs)} ({(run.sol.maxAbs / 1e9).toFixed(run.sol.maxAbs >= 1e9 ? 1 : 2)} billion rupees) for a ₹{Math.round(TRUTH)} option
        </div>
      )}
    </div>
  );
}

/** the three weights at the top node as bars; the middle one turns red below zero */
function Weights({ run, narrow }: { run: DialRun; narrow: boolean }) {
  const w = run.weights;
  const vals = [w.down, w.stay, w.up];
  const names = ["down", "stay", "up"];
  const Y: [number, number] = [Math.min(-0.6, w.stay * 1.25), Math.max(1.25, w.down * 1.25)];
  return (
    <Plot xDomain={[-0.6, 2.6]} yDomain={Y} width={narrow ? 400 : 300} height={narrow ? 220 : 320} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={-0.6} axisY={0} ariaLabel={`the explicit scheme's three weights at the top node: down ${w.down.toFixed(2)}, stay ${w.stay.toFixed(2)}, up ${w.up.toFixed(2)}`}>
      <YTicks at={[1].filter((t) => t < Y[1])} fmt={(v) => String(v)} />
      <Bars bars={vals.map((v, i) => ({ x: i, y: v, w: 0.62 })).filter((b) => b.y >= 0)} role="approx" opacity={0.85} />
      <Bars bars={vals.map((v, i) => ({ x: i, y: v, w: 0.62 })).filter((b) => b.y < 0)} role="error" opacity={0.85} />
      {vals.map((v, i) => (
        <Label key={i} at={[i, v]} text={(v < 0 ? "−" : "") + Math.abs(v).toFixed(2)} role={v < 0 ? "error" : "approx"} dx={0} dy={v < 0 ? 14 : -6} anchor="middle" />
      ))}
      {names.map((nm, i) => (
        <Label key={nm} at={[i, 0]} text={nm} role="ink" dx={0} dy={vals[i] < 0 ? -6 : 14} anchor="middle" />
      ))}
      <Label at={[-0.6, Y[1]]} text={`weights at the top node, ${n0(GRID.Fhi)}`} role="ink" dx={4} dy={12} />
      <Label at={[2.6, Y[0]]} text={w.stay >= 0 ? "all three positive: stable" : "the middle one is negative"} role={w.stay >= 0 ? "ink" : "error"} dx={-4} dy={-6} anchor="end" />
    </Plot>
  );
}

export function F1Step() {
  const narrow = useNarrow();
  const [si, setSi] = useState(0);
  const [grid, setGrid] = useState<GridName>("grid100");
  const run = useLazy(`dial:${grid}:${si}`, () => getDial(grid, si));
  const last = useRef<DialRun | null>(null);
  if (run) last.current = run;
  const shown = run ?? last.current;
  const d = DIAL[grid];
  const row = (name: GridName, step: number) => DIAL[name].rows.find((r) => r.step_days === step)!;

  return (
    <Figure
      n="1"
      prompt={
        <>
          The cheapest way to walk back: tomorrow's value at each dot from today's three — the dot and its two neighbours. Turn the time step up from a tenth of a day to a
          whole day and watch the rod.
        </>
      }
      controls={
        <>
          <Slider label="time step" value={si} min={0} max={STEP_DAYS.length - 1} step={1} onChange={setSi} role={shown && !shown.stable ? "error" : undefined} fmt={() => dayLabel(STEP_DAYS[si])} />
          <Segmented<GridName> label="grid points" options={[{ id: "grid100", label: "100" }, { id: "grid50", label: "50" }]} value={grid} onChange={setGrid} />
          <Readouts
            items={[
              [`price at ${n0(GRID.F)}`, shown ? rupees(shown.sol.value) : "…"],
              ["largest |value| on the grid", shown ? rupees(shown.sol.maxAbs) : "…"],
              ["limit", <>{d.limit_days.toFixed(3)} days — {shown ? <b className={shown.stable ? "f1-good" : "f1-bad"}>{shown.stable ? "stable" : "unstable"}</b> : "…"}</>],
            ]}
          />
        </>
      }
      observe={
        <>
          On 100 points (δF = 100) the explicit step may not exceed δF²/(σ²F²<sub>max</sub>) = {DIAL.grid100.limit_days.toFixed(3)} days, so an {Math.round(GRID.T * 365)}-day option needs at least {DIAL.grid100.min_steps}{" "}
          steps (key). At 0.1 day it reads {n2(row("grid100", 0.1).price)}; at 0.25 day still {n2(row("grid100", 0.25).price)} at the node, and the largest value on the grid is still the boundary's{" "}
          {n0(row("grid100", 0.25).max_abs)} — past the limit, but {row("grid100", 0.25).N} steps are too few for the error to grow. At 0.3 day: {n2(row("grid100", 0.3).price)}, with {n0(row("grid100", 0.3).max_abs)} on the grid. At
          0.4 day: {rupees(row("grid100", 0.4).price)}. At 1 day: {rupees(row("grid100", 1).price)} for a ₹{Math.round(TRUTH)} option (key). The three weights are a_jδt, 1 − 2a_jδt − rδt, a_jδt — Hull's trinomial
          reading — and the middle one is {DIAL.grid100.weights_at[2].stay.toFixed(2)} at 0.25 day, {DIAL.grid100.weights_at[4].stay.toFixed(2)} at 1 day (key). On 50 points (δF = 200) the limit is four
          times longer, {DIAL.grid50.limit_days.toFixed(3)} days: the 1-day step is just past it, reads {n2(row("grid50", 1).price)} after 11 steps, and its middle weight is already{" "}
          {DIAL.grid50.weights_at[4].stay.toFixed(2)}.
        </>
      }
    >
      <div className="f1-step">
        <div className="f1-step-two">
          <div className="f1-panel">
            <div className="f1-panel-title">
              <strong>the rod after {shown ? shown.N : "…"} steps</strong> <span>the explicit scheme's values over the index, against the formula</span>
            </div>
            {shown ? <Row run={shown} narrow={narrow} /> : <div className="f1-wait">solving…</div>}
          </div>
          <div className="f1-panel">
            <div className="f1-panel-title">
              <strong>the three weights</strong> <span>stable while the middle weight is positive</span>
            </div>
            {shown ? <Weights run={shown} narrow={narrow} /> : <div className="f1-wait">…</div>}
          </div>
        </div>
      </div>
    </Figure>
  );
}
