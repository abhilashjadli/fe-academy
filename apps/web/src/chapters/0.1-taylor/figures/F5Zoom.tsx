import { useEffect, useMemo, useRef, useState } from "react";
import { FUNCTIONS, sample, taylor } from "../../../engine/taylor";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Marker, Plot, type Pt } from "../../../ui/Plot";
import { Slider } from "../../../ui/controls";

const f = FUNCTIONS.exp;
const A = 0;
const W_MAX = 2.4;
const W_MIN = 0.04;

/** Zoom until the curve is straight. The measurement (log–log slopes) lives under "more". */
export function F5Zoom() {
  const [w, setW] = useState(W_MAX); // half-width of the window
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);

  // continuous zoom: shrink the window geometrically, then grow it back
  useEffect(() => {
    if (!playing) return;
    let dir = -1;
    let last = performance.now();
    const step = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      setW((cur) => {
        let nx = cur * Math.exp(dir * dt * 1.1);
        if (nx < W_MIN) {
          nx = W_MIN;
          dir = 1;
        }
        if (nx > W_MAX) {
          nx = W_MAX;
          setPlaying(false);
        }
        return nx;
      });
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const dom: [number, number] = [A - w, A + w];
  const truth = useMemo(() => sample((x) => f.deriv(0, x), dom[0], dom[1], 161), [w]);
  const p1 = useMemo(() => sample((x) => taylor(f, 1, A, x), dom[0], dom[1], 2), [w]);
  const p2 = useMemo(() => sample((x) => taylor(f, 2, A, x), dom[0], dom[1], 161), [w]);
  const yc = f.deriv(0, A);
  const yr = Math.max(0.03, (f.deriv(0, A + w) - f.deriv(0, A - w)) * 0.65);
  const ydom: [number, number] = [yc - yr, yc + yr];
  const gapAtEdge = f.deriv(0, A + w) - taylor(f, 1, A, A + w);

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
  const zoomFactor = W_MAX / w;

  return (
    <Figure
      n="5"
      prompt={<>Zoom in until the curve looks straight. Zoom out until the bend shows.</>}
      controls={
        <>
          <button type="button" className="btn primary" onClick={() => setPlaying((p) => !p)}>
            {playing ? "Stop" : "Zoom in, then out"}
          </button>
          <Slider label="zoom" value={Math.log(W_MAX / w)} min={0} max={Math.log(W_MAX / W_MIN)} step={0.01} onChange={(v) => { setPlaying(false); setW(W_MAX / Math.exp(v)); }} fmt={() => `${zoomFactor < 10 ? zoomFactor.toFixed(1) : Math.round(zoomFactor)}×`} />
          <span className="readouts">
            <span>
              <span className="k">at the edge of the window the line is off by </span>
              <span className="v tok-error">{gapAtEdge < 0.0005 ? "less than a thousandth" : gapAtEdge.toFixed(3)}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          Zoomed in, the dashed line is all you need: one term, the <strong>first-order</strong> guess. Zoom out and the gap between line and curve is a bowl — a parabola — which the
          second term fills. Keep n terms and the leftover error is about the size of the first term you threw away.
          <details className="t-more">
            <summary>measure it: how fast each error shrinks</summary>
            <p>
              Halve the step and the one-term error drops by 4, the two-term error by 8. On axes where both the step and the error are plotted as powers of ten, each polynomial's
              error is a straight line whose steepness is one more than its number of terms — measured here: P₀ {sl[0].toFixed(2)}, P₁ {sl[1].toFixed(2)}, P₂ {sl[2].toFixed(2)}.
            </p>
            <Plot xDomain={[-2, -0.3]} yDomain={[-8, 0.6]} xLabel="step (powers of ten)" yLabel="error (powers of ten)" width={520} height={260} xTicks={4} ariaLabel="Error versus step size on log-log axes">
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
              <Label at={e0[5]} text={`no terms, slope ${sl[0].toFixed(1)}`} role="ghost" dx={8} dy={-8} />
              <Label at={e1[5]} text={`the line, slope ${sl[1].toFixed(1)}`} role="ghost" dx={8} dy={-8} />
              <Label at={e2[5]} text={`the bend, slope ${sl[2].toFixed(1)}`} role="approx" dx={8} dy={-8} />
            </Plot>
            <p>
              Exactly: the error after n terms is the (n + 1)-th derivative, taken somewhere between the centre and x, divided by (n + 1)!, times (x − a)ⁿ⁺¹. That is the next
              term with its derivative evaluated at an unknown nearby point instead of at the centre.
            </p>
          </details>
        </>
      }
    >
      <Plot xDomain={dom} yDomain={ydom} xLabel="x" height={330} xTicks={5} ariaLabel="Zooming into e^x at 0 with its tangent and quadratic">
        <Curve pts={p1} role="ghost" dash="5 4" smooth={false} />
        <Curve pts={p2} role="approx" />
        <Curve pts={truth} role="truth" />
        <Marker at={[A, yc]} role="ink" r={4} />
        <Label at={[A + w * 0.9, taylor(f, 1, A, A + w * 0.9)]} text="the line" role="ghost" dx={-4} dy={14} anchor="end" />
        <Label at={[A - w * 0.9, f.deriv(0, A - w * 0.9)]} text="eˣ" role="truth" dx={4} dy={-8} />
        <Label at={[A + w * 0.55, taylor(f, 2, A, A + w * 0.55)]} text="the bend" role="approx" dx={0} dy={-10} anchor="middle" />
      </Plot>
    </Figure>
  );
}
