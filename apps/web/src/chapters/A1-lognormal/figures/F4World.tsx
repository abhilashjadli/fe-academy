import { useMemo, useState } from "react";
import { moments, npdf, studentT, tailTwoSidedNormal } from "../../../engine/distributions";
import { rng, tSample } from "../../../engine/random";
import { Figure } from "../../../ui/Figure";
import { Curve, Plot, VLine, Label, fmt, usePlot } from "../../../ui/Plot";
import { Toggle } from "../../../ui/controls";
import { histogram } from "../sim";

/** Daily returns from the world (simulated stand-in until real index data is supplied). */
export function F4World() {
  const [logScale, setLog] = useState(false);
  // stand-in: 30 years of daily log-returns, Student-t with nu = 3.5 scaled to sd 1.1 %
  const data = useMemo(() => {
    const r = rng(1987);
    const nu = 3.5;
    const scale = (0.011 * Math.sqrt((nu - 2) / nu));
    const out = new Float64Array(7560);
    for (let i = 0; i < out.length; i++) out[i] = tSample(nu, r) * scale + 0.0003;
    return out;
  }, []);
  const m = moments(data);
  const z = useMemo(() => Array.from(data, (v) => (v - m.mean) / m.sd), [data, m.mean, m.sd]);
  const bins = useMemo(() => histogram(z, -8, 8, 80), [z]);
  const bigObs = z.filter((v) => Math.abs(v) >= 4).length;
  const bigBell = data.length * tailTwoSidedNormal(4);
  const nuFit = Math.max(2.5, Math.min(30, 4 + 6 / Math.max(0.1, m.kurtosis - 3)));
  const bell = useMemo(() => Array.from({ length: 241 }, (_, i) => [-8 + (16 * i) / 240, npdf(-8 + (16 * i) / 240)] as [number, number]), []);
  const tfit = useMemo(() => {
    const c = studentT.unitScale(nuFit);
    return Array.from({ length: 241 }, (_, i) => {
      const x = -8 + (16 * i) / 240;
      return [x, studentT.pdf(x / c, nuFit) / c] as [number, number];
    });
  }, [nuFit]);
  const tr = (v: number) => (logScale ? Math.log10(Math.max(v, 1e-7)) : v);
  const ydom: [number, number] = logScale ? [-6, 0] : [0, 0.5];

  return (
    <Figure
      n="4"
      prompt={<>Thirty years of daily returns of a stock index, standardised to z-scores. Does the world agree with the bell? Switch to the log view.</>}
      controls={
        <>
          <Toggle label="log-density view" on={logScale} onChange={setLog} />
          <span className="readouts">
            <span>
              <span className="k">days </span>
              <span className="v">{data.length.toLocaleString()}</span>
            </span>
            <span>
              <span className="k">kurtosis </span>
              <span className="v">{fmt.n(1)(m.kurtosis)}</span>
              <span className="k"> (bell: 3)</span>
            </span>
            <span>
              <span className="k">days beyond 4σ: observed </span>
              <span className="v">{bigObs}</span>
              <span className="k">, the bell expected </span>
              <span className="v">{fmt.n(2)(bigBell)}</span>
            </span>
            <span>
              <span className="k">t fitted by kurtosis: ν ≈ </span>
              <span className="v">{fmt.n(1)(nuFit)}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          <p style={{ margin: 0 }}>
            On the ordinary view the bell looks fine — a little too low in the middle, a little too fat at the shoulders, nothing alarming. The log view is where
            it fails: the bell's tails fall away as a parabola (log of e^{"{"}−z²/2{"}"} is −z²/2), while the data's tails fall away as roughly straight lines.
            Straight lines in a log-density plot mean the tail is a <em>power</em>, not an exponential — and a power tail keeps producing 4σ, 5σ, 6σ days long
            after the bell has sworn they cannot happen. The kurtosis — the fourth moment, 3 for a bell — is the single number that records this.
          </p>
          <p className="footnote" style={{ margin: "0.5em 0 0" }}>
            This series is <strong>simulated</strong> (Student-t, ν = 3.5, daily sd 1.1 %) as a stand-in with the right shape; it will be replaced by real index
            data when supplied, and the counts above will become real counts.
          </p>
        </>
      }
    >
      <Plot xDomain={[-8, 8]} yDomain={ydom} xLabel="daily return, in standard deviations" yLabel={logScale ? "log₁₀ density" : "density"} height={300} ariaLabel="Histogram of daily returns with normal and t fits">
        <LogBars bins={bins} tr={tr} floor={ydom[0]} />
        <Curve pts={bell.map((p) => [p[0], tr(p[1])])} role="truth" />
        <Curve pts={tfit.map((p) => [p[0], tr(p[1])])} role="error" dash="5 4" />
        <VLine at={4} />
        <VLine at={-4} />
        <Label at={[7.8, logScale ? -0.3 : 0.47]} text="bell" role="truth" anchor="end" />
        <Label at={[7.8, logScale ? -0.9 : 0.43]} text={`t, ν = ${fmt.n(1)(nuFit)}`} role="error" anchor="end" />
      </Plot>
    </Figure>
  );
}

function LogBars({ bins, tr, floor }: { bins: ReturnType<typeof histogram>; tr: (v: number) => number; floor: number }) {
  const { x, y } = usePlot();
  return (
    <g>
      {bins.map((b, i) => {
        if (b.density <= 0) return null;
        const top = y(tr(b.density));
        const bot = y(floor);
        return <rect key={i} className="marker approx" x={x(b.lo) + 0.5} y={top} width={Math.max(0.5, x(b.hi) - x(b.lo) - 1)} height={Math.max(0, bot - top)} style={{ opacity: 0.75, stroke: "none" }} />;
      })}
    </g>
  );
}
