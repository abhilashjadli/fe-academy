import "./figures.css";
import { useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Segmented, Slider } from "../../../ui/controls";
import { Curve, Label, Marker, Plot, usePlot, type Pt } from "../../../ui/Plot";
import { XTicks } from "./parts";
import { ERR_DF, ERR_DT, KEY, LADDER_M, SCHEME_NAME, SLOPES, TRUTH, count, f2, getLadder, n2, neg, s2, s3, useLazy, useNarrow, type Rung, type Scheme } from "./f1";
/** signed error: two decimals, three when it is under a paisa */
const err = (e: number) => (Math.abs(e) < 0.01 ? s3(e) : s2(e));

/**
 * Figure 2 — three schemes, one answer. Segmented scheme (explicit at its stable step count / implicit / Crank–Nicolson with a
 * Rannacher start), dial grid points over the key's ladder 25 → 800: the six prices of the chosen scheme against the formula,
 * computed live (equal key.schemes). Below, Wilmott's two log plots on our chain from the key: error against grid spacing
 * (steps fixed at 400) and error against the time step on 800 points, with the fitted slopes. Two controls; three readouts.
 */

const PRICE_AXIS: [number, number] = [236, 272];
const ROLE: Record<Scheme, "approx" | "ink" | "truth"> = { explicit: "approx", implicit: "ink", cn: "truth" };
const lg = Math.log10;

/** the six rungs of one scheme as ticks against the formula's line */
function Ladder({ rungs, cur, scheme, narrow }: { rungs: Rung[]; cur: number; scheme: Scheme; narrow: boolean }) {
  const n = rungs.length;
  return (
    <Plot xDomain={PRICE_AXIS} yDomain={[-1.7, n - 0.4]} width={narrow ? 400 : 880} height={narrow ? 250 : 230} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={PRICE_AXIS[0]} axisY={-1.7} ariaLabel={`the ${SCHEME_NAME[scheme]} scheme's price at six grid sizes from 25 to 800 points, closing on the formula's ${n2(TRUTH)}`}>
      <XTicks at={[240, 250, 260, 270]} label="price" />
      <Curve pts={[[TRUTH, -0.9], [TRUTH, n - 0.4]]} role="truth" width={1.5} dash="4 3" smooth={false} />
      <Label at={[TRUTH, -0.8]} text={`the formula: ${n2(TRUTH)}`} role="truth" dx={6} dy={4} />
      {rungs.map((r, i) => (
        <Tick key={r.M} r={r} yv={n - 1 - i} bold={i === cur} role={ROLE[scheme]} narrow={narrow} />
      ))}
    </Plot>
  );
}
function Tick({ r, yv, bold, role, narrow }: { r: Rung; yv: number; bold: boolean; role: "approx" | "ink" | "truth"; narrow: boolean }) {
  const { x, y } = usePlot();
  const cy = y(yv);
  const col = role === "ink" ? (bold ? "var(--ink)" : "var(--ink-3)") : `var(--${role})`;
  const right = r.price < TRUTH + 6;
  const text = narrow ? `${r.M} pts, ${count(r.N)} steps: ${n2(r.price)}` : `${r.M} points, ${count(r.N)} steps: ${n2(r.price)} (${err(r.error)})`;
  return (
    <g opacity={bold ? 1 : 0.75}>
      <line x1={x(TRUTH)} x2={x(r.price)} y1={cy} y2={cy} stroke={col} strokeWidth={bold ? 4 : 2.5} opacity={0.35} />
      <line x1={x(r.price)} x2={x(r.price)} y1={cy - 7} y2={cy + 7} stroke={col} strokeWidth={bold ? 3 : 1.8} />
      <text className={`label ${role === "ink" ? "" : role}`} x={right ? x(Math.max(r.price, TRUTH)) + 8 : x(PRICE_AXIS[0]) + 6} y={cy + 4} textAnchor="start" style={{ fontWeight: bold ? 600 : 400 }}>
        {text}
      </text>
    </g>
  );
}

interface Series {
  name: string;
  role: "approx" | "ink" | "truth" | "error";
  xs: number[];
  errs: number[];
  slope: number;
  /** where the name sits: by the first point or the last */
  labelAt: "first" | "last";
  dy?: number;
}
/** error against x on log axes, each series with its least-squares line (slope from the key) */
function LogPanel({ series, X, Y, xTicks, yTicks, xLabel, narrow, aria }: { series: Series[]; X: [number, number]; Y: [number, number]; xTicks: number[]; yTicks: number[]; xLabel: string; narrow: boolean; aria: string }) {
  return (
    <Plot xDomain={[lg(X[0]), lg(X[1])]} yDomain={[lg(Y[0]), lg(Y[1])]} width={narrow ? 400 : 430} height={narrow ? 260 : 290} margin={{ top: 8, right: 10, bottom: 8, left: 10 }} xTicks={0} yTicks={0} grid={false} axisX={lg(X[0])} axisY={lg(Y[0])} ariaLabel={aria}>
      <LogTicks xs={xTicks} ys={yTicks} xLabel={xLabel} />
      {series.map((s) => {
        const mx = s.xs.reduce((a, v) => a + Math.log(v), 0) / s.xs.length;
        const my = s.errs.reduce((a, v) => a + Math.log(Math.abs(v)), 0) / s.errs.length;
        const fit = (v: number) => Math.exp(my + s.slope * (Math.log(v) - mx));
        const line: Pt[] = [
          [lg(X[0]), lg(fit(X[0]))],
          [lg(X[1]), lg(fit(X[1]))],
        ];
        return (
          <g key={s.name}>
            <Curve pts={line} role={s.role} width={1.3} dash="5 3" smooth={false} opacity={0.7} />
            {s.xs.map((v, i) => (
              <Marker key={v} at={[lg(v), lg(Math.abs(s.errs[i]))]} role={s.role} r={4} />
            ))}
            <Label
              at={s.labelAt === "last" ? [lg(s.xs[s.xs.length - 1]), lg(Math.abs(s.errs[s.errs.length - 1]))] : [lg(s.xs[0]), lg(Math.abs(s.errs[0]))]}
              text={`${s.name}: slope ${neg(f2(s.slope))}`}
              role={s.role === "ink" ? undefined : s.role}
              dx={s.labelAt === "last" ? -10 : 10}
              dy={s.dy ?? -8}
              anchor={s.labelAt === "last" ? "end" : "start"}
            />
          </g>
        );
      })}
    </Plot>
  );
}
function LogTicks({ xs, ys, xLabel }: { xs: number[]; ys: number[]; xLabel: string }) {
  const { x, y, inner } = usePlot();
  return (
    <g>
      {xs.map((v) => (
        <text key={v} className="label f1-ticklabel" x={x(lg(v))} y={inner.top + inner.height - 4} textAnchor="middle">
          {v}
        </text>
      ))}
      <text className="label f1-ticklabel" x={inner.left + inner.width} y={inner.top + inner.height - 4} textAnchor="end">
        {xLabel}
      </text>
      {ys.map((v) => (
        <g key={v}>
          <line x1={inner.left} x2={inner.left + inner.width} y1={y(lg(v))} y2={y(lg(v))} className="f1-tick" />
          <text className="label f1-ticklabel" x={inner.left + 4} y={y(lg(v)) - 2}>
            {`₹${v}`}
          </text>
        </g>
      ))}
    </g>
  );
}

export function F2Schemes() {
  const narrow = useNarrow();
  const [scheme, setScheme] = useState<Scheme>("cn");
  const [mi, setMi] = useState(LADDER_M.length - 1);
  const ladder = useLazy(`ladder:${scheme}`, () => getLadder(scheme));
  const cur = ladder ? ladder[mi] : null;
  const dF = ERR_DF;
  const dT = ERR_DT;
  const last = (s: Scheme) => KEY.schemes[s][KEY.schemes[s].length - 1];

  return (
    <Figure
      n="2"
      prompt={
        <>
          Three ways to take the same step. <strong>Explicit</strong>: tomorrow from today's neighbours, at the largest step it can stand. <strong>Implicit</strong>: today's values solved
          together, so each agrees with its own neighbours' pull. <strong>Crank–Nicolson</strong>: half of each. Pick one, then coarsen and refine the grid.
        </>
      }
      controls={
        <>
          <Segmented<Scheme> label="scheme" options={[{ id: "explicit", label: "explicit" }, { id: "implicit", label: "implicit" }, { id: "cn", label: "Crank–Nicolson" }]} value={scheme} onChange={setScheme} />
          <Slider label="grid points" value={mi} min={0} max={LADDER_M.length - 1} step={1} onChange={setMi} fmt={() => String(LADDER_M[mi])} />
          <Readouts items={[["price", cur ? n2(cur.price) : "…"], [`error vs ${n2(TRUTH)}`, cur ? err(cur.error) : "…"], ["steps", cur ? count(cur.N) : "…"]]} />
        </>
      }
      observe={
        <>
          All three close on the formula, at different speeds. On 800 points the explicit scheme needs {count(last("explicit").N)} steps to stay under its limit and lands at {n2(last("explicit").price)}; implicit
          with {last("implicit").N} steps reads {n2(last("implicit").price)} ({s2(last("implicit").error)}); Crank–Nicolson with the same {last("cn").N} steps, {last("cn").price.toFixed(3)} ({err(last("cn").error)}) (key). Against the grid
          spacing, with the time error pinned by 400 steps, the fitted slopes are explicit {neg(f2(SLOPES.dF.explicit))}, Crank–Nicolson {neg(f2(SLOPES.dF.cn))}, implicit {neg(f2(SLOPES.dF.implicit))} — its
          first-order time error floors it. Against the time step on 800 points: implicit {neg(f2(SLOPES.dt.implicit))}, the textbook 1. Crank–Nicolson alone {neg(f2(SLOPES.dt.cn))}: with two steps it is{" "}
          {n2(Math.abs(dT.cn[0].error))} rupees off, because the corner at the strike rings; with the first step taken as two implicit half-steps (Rannacher) {n2(Math.abs(dT.cn_rannacher[0].error))}, and the
          slope is {neg(f2(SLOPES.dt.cn_rannacher))} — faster than first order, short of the textbook 2 a smooth payoff would give (key). Put–call parity holds on the same grid to{" "}
          {(KEY.parity.max_abs * 1e6).toFixed(1)} millionths of a rupee (key).
        </>
      }
    >
      <div className="f1-schemes">
        <div className="f1-panel">
          <div className="f1-panel-title">
            <strong>{SCHEME_NAME[scheme]}</strong> <span>the price at each grid size; {scheme === "explicit" ? "steps as many as the stability limit demands" : scheme === "cn" ? "steps = points ÷ 9 (at least 11), the first as two implicit half-steps" : "steps = points ÷ 9 (at least 11)"}; the dial's rung is bold</span>
          </div>
          {ladder ? <Ladder rungs={ladder} cur={mi} scheme={scheme} narrow={narrow} /> : <div className="f1-wait">solving the ladder…</div>}
        </div>
        <div className="f1-schemes-two">
          <div className="f1-panel">
            <div className="f1-panel-title">
              <strong>A · error against grid spacing</strong> <span>|price − {n2(TRUTH)}| on log axes, 400 steps for all three (key)</span>
            </div>
            <LogPanel
              narrow={narrow}
              X={[36, 560]}
              Y={[0.002, 6]}
              xTicks={[50, 100, 200]}
              yTicks={[0.01, 0.1, 1]}
              xLabel="400 grid points"
              series={[
                { name: "explicit", role: "approx", xs: dF.explicit.map((e) => e.M), errs: dF.explicit.map((e) => e.error), slope: SLOPES.dF.explicit, labelAt: "last" },
                { name: "implicit", role: "ink", xs: dF.implicit.map((e) => e.M), errs: dF.implicit.map((e) => e.error), slope: SLOPES.dF.implicit, labelAt: "last" },
                { name: "Crank–Nicolson", role: "truth", xs: dF.cn.map((e) => e.M), errs: dF.cn.map((e) => e.error), slope: SLOPES.dF.cn, labelAt: "last" },
              ]}
              aria="error against grid points on log axes for the three schemes: straight lines of slope about minus two or steeper"
            />
          </div>
          <div className="f1-panel">
            <div className="f1-panel-title">
              <strong>B · error against the time step</strong> <span>800 points, 2 → 32 steps (key)</span>
            </div>
            <LogPanel
              narrow={narrow}
              X={[1.5, 44]}
              Y={[0.005, 160]}
              xTicks={[2, 4, 8, 16]}
              yTicks={[0.01, 0.1, 1, 10]}
              xLabel="32 steps"
              series={[
                { name: "implicit", role: "ink", xs: dT.implicit.map((e) => e.N), errs: dT.implicit.map((e) => e.error), slope: SLOPES.dt.implicit, labelAt: "first", dy: 22 },
                { name: "Crank–Nicolson, no half-steps (rings at the corner)", role: "error", xs: dT.cn.map((e) => e.N), errs: dT.cn.map((e) => e.error), slope: SLOPES.dt.cn, labelAt: "first", dy: -12 },
                { name: "Crank–Nicolson + Rannacher", role: "truth", xs: dT.cn_rannacher.map((e) => e.N), errs: dT.cn_rannacher.map((e) => e.error), slope: SLOPES.dt.cn_rannacher, labelAt: "first", dy: -8 },
              ]}
              aria="error against number of time steps on log axes: implicit slope about minus one, Crank–Nicolson with a Rannacher start steeper, Crank–Nicolson alone high and ringing"
            />
          </div>
        </div>
      </div>
    </Figure>
  );
}
