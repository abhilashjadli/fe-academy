import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { CovEllipse, DirLine, Plot, Points, fmt, usePlot, type Pt } from "../../../ui/Plot";
import { Slider, Toggle } from "../../../ui/controls";
import { normalSample, rng } from "../../../engine/random";
import { correlation, covariance, symEigen } from "../../../engine/linalg";
import { M } from "../../../ui/Math";

const N = 400;

/** The cloud machine: independent noise, sheared by ρ; the same points slide. */
export function F1Cloud() {
  const [rho, setRho] = useState(0.6);
  const [rects, setRects] = useState(false);
  const [ellipse, setEllipse] = useState(true);
  const [ghost, setGhost] = useState(true);
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
  const e = symEigen([
    [1, rho],
    [rho, 1],
  ]);

  return (
    <Figure
      n="1"
      prompt={<>The cloud machine. Four hundred points of independent noise; the slider shears them. Every point keeps its identity — watch one slide.</>}
      controls={
        <>
          <Slider label="ρ" value={rho} min={-0.98} max={0.98} step={0.01} onChange={setRho} role="approx" width={220} />
          <Toggle label="ghost: the unsheared cloud" on={ghost} onChange={setGhost} />
          <Toggle label="covariance rectangles" on={rects} onChange={setRects} />
          <Toggle label="ellipse and its axes" on={ellipse} onChange={setEllipse} />
          <span className="readouts">
            <span>
              <span className="k">measured correlation </span>
              <span className="v">{fmt.n(3)(rMeasured)}</span>
            </span>
            <span>
              <span className="k">covariance </span>
              <span className="v">{fmt.n(3)(cov)}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          <M block tex="x = z_1, \qquad y = \tok{approx}{\rho}\,z_1 + \sqrt{1-\tok{approx}{\rho}^{2}}\;z_2 \qquad\Rightarrow\qquad \operatorname{corr}(x, y) = \rho" />
          <p style={{ margin: 0 }}>
            The second coordinate borrows a share ρ of the first and tops up with just enough fresh noise to keep its variance at 1. That is all correlation is
            geometrically: a <strong>shear</strong> of a round cloud. Switch on the rectangles: each point draws a box from the centre, blue where x and y
            deviate the same way, rose where they deviate oppositely; the covariance is the average signed area, and correlation is covariance with the units
            divided out. Switch on the ellipse: its long axis is the cloud's direction, the subject of Figure 3.
          </p>
        </>
      }
    >
      <Plot xDomain={[-3.5, 3.5]} yDomain={[-3.5, 3.5]} xLabel="x" yLabel="y" height={400} width={720} ariaLabel="A sheared cloud of points">
        {rects && <CovRects pts={pts.slice(0, 120)} />}
        {ghost && <Points pts={z} role="ghost" r={2} opacity={0.35} />}
        <Points pts={pts} role="approx" r={2.6} opacity={0.65} />
        {ellipse && (
          <>
            <CovEllipse L={L} k={1} role="ink" />
            <CovEllipse L={L} k={2} role="ink" dash="4 3" />
            <DirLine u={e.vectors[0]} role="truth" width={1.5} />
            <DirLine u={e.vectors[1]} role="truth" width={1} />
          </>
        )}
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
