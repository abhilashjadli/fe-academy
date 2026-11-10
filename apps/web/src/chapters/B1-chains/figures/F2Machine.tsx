import "./figures.css";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Figure } from "../../../ui/Figure";
import { Readouts, Segmented } from "../../../ui/controls";
import { distributionPath, nStepDistribution, runningFraction, simulateChain } from "../../../engine/markov";
import { rng } from "../../../engine/random";
import { PSI_STAR, P_FIT, STATE_NAME, STATE_SHORT, f2, f3, type State } from "./rain";
import { DayStrip, stateClass } from "./strip";

/**
 * Figure 2 — drive the machine. The nine fractions become a three-state diagram with arrows as thick as their fraction
 * and one token. Hop: the token moves by the arrow it stands on and a new strip grows underneath. Six by hand, then
 * auto 1,000. Two instruments in words: what actually happened so far (running fraction per colour) and what you would
 * bet before looking (the law, a dot inside a triangle whose corners are the three states). Both settle at one point.
 */

const AUTO = 1000;
const NODE: Array<[number, number]> = [
  [64, 200],
  [256, 200],
  [160, 62],
];
const R = 22;

export function F2Machine() {
  const [start, setStart] = useState<State>(0);
  const [path, setPath] = useState<number[]>([0]);
  const [auto, setAuto] = useState(false);
  const gen = useRef<() => number>(rng(7));
  const raf = useRef(0);

  const reset = (s: State) => {
    cancelAnimationFrame(raf.current);
    setAuto(false);
    setStart(s);
    gen.current = rng(7 + s);
    setPath([s]);
  };
  const hop = (k = 1) =>
    setPath((p) => {
      const ext = simulateChain(P_FIT, k, p[p.length - 1], gen.current);
      return p.concat(ext.slice(1));
    });

  useEffect(() => {
    if (!auto) return;
    const target = path.length - 1 + AUTO;
    let count = path.length - 1;
    const tick = () => {
      const k = Math.min(7, target - count);
      if (k <= 0) {
        setAuto(false);
        return;
      }
      count += k;
      hop(k);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  const t = path.length - 1;
  const cur = path[t] as State;
  const sofar = useMemo(() => runningFraction(path, 3)[t], [path, t]);
  const e0 = [0, 0, 0].map((_, i) => (i === start ? 1 : 0));
  const law = useMemo(() => nStepDistribution(P_FIT, e0, t), [start, t]); // eslint-disable-line react-hooks/exhaustive-deps
  const trail = useMemo(() => distributionPath(P_FIT, e0, Math.min(t, 40)), [start, t]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = path.slice(Math.max(0, path.length - 120));

  return (
    <Figure
      n="2"
      prompt={
        <>
          Your nine fractions, drawn as a machine: three states, arrows as thick as their fraction, one token. <strong>Hop</strong> moves the token along an arrow it is
          standing on — it never looks at the strip — and a new strip grows underneath. Six by hand, then let it run.
        </>
      }
      controls={
        <>
          <span className="ctl">
            <span className="seg" role="group" aria-label="drive">
              <button type="button" disabled={auto} onClick={() => hop(1)}>
                hop
              </button>
              <button type="button" disabled={auto} onClick={() => setAuto(true)}>
                auto {AUTO.toLocaleString("en-US")}
              </button>
              <button type="button" disabled={auto || t === 0} onClick={() => reset(start)}>
                reset
              </button>
            </span>
          </span>
          <Segmented<"0" | "1" | "2"> label="start from" options={[{ id: "0", label: "dry" }, { id: "1", label: "some" }, { id: "2", label: "heavy" }]} value={String(start) as "0" | "1" | "2"} onChange={(v) => reset(Number(v) as State)} />
          <Readouts
            items={[
              ["hops", t.toLocaleString("en-US")],
              ["so far (dry · some · heavy)", sofar.map(f2).join(" · ")],
              ["the bet (law)", law.map(f3).join(" · ")],
            ]}
          />
        </>
      }
      observe={
        t === 0 ? (
          <>
            The token stands on {STATE_NAME[cur]}. Before you hop, the two instruments disagree completely: so far is all one colour, and the bet is a corner of the triangle.
            Hop six times.
          </>
        ) : t < 6 ? (
          <>
            One arrow was drawn from the row the token stood on — {STATE_SHORT[path[t - 1]]} → {STATE_SHORT[cur]}. The bet moved before you looked (it is arithmetic: today's law times
            the table); the "so far" moved after. Keep going.
          </>
        ) : t < 200 ? (
          <>
            <strong>Markov</strong> is the rule you just used six times: the next square is drawn from the row you are standing in, and nothing else — the hop reads the
            arrow, never the strip. Now auto {AUTO.toLocaleString("en-US")} and watch both instruments.
          </>
        ) : (
          <>
            The bet settled in about ten hops at ({PSI_STAR.map(f3).join(", ")}) — the fixed point of the table, the one law the table turns back into itself. The "so far" is
            still within a few hundredths of it and closes in slowly, like any average. Start from another corner: the bet ends in the same place. The strip forgets where it began.
          </>
        )
      }
    >
      <div className="b1-machine">
        <Diagram cur={cur} last={t > 0 ? (path[t - 1] as State) : null} />
        <div className="b1-instruments">
          <div className="b1-instr">
            <div className="b1-instr-head">what actually happened so far</div>
            <svg viewBox="0 0 240 78" className="b1-bars" role="img" aria-label="running fraction of hops spent in each state">
              {([0, 1, 2] as State[]).map((s) => (
                <g key={s} transform={`translate(0 ${s * 25})`}>
                  <text className="b1-barlabel" x={44} y={14} textAnchor="end">
                    {STATE_SHORT[s]}
                  </text>
                  <rect className="b1-bar-bg" x={50} y={4} width={180} height={13} rx={2} />
                  <rect className={"b1-bar " + stateClass(s)} x={50} y={4} width={180 * sofar[s]} height={13} rx={2} />
                  <line className="b1-fixed" x1={50 + 180 * PSI_STAR[s]} x2={50 + 180 * PSI_STAR[s]} y1={1} y2={20} />
                </g>
              ))}
            </svg>
            <div className="b1-instr-foot">ticks: the fixed point {PSI_STAR.map(f2).join(" · ")}</div>
          </div>
          <div className="b1-instr">
            <div className="b1-instr-head">what you would bet before looking</div>
            <Simplex law={law} trail={trail} />
            <div className="b1-instr-foot">the dot is the law after {t.toLocaleString("en-US")} hops; the hollow mark is the fixed point</div>
          </div>
        </div>
        <div className="b1-grown">
          <DayStrip states={shown} perRow={30} ariaLabel={`the strip the machine has grown so far, last ${shown.length} of ${t + 1} days`} mark={(i) => (i === shown.length - 1 ? "b1-today" : undefined)} />
          <div className="b1-hint">{t + 1 > 120 ? `the last 120 of ${(t + 1).toLocaleString("en-US")} days the machine has grown` : `${t + 1} day${t ? "s" : ""} grown by the machine`}</div>
        </div>
      </div>
    </Figure>
  );
}

/** an arrowhead at (ex, ey) pointing along the tangent from the control point */
function head(cx: number, cy: number, ex: number, ey: number, size: number): string {
  const dx = ex - cx,
    dy = ey - cy;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L,
    uy = dy / L;
  const bx = ex - ux * size * 1.8,
    by = ey - uy * size * 1.8;
  return `${ex},${ey} ${bx - uy * size},${by + ux * size} ${bx + uy * size},${by - ux * size}`;
}

/** Three nodes, six arrows and three loops, thickness by fraction; the token on `cur`; the row the token stands on is lit. */
function Diagram({ cur, last }: { cur: State; last: State | null }) {
  const arrows: ReactElement[] = [];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      const p = P_FIT[i][j];
      const lit = i === cur;
      const used = last !== null && last === i && cur === j;
      const cls = "b1-arrow " + (lit ? "lit " : "") + (used ? "used " : "") + stateClass(j);
      const sw = 0.8 + 9 * p;
      if (i === j) {
        const [x, y] = NODE[i];
        const out = i === 2 ? [0, -1] : i === 0 ? [-0.8, 0.6] : [0.8, 0.6];
        const cx = x + out[0] * (R + 16),
          cy = y + out[1] * (R + 16);
        arrows.push(
          <g key={`${i}${j}`} className={cls}>
            <circle cx={cx} cy={cy} r={14} fill="none" style={{ strokeWidth: sw }} />
            <text className="b1-arrowlabel" x={i === 2 ? cx + 20 : cx + out[0] * 24} y={i === 2 ? cy + 4 : cy + out[1] * 24 + 4} textAnchor={i === 2 ? "start" : "middle"}>
              {f2(p)}
            </text>
          </g>,
        );
      } else {
        const [x1, y1] = NODE[i],
          [x2, y2] = NODE[j];
        const dx = x2 - x1,
          dy = y2 - y1;
        const L = Math.hypot(dx, dy);
        const ux = dx / L,
          uy = dy / L;
        const nx = -uy,
          ny = ux; // left normal: i→j bows to one side, j→i to the other
        const sx = x1 + ux * R + nx * 7,
          sy = y1 + uy * R + ny * 7;
        const ex = x2 - ux * (R + 6) + nx * 7,
          ey = y2 - uy * (R + 6) + ny * 7;
        const mx = (sx + ex) / 2 + nx * 18,
          my = (sy + ey) / 2 + ny * 18;
        arrows.push(
          <g key={`${i}${j}`} className={cls}>
            <path d={`M${sx} ${sy} Q${mx} ${my} ${ex} ${ey}`} fill="none" style={{ strokeWidth: sw }} />
            <polygon className="b1-head" points={head(mx, my, ex, ey, 2.5 + sw * 0.5)} />
            <text className="b1-arrowlabel" x={(sx + 2 * mx + ex) / 4 + nx * 9} y={(sy + 2 * my + ey) / 4 + ny * 9 + 4} textAnchor="middle">
              {f2(p)}
            </text>
          </g>,
        );
      }
    }
  return (
    <svg className="b1-diagram" viewBox="0 0 320 256" role="img" aria-label={`Three-state diagram, token on ${STATE_NAME[cur]}`}>
      {arrows}
      {NODE.map(([x, y], s) => (
        <g key={s} className={"b1-node " + stateClass(s) + (s === cur ? " on" : "")}>
          <circle cx={x} cy={y} r={R} />
          <text x={x} y={y + 4} textAnchor="middle">
            {STATE_SHORT[s]}
          </text>
        </g>
      ))}
      <circle className="b1-token" cx={NODE[cur][0]} cy={NODE[cur][1] - R - 4} r={5} />
    </svg>
  );
}

/** The simplex as a readout: the law is a dot; the trail is where it has been; the fixed point is a hollow mark. */
function Simplex({ law, trail }: { law: number[]; trail: number[][] }) {
  const C: Array<[number, number]> = [
    [18, 100],
    [222, 100],
    [120, 12],
  ];
  const at = (psi: number[]): [number, number] => [psi[0] * C[0][0] + psi[1] * C[1][0] + psi[2] * C[2][0], psi[0] * C[0][1] + psi[1] * C[1][1] + psi[2] * C[2][1]];
  const [lx, ly] = at(law);
  const [fx, fy] = at(PSI_STAR);
  const d = trail.map((p, k) => (k === 0 ? "M" : "L") + at(p).join(" ")).join(" ");
  return (
    <svg viewBox="0 0 240 118" className="b1-simplex" role="img" aria-label={`the law as a point in the triangle: dry ${f3(law[0])}, some ${f3(law[1])}, heavy ${f3(law[2])}`}>
      <path className="b1-tri" d={`M${C[0].join(" ")} L${C[1].join(" ")} L${C[2].join(" ")} Z`} />
      <text className="b1-simplex-corner" x={C[0][0] - 2} y={C[0][1] + 12} textAnchor="start">
        all dry
      </text>
      <text className="b1-simplex-corner" x={C[1][0] + 2} y={C[1][1] + 12} textAnchor="end">
        all some
      </text>
      <text className="b1-simplex-corner" x={C[2][0]} y={C[2][1] - 3} textAnchor="middle">
        all heavy
      </text>
      <path className="b1-trail" d={d} />
      <circle className="b1-fixedpt" cx={fx} cy={fy} r={5} />
      <circle className="b1-lawdot" cx={lx} cy={ly} r={4} />
    </svg>
  );
}
