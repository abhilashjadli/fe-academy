import { useMemo, useState } from "react";
import { binomialPmf } from "../../../engine/discrete";
import { pdf } from "../../../engine/normal";
import { Figure } from "../../../ui/Figure";
import { Bars, Curve, Plot, VLine, fmt } from "../../../ui/Plot";
import { Slider, Toggle } from "../../../ui/controls";
import { M } from "../../../ui/Math";

/** The binomial as bars: n and p sliders, mean and sd live, the bell forming. */
export function F4Binomial() {
  const [n, setN] = useState(5);
  const [p, setP] = useState(0.5);
  const [ghost, setGhost] = useState(true);
  const [bell, setBell] = useState(false);
  const pmf = useMemo(() => binomialPmf(n, p), [n, p]);
  const mean = n * p;
  const sd = Math.sqrt(n * p * (1 - p));
  const xmax = Math.max(12, n);
  const ymax = Math.max(...pmf) * 1.15;
  const bars = pmf.map((v, k) => ({ x: k, y: v, w: 1 }));
  const pmf10 = useMemo(() => binomialPmf(10, 0.5), []);
  const bellPts = useMemo(() => {
    const out: Array<[number, number]> = [];
    for (let i = 0; i <= 200; i++) {
      const x = (xmax * i) / 200;
      out.push([x, sd > 0 ? pdf((x - mean) / sd) / sd : 0]);
    }
    return out;
  }, [mean, sd, xmax]);

  return (
    <Figure
      n="4"
      prompt={<>Every route is a brick; stack the bricks by bucket. Push n up, and tilt the pegs with p — the chance of bouncing right.</>}
      controls={
        <>
          <Slider label="rows n" value={n} min={1} max={100} step={1} onChange={setN} fmt={(v) => String(v)} />
          <Slider label="P(right) = p" value={p} min={0.05} max={0.95} step={0.01} onChange={setP} role="approx" />
          <Toggle label="keep n = 10 faintly behind" on={ghost} onChange={setGhost} />
          <Toggle label="bell with the same mean and sd" on={bell} onChange={setBell} />
          <span className="readouts">
            <span>
              <span className="k">hump at np = </span>
              <span className="v">{fmt.n(2)(mean)}</span>
            </span>
            <span>
              <span className="k">width √(np(1−p)) = </span>
              <span className="v">{fmt.n(3)(sd)}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          <M block tex="P(k) \;=\; \underbrace{\binom{n}{k}}_{\text{routes into }k}\;\underbrace{p^{k}(1-p)^{\,n-k}}_{\text{chance of one such route}}" />
          <p style={{ margin: 0 }}>
            Tilt the pegs and each route's chance depends on how many rights it holds — p per right, 1 − p per left — but the route count is unchanged. Push n up: the hump
            moves right like n and widens only like √n. Switch the bell on: it fits better and better. That bell is the rest of the page.
          </p>
          <details className="n2-more">
            <summary>the two readouts</summary>
            <p>
              The hump sits at np — n bounces, each right with chance p. Its width, measured as a standard deviation, is √(np(1−p)): each bounce adds p(1−p) of variance and
              variances of independent things add, so the spread grows like √n while the position grows like n. This formula, routes times chances, is called the{" "}
              <strong>binomial distribution</strong>.
            </p>
          </details>
        </>
      }
    >
      <Plot xDomain={[-0.5, xmax + 0.5]} yDomain={[0, ymax]} xLabel="k = number of rights" yLabel="probability of bucket k" height={320} ariaLabel="Binomial distribution bars">
        {ghost && n !== 10 && <Bars bars={pmf10.map((v, k) => ({ x: k, y: v, w: 1 }))} role="ghost" opacity={0.35} />}
        <Bars bars={bars} role="approx" />
        {bell && <Curve pts={bellPts} role="truth" />}
        <VLine at={mean} />
      </Plot>
    </Figure>
  );
}
