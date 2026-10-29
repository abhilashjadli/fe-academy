import { useMemo } from "react";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Plot, Points, usePlot, type Pt } from "../../../ui/Plot";
import { M } from "../../../ui/Math";
import { ols } from "../../../engine/regression";

/** Figure 1 — the honest fit: one still picture of what "least squares" means and what OLS assumes. */
export function F1Honest() {
  const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const y = [3.4, 2.6, 7.9, 6.1, 11.8, 10.2, 15.9, 14.1, 17.2, 20.8];
  const f = useMemo(() => ols(x, y, 2), [x, y]);
  const pts: Pt[] = x.map((v, i) => [v, y[i]]);
  const line: Pt[] = [
    [0.5, f.intercept + f.slope * 0.5],
    [10.5, f.intercept + f.slope * 10.5],
  ];
  return (
    <Figure
      n="1"
      prompt="Ten points, one line. The line is the one that makes the shaded squares as small as possible in total — that is all 'least squares' means."
      observe={
        <>
          Two things come out: a <strong>slope</strong> (here {f.slope.toFixed(2)}) and a <strong>how-sure</strong> (± {(2 * f.se).toFixed(2)}). The how-sure is computed
          from the leftovers on the right — and it is only honest if they look like nothing: no fan, no runs, no wander. Everything that follows is a leftover
          that looks like something.
        </>
      }
    >
      <div className="two" style={{ gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)" }}>
        <Plot xDomain={[0, 11]} yDomain={[0, 22]} width={520} height={340} xLabel="x" yLabel="y" xTicks={5} yTicks={5} ariaLabel="Ten points with the least-squares line and residual squares">
          <ResidualSquares pts={pts} slope={f.slope} intercept={f.intercept} />
          <Curve pts={line} role="truth" width={2.5} smooth={false} />
          <Points pts={pts} role="ink" r={4} opacity={0.9} />
          <Label at={[7.5, f.intercept + f.slope * 7.5]} text={`slope ${f.slope.toFixed(2)}`} role="truth" dx={8} dy={-10} />
        </Plot>
        <div>
          <Plot xDomain={[0, 11]} yDomain={[-3, 3]} width={360} height={200} xLabel="x" yLabel="leftover" xTicks={5} yTicks={3} ariaLabel="The residuals: a flat band of noise">
            <Points pts={x.map((v, i) => [v, f.resid[i]] as Pt)} role="error" r={4} opacity={0.9} />
          </Plot>
          <div className="a3-formula">
            <M block tex="\text{slope} = \frac{\operatorname{cov}(x,y)}{\operatorname{var}(x)}" />
            <M block tex="\text{how-sure} \approx \pm\, 2\,\frac{\text{spread of leftovers}}{\sqrt{n}\,\text{spread of }x}" />
          </div>
        </div>
      </div>
    </Figure>
  );
}

function ResidualSquares({ pts, slope, intercept }: { pts: Pt[]; slope: number; intercept: number }) {
  const { x, y } = usePlot();
  return (
    <g>
      {pts.map(([px, py], i) => {
        const fy = intercept + slope * px;
        const e = py - fy;
        // a square of side |e| in y-units, drawn in data space as width equal in pixels to its height
        const h = Math.abs(y(py) - y(fy));
        const left = e > 0 ? x(px) - h : x(px);
        return <rect key={i} x={left} y={Math.min(y(py), y(fy))} width={h} height={h} fill="var(--error-soft)" stroke="var(--error)" strokeWidth={1} />;
      })}
    </g>
  );
}
