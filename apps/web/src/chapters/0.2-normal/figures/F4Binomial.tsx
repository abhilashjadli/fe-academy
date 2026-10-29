import { useMemo, useState } from "react";
import { binomialPmf } from "../../../engine/discrete";
import { pdf } from "../../../engine/normal";
import { Figure } from "../../../ui/Figure";
import { Bars, Curve, Label, Plot, VLine, fmt } from "../../../ui/Plot";
import { Toggle } from "../../../ui/controls";
import { M } from "../../../ui/Math";

const NS = [10, 30, 100];

/** The binomial as bricks, three boards at once: n = 10, 30, 100 with the bell of the same mean and sd drawn over each. */
export function F4Binomial() {
  const [tilt, setTilt] = useState(false);
  const p = tilt ? 0.2 : 0.5;
  const panels = useMemo(
    () =>
      NS.map((n) => {
        const pmf = binomialPmf(n, p);
        const mean = n * p;
        const sd = Math.sqrt(n * p * (1 - p));
        const ymax = Math.max(...pmf) * 1.2;
        const bell: Array<[number, number]> = [];
        for (let i = 0; i <= 200; i++) {
          const x = (n * i) / 200;
          bell.push([x, pdf((x - mean) / sd) / sd]);
        }
        return { n, pmf, mean, sd, ymax, bell, bars: pmf.map((v, k) => ({ x: k, y: v, w: 1 })) };
      }),
    [p],
  );
  const n2 = fmt.n(2);

  return (
    <Figure
      n="4"
      prompt={<>Every route is a brick; stack the bricks by bucket. Three boards, 10, 30 and 100 rows, each with the bell of the same hump and width laid over it.</>}
      controls={<Toggle label={tilt ? "pegs tilted: p = 0.20" : "pegs fair: p = 0.50"} on={tilt} onChange={setTilt} />}
      observe={
        <>
          <M block tex="P(k) \;=\; \underbrace{\binom{n}{k}}_{\text{routes into }k}\;\underbrace{p^{k}(1-p)^{\,n-k}}_{\text{chance of one such route}}" />
          <p style={{ margin: 0 }}>
            Read left to right: the hump moves like n, the width only like √n, and the bell fits better at every step. Tilt the pegs and the pile leans at ten
            rows but is a bell again by a hundred. Nothing in the formula mentions a bell; it appears anyway.
          </p>
          <details className="n2-more">
            <summary>the two numbers in each panel</summary>
            <p>
              The hump sits at np — n bounces, each right with chance p. Its width, measured as a standard deviation, is √(np(1−p)): each bounce adds p(1−p) of
              variance and variances of independent things add, so the spread grows like √n while the position grows like n. This formula, routes times chances,
              is called the <strong>binomial distribution</strong>.
            </p>
          </details>
        </>
      }
    >
      <div className="n2-multiples">
        {panels.map((q) => (
          <figure key={q.n} className="n2-panel">
            <Plot
              xDomain={[-0.5, q.n + 0.5]}
              yDomain={[0, q.ymax]}
              width={300}
              height={240}
              margin={{ top: 10, right: 8, bottom: 36, left: 36 }}
              xTicks={4}
              yTicks={3}
              xLabel="k = rights"
              ariaLabel={`Binomial bars for n = ${q.n}, p = ${p}, with the matching bell`}
            >
              <Bars bars={q.bars} role="approx" />
              <Curve pts={q.bell} role="truth" />
              <VLine at={q.mean} />
              <Label at={[-0.5, q.ymax]} text={`n = ${q.n}`} dx={6} dy={14} role="approx" />
            </Plot>
            <figcaption>
              hump np = <span className="num">{n2(q.mean)}</span> · width = <span className="num">{n2(q.sd)}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Figure>
  );
}
