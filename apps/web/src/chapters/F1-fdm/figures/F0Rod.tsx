import "./figures.css";
import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { Readouts, Slider, Toggle } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { DotsPath, XTicks, YTicks } from "./parts";
import { DAYS, FORMULA_ROW, GRID, KEY, ROD_DAYS, ROD_DF, ROD_F, ROD_J0, ROD_ROWS, TRUTH, maxPull, n0, n1, n2, nodesPerSd, rowAt, ruleAt, useNarrow, type Rule } from "./f1";

/**
 * Figure 0 — the rod relaxes. The real 22,600 call's payoff laid along B6's rod as 101 dots from 18,000 to 28,000, then walked
 * back from expiry one day at a time (key.rod: the 800 × 88 Crank–Nicolson grid with a Rannacher start, every eighth node).
 * Bet first: does the corner sharpen, round off or slide up? Scrub days to expiry; hover a dot for the neighbour rule
 * (engine neighbourRule); toggle the formula (engine black76) over the dots. Two controls; three readouts.
 */

type Pick = "sharpens" | "rounds" | "slides";
const OPTIONS: Array<{ id: Pick; label: string }> = [
  { id: "sharpens", label: "sharpens" },
  { id: "rounds", label: "rounds off" },
  { id: "slides", label: "slides up" },
];
const X: [number, number] = [GRID.Flo, GRID.Fhi];
const Y_ALL: [number, number] = [-700, 5700];
const X_ZOOM: [number, number] = [21600, 23600];
const Y_ZOOM: [number, number] = [-60, 1080];
const STRIP_Y: [number, number] = [-620, -200];
const VMAX = GRID.Fhi - GRID.K;

/** B6's rod: the value along the grid as heat, hot where the option is worth most */
function HeatStrip({ row }: { row: ArrayLike<number> }) {
  const { x, y } = usePlot();
  const top = y(STRIP_Y[1]);
  const h = y(STRIP_Y[0]) - top;
  const w = x(ROD_F[1]) - x(ROD_F[0]);
  return (
    <g>
      <rect x={x(ROD_F[0]) - w / 2} y={top} width={x(ROD_F[ROD_F.length - 1]) - x(ROD_F[0]) + w} height={h} fill="var(--rule-soft)" />
      {ROD_F.map((F, j) => {
        const t = Math.sqrt(Math.max(0, Math.min(1, row[j] / VMAX)));
        return <rect key={j} x={x(F) - w / 2} y={top} width={w + 0.5} height={h} fill="var(--truth)" opacity={t} />;
      })}
      <rect x={x(ROD_F[0]) - w / 2} y={top} width={x(ROD_F[ROD_F.length - 1]) - x(ROD_F[0]) + w} height={h} fill="none" stroke="var(--ink-3)" strokeWidth={0.8} />
    </g>
  );
}

/** the hovered dot, its two neighbours, their average, and the pull */
function RuleMarks({ rule, zoom }: { rule: Rule; zoom: boolean }) {
  const { x, y } = usePlot();
  const xm = x(rule.F - ROD_DF);
  const xp = x(rule.F + ROD_DF);
  const x0 = x(rule.F);
  const yAvg = y(rule.avg);
  const yV = y(rule.V);
  const gap = Math.abs(yAvg - yV);
  return (
    <g>
      <line x1={xm} x2={xp} y1={y(rule.Vm)} y2={y(rule.Vp)} stroke="var(--approx)" strokeWidth={1.2} strokeDasharray="4 3" />
      <line x1={x0 - 9} x2={x0 + 9} y1={yAvg} y2={yAvg} stroke="var(--approx)" strokeWidth={2} />
      {gap > 3 && <line x1={x0} x2={x0} y1={yV} y2={yAvg + (yAvg > yV ? -2 : 2)} stroke="var(--approx)" strokeWidth={1.5} markerEnd="url(#f1-arrow)" />}
      <circle cx={xm} cy={y(rule.Vm)} r={4.5} fill="var(--approx)" stroke="var(--surface-figure)" strokeWidth={2} />
      <circle cx={xp} cy={y(rule.Vp)} r={4.5} fill="var(--approx)" stroke="var(--surface-figure)" strokeWidth={2} />
      <circle cx={x0} cy={yV} r={5.5} fill="var(--ink)" stroke="var(--surface-figure)" strokeWidth={2} />
      {zoom && gap > 10 && <text className="label approx" x={x0 + 12} y={yAvg + 4}>{`neighbours' average ${n2(rule.avg)}`}</text>}
    </g>
  );
}

function Arrow() {
  return (
    <defs>
      <marker id="f1-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--approx)" />
      </marker>
    </defs>
  );
}

function Rod({ row, rule, formula, hoverJ, onHover, narrow }: { row: number[]; rule: Rule; formula: boolean; hoverJ: number | null; onHover: (j: number | null) => void; narrow: boolean }) {
  const v0 = rowAt(row, GRID.F);
  const formulaPts: Pt[] = ROD_F.map((F, i) => [F, FORMULA_ROW[i]]);
  return (
    <Plot
      xDomain={X}
      yDomain={Y_ALL}
      width={narrow ? 400 : 560}
      height={narrow ? 280 : 330}
      margin={{ top: 8, right: 10, bottom: 8, left: 10 }}
      xTicks={0}
      yTicks={0}
      grid={false}
      axisX={X[0]}
      axisY={Y_ALL[0]}
      onHover={(fx) => onHover(fx === null ? null : Math.max(1, Math.min(ROD_F.length - 2, Math.round((fx - ROD_F[0]) / ROD_DF))))}
      ariaLabel={`the ${n0(GRID.K)} call's value as ${ROD_F.length} dots along the index from ${n0(X[0])} to ${n0(X[1])}, a corner at the strike that rounds off as days to expiry grow`}
    >
      <Arrow />
      <YTicks at={[1000, 2000, 3000, 4000, 5000]} fmt={n0} />
      <XTicks at={[18000, 20000, 22000, 24000, 26000, 28000]} fmt={n0} />
      <HeatStrip row={row} />
      <Label at={[X[0], STRIP_Y[1]]} text="the rod: hotter where the call is worth more" role="ink" dx={4} dy={-5} />
      {formula && <Curve pts={formulaPts} role="truth" width={1.6} dash="6 4" smooth={false} />}
      <DotsPath xs={ROD_F} ys={row} role="truth" r={narrow ? 2 : 2.6} />
      <Curve pts={[[GRID.F, 0], [GRID.F, v0]]} role="ghost" width={1} dash="3 3" smooth={false} />
      <Marker at={[GRID.F, v0]} role="ink" r={4.5} />
      <Label at={[GRID.F, v0]} text={`${n0(GRID.F)}: ${n2(v0)}`} role="ink" dx={-8} dy={-8} anchor="end" />
      {hoverJ !== null && <RuleMarks rule={rule} zoom={false} />}
      {formula && <Label at={[X[1], FORMULA_ROW[ROD_F.length - 1]]} text="the formula (Black-76)" role="truth" dx={-6} dy={16} anchor="end" />}
    </Plot>
  );
}

function Zoom({ row, rule, formula, hoverJ, onHover, narrow }: { row: number[]; rule: Rule; formula: boolean; hoverJ: number | null; onHover: (j: number | null) => void; narrow: boolean }) {
  const v0 = rowAt(row, GRID.F);
  const idx = ROD_F.map((F, i) => [F, i] as const).filter(([F]) => F >= X_ZOOM[0] && F <= X_ZOOM[1]);
  const xs = idx.map(([F]) => F);
  const ys = idx.map(([, i]) => row[i]);
  const formulaPts: Pt[] = idx.map(([F, i]) => [F, FORMULA_ROW[i]]);
  return (
    <Plot
      xDomain={X_ZOOM}
      yDomain={Y_ZOOM}
      width={narrow ? 400 : 320}
      height={narrow ? 280 : 330}
      margin={{ top: 8, right: 10, bottom: 8, left: 10 }}
      xTicks={0}
      yTicks={0}
      grid={false}
      axisX={X_ZOOM[0]}
      axisY={Y_ZOOM[0]}
      onHover={(fx) => onHover(fx === null ? null : Math.max(1, Math.min(ROD_F.length - 2, Math.round((fx - ROD_F[0]) / ROD_DF))))}
      ariaLabel="the same dots within a thousand points of the strike, close up"
    >
      <Arrow />
      <YTicks at={[250, 500, 750, 1000]} fmt={n0} />
      <XTicks at={[22000, 22600, 23200]} fmt={n0} />
      {formula && <Curve pts={formulaPts} role="truth" width={1.6} dash="6 4" smooth={false} />}
      <Curve pts={[[X_ZOOM[0], 0], [GRID.K, 0], [X_ZOOM[1], X_ZOOM[1] - GRID.K]]} role="ghost" width={1} smooth={false} />
      <DotsPath xs={xs} ys={ys} role="truth" r={3.2} />
      <Curve pts={[[GRID.F, 0], [GRID.F, v0]]} role="ghost" width={1} dash="3 3" smooth={false} />
      <Marker at={[GRID.F, v0]} role="ink" r={5} />
      <Label at={[GRID.F, v0]} text={`${n2(v0)} over ${n0(GRID.F)}`} role="ink" dx={-9} dy={-8} anchor="end" />
      {hoverJ !== null && rule.F >= X_ZOOM[0] && rule.F <= X_ZOOM[1] && <RuleMarks rule={rule} zoom />}
      <Label at={[X_ZOOM[0], Y_ZOOM[1]]} text="the corner, close up" role="ink" dx={4} dy={12} />
    </Plot>
  );
}

export function F0Rod() {
  const narrow = useNarrow();
  const [pick, setPick] = useBet<Pick>("f1-f0");
  const [di, setDi] = useState(0);
  const [formula, setFormula] = useState(false);
  const [hoverJ, setHoverJ] = useState<number | null>(null);
  const placed = !!pick;
  const row = ROD_ROWS[di];
  const days = ROD_DAYS[di];
  const v0 = rowAt(row, GRID.F);
  const j = hoverJ ?? ROD_J0;
  const rule = ruleAt(row, j);
  const mp = maxPull(row);
  const v1 = rowAt(ROD_ROWS[1], GRID.F);
  const vEnd = rowAt(ROD_ROWS[ROD_ROWS.length - 1], GRID.F);
  const verdict = pick === "rounds" ? "right" : "miss";
  const yoursLabel = OPTIONS.find((o) => o.id === pick)?.label ?? "";
  const E = KEY.rod.rule_example;
  const W = KEY.wide_grid_note;

  return (
    <Figure
      n="0"
      prompt={
        <>
          The {n0(GRID.K)} call's payoff at expiry, laid along a rod of index levels from {n0(X[0])} to {n0(X[1])} as {ROD_F.length} dots: nothing below the strike, then a straight
          slope. Make your bet, then walk back from expiry a day at a time.
        </>
      }
      controls={
        <>
          <Slider label="days to expiry" value={di} min={0} max={ROD_DAYS.length - 1} step={1} onChange={setDi} locked={!placed} fmt={() => String(days)} />
          <Toggle label="the formula" on={formula} onChange={setFormula} />
          <Readouts items={[[`value at ${n0(GRID.F)}`, n2(v0)], ["days to expiry", String(days)], ["largest pull", `${n0(Math.abs(mp.pull))} a year, at ${n0(ROD_F[mp.j])}`]]} />
        </>
      }
      observe={
        <>
          The grid runs {n0(X[0])}–{n0(X[1])} in 800 nodes (shown as {ROD_F.length}, every eighth), Crank–Nicolson with a Rannacher start, 88 steps of {((DAYS * 24) / 88).toFixed(0)} hours: over{" "}
          {n0(GRID.F)} it ends at {KEY.rod.value_at_F0.toFixed(3)} against the formula's {TRUTH.toFixed(3)} (key). The rule is the same at every dot — move toward the neighbours' average, by the F² weight, less the
          carry — and it bites where the curve bends: at {DAYS} days the dot at {n0(E.F)} has neighbours {n2(E.Vm)} and {n2(E.Vp)}, average {n2(E.avg)}, weight {n0(E.weight)}, pull {n0(E.pull_per_year)} a
          year (key). A wider grid starves a short option: on 0–45,200 in a hundred nodes there are {n1(W.nodes_per_sd_wide)} nodes per standard deviation of the {DAYS}-day move ({n0(W.sd_points)} points);
          here {n1(W.nodes_per_sd_here)} on the {ROD_F.length} dots and {n0(nodesPerSd((GRID.Fhi - GRID.Flo) / 800))} on the 800 nodes (key).
        </>
      }
    >
      <div className="f1-rod">
        <Bet<Pick>
          question={<>Step back one day from expiry. The corner at {n0(GRID.K)} —</>}
          options={OPTIONS}
          pick={pick}
          onPick={(v) => {
            setPick(v);
            setDi(v === null ? 0 : 1);
          }}
        >
          <ResultCard yours={yoursLabel} answer={<>it rounds off — after one day the dot over {n0(GRID.F)} reads {n2(v1)}; after all {DAYS} days, {n2(vEnd)}, the formula's price</>} verdict={verdict}>
            Every dot moves toward the average of its two neighbours. On the straight parts the average <em>is</em> the dot, so nothing moves; at the corner the average sits above the dot, so the corner
            is pulled up and rounds. Nothing slides: the strike stays where the slope starts. Scrub the days; hover a dot to see its rule.
          </ResultCard>
        </Bet>
        <div className="f1-rod-two">
          <div className="f1-panel">
            <div className="f1-panel-title">
              <strong>the whole rod</strong> <span>value of the call over the index, {days} {days === 1 ? "day" : "days"} to expiry</span>
            </div>
            <Rod row={row} rule={rule} formula={formula} hoverJ={hoverJ} onHover={setHoverJ} narrow={narrow} />
          </div>
          <div className="f1-panel">
            <div className="f1-panel-title">
              <strong>the corner</strong> <span>grey: the payoff</span>
            </div>
            <Zoom row={row} rule={rule} formula={formula} hoverJ={hoverJ} onHover={setHoverJ} narrow={narrow} />
          </div>
        </div>
        <div className="f1-rule" role="status">
          <strong>the rule at {n0(rule.F)}</strong>
          <span>
            value {n2(rule.V)} · neighbours {n2(rule.Vm)} and {n2(rule.Vp)}, average {n2(rule.avg)} · weight ½σ²F²/δF² = {n0(rule.weight)} · pull toward the average{" "}
            <b className={rule.pull >= 0 ? "f1-up" : "f1-down"}>
              {rule.pull >= 0 ? "+" : "−"}
              {n0(Math.abs(rule.pull))} a year
            </b>{" "}
            ({rule.pull >= 0 ? "+" : "−"}
            {n2(Math.abs(rule.pull) / 365)} a day){hoverJ === null ? " — hover or tap a dot for its own" : ""}
          </span>
        </div>
      </div>
    </Figure>
  );
}
