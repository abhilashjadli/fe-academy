import { useMemo, useState } from "react";
import { npdf, onceInYears, studentT, tailTwoSidedNormal, tailTwoSidedT } from "../../../engine/distributions";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Marker, Plot, VLine, fmt } from "../../../ui/Plot";
import { Slider, Toggle } from "../../../ui/controls";

const fmtYears = (y: number) => (!Number.isFinite(y) ? "never" : y < 1 ? `${fmt.n(1)(y * 12)} months` : y < 1000 ? `${fmt.n(1)(y)} years` : y < 1e6 ? `${Math.round(y).toLocaleString()} years` : y < 1e9 ? `${fmt.n(1)(y / 1e6)} million years` : `${fmt.sci(y)} years`);

/** Normal vs Student-t with the same sd: how often does a k-sigma day happen? */
export function F5Tails() {
  const [nu, setNu] = useState(4);
  const [k, setK] = useState(4);
  const [logScale, setLog] = useState(true);
  const c = studentT.unitScale(nu);
  const tr = (v: number) => (logScale ? Math.log10(Math.max(v, 1e-12)) : v);
  const bell = useMemo(() => Array.from({ length: 321 }, (_, i) => [-10 + (20 * i) / 320, npdf(-10 + (20 * i) / 320)] as [number, number]), []);
  const tcurve = useMemo(
    () =>
      Array.from({ length: 321 }, (_, i) => {
        const x = -10 + (20 * i) / 320;
        return [x, nu > 2 ? studentT.pdf(x / c, nu) / c : studentT.pdf(x, nu)] as [number, number];
      }),
    [nu, c],
  );
  const pN = tailTwoSidedNormal(k);
  const pT = nu > 2 ? tailTwoSidedT(k, nu) : 2 * (1 - studentT.cdf(k, nu));
  const kurt = studentT.excessKurtosis(nu);
  const ydom: [number, number] = logScale ? [-10, 0] : [0, 0.5];

  return (
    <Figure
      n="5"
      prompt={<>Same mean, same standard deviation, different tails. How often does a k-σ day come round under each curve?</>}
      controls={
        <>
          <Slider label="t's degrees of freedom ν" value={nu} min={2.2} max={30} step={0.1} onChange={setNu} role="error" fmt={(v) => v.toFixed(1)} />
          <Slider label="a k-σ day, k =" value={k} min={1} max={10} step={0.5} onChange={setK} fmt={(v) => v.toFixed(1)} />
          <Toggle label="log-density view" on={logScale} onChange={setLog} />
          <span className="readouts">
            <span>
              <span className="k">under the bell: once in </span>
              <span className="v tok-truth">{fmtYears(onceInYears(pN))}</span>
            </span>
            <span>
              <span className="k">under the t: once in </span>
              <span className="v tok-error">{fmtYears(onceInYears(pT))}</span>
            </span>
            <span>
              <span className="k">t's kurtosis </span>
              <span className="v">{Number.isFinite(kurt) ? fmt.n(1)(kurt + 3) : "∞"}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          Both curves have standard deviation 1, so "a 4σ day" means the same size of move under each. The bell says once in 63 years; a t with ν = 4 says
          once in about a year. Move k to 5: the bell says once in seven thousand years; the t says a few years. The worst day of October 1987 was about
          twenty standard deviations under the bell — a probability so small the readout gives up. Fat tails are not "more volatility"; they are the same sd
          with the probability moved from the shoulders to the far tails and the centre. Slide ν toward 2: the t's variance heads to infinity and the bell
          comparison stops meaning anything — that is Figure 6.
        </>
      }
    >
      <Plot xDomain={[-10, 10]} yDomain={ydom} xLabel="standard deviations from the mean" yLabel={logScale ? "log₁₀ density" : "density"} height={300} ariaLabel="Normal and Student-t densities compared">
        <Curve pts={bell.map((p) => [p[0], tr(p[1])])} role="truth" />
        <Curve pts={tcurve.map((p) => [p[0], tr(p[1])])} role="error" />
        <VLine at={k} />
        <VLine at={-k} />
        <Marker at={[k, tr(npdf(k))]} role="truth" r={4} />
        <Marker at={[k, tr(nu > 2 ? studentT.pdf(k / c, nu) / c : studentT.pdf(k, nu))]} role="error" r={4} />
        <Label at={[k, ydom[1] - (logScale ? 1.6 : 0.08)]} text={`${k.toFixed(1)}σ`} dx={6} />
        <Label at={[-9.6, ydom[1] - (logScale ? 2.2 : 0.12)]} text="bell" role="truth" />
        <Label at={[-9.6, ydom[1] - (logScale ? 3.0 : 0.16)]} text={`t, ν = ${nu.toFixed(1)}`} role="error" />
      </Plot>
    </Figure>
  );
}
