import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { Curve, Plot, Points, fmt, type Pt } from "../../../ui/Plot";
import { Slider } from "../../../ui/controls";
import { gammaSample, normalSample, rng } from "../../../engine/random";
import { correlation } from "../../../engine/linalg";

const N = 2000;
const NU = 4;

/** Same ρ, different tails: a Gaussian pair vs a t pair. */
export function F5Copula() {
  const [rho, setRho] = useState(0.5);
  const [k, setK] = useState(2);
  const q = Math.sqrt(1 - rho * rho);
  const clouds = useMemo(() => {
    const r = rng(99);
    const g: Pt[] = [],
      t: Pt[] = [];
    const c = Math.sqrt((NU - 2) / NU);
    for (let i = 0; i < N; i++) {
      const a = normalSample(r),
        b = normalSample(r);
      g.push([a, rho * a + q * b]);
      const w = Math.sqrt((2 * gammaSample(NU / 2, r)) / NU); // sqrt(chi2_nu / nu)
      const a2 = normalSample(r),
        b2 = normalSample(r);
      t.push([(a2 / w) * c, ((rho * a2 + q * b2) / w) * c]);
    }
    return { g, t };
  }, [rho, q]);
  const both = (pts: Pt[]) => pts.filter((p) => p[0] < -k && p[1] < -k).length;
  const either = (pts: Pt[]) => pts.filter((p) => p[0] < -k).length;
  const rg = correlation(clouds.g.map((p) => p[0]), clouds.g.map((p) => p[1]));
  const rt = correlation(clouds.t.map((p) => p[0]), clouds.t.map((p) => p[1]));
  const panel = (pts: Pt[], role: "truth" | "error", label: string, rMeasured: number) => (
    <div>
      <Plot xDomain={[-6, 6]} yDomain={[-6, 6]} width={400} height={340} xTicks={6} yTicks={6} ariaLabel={label}>
        <Points pts={pts} role={role} r={1.8} opacity={0.45} />
        <Curve pts={[[-6, -k], [-k, -k], [-k, -6]]} role="ink" width={1.5} dash="4 3" smooth={false} />
      </Plot>
      <div className="readouts" style={{ padding: "0.3rem 0.5rem 0", fontSize: "0.8rem" }}>
        <span>
          <span className="k">{label} · measured ρ </span>
          <span className="v">{fmt.n(2)(rMeasured)}</span>
        </span>
        <span>
          <span className="k">days x below −{k}σ: </span>
          <span className="v">{either(pts)}</span>
          <span className="k"> · of those, y also below: </span>
          <span className="v">{both(pts)}</span>
          <span className="k"> ({either(pts) ? fmt.pct(0)(both(pts) / either(pts)) : "—"})</span>
        </span>
      </div>
    </div>
  );

  return (
    <Figure
      n="5"
      prompt={<>Two clouds with the same correlation. Count the days that land in the bottom-left corner — both assets crashing together.</>}
      controls={
        <>
          <Slider label="ρ" value={rho} min={0} max={0.9} step={0.05} onChange={setRho} />
          <Slider label="corner threshold, σ" value={k} min={1} max={3.5} step={0.25} onChange={setK} />
        </>
      }
      observe={
        <>
          Left, a Gaussian pair: when x has a bad day, y is somewhat likely to. Right, a <strong>t-copula</strong> — the same ρ, the same marginal
          spread, but both coordinates share one random scale, so the bad days arrive together and the cloud grows an X of joint extremes. Given that x
          fell beyond the threshold, the chance that y did too is far higher on the right, and the gap widens as you push the threshold out. This is what
          "correlations go to one in a crisis" means: ρ did not change; ρ was never the whole story. One number summarises the centre of a cloud and says
          almost nothing about its corners — and the corners are where risk lives (E1). (The measured ρ on the right wobbles from sample to sample: with tails this fat, even correlation is hard to estimate.)
        </>
      }
    >
      <div className="two">
        {panel(clouds.g, "truth", "Gaussian", rg)}
        {panel(clouds.t, "error", `t-copula, ν = ${NU}`, rt)}
      </div>
    </Figure>
  );
}
