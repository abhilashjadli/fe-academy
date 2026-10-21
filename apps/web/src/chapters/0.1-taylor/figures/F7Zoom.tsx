import { useMemo, useState } from "react";
import { FUNCTIONS, sample, taylor } from "../../../engine/taylor";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Marker, Plot, fmt, type Pt } from "../../../ui/Plot";
import { Slider } from "../../../ui/controls";

const f = FUNCTIONS.exp;
const A = 0;

/** Zoom until the curve is straight; then measure how the error shrinks with the step. */
export function F7Zoom() {
  const [w, setW] = useState(2.4); // half-width of the window
  const dom: [number, number] = [A - w, A + w];
  const truth = useMemo(() => sample((x) => f.deriv(0, x), dom[0], dom[1], 161), [w]);
  const p1 = useMemo(() => sample((x) => taylor(f, 1, A, x), dom[0], dom[1], 2), [w]);
  const p2 = useMemo(() => sample((x) => taylor(f, 2, A, x), dom[0], dom[1], 161), [w]);
  const yc = f.deriv(0, A);
  const yr = Math.max(0.1, (f.deriv(0, A + w) - f.deriv(0, A - w)) * 0.65);
  const ydom: [number, number] = [yc - yr, yc + yr];

  // measured panel: |error| vs step, log-log, for P0, P1, P2
  const steps = [0.4, 0.2, 0.1, 0.05, 0.025, 0.0125];
  const errs = (n: number): Pt[] => steps.map((h) => [Math.log10(h), Math.log10(Math.abs(f.deriv(0, A + h) - taylor(f, n, A, A + h)))]);
  const slope = (pts: Pt[]) => {
    const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const num = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0);
    const den = pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
    return num / den;
  };
  const e0 = errs(0),
    e1 = errs(1),
    e2 = errs(2);
  const sl = [slope(e0), slope(e1), slope(e2)];
  const sliderStep = w;

  return (
    <Figure
      n="7"
      prompt={<>Zoom in until the curve looks straight; zoom out until the bend shows. Then look at how fast each approximation's error shrinks.</>}
      controls={
        <>
          <Slider label="window half-width" value={w} min={0.05} max={2.4} step={0.05} onChange={setW} fmt={(v) => v.toFixed(2)} />
          <span className="readouts">
            <span>
              <span className="k">measured slopes: </span>
              <span className="v tok-ghost">P₀ {sl[0].toFixed(2)}</span> <span className="v tok-ghost">P₁ {sl[1].toFixed(2)}</span> <span className="v tok-approx">P₂ {sl[2].toFixed(2)}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          Zoomed in, the tangent line is all you need: first order. Zoomed out, the gap between the line and the curve is a parabola: second order. The right panel measures it — on log–log axes the error of Pₙ is a straight line of slope n + 1, so halving the step divides the first-order error by 4 and the second-order error by 8. In symbols, the error of Pₙ behaves like (x − a)ⁿ⁺¹ times the next derivative over (n + 1)!.
          <div className="footnote" style={{ marginTop: "0.5em" }}>
            Exactly: f(x) − Pₙ(x) = f⁽ⁿ⁺¹⁾(ξ)/(n+1)! · (x − a)ⁿ⁺¹ for some ξ between a and x (Lagrange's form of the remainder).
          </div>
        </>
      }
    >
      <div className="two">
        <Plot xDomain={dom} yDomain={ydom} xLabel="x" width={440} height={280} xTicks={5} ariaLabel="Zooming into e^x at 0 with its tangent and quadratic">
          <Curve pts={p1} role="ghost" dash="5 4" smooth={false} />
          <Curve pts={p2} role="approx" />
          <Curve pts={truth} role="truth" />
          <Marker at={[A, yc]} role="ink" r={4} />
          <Label at={[A + sliderStep * 0.9, taylor(f, 1, A, A + sliderStep * 0.9)]} text="tangent" role="ghost" dx={-4} dy={14} anchor="end" />
        </Plot>
        <Plot xDomain={[-2, -0.3]} yDomain={[-8, 0.6]} xLabel="log₁₀ step" yLabel="log₁₀ |error|" width={440} height={280} xTicks={4} ariaLabel="Error versus step size on log-log axes">
          <Curve pts={e0} role="ghost" smooth={false} />
          <Curve pts={e1} role="ghost" smooth={false} dash="5 4" />
          <Curve pts={e2} role="approx" smooth={false} />
          {e0.map((p, i) => (
            <Marker key={"a" + i} at={p} role="ghost" r={3} />
          ))}
          {e1.map((p, i) => (
            <Marker key={"b" + i} at={p} role="ghost" r={3} />
          ))}
          {e2.map((p, i) => (
            <Marker key={"c" + i} at={p} role="approx" r={3} />
          ))}
          <Label at={e0[5]} text={`P₀, slope ${sl[0].toFixed(1)}`} role="ghost" dx={8} dy={-8} />
          <Label at={e1[5]} text={`P₁, slope ${sl[1].toFixed(1)}`} role="ghost" dx={8} dy={-8} />
          <Label at={e2[5]} text={`P₂, slope ${sl[2].toFixed(1)}`} role="approx" dx={8} dy={-8} />
        </Plot>
      </div>
      <div className="footnote" style={{ padding: "0.3rem 0.5rem 0" }}>
        Left: eˣ about 0 (cos would hide the first-order line, since its slope at 0 is zero). Right: steps 0.4 → 0.0125, errors {fmt.sci(Math.abs(f.deriv(0, 0.4) - taylor(f, 2, 0, 0.4)))} down to{" "}
        {fmt.sci(Math.abs(f.deriv(0, 0.0125) - taylor(f, 2, 0, 0.0125)))} for P₂.
      </div>
    </Figure>
  );
}
