import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { CovEllipse, Plot, Points, fmt, usePlot, type Pt } from "../../../ui/Plot";
import { Slider, Toggle } from "../../../ui/controls";
import { normalSample, rng } from "../../../engine/random";
import { correlation, covariance } from "../../../engine/linalg";
import { M } from "../../../ui/Math";

const N = 400;

/** The cloud machine: independent noise, sheared by ρ; the same points slide. One slider, one readout. */
export function F1Cloud() {
  const [rho, setRho] = useState(0.6);
  const [rects, setRects] = useState(false);
  const z = useMemo(() => {
    const r = rng(42);
    return Array.from({ length: N }, () => [normalSample(r), normalSample(r)] as Pt);
  }, []);
  const q = Math.sqrt(1 - rho * rho);
  const pts: Pt[] = useMemo(() => z.map(([a, b]) => [a, rho * a + q * b]), [z, rho, q]);
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]);
  const rMeasured = correlation(xs, ys);
  const cov = covariance(xs, ys);
  const L = [
    [1, 0],
    [rho, q],
  ];

  return (
    <Figure
      n="1"
      prompt={<>The cloud machine. Four hundred dots of plain noise; the slider pushes them sideways. Watch the red dot — it keeps its identity.</>}
      controls={
        <>
          <Slider label="ρ, the correlation" value={rho} min={-0.98} max={0.98} step={0.01} onChange={setRho} role="approx" width={240} />
          <span className="readouts">
            <span>
              <span className="k">tilt measured from the dots </span>
              <span className="v">{fmt.n(2)(rMeasured)}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          <p style={{ margin: 0 }}>
            The grey cloud is plain independent noise. Slide ρ and each grey dot slides to its amber place: y borrows a share ρ of x and keeps the rest of
            itself. That sliding is a <strong>shear</strong>, and the tilt it leaves behind is the correlation. The outline is where a typical dot lands.
          </p>
          <details className="a2-more">
            <summary>more: the recipe, and what covariance is</summary>
            <M block tex="x = z_1, \qquad y = \tok{approx}{\rho}\,z_1 + \sqrt{1-\tok{approx}{\rho}^{2}}\;z_2 \qquad\Rightarrow\qquad \operatorname{corr}(x, y) = \rho" />
            <p>
              The second coordinate borrows a share ρ of the first and tops up with just enough fresh noise to keep its spread at 1. The square root is the
              top-up.
            </p>
            <p style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem", alignItems: "center" }}>
              <Toggle label="draw the covariance rectangles" on={rects} onChange={setRects} />
              <span className="readouts">
                <span>
                  <span className="k">covariance </span>
                  <span className="v">{fmt.n(2)(cov)}</span>
                </span>
              </span>
            </p>
            <p>
              Each dot draws a box from the centre: blue where x and y lean the same way, rose where they lean opposite ways. The <strong>covariance</strong> is
              the average signed area. Correlation is covariance with the units divided out, so it always sits between −1 and 1.
            </p>
          </details>
        </>
      }
    >
      <Plot xDomain={[-3.5, 3.5]} yDomain={[-3.5, 3.5]} xLabel="x" yLabel="y" height={400} width={720} ariaLabel="A sheared cloud of points">
        {rects && <CovRects pts={pts.slice(0, 120)} />}
        <Points pts={z} role="ghost" r={2} opacity={0.35} />
        <Points pts={pts} role="approx" r={2.6} opacity={0.65} />
        <CovEllipse L={L} k={1} role="ink" />
        <Points pts={[z[0]]} role="error" r={4} opacity={0.4} />
        <Points pts={[pts[0]]} role="error" r={5} opacity={1} />
      </Plot>
    </Figure>
  );
}

function CovRects({ pts }: { pts: Pt[] }) {
  const { x, y } = usePlot();
  return (
    <g>
      {pts.map((p, i) => {
        const pos = p[0] * p[1] > 0;
        return <rect key={i} x={Math.min(x(0), x(p[0]))} y={Math.min(y(0), y(p[1]))} width={Math.abs(x(p[0]) - x(0))} height={Math.abs(y(p[1]) - y(0))} fill={pos ? "var(--truth)" : "var(--error)"} opacity={0.045} />;
      })}
    </g>
  );
}
