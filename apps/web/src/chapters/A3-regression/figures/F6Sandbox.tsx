import { useMemo, useRef, useState } from "react";
import "./figures.css";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Plot, fmt, usePlot, type Pt } from "../../../ui/Plot";
import { Readouts, Toggle } from "../../../ui/controls";
import { ols } from "../../../engine/regression";
import { normalSample, rng } from "../../../engine/random";

const N = 12;
const DOM: [number, number] = [0, 10];
const n2 = fmt.n(2);

function freshCloud(seed: number): Pt[] {
  const r = rng(seed);
  return Array.from({ length: N }, (_, i) => {
    const x = 1 + (8 * i) / (N - 1) + 0.4 * normalSample(r);
    const y = 2 + 0.6 * x + 1.1 * normalSample(r);
    return [Math.max(0.3, Math.min(9.7, x)), Math.max(0.3, Math.min(9.7, y))] as Pt;
  });
}

/** The residual squares: side = |leftover|, drawn from the point to the line. Equal axes make them square. */
function Squares({ pts, fitted }: { pts: Pt[]; fitted: number[] }) {
  const { x, y } = usePlot();
  return (
    <g>
      {pts.map((p, i) => {
        const e = p[1] - fitted[i];
        const side = Math.abs(x(p[0] + e) - x(p[0]));
        const left = e >= 0 ? x(p[0]) - side : x(p[0]);
        const top = Math.min(y(p[1]), y(fitted[i]));
        return <rect key={i} className="a3-sq" x={left} y={top} width={side} height={side} />;
      })}
    </g>
  );
}

function Handles({ pts, held }: { pts: Pt[]; held: number | null }) {
  const { x, y } = usePlot();
  return (
    <g>
      {pts.map((p, i) => (
        <circle key={i} className={"a3-handle " + (held === i ? "held" : "")} cx={x(p[0])} cy={y(p[1])} r={held === i ? 8 : 6} />
      ))}
    </g>
  );
}

/** Use it yourself — twelve points you can drag; the line, the squares it minimises, and two "how sure" numbers. */
export function F6Sandbox() {
  const [seed, setSeed] = useState(12);
  const [pts, setPts] = useState<Pt[]>(() => freshCloud(12));
  const [held, setHeld] = useState<number | null>(null);
  const [squares, setSquares] = useState(true);
  const heldRef = useRef<number | null>(null);

  const fit = useMemo(
    () =>
      ols(
        pts.map((p) => p[0]),
        pts.map((p) => p[1]),
      ),
    [pts],
  );
  const line: Pt[] = [
    [DOM[0], fit.intercept + fit.slope * DOM[0]],
    [DOM[1], fit.intercept + fit.slope * DOM[1]],
  ];

  const onDrag = (dx: number, dy: number, phase: "down" | "move" | "up") => {
    if (phase === "down") {
      let best = -1,
        bd = Infinity;
      pts.forEach((p, i) => {
        const d = (p[0] - dx) ** 2 + (p[1] - dy) ** 2;
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      if (bd > 1.2 * 1.2) return;
      heldRef.current = best;
      setHeld(best);
      return;
    }
    const i = heldRef.current;
    if (i === null) return;
    if (phase === "up") {
      heldRef.current = null;
      setHeld(null);
      return;
    }
    const nx = Math.max(DOM[0], Math.min(DOM[1], dx)),
      ny = Math.max(DOM[0], Math.min(DOM[1], dy));
    setPts(pts.map((p, j) => (j === i ? [nx, ny] : p)));
  };

  const reset = (s: number) => {
    setSeed(s);
    setPts(freshCloud(s));
  };
  const ratio = fit.seHAC / fit.se;

  return (
    <Figure
      n="6"
      prompt={<>Twelve points. Drag any of them: the line follows, the squares it minimises resize, and both "how sure" numbers move. Make them disagree.</>}
      controls={
        <>
          <Toggle label="show the squares" on={squares} onChange={setSquares} />
          <button type="button" className="btn" onClick={() => reset(seed)}>
            reset points
          </button>
          <button type="button" className="btn" onClick={() => reset(seed + 1)}>
            new points
          </button>
          <Readouts
            items={[
              ["slope", n2(fit.slope)],
              ["intercept", n2(fit.intercept)],
              ["R²", n2(fit.r2)],
              ["naive SE", n2(fit.se)],
              ["honest SE (Newey–West)", <span key="hac" className={ratio > 1.5 ? "tok-error" : undefined}>{n2(fit.seHAC)}</span>],
            ]}
          />
        </>
      }
      observe={
        <>
          The line sits where the pink squares are smallest in total; that is all "least squares" means. Pull one point far out and the slope moves a little,
          the squares a lot. Line the leftovers up on one side in order and the honest SE leaves the naive one behind.
        </>
      }
    >
      <div className="a3-drag" style={{ maxWidth: 520, margin: "0 auto" }}>
        <Plot xDomain={DOM} yDomain={DOM} width={520} height={520} xTicks={5} yTicks={5} xLabel="x" yLabel="y" onDrag={onDrag} ariaLabel="Twelve draggable points with a least-squares line and residual squares">
          {squares && <Squares pts={pts} fitted={fit.fitted} />}
          <Curve pts={line} role="truth" width={2.2} smooth={false} />
          <Handles pts={pts} held={held} />
          <Label at={[DOM[1], line[1][1]]} text={`y = ${n2(fit.intercept)} + ${n2(fit.slope)} x`} role="truth" anchor="end" dx={-6} dy={line[1][1] > 8.5 ? 18 : -8} />
        </Plot>
      </div>
    </Figure>
  );
}
