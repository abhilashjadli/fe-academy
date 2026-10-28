import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Plot, Points, fmt, type Pt } from "../../../ui/Plot";
import { Segmented } from "../../../ui/controls";
import { normalSample, rng } from "../../../engine/random";
import { correlation } from "../../../engine/linalg";

type Mode = "round" | "parabola" | "outlier";

/** Break it: zero correlation with total dependence; strong correlation made by one point. */
export function F6Break() {
  const [mode, setMode] = useState<Mode>("parabola");
  const pts = useMemo(() => {
    const r = rng(5);
    const base: Pt[] = Array.from({ length: 200 }, () => [normalSample(r), normalSample(r)]);
    if (mode === "round") return base;
    if (mode === "parabola") return base.map(([x]) => [x, x * x - 1 + 0.15 * normalSample(r)] as Pt);
    return [...base.map(([x, y]) => [0.6 * x, 0.6 * y] as Pt), [7, 7] as Pt];
  }, [mode]);
  const rho = correlation(pts.map((p) => p[0]), pts.map((p) => p[1]));
  return (
    <Figure
      n="6"
      prompt={<>Break it. One number for a whole cloud — two ways it can mislead you.</>}
      controls={
        <>
          <Segmented value={mode} onChange={setMode} options={[{ id: "round", label: "independent" }, { id: "parabola", label: "a parabola" }, { id: "outlier", label: "one outlier" }]} />
          <span className="readouts">
            <span>
              <span className="k">correlation </span>
              <span className="v">{fmt.n(2)(rho)}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          {mode === "round" && <>Independent noise: a round cloud, correlation about zero, and nothing to see. Now try the other two.</>}
          {mode === "parabola" && (
            <>
              <strong>Correlation {fmt.n(2)(rho)}, total dependence.</strong> Know x and you know y almost exactly — yet the number says "nothing here", because
              it only sees straight lines, and the uphill half cancels the downhill half. "Uncorrelated" does not mean "independent". It means "no
              straight-line relationship".
            </>
          )}
          {mode === "outlier" && (
            <>
              <strong>One point, correlation {fmt.n(2)(rho)}.</strong> Two hundred independent days plus a single wild one, and the number reports a strong
              relationship. One huge product of deviations outweighs two hundred small ones. Every correlation from market data has a day like this inside
              it. Is it signal or noise? That is always the question.
            </>
          )}
        </>
      }
    >
      <Plot xDomain={[-4, 8]} yDomain={[-4, 8]} xLabel="x" yLabel="y" height={340} ariaLabel="Scatter illustrating how correlation can mislead">
        <Points pts={pts} role={mode === "outlier" ? "error" : "approx"} r={3} opacity={0.6} />
      </Plot>
    </Figure>
  );
}
