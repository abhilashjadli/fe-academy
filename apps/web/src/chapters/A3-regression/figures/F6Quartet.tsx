import { useMemo, useState } from "react";
import "./figures.css";
import { Figure } from "../../../ui/Figure";
import { Curve, HLine, Label, Plot, Points, fmt, type Pt } from "../../../ui/Plot";
import { Readouts } from "../../../ui/controls";
import { ols } from "../../../engine/regression";

const n2 = fmt.n(2);

/**
 * Anscombe's quartet (F. J. Anscombe, "Graphs in Statistical Analysis", The American Statistician 27(1), 1973).
 * Four sets of eleven points with the same mean of x and y, the same fitted line y = 3.00 + 0.50 x and the same R² = 0.67.
 * Public-domain numbers, as tabulated on Wikipedia; the line and R² below are computed by the engine, not typed in.
 */
const X123 = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5];
export const ANSCOMBE: Array<{ name: string; truth: string; x: number[]; y: number[] }> = [
  { name: "I", truth: "a line plus noise", x: X123, y: [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68] },
  { name: "II", truth: "a curve, not a line", x: X123, y: [9.14, 8.14, 8.74, 8.77, 9.26, 8.1, 6.13, 3.1, 9.13, 7.26, 4.74] },
  { name: "III", truth: "a perfect line and one outlier", x: X123, y: [7.46, 6.77, 12.74, 7.11, 7.81, 8.84, 6.08, 5.39, 8.15, 6.42, 5.73] },
  { name: "IV", truth: "one point holding the whole line up", x: [8, 8, 8, 8, 8, 8, 8, 19, 8, 8, 8], y: [6.58, 5.76, 7.71, 8.84, 8.47, 7.04, 5.25, 12.5, 5.56, 7.91, 6.89] },
];
const XD: [number, number] = [2, 20];
const YD: [number, number] = [2, 14];

/** Use it yourself — Anscombe's quartet: four clouds, one line, one R²; click a cloud and look at its leftovers. */
export function F6Quartet() {
  const [sel, setSel] = useState(0);
  const sets = useMemo(() => ANSCOMBE.map((s) => ({ ...s, f: ols(s.x, s.y), pts: s.x.map((v, i) => [v, s.y[i]] as Pt) })), []);
  const cur = sets[sel];
  const line = (f: { intercept: number; slope: number }): Pt[] => [
    [XD[0], f.intercept + f.slope * XD[0]],
    [XD[1], f.intercept + f.slope * XD[1]],
  ];
  const eMax = Math.max(...sets.flatMap((s) => s.f.resid.map(Math.abs))) * 1.15;

  return (
    <Figure
      n="6"
      prompt={<>Four clouds of eleven points, published in 1973 and still the best warning in statistics. Click a cloud: its line, its numbers, its leftovers.</>}
      controls={<Readouts items={[["slope", n2(cur.f.slope)], ["intercept", n2(cur.f.intercept)], ["R²", n2(cur.f.r2)]]} />}
      observe={
        <>
          <strong>Same line, same numbers, four different truths — the only way to know is to look.</strong> Cloud {cur.name}: {cur.truth}. The three readouts
          do not change when you click, because they cannot see what you can: a curve, an outlier, a single point doing all the work.
        </>
      }
    >
      <div className="a3-quartet" role="group" aria-label="Anscombe's four clouds">
        {sets.map((s, i) => (
          <button key={s.name} type="button" className={"a3-cloud " + (i === sel ? "on" : "")} aria-pressed={i === sel} onClick={() => setSel(i)}>
            <Plot xDomain={XD} yDomain={YD} width={220} height={170} xTicks={3} yTicks={3} margin={{ top: 10, right: 10, bottom: 22, left: 30 }} ariaLabel={`Cloud ${s.name}: ${s.truth}`}>
              <Curve pts={line(s.f)} role={i === sel ? "truth" : "ghost"} width={i === sel ? 2.2 : 1.4} smooth={false} />
              <Points pts={s.pts} role="ink" r={4} opacity={0.9} />
              <Label at={[XD[0], YD[1]]} text={s.name} role={i === sel ? "truth" : "ghost"} dx={6} dy={14} />
            </Plot>
          </button>
        ))}
      </div>
      <Plot xDomain={XD} yDomain={[-eMax, eMax]} width={720} height={220} xLabel="x" yLabel={`leftovers of cloud ${cur.name}`} xTicks={6} yTicks={4} ariaLabel={`Residuals of cloud ${cur.name} against x`}>
        <HLine at={0} />
        <Points pts={cur.x.map((v, i) => [v, cur.f.resid[i]] as Pt)} role="error" r={4.5} opacity={0.9} />
        <Label at={[XD[1], eMax]} text={cur.truth} role="error" anchor="end" dx={-8} dy={16} />
      </Plot>
    </Figure>
  );
}
