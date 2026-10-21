import { useMemo, useState } from "react";
import { cdf, pdf } from "../../../engine/normal";
import { Figure } from "../../../ui/Figure";
import { Band, Curve, Marker, Plot, VLine, Label, fmt } from "../../../ui/Plot";

/** The standard normal with two draggable bounds; snap points at ±1σ, ±2σ, ±3σ. */
export function F7Rule() {
  const [lo, setLo] = useState(-1);
  const [hi, setHi] = useState(1);
  const [drag, setDrag] = useState<"lo" | "hi" | null>(null);
  const curve = useMemo(() => {
    const out: Array<[number, number]> = [];
    for (let i = 0; i <= 240; i++) {
      const x = -4 + (8 * i) / 240;
      out.push([x, pdf(x)]);
    }
    return out;
  }, []);
  const inside = curve.filter((p) => p[0] >= lo && p[0] <= hi);
  const prob = cdf(hi) - cdf(lo);
  const snap = (z: number) => {
    setLo(-z);
    setHi(z);
  };
  return (
    <Figure
      n="7"
      prompt={<>Drag the two bounds. The shaded area is the probability of landing between them. Try ±1, ±2 and ±3 standard deviations.</>}
      controls={
        <>
          <span className="toggle-row">
            <button type="button" className="btn" onClick={() => snap(1)}>
              ±1σ
            </button>
            <button type="button" className="btn" onClick={() => snap(2)}>
              ±2σ
            </button>
            <button type="button" className="btn" onClick={() => snap(3)}>
              ±3σ
            </button>
          </span>
          <span className="readouts">
            <span>
              <span className="k">from </span>
              <span className="v">{fmt.n(2)(lo)}σ</span>
              <span className="k"> to </span>
              <span className="v">{fmt.n(2)(hi)}σ</span>
            </span>
            <span>
              <span className="k">probability </span>
              <span className="v">{fmt.pct(2)(prob)}</span>
            </span>
            <span>
              <span className="k">outside, each tail </span>
              <span className="v">{fmt.pct(2)(cdf(lo))} / {fmt.pct(2)(1 - cdf(hi))}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          68.27 % within one standard deviation of the mean, 95.45 % within two, 99.73 % within three: the rule of thumb every quantitative conversation
          leans on. A value's distance from the mean in units of σ is its <strong>z-score</strong>; "a 3σ event" means a z of 3, which the curve says
          happens about 0.13 % of the time on each side — if the curve is the right one. (That caveat is chapter A1.)
        </>
      }
    >
      <Plot
        xDomain={[-4, 4]}
        yDomain={[0, 0.45]}
        xLabel="z = (x − μ) / σ"
        yLabel="density"
        height={280}
        onDrag={(x, _y, phase) => {
          if (phase === "down") {
            const which = Math.abs(x - lo) < Math.abs(x - hi) ? "lo" : "hi";
            setDrag(which);
            if (which === "lo") setLo(Math.min(x, hi - 0.05));
            else setHi(Math.max(x, lo + 0.05));
          } else if (phase === "move" && drag) {
            if (drag === "lo") setLo(Math.max(-4, Math.min(x, hi - 0.05)));
            else setHi(Math.min(4, Math.max(x, lo + 0.05)));
          } else if (phase === "up") setDrag(null);
        }}
        ariaLabel="Standard normal density with draggable bounds"
      >
        <Band upper={inside} lower={inside.map((p) => [p[0], 0])} role="approx" />
        <Curve pts={curve} role="truth" />
        <VLine at={lo} role="approx" />
        <VLine at={hi} role="approx" />
        <Marker at={[lo, pdf(lo)]} role="approx" r={6} />
        <Marker at={[hi, pdf(hi)]} role="approx" r={6} />
        <Label at={[0, 0.42]} text={`${fmt.pct(2)(prob)} of the area`} anchor="middle" dx={0} dy={0} />
      </Plot>
    </Figure>
  );
}
