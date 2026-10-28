import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Bet, ResultCard, useBet } from "../../../ui/Bet";
import { CovEllipse, Curve, DirLine, Marker, Plot, Points, fmt, type Pt } from "../../../ui/Plot";
import { Toggle } from "../../../ui/controls";
import { normalSample, rng } from "../../../engine/random";
import { cholesky, projectionVariance, symEigen } from "../../../engine/linalg";
import { M } from "../../../ui/Math";

const S = [
  [4, 2],
  [2, 3],
];

type Pick = "along" | "across" | "same";

/** The cloud's own axes: drag a line through the cloud; the spread along it peaks at PC1. */
export function F3PCA() {
  const [pick, setPick] = useBet<Pick>("A2-F3");
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
  const pc1 = Math.atan2(e.vectors[0][1], e.vectors[0][0]);
  const pc2 = Math.atan2(e.vectors[1][1], e.vectors[1][0]);
  const total = S[0][0] + S[1][1];
  const n1 = fmt.n(1);

  return (
    <Figure
      n="3"
      prompt={<>A tilted cloud. The readout is how spread out the dots are along the line you drag. Bet first, then drag.</>}
      controls={
        pick && (
          <>
            <span className="toggle-row">
              <button type="button" className="btn" onClick={() => setTheta(pc1)}>
                jump to the peak
              </button>
              <button type="button" className="btn" onClick={() => setTheta(pc2)}>
                jump to the trough
              </button>
            </span>
            <Toggle label="drop the dots onto the line" on={proj} onChange={setProj} />
            <span className="readouts">
              <span>
                <span className="k">angle </span>
                <span className="v">{fmt.n(0)(thetaDeg)}°</span>
              </span>
              <span>
                <span className="k">spread along the line </span>
                <span className="v">{n1(v)}</span>
              </span>
              <span>
                <span className="k">of a total </span>
                <span className="v">{n1(total)}</span>
              </span>
            </span>
          </>
        )
      }
      observe={
        pick && (
          <>
            <p style={{ margin: 0 }}>
              Turn the line until the readout peaks: that is the cloud's long axis, and the spread there, {n1(e.values[0])} out of {n1(total)}, is most of the
              cloud. The short axis gets the rest. Those two directions are called the <strong>principal components</strong>; the two spreads are the{" "}
              <strong>eigenvalues</strong>. If "eigenvalue" makes you nervous: it is the readout at the peak.
            </p>
            <details className="a2-more">
              <summary>more: the formula the readout computes</summary>
              <M block tex={`\\Sigma = \\begin{pmatrix} 4 & 2 \\\\ 2 & 3 \\end{pmatrix}, \\qquad \\operatorname{Var}(u^{\\mathsf T}X) = u^{\\mathsf T}\\Sigma u, \\qquad \\lambda_1 = ${fmt.n(2)(e.values[0])},\\; \\lambda_2 = ${fmt.n(2)(e.values[1])},\\; \\lambda_1 + \\lambda_2 = 7`} />
              <p>
                u is the direction of your line (a unit vector), Σ the covariance table, and uᵀΣu the spread of the dots dropped onto the line. The peak and
                the trough are at right angles, the two spreads add up to the total, and the first one alone holds {fmt.pct(0)(e.values[0] / total)} of it.
                With sixty variables instead of two the same recipe still finds the long axis — that is why anyone bothers.
              </p>
            </details>
          </>
        )
      }
    >
      <Bet
        question="Where is the spread of the dots largest?"
        options={[
          { id: "along", label: "along the tilt" },
          { id: "across", label: "across it" },
          { id: "same", label: "the same everywhere" },
        ]}
        pick={pick}
        onPick={setPick}
      >
        <div className="two" style={{ gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", marginTop: "0.5rem" }}>
          <Plot xDomain={[-6, 6]} yDomain={[-6, 6]} width={460} height={380} xTicks={6} yTicks={6} onDrag={(x, y) => setTheta(Math.atan2(y, x))} ariaLabel="A cloud with a draggable direction line">
            <Points pts={pts} role="approx" r={2.4} opacity={0.5} />
            <CovEllipse L={L} k={1} role="ink" />
            <CovEllipse L={L} k={2} role="ink" dash="4 3" />
            <DirLine u={e.vectors[0]} role="ghost" width={1} />
            <DirLine u={e.vectors[1]} role="ghost" width={1} />
            <DirLine u={u} role="truth" width={2.5} />
            {proj &&
              pts.slice(0, 120).map((p, i) => {
                const s = p[0] * u[0] + p[1] * u[1];
                return <Marker key={i} at={[s * u[0], s * u[1]]} role="truth" r={2} />;
              })}
          </Plot>
          <Plot xDomain={[-90, 90]} yDomain={[0, 6]} width={380} height={380} xLabel="angle of the line, °" yLabel="spread along it" xTicks={5} yTicks={4} ariaLabel="Spread along the line versus its angle">
            <Curve pts={curve} role="truth" />
            <Marker at={[thetaDeg, v]} role="truth" r={6} />
          </Plot>
        </div>
        <ResultCard
          yours={pick === "along" ? "along the tilt" : pick === "across" ? "across it" : "the same everywhere"}
          answer={`along the tilt — the readout peaks at ${n1(e.values[0])} of ${n1(total)} there`}
          verdict={pick === "along" ? "right" : "miss"}
        >
          Drag the blue line and watch the wave on the right: one hump, one dip. The hump is the long axis of the cloud. Dots dropped onto that line spread
          out the most; dropped onto the line at right angles, the least.
        </ResultCard>
      </Bet>
    </Figure>
  );
}
