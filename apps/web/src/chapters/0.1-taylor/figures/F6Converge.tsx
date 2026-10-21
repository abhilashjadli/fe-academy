import { useMemo, useState } from "react";
import { FUNCTIONS, partialSums } from "../../../engine/taylor";
import { Figure } from "../../../ui/Figure";
import { Curve, HLine, Label, Marker, Plot, fmt, type Pt } from "../../../ui/Plot";
import { Slider, Stepper } from "../../../ui/controls";

const E = Math.E;

/** Convergence at a point (e), then the radius of convergence (ln x about 1). */
export function F6Converge() {
  const [n, setN] = useState(3);
  const [x, setX] = useState(1.5);
  const expSums = useMemo(() => partialSums(FUNCTIONS.exp, 12, 0, 1), []);
  const lnSums = useMemo(() => partialSums(FUNCTIONS.ln, 14, 1, x), [x]);
  const expPts: Pt[] = expSums.slice(0, n + 1).map((s, k) => [k, s]);
  const lnPts: Pt[] = lnSums.slice(1, 15).map((s, k) => [k + 1, s]);
  const target = Math.log(x);
  const inside = x > 0 && x <= 2;
  const f6 = fmt.n(6);
  const lnDom: [number, number] = inside ? [Math.min(-1.2, target - 0.6), Math.max(1.2, target + 0.6)] : [-6, 6];

  // digits that have frozen: compare S_n with S_{n-1}
  const frozen = (() => {
    if (n === 0) return 0;
    const a = expSums[n].toFixed(6),
      b = expSums[n - 1].toFixed(6);
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    return Math.max(0, i - 2);
  })();

  return (
    <Figure
      n="6"
      prompt={<>Does it ever stop? Left: add terms of eˣ at x = 1. Right: ln x about 1 — move x past 2 and watch the sums fall apart.</>}
      controls={
        <>
          <Stepper label="terms of e (left)" value={n} min={0} max={12} onChange={setN} />
          <Slider label="x for ln x (right)" value={x} min={0.2} max={3} step={0.05} onChange={setX} />
        </>
      }
      observe={
        <>
          <p style={{ margin: 0 }}>
            <strong>Left:</strong> 1, 2, 2.5, 2.667, 2.708… the digits freeze from the left. Each new term is smaller than the last by a bigger factor, so the sum settles — on e = 2.71828… — for every x.
          </p>
          <p style={{ margin: "0.5em 0 0" }}>
            <strong>Right:</strong> at x = 1.5 the sums close in on ln 1.5 = {f6(Math.log(1.5))}. At x = 2.5 the terms (x − 1)ᵏ/k grow, so the sums bounce ever wider: <span className="tok-error">more terms make it worse.</span> The series about 1 only works on (0, 2] — a radius of 1, set by the point x = 0 where ln x blows up. Adding terms never cures a point outside the radius.
          </p>
        </>
      }
    >
      <div className="two">
        <div>
          <Plot xDomain={[0, 12]} yDomain={[0.5, 3]} xLabel="terms" yLabel="partial sum at x = 1" width={440} height={260} xTicks={6} ariaLabel="Partial sums of e converging">
            <HLine at={E} />
            <Label at={[11.8, E]} text="e = 2.71828…" dy={-6} anchor="end" />
            <Curve pts={expPts} role="approx" smooth={false} />
            {expPts.map((p) => (
              <Marker key={p[0]} at={p} role="approx" r={3.5} />
            ))}
          </Plot>
          <div className="readouts" style={{ padding: "0.4rem 0.5rem 0" }}>
            <span>
              <span className="k">S{n} = </span>
              <span className="v">
                <span style={{ textDecoration: "underline", textDecorationColor: "var(--approx)", textUnderlineOffset: 3 }}>{expSums[n].toFixed(6).slice(0, frozen)}</span>
                {expSums[n].toFixed(6).slice(frozen)}
              </span>
              <span className="k"> frozen digits underlined</span>
            </span>
          </div>
        </div>
        <div>
          <Plot xDomain={[0, 14]} yDomain={lnDom} xLabel="terms" yLabel={`partial sum at x = ${x.toFixed(2)}`} width={440} height={260} xTicks={7} ariaLabel="Partial sums of ln x about 1">
            <HLine at={target} />
            <Label at={[13.8, target]} text={`ln ${x.toFixed(2)} = ${target.toFixed(4)}`} dy={-6} anchor="end" />
            <Curve pts={lnPts} role={inside ? "approx" : "error"} smooth={false} />
            {lnPts.map((p) => (
              <Marker key={p[0]} at={p} role={inside ? "approx" : "error"} r={3.5} />
            ))}
          </Plot>
          <svg viewBox="0 0 440 34" className="plot" style={{ marginTop: 4 }} aria-label="Interval of convergence">
            <line x1={30} x2={410} y1={16} y2={16} className="guide" />
            <rect x={30 + ((0 - 0) / 3) * 380} y={11} width={(2 / 3) * 380} height={10} fill="var(--approx-soft)" />
            <line x1={30 + (2 / 3) * 380} x2={30 + (2 / 3) * 380} y1={8} y2={24} stroke="var(--approx)" strokeWidth={2} />
            <line x1={30 + (1 / 3) * 380} x2={30 + (1 / 3) * 380} y1={8} y2={24} stroke="var(--ink-2)" strokeWidth={1.5} />
            <circle cx={30 + (x / 3) * 380} cy={16} r={5} fill={inside ? "var(--approx)" : "var(--error)"} />
            <text x={30 + (1 / 3) * 380} y={32} textAnchor="middle" className="label">
              centre 1
            </text>
            <text x={30 + (2 / 3) * 380} y={32} textAnchor="middle" className="label">
              2
            </text>
            <text x={30} y={32} textAnchor="middle" className="label">
              0
            </text>
            <text x={410} y={32} textAnchor="middle" className="label">
              3
            </text>
          </svg>
        </div>
      </div>
    </Figure>
  );
}
