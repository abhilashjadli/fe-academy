import { useMemo, useState } from "react";
import { Figure } from "../../../ui/Figure";
import { StepThrough, type Step } from "../../../ui/StepThrough";
import { Bars, Plot, fmt } from "../../../ui/Plot";
import { Slider } from "../../../ui/controls";
import { normalSample, rng } from "../../../engine/random";
import { corrFromCov, covMatrix, symEigen } from "../../../engine/linalg";

const NAMES = ["Bank A", "Bank B", "Bank C", "Tech X", "Tech Y", "Tech Z"];
const BETA = [1.0, 0.9, 1.1, 0.8, 1.2, 1.0];
const SECTOR = [0, 0, 0, 1, 1, 1];

/** Six made-up stocks, one market, two sectors: a step-through reads the correlation table, then PCA reads it. */
export function F4Assets() {
  const [mkt, setMkt] = useState(1);
  const [step, setStep] = useState(0);
  const data = useMemo(() => {
    const r = rng(2026);
    const rows: number[][] = [];
    for (let d = 0; d < 1500; d++) {
      const m = normalSample(r),
        s0 = normalSample(r),
        s1 = normalSample(r);
      rows.push(BETA.map((b, j) => b * mkt * m + 0.6 * (SECTOR[j] === 0 ? s0 : s1) + 0.8 * normalSample(r)));
    }
    return rows;
  }, [mkt]);
  const C = useMemo(() => corrFromCov(covMatrix(data)), [data]);
  const e = useMemo(() => symEigen(C), [C]);
  const total = e.values.reduce((s, v) => s + v, 0);
  const share1 = e.values[0] / total;
  const share2 = e.values[1] / total;
  // make PC1 point "up" (all positive) and PC2 "banks plus" so the words match the bars
  const pc1 = useMemo(() => (e.vectors[0].reduce((s, v) => s + v, 0) < 0 ? e.vectors[0].map((v) => -v) : e.vectors[0]), [e]);
  const pc2 = useMemo(() => (e.vectors[1].slice(0, 3).reduce((s, v) => s + v, 0) < 0 ? e.vectors[1].map((v) => -v) : e.vectors[1]), [e]);
  const cell = (v: number) => {
    const a = Math.min(1, Math.abs(v));
    return v >= 0 ? `rgba(47, 91, 234, ${0.08 + 0.75 * a})` : `rgba(200, 50, 95, ${0.08 + 0.75 * a})`;
  };
  const inBlock = (i: number, j: number) => SECTOR[i] === SECTOR[j] && i !== j;
  const pct = fmt.pct(0);

  const steps: Step[] = [
    { caption: <>Every number in the table is positive: when one stock has an up day, the other five tend to as well. That one fact is "the market".</> },
    { caption: <>Look closer: two warmer squares. Bank with bank and tech with tech sit higher than bank with tech. That is "the sector".</> },
    { caption: <>Now let the maths read it. The first direction weights all six stocks the same way — that is "the market went up today". It carries {pct(share1)} of everything.</> },
    { caption: <>The second weights banks plus and tech minus — "banks beat tech today", another {pct(share2)}. Everything after that is each stock's own news.</> },
  ];

  return (
    <Figure
      n="4"
      prompt={<>Six made-up stocks with a realistic structure — real tickers to follow. Three banks, three tech names, 1,500 days. Step through and let the table be read for you.</>}
      controls={
        <>
          <Slider label="how hard the market pulls on all six" value={mkt} min={0} max={2} step={0.05} onChange={setMkt} role="truth" width={200} />
          {step >= 2 && (
            <span className="readouts">
              <span>
                <span className="k">first direction holds </span>
                <span className="v">{pct(share1)}</span>
              </span>
              <span>
                <span className="k">first two together </span>
                <span className="v">{pct(share1 + share2)}</span>
              </span>
            </span>
          )}
        </>
      }
      observe={
        <>
          One table, three stories. "Market" is the first direction, "banks versus tech" the second, and the rest is noise. Pull the market slider to zero
          and the first direction becomes a sector; pull it up and one direction carries almost everything. A yield curve read this way gives level, slope
          and curvature (E3).
        </>
      }
    >
      <StepThrough
        steps={steps}
        onStep={setStep}
        render={(i) => (
          <div className="a2-steps-body">
            <table className="table a2-matrix" style={{ fontSize: "0.78rem" }}>
              <caption>correlation of daily moves, simulated</caption>
              <thead>
                <tr>
                  <th></th>
                  {NAMES.map((n) => (
                    <th key={n}>{n}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {C.map((row, r) => (
                  <tr key={r}>
                    <td style={{ textAlign: "left", color: "var(--ink-3)" }}>{NAMES[r]}</td>
                    {row.map((v, c) => {
                      const hl = i === 0 ? r !== c : i === 1 ? inBlock(r, c) : false;
                      const dim = i === 1 && !inBlock(r, c) && r !== c;
                      return (
                        <td key={c} className={"cell " + (hl ? "hl " : "") + (dim ? "dim" : "")} style={{ background: cell(v), color: Math.abs(v) > 0.55 ? "#fff" : "var(--ink)" }}>
                          {v.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="two" style={{ marginTop: "0.5rem" }}>
              <Plot
                xDomain={[0.4, 6.6]}
                yDomain={[-0.8, 0.8]}
                width={300}
                height={170}
                xTicks={6}
                yTicks={3}
                xLabel="stock 1–6"
                yLabel={i >= 3 ? "weights: first (blue), second (amber)" : "weights of the first direction"}
                margin={{ top: 12, right: 10, bottom: 28, left: 36 }}
                ariaLabel="Weights of the first two directions"
              >
                {i >= 2 && <Bars bars={pc1.map((v, k) => ({ x: k + (i >= 3 ? 0.82 : 1), y: v, w: i >= 3 ? 0.34 : 0.6 }))} role="truth" />}
                {i >= 3 && <Bars bars={pc2.map((v, k) => ({ x: k + 1.18, y: v, w: 0.34 }))} role="approx" />}
              </Plot>
              <Plot
                xDomain={[0.4, 6.6]}
                yDomain={[0, Math.max(3, e.values[0] * 1.15)]}
                width={300}
                height={170}
                xTicks={6}
                yTicks={3}
                xLabel="direction 1–6"
                yLabel="how much each direction holds"
                margin={{ top: 12, right: 10, bottom: 28, left: 36 }}
                ariaLabel="Variance held by each direction"
              >
                {i >= 2 && <Bars bars={e.values.map((v, k) => ({ x: k + 1, y: v, w: 0.7 })).filter((b) => i >= 3 || b.x === 1)} role="truth" />}
              </Plot>
            </div>
          </div>
        )}
      />
    </Figure>
  );
}
