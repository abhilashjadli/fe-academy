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
      prompt={<>Every path is a brick; stack the bricks by bucket. Push n up and tilt the pegs with p.</>}
      controls={
        <>
          <Slider label="rows n" value={n} min={1} max={100} step={1} onChange={setN} fmt={(v) => String(v)} />
          <Slider label="P(right) = p" value={p} min={0.05} max={0.95} step={0.01} onChange={setP} role="approx" />
          <Toggle label="ghost n = 10" on={ghost} onChange={setGhost} />
          <Toggle label="bell with the same mean and sd" on={bell} onChange={setBell} />
          <span className="readouts">
            <span>
              <span className="k">mean np = </span>
              <span className="v">{fmt.n(2)(mean)}</span>
            </span>
            <span>
              <span className="k">sd √(np(1−p)) = </span>
              <span className="v">{fmt.n(3)(sd)}</span>
            </span>
          </span>
        </>
      }
      observe={
        <>
          <M block tex="P(k) \;=\; \underbrace{\binom{n}{k}}_{\text{paths into }k}\;\underbrace{p^{k}(1-p)^{\,n-k}}_{\text{probability of one such path}}" />
          <p style={{ margin: 0 }}>
            With p = ½ every path has the same probability and only the count matters (Figure 2). Tilt the pegs and each path's probability depends on how
            many rights it contains — p for each right, 1 − p for each left — but the count of paths is unchanged. Two things to watch as n grows: the hump
            moves right like n and widens only like √n, and its shape stops caring whether p was ½ or 0.2. Switch the bell on: a curve with the same mean
            and sd fits better and better. That curve is the subject of the rest of the page.
          </p>
        </>
      }
    >
      <Plot xDomain={[-0.5, xmax + 0.5]} yDomain={[0, ymax]} xLabel="k = number of rights" yLabel="probability" height={320} ariaLabel="Binomial distribution bars">
        {ghost && n !== 10 && <Bars bars={pmf10.map((v, k) => ({ x: k, y: v, w: 1 }))} role="ghost" opacity={0.35} />}
        <Bars bars={bars} role="approx" />
        {bell && <Curve pts={bellPts} role="truth" />}
        <VLine at={mean} />
      </Plot>
    </Figure>
  );
}
