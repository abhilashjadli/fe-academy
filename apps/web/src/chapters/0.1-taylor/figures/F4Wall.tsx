import { useMemo, useState } from "react";
import { FUNCTIONS, partialSums, sample, taylor } from "../../../engine/taylor";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Marker, Plot, VLine, usePlot, type Pt } from "../../../ui/Plot";
import { Slider, Stepper } from "../../../ui/controls";

const f = FUNCTIONS.ln;
const A = 1; // centre
const MAX_TERMS = 14;

/** The no-go zone past the wall, drawn inside the plot. */
function Wall({ from, to }: { from: number; to: number }) {
  const { x, inner } = usePlot();
  const x0 = Math.min(x(from), x(to));
  const x1 = Math.max(x(from), x(to));
  return <rect className="t-wall" x={x0} y={inner.top} width={x1 - x0} height={inner.height} />;
}

/**
 * One picture: the curve ln x, the centre at 1, the wall at x = 2 (as far from the centre as x = 0, where ln x blows up),
 * and the running totals of the series stacked at wherever you stand — closing in inside the wall, bouncing outside it.
 */
export function F4Wall() {
  const [x, setX] = useState(1.5);
  const [n, setN] = useState(6);
  const truth = useMemo(() => sample((t) => Math.log(t), 0.03, 3.2, 241), []);
  const poly = useMemo(() => sample((t) => taylor(f, n, A, t), 0.03, 3.2, 241), [n]);
  const sums = useMemo(() => partialSums(f, MAX_TERMS, A, x), [x]);
  const dots: Pt[] = sums.slice(1, n + 1).map((s) => [x, s]);
  const inside = x > 0 && x <= 2;
  const target = Math.log(x);
  const last = sums[n];
  const role = inside ? "approx" : "error";

  return (
    <Figure
      n="4"
      prompt={
        <>
          Walk away from the centre. The running totals of the series — one term, two terms, three… — are the dots stacked where you stand. Cross the wall at x = 2 and
          watch them bounce.
        </>
      }
      controls={
        <>
          <Slider label="where you stand, x" value={x} min={0.2} max={3} step={0.05} onChange={setX} />
          <Stepper label="terms" value={n} min={1} max={MAX_TERMS} onChange={setN} />
          <span className="readouts">
            <span>
              <span className="k">after {n} terms </span>
              <span className={"v tok-" + role}>{Math.abs(last) < 100 ? last.toFixed(3) : last > 0 ? "far above the chart" : "far below the chart"}</span>
              <span className="k"> · ln {x.toFixed(2)} = </span>
              <span className="v tok-truth">{target.toFixed(3)}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          Inside the wall the dots close in on <span className="tok-truth">ln x</span>: more terms, better. Past x = 2 they bounce ever wider — <span className="tok-error">more terms make it worse</span>. The wall stands
          exactly as far from the centre as x = 0, where ln x itself blows up. No number of terms crosses it.
          <details className="t-more">
            <summary>and for eˣ there is no wall</summary>
            <p>
              Stand at x = 1 and add the terms of eˣ: 1, 2, 2.5, 2.667, 2.708, 2.717, 2.718… The digits freeze from the left, because each new term is smaller than the last by a
              bigger factor. Every x works. The distance from the centre to the nearest trouble spot is called the radius: for ln x about 1 it is 1; for eˣ and cos x it is
              infinite.
            </p>
          </details>
        </>
      }
    >
      <Plot xDomain={[0, 3.2]} yDomain={[-3, 2]} xLabel="x" height={340} xTicks={7} axisX={0} ariaLabel="ln x with its centre, its wall, and the running totals of its series at a chosen x">
        <Wall from={2} to={3.2} />
        <VLine at={2} role="error" />
        <VLine at={0.001} role="error" />
        <Label at={[2, 1.9]} text="the wall" role="error" dx={6} dy={6} />
        <Label at={[0.02, 1.9]} text="ln x blows up here" role="error" dx={6} dy={6} />
        <Curve pts={poly} role="approx" opacity={0.55} />
        <Curve pts={truth} role="truth" />
        <VLine at={A} />
        <Marker at={[A, 0]} role="ink" r={6} />
        <Label at={[A, 0]} text="centre" dx={8} dy={16} />
        <VLine at={x} />
        <Curve pts={dots} role={role} smooth={false} width={1.5} opacity={0.9} />
        {dots.map((p, i) => (
          <Marker key={i} at={p} role={role} r={i === dots.length - 1 ? 5 : 3.2} />
        ))}
        <Marker at={[x, target]} role="truth" r={4} />
      </Plot>
    </Figure>
  );
}
