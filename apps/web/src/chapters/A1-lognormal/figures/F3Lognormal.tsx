import { useMemo, useState } from "react";
import { lognormal, npdf } from "../../../engine/distributions";
import { Figure } from "../../../ui/Figure";
import { Curve, Label, Plot, VLine, fmt } from "../../../ui/Plot";
import { Slider, Toggle } from "../../../ui/controls";
import { M } from "../../../ui/Math";

/** The lognormal density with its three centres, and a ghost normal with the same mean and sd. */
export function F3Lognormal() {
  const [mu, setMu] = useState(0);
  const [sigma, setSigma] = useState(0.5);
  const [ghost, setGhost] = useState(true);
  const mean = lognormal.mean(mu, sigma),
    median = lognormal.median(mu),
    mode = lognormal.mode(mu, sigma),
    sd = Math.sqrt(lognormal.variance(mu, sigma));
  const xmax = Math.max(3, mean + 3.5 * sd);
  const curve = useMemo(() => {
    const out: Array<[number, number]> = [];
    for (let i = 1; i <= 300; i++) {
      const yv = (xmax * i) / 300;
      out.push([yv, lognormal.pdf(yv, mu, sigma)]);
    }
    return out;
  }, [mu, sigma, xmax]);
  const normal = useMemo(() => {
    const out: Array<[number, number]> = [];
    for (let i = 0; i <= 300; i++) {
      const yv = (xmax * i) / 300;
      out.push([yv, npdf((yv - mean) / sd) / sd]);
    }
    return out;
  }, [mean, sd, xmax]);
  const ymax = Math.max(...curve.map((p) => p[1]), ...normal.map((p) => p[1])) * 1.15;

  return (
      <Figure
      n="3"
      prompt={<>The lognormal: e raised to a normal. Slide σ to see its three centres separate; shrink σ and it becomes a normal.</>}
      controls={
        <>
          <Slider label="μ (centre of the log)" value={mu} min={-0.5} max={0.5} step={0.01} onChange={setMu} />
          <Slider label="σ (spread of the log)" value={sigma} min={0.02} max={1} step={0.01} onChange={setSigma} role="approx" />
          <Toggle label="ghost: a normal with the same mean and sd" on={ghost} onChange={setGhost} />
          <span className="readouts">
            <span>
              <span className="k">mode </span>
              <span className="v">{fmt.n(3)(mode)}</span>
            </span>
            <span>
              <span className="k">median </span>
              <span className="v">{fmt.n(3)(median)}</span>
            </span>
            <span>
              <span className="k">mean </span>
              <span className="v">{fmt.n(3)(mean)}</span>
            </span>
            <span>
              <span className="k">skewness </span>
              <span className="v">{fmt.n(2)(lognormal.skewness(sigma))}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          <M block tex="Y = e^{X},\; X \sim N(\mu,\sigma^2): \qquad \text{mode} = e^{\mu-\sigma^2} \;<\; \text{median} = e^{\mu} \;<\; \text{mean} = e^{\mu+\sigma^2/2}" />
          <p style={{ margin: 0 }}>
            Three centres, in a fixed order, and the gaps between them grow with σ². The mean sits above the median by the factor e^{"{"}σ²/2{"}"} — the same ½σ² as the drag in Figure 2, seen from the other side: the average is pulled up by the long right tail, the typical outcome is not. At σ = 0.02 the ghost normal is indistinguishable from the lognormal: small steps, either world. At σ = 0.5 they are different shapes with the same mean and sd, and the normal cheerfully puts probability below zero.
          </p>
        </>
      }
    >
      <Plot xDomain={[0, xmax]} yDomain={[0, ymax]} xLabel="y" yLabel="density" height={300} ariaLabel="Lognormal density with mode, median and mean">
        {ghost && <Curve pts={normal} role="ghost" dash="5 4" />}
        <Curve pts={curve} role="approx" />
        <VLine at={mode} />
        <VLine at={median} />
        <VLine at={mean} />
        <Label at={[mode, ymax * 0.97]} text="mode" dx={-4} anchor="end" />
        <Label at={[median, ymax * 0.9]} text="median" dx={4} />
        <Label at={[mean, ymax * 0.83]} text="mean" dx={4} />
      </Plot>
    </Figure>
  );
}
