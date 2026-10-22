import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { CovEllipse, Curve, DirLine, Marker, Plot, Points, fmt, type Pt } from "../../../ui/Plot";
import { Toggle } from "../../../ui/controls";
import { normalSample, rng } from "../../../engine/random";
import { cholesky, projectionVariance, symEigen } from "../../../engine/linalg";
import { M } from "../../../ui/Math";

const S = [
  [4, 2],
  [2, 3],
];

/** The ellipse's own axes: drag a line through the cloud; the variance of the projection peaks at PC1. */
export function F3PCA() {
  const [theta, setTheta] = useState(0.3);
  const [proj, setProj] = useState(true);
  const L = useMemo(() => cholesky(S), []);
  const e = useMemo(() => symEigen(S), []);
  const pts = useMemo(() => {
    const r = rng(77);
    return Array.from({ length: 350 }, () => {
      const a = normalSample(r),
        b = normalSample(r);
      return [L[0][0] * a, L[1][0] * a + L[1][1] * b] as Pt;
    });
  }, [L]);
  const u = [Math.cos(theta), Math.sin(theta)];
  const v = projectionVariance(S, u);
  const curve: Pt[] = useMemo(() => Array.from({ length: 181 }, (_, i) => [(-90 + i) as number, projectionVariance(S, [Math.cos(((-90 + i) * Math.PI) / 180), Math.sin(((-90 + i) * Math.PI) / 180)])]), []);
  const thetaDeg = ((theta * 180) / Math.PI + 90) % 180 - 90;
  const pc1Deg = (Math.atan2(e.vectors[0][1], e.vectors[0][0]) * 180) / Math.PI;
  const total = S[0][0] + S[1][1];

  return (
    <Figure
      n="3"
      prompt={<>Drag the line through the cloud. The readout is the spread of the cloud along that line. Where is it largest?</>}
      controls={
        <>
          <span className="toggle-row">
            <button type="button" className="btn" onClick={() => setTheta(Math.atan2(e.vectors[0][1], e.vectors[0][0]))}>
              snap to PC1
            </button>
            <button type="button" className="btn" onClick={() => setTheta(Math.atan2(e.vectors[1][1], e.vectors[1][0]))}>
              snap to PC2
            </button>
          </span>
          <Toggle label="project the points onto the line" on={proj} onChange={setProj} />
          <span className="readouts">
            <span>
              <span className="k">angle </span>
              <span className="v">{fmt.n(1)(thetaDeg)}°</span>
            </span>
            <span>
              <span className="k">variance along the line </span>
              <span className="v">{fmt.n(3)(v)}</span>
            </span>
            <span>
              <span className="k">of a total </span>
              <span className="v">{fmt.n(1)(total)}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          <M block tex={`\\Sigma = \\begin{pmatrix} 4 & 2 \\\\ 2 & 3 \\end{pmatrix}, \\qquad \\operatorname{Var}(u^{\\mathsf T}X) = u^{\\mathsf T}\\Sigma u, \\qquad \\lambda_1 = ${fmt.n(3)(e.values[0])},\\; \\lambda_2 = ${fmt.n(3)(e.values[1])},\\; \\lambda_1 + \\lambda_2 = 7`} />
          <p style={{ margin: 0 }}>
            The spread along a direction u is uᵀΣu. As you turn the line the readout rises and falls like a wave, and its peak is at {fmt.n(1)(pc1Deg)}° — the
            long axis of the ellipse. That direction is the first <strong>principal component</strong>; the variance there, λ₁, is the largest eigenvalue of Σ;
            the perpendicular direction is the second, with the smallest. They are the directions in which Σ acts as a pure stretch (no shear), and
            together they carry all the variance: λ₁ + λ₂ equals the trace. PC1 explains {fmt.pct(1)(e.values[0] / total)} of the total — one direction
            for four-fifths of the picture, which is the whole appeal of PCA when there are sixty variables instead of two.
          </p>
        </>
      }
    >
      <div className="two" style={{ gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)" }}>
        <Plot xDomain={[-6, 6]} yDomain={[-6, 6]} width={460} height={380} xTicks={6} yTicks={6} onDrag={(x, y) => setTheta(Math.atan2(y, x))} ariaLabel="A cloud with a draggable direction line">
          <Points pts={pts} role="approx" r={2.4} opacity={0.5} />
          <CovEllipse L={L} k={1} role="ink" />
          <CovEllipse L={L} k={2} role="ink" dash="4 3" />
          <DirLine u={e.vectors[0]} role="ghost" width={1} />
          <DirLine u={e.vectors[1]} role="ghost" width={1} />
          <DirLine u={u} role="truth" width={2.5} />
          {proj && pts.slice(0, 120).map((p, i) => {
            const s = p[0] * u[0] + p[1] * u[1];
            return <Marker key={i} at={[s * u[0], s * u[1]]} role="truth" r={2} />;
          })}
        </Plot>
        <Plot xDomain={[-90, 90]} yDomain={[0, 6]} width={380} height={380} xLabel="angle of the line, °" yLabel="variance along it" xTicks={5} yTicks={4} ariaLabel="Variance of the projection versus angle">
          <Curve pts={curve} role="truth" />
          <Marker at={[thetaDeg, v]} role="truth" r={6} />
        </Plot>
      </div>
    </Figure>
  );
}
